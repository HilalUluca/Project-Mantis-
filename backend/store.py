"""
store.py — RAM'deki db_tasks / db_risk_findings / db_audit_logs / db_vault_documents
listelerinin yerine geçen, ama main.py'deki kullanım şeklini (neredeyse) hiç
değiştirmeyen kalıcı (SQLite) depo katmanı.

NEDEN GEREKLİ: Önceki main.py'de bu veriler sade Python listesiydi — uvicorn
--reload her yeniden başlattığında, process crash olduğunda ya da deploy
sırasında TÜM görevler/onaylar/risk bulguları/dokümanlar sıfırlanıyordu.
Demo günü bu bir felaket riski.

TASARIM: Her tablo tek bir `data` (JSON) kolonu + bir `item_id` kolonu
tutuyor. Böylece main.py'deki "her task'ın farklı alanları olabilir"
(bazen `pending_doc_topic` var, bazen `recipient_email` var, vs.) esnekliği
korunuyor — şemayı sabit kolonlara zorlamaya gerek kalmadı.

KULLANIM (main.py'de):
    from store import SQLiteList, init_store

    init_store()  # startup_event içinde bir kere çağır

    db_tasks = SQLiteList("tasks")                      # id_field="id" (varsayılan)
    db_risk_findings = SQLiteList("risk_findings", id_field="risk_id")
    db_audit_logs = SQLiteList("audit_logs")
    db_vault_documents = SQLiteList("vault_documents")

Eski kod böyle kalabilir (DEĞİŞMEDEN çalışır):
    db_tasks.insert(0, new_task)              # index parametresi yok sayılır
    for t in db_tasks: ...                    # __iter__ tanımlı
    len(db_tasks)                             # __len__ tanımlı
    next((t for t in db_tasks if ...), None)  # iterasyon üzerinden çalışır

TEK FARK — mutasyon: Eskiden `target_task["status"] = "x"` demek yeterliydi
çünkü aynı obje RAM'deydi. Şimdi her okuma YENİ bir dict döndürüyor (SQLite'tan
deserialize), o yüzden bir alanı değiştirdikten sonra AYRICA şunu çağırman
gerekiyor:
    db_tasks.update(target_task["id"], status="Onaylandı", completed=True)
main.py'deki üç mutasyon noktası için bu satırlar main_py_patches.md'de işaretli.
"""

import json
import sqlite3
from contextlib import contextmanager
from typing import Any, Dict, List, Optional

DB_PATH = "mantis.db"


@contextmanager
def get_conn():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_store() -> None:
    """Uygulama başlarken bir kere çağrılmalı (startup_event içinde)."""
    for table in ("tasks", "risk_findings", "audit_logs", "vault_documents"):
        with get_conn() as conn:
            conn.execute(
                f"""CREATE TABLE IF NOT EXISTS {table} (
                    item_id TEXT PRIMARY KEY,
                    data TEXT NOT NULL,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP
                )"""
            )


class SQLiteList:
    """db_tasks/db_risk_findings gibi kullanılan, ama SQLite'a yazan liste-benzeri depo."""

    def __init__(self, table: str, id_field: str = "id"):
        self.table = table
        self.id_field = id_field

    def insert(self, _index_ignored: int, item: Dict[str, Any]) -> None:
        """Eski `db_tasks.insert(0, item)` çağrılarıyla uyumlu — index parametresi
        yok sayılır, sıralama zaten created_at DESC ile yapılıyor."""
        item_id = str(item[self.id_field])
        with get_conn() as conn:
            conn.execute(
                f"INSERT OR REPLACE INTO {self.table} (item_id, data) VALUES (?, ?)",
                (item_id, json.dumps(item, ensure_ascii=False)),
            )

    def all(self) -> List[Dict[str, Any]]:
        with get_conn() as conn:
            rows = conn.execute(
                f"SELECT data FROM {self.table} ORDER BY created_at DESC"
            ).fetchall()
            return [json.loads(r["data"]) for r in rows]

    def get(self, item_id: Any) -> Optional[Dict[str, Any]]:
        with get_conn() as conn:
            row = conn.execute(
                f"SELECT data FROM {self.table} WHERE item_id=?", (str(item_id),)
            ).fetchone()
            return json.loads(row["data"]) if row else None

    def update(self, item_id: Any, **updates: Any) -> Optional[Dict[str, Any]]:
        """Bir alanı değiştirdikten sonra bunu çağırmayı UNUTMA — aksi halde
        değişiklik sadece o anki Python dict'inde kalır, kalıcı olmaz."""
        item_id = str(item_id)
        with get_conn() as conn:
            row = conn.execute(
                f"SELECT data FROM {self.table} WHERE item_id=?", (item_id,)
            ).fetchone()
            if not row:
                return None
            item = json.loads(row["data"])
            item.update(updates)
            conn.execute(
                f"UPDATE {self.table} SET data=? WHERE item_id=?",
                (json.dumps(item, ensure_ascii=False), item_id),
            )
            return item

    def clear(self) -> None:
        """Tablodaki tüm kayıtları siler."""
        with get_conn() as conn:
            conn.execute(f"DELETE FROM {self.table}")

    def delete(self, item_id: Any) -> None:
        with get_conn() as conn:
            conn.execute(f"DELETE FROM {self.table} WHERE item_id=?", (str(item_id),))

    def seed_if_empty(self, items: List[Dict[str, Any]]) -> None:
        """main.py'deki başlangıç seed verilerini (örnek risk bulguları,
        'SYSTEM_READY' log kaydı) tablo boşsa bir kere ekler."""
        if len(self) == 0:
            for it in items:
                self.insert(0, it)

    def __len__(self) -> int:
        with get_conn() as conn:
            return conn.execute(f"SELECT COUNT(*) c FROM {self.table}").fetchone()["c"]

    def __iter__(self):
        return iter(self.all())