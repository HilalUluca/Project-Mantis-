import sqlite3
import json
import math
import requests
import os

# Veritabanı dosyamızın yolu
DB_PATH = "mantis_memory.db"
DEFAULT_EMBEDDING_URL = os.getenv("FOUNDRY_LOCAL_EMBEDDINGS_URL", "http://127.0.0.1:5272/v1/embeddings")
DEFAULT_EMBEDDING_MODEL = os.getenv("FOUNDRY_LOCAL_EMBEDDING_MODEL", "qwen3-embedding-0.6b")

def init_db():
    """SQLite veritabanını ve RAG tablosunu oluşturur."""
    conn = None
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS document_chunks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                source_file TEXT NOT NULL,
                document_type TEXT DEFAULT 'genel',
                document_id TEXT DEFAULT '',
                doc_name TEXT DEFAULT '',
                page_number INTEGER DEFAULT 1,
                clause_title TEXT DEFAULT 'Genel Madde',
                chunk_text TEXT NOT NULL,
                embedding TEXT NOT NULL
            )
        ''')

        columns = [row[1] for row in cursor.execute("PRAGMA table_info(document_chunks)").fetchall()]
        for column_name, create_sql in {
            "document_id": "ALTER TABLE document_chunks ADD COLUMN document_id TEXT DEFAULT ''",
            "doc_name": "ALTER TABLE document_chunks ADD COLUMN doc_name TEXT DEFAULT ''",
            "page_number": "ALTER TABLE document_chunks ADD COLUMN page_number INTEGER DEFAULT 1",
            "clause_title": "ALTER TABLE document_chunks ADD COLUMN clause_title TEXT DEFAULT 'Genel Madde'",
        }.items():
            if column_name not in columns:
                cursor.execute(create_sql)

        conn.commit()
        print("✅ Mantis RAG Veritabanı başarıyla başlatıldı.")
    except Exception as e:
        print(f"❌ Veritabanı başlatılma hatası: {e}")
    finally:
        if conn:
            conn.close()


def _default_chunk_metadata(source_file, chunk_index=0):
    doc_name = os.path.basename(str(source_file)) if source_file else "unknown_document"
    return {
        "doc_id": str(source_file or f"doc_{chunk_index}"),
        "doc_name": doc_name,
        "page_number": max(1, (chunk_index // 2) + 1),
        "clause_title": f"Genel Madde {chunk_index + 1}",
    }


def chunk_document(text, chunk_size=700, overlap=100):
    """Geriye uyumlu chunk üretimi: yalnızca metin listesi döndürür."""
    return [entry["text"] for entry in chunk_document_with_metadata(text, chunk_size=chunk_size, overlap=overlap)]


def chunk_document_with_metadata(text, chunk_size=700, overlap=100, source_file=None):
    """Her chunk için kaynak metadatası da taşıyan chunk listesi üretir."""
    if not text:
        return []

    paragraphs = [paragraph.strip() for paragraph in text.splitlines() if paragraph.strip()]
    chunks = []
    current = ""
    for paragraph in paragraphs:
        if current and len(current) + len(paragraph) + 1 > chunk_size:
            chunks.append(current)
            current = current[-overlap:] + " " + paragraph
        else:
            current = f"{current} {paragraph}".strip()
    if current:
        chunks.append(current)

    enriched = []
    for index, chunk_text in enumerate(chunks):
        metadata = _default_chunk_metadata(source_file, index)
        enriched.append({
            "text": chunk_text,
            "metadata": metadata,
        })
    return enriched

def get_embedding(text):
    """
    Metni sayısal vektörlere (embedding) dönüştürür.
    Foundry Local'un OpenAI-uyumlu embeddings endpoint'ini kullanır.
    """
    try:
        payload = {
            "model": DEFAULT_EMBEDDING_MODEL,
            "input": text,
        }
        response = requests.post(
            DEFAULT_EMBEDDING_URL,
            json=payload,
            headers={"Authorization": "Bearer " + os.getenv("FOUNDRY_API_KEY", "foundry-local-key")},
            timeout=15,
        )
        if response.status_code == 200:
            data = response.json()
            embedding = data.get("data", [{}])[0].get("embedding") if isinstance(data.get("data"), list) else data.get("embedding")
            if embedding:
                return embedding
        print(f"⚠️ Foundry Local embedding servisi hata döndü, yedek vektör kullanılıyor. Kod: {response.status_code}")
        import random
        return [random.uniform(-1, 1) for _ in range(384)]
    except Exception as e:
        print(f"❌ Foundry Local embedding bağlantısı kurulamadı: {e}. Yedek vektör kullanılıyor.")
        import random
        return [random.uniform(-1, 1) for _ in range(384)]

def process_and_store_document(source_file, content, document_type="genel", chunk_metadata=None):
    """Bir dokümanı alır, parçalar, vektörleştirir ve SQLite'a kaydeder."""
    chunks = chunk_document_with_metadata(content, source_file=source_file)

    if not chunks:
        print(f"⚠️ {source_file} içeriği boş, işleme atlandı.")
        return False

    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        cursor.execute("DELETE FROM document_chunks WHERE source_file=?", (source_file,))

        for index, chunk in enumerate(chunks):
            metadata = chunk_metadata or chunk.get("metadata") or _default_chunk_metadata(source_file, index)
            chunk_text = chunk.get("text") or str(chunk)
            vector = get_embedding(chunk_text)

            cursor.execute('''
                INSERT INTO document_chunks (
                    source_file, document_type, document_id, doc_name, page_number, clause_title, chunk_text, embedding
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                source_file,
                document_type,
                metadata.get("doc_id") or str(source_file),
                metadata.get("doc_name") or os.path.basename(str(source_file) or "unknown_document"),
                metadata.get("page_number") or 1,
                metadata.get("clause_title") or "Genel Madde",
                chunk_text,
                json.dumps(vector),
            ))

        conn.commit()
        print(f"🎯 {source_file} ({document_type}) başarıyla Mantis hafızasına işlendi. ({len(chunks)} parça)")
        return True

    except Exception as e:
        print(f"❌ Doküman işleme ve kaydetme hatası: {e}")
        return False
    finally:
        if conn:
            conn.close()

def cosine_similarity(vec1, vec2):
    """İki vektör (embedding) arasındaki anlamsal benzerliği hesaplar."""
    if not vec1 or not vec2 or len(vec1) != len(vec2):
        return 0.0
    dot_product = sum(a * b for a, b in zip(vec1, vec2))
    magnitude1 = math.sqrt(sum(a * a for a in vec1))
    magnitude2 = math.sqrt(sum(b * b for b in vec2))
    if magnitude1 == 0 or magnitude2 == 0:
        return 0.0
    return dot_product / (magnitude1 * magnitude2)

def retrieve_relevant_chunks(query, top_k=3, document_type=None, source_file=None):
    """İlgili chunk'ları kaynak metadatasıyla birlikte döndürür."""
    conn = None
    try:
        query_vector = get_embedding(query)

        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        if source_file:
            cursor.execute(
                "SELECT source_file, document_id, doc_name, page_number, clause_title, chunk_text, embedding FROM document_chunks WHERE source_file=?",
                (source_file,),
            )
        elif document_type and document_type != "genel":
            cursor.execute(
                "SELECT source_file, document_id, doc_name, page_number, clause_title, chunk_text, embedding FROM document_chunks WHERE document_type=?",
                (document_type,),
            )
        else:
            cursor.execute(
                "SELECT source_file, document_id, doc_name, page_number, clause_title, chunk_text, embedding FROM document_chunks"
            )

        rows = cursor.fetchall()

        results = []
        for row in rows:
            source, document_id, doc_name, page_number, clause_title, text, emb_str = row
            try:
                chunk_vector = json.loads(emb_str)
                similarity = cosine_similarity(query_vector, chunk_vector)
                results.append({
                    "score": similarity,
                    "source_file": source,
                    "document_id": document_id or str(source),
                    "doc_name": doc_name or os.path.basename(str(source) or "unknown_document"),
                    "page_number": int(page_number or 1),
                    "clause_title": clause_title or "Genel Madde",
                    "text": text,
                })
            except Exception:
                continue

        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:top_k]

    except Exception as e:
        print(f"❌ Arama (Retrieval) hatası: {e}")
        return []
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    init_db()