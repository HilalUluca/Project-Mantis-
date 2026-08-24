import sqlite3
import json  # JSON kütüphanesi eklendi

DB_NAME = "mantis.db"

def insert_document(title: str, text: str) -> int:
    """
    Yeni bir sözleşmeyi veritabanına kaydeder ve ID'sini döner.
    Hata durumunda kontrollü bir şekilde None döner.
    """
    conn = None
    try:
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        
        # Ana sözleşme metnini kaydet
        cursor.execute(
            "INSERT INTO documents (title, original_text) VALUES (?, ?)", 
            (title, text)
        )
        document_id = cursor.lastrowid
        
        conn.commit()
        return document_id
        
    except Exception as e:
        print(f"Sözleşme kaydedilirken kritik hata: {e}")
        return None
        
    finally:
        # İşlem bitince veya hata çıkarsa bağlantıyı güvenli bir şekilde kapat
        if conn:
            conn.close()

def insert_chunks(document_id: int, chunks: list) -> bool:
    """
    Bölünen metin parçalarını ilgili sözleşme ID'si ile veritabanına bağlayarak kaydeder.
    Defensive programming: Hatalı veri tipine veya boş listeye karşı baştan önlem alır.
    """
    if not chunks or not document_id:
        return False
        
    conn = None
    try:
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        
        # Her bir parçayı döngüyle tek tek kaydetmek yerine, performansı artırmak için
        # executemany ile toplu kayıt (batch insert) stratejisi uyguluyoruz.
        records = [(document_id, i, chunk) for i, chunk in enumerate(chunks)]
        cursor.executemany(
            "INSERT INTO chunks (document_id, chunk_index, chunk_text) VALUES (?, ?, ?)",
            records
        )
        
        conn.commit()
        return True
        
    except Exception as e:
        print(f"Parçalar kaydedilirken kritik hata: {e}")
        return False
        
    finally:
        if conn:
            conn.close()

def insert_chunks_and_embeddings(document_id: int, chunks: list, embeddings: list, model_name: str = "foundry_local") -> bool:
    """
    Hem metin parçalarını hem de vektörlerini aynı anda birbirine bağlayarak kaydeder.
    """
    if not chunks or not embeddings or len(chunks) != len(embeddings):
        return False
        
    conn = None
    try:
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        
        for i, chunk_text in enumerate(chunks):
            # 1. Önce Parçayı (Chunk) Kaydet
            cursor.execute(
                "INSERT INTO chunks (document_id, chunk_index, chunk_text) VALUES (?, ?, ?)",
                (document_id, i, chunk_text)
            )
            chunk_id = cursor.lastrowid # Oluşan ID'yi yakala
            
            # 2. Vektörü (Embedding) Byte formatına çevir ve Kaydet
            vector_data = json.dumps(embeddings[i]).encode('utf-8')
            cursor.execute(
                "INSERT INTO embeddings (chunk_id, embedding, model_name) VALUES (?, ?, ?)",
                (chunk_id, vector_data, model_name)
            )
            
        conn.commit()
        return True
        
    except Exception as e:
        print(f"Chunk/Embedding kayıt zincirinde kritik hata: {e}")
        return False
        
    finally:
        if conn:
            conn.close()