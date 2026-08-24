import sqlite3
import json

# Veritabanı dosyamızın yolu
DB_PATH = "mantis_memory.db"

def init_db():
    """SQLite veritabanını ve RAG tablosunu oluşturur."""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # document_type sütunu, sistemin sadece hukuki değil; İK, Finans, 
        # Operasyon gibi tüm şirket verilerini kategorize etmesini sağlar.
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS document_chunks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                source_file TEXT NOT NULL,
                document_type TEXT DEFAULT 'genel', 
                chunk_text TEXT NOT NULL,
                embedding TEXT NOT NULL
            )
        ''')
        conn.commit()
        print("✅ Mantis RAG Veritabanı başarıyla başlatıldı.")
    except Exception as e:
        print(f"❌ Veritabanı başlatılma hatası: {e}")
    finally:
        if conn:
            conn.close()

def chunk_document(text, chunk_size=300, overlap=50):
    """
    Uzun metinleri anlamsal bütünlüğü koruyarak parçalara (chunk) ayırır.
    Overlap (örtüşme) değeri, cümlelerin ortasından bölünmesini kompanse eder.
    """
    if not text:
        return []
        
    words = text.split()
    chunks = []
    
    for i in range(0, len(words), chunk_size - overlap):
        chunk = " ".join(words[i:i + chunk_size])
        chunks.append(chunk)
        
    return chunks

def get_embedding(text):
    """
    Metni sayısal vektörlere (embedding) dönüştürür.
    Burada Foundry Local Embedding modelini çağıracağız.
    """
    # TODO: Kendi yerel model entegrasyonun buraya gelecek (örn: Qwen/Ollama/SentenceTransformers).
    # Şimdilik sistemi ayağa kaldırmak ve test etmek için dummy (göstermelik) bir vektör üretiyoruz.
    import random
    return [random.uniform(-1, 1) for _ in range(384)]

def process_and_store_document(source_file, content, document_type="genel"):
    """
    Bir dokümanı alır, parçalar, vektörleştirir ve SQLite'a kaydeder.
    Hata yönetimi ile (defensive programming) veritabanı kilitlenmelerini önler.
    """
    chunks = chunk_document(content)
    
    if not chunks:
        print(f"⚠️ {source_file} içeriği boş, işleme atlandı.")
        return False
        
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        for chunk in chunks:
            vector = get_embedding(chunk)
            
            # Vektörü JSON string olarak kaydediyoruz (Vanilla SQLite için en pratik ve hatasız yol)
            cursor.execute('''
                INSERT INTO document_chunks (source_file, document_type, chunk_text, embedding)
                VALUES (?, ?, ?, ?)
            ''', (source_file, document_type, chunk, json.dumps(vector)))
            
        conn.commit()
        print(f"🎯 {source_file} ({document_type}) başarıyla Mantis hafızasına işlendi. ({len(chunks)} parça)")
        return True
        
    except Exception as e:
        print(f"❌ Doküman işleme hatası: {e}")
        return False
    finally:
        if conn:
            conn.close()

# Sistemi test etmek için doğrudan bu dosya çalıştırıldığında veritabanını kur
if __name__ == "__main__":
    init_db()

import math

def cosine_similarity(vec1, vec2):
    """İki vektör (embedding) arasındaki anlamsal benzerliği hesaplar."""
    dot_product = sum(a * b for a, b in zip(vec1, vec2))
    magnitude1 = math.sqrt(sum(a * a for a in vec1))
    magnitude2 = math.sqrt(sum(b * b for b in vec2))
    if magnitude1 == 0 or magnitude2 == 0:
        return 0.0
    return dot_product / (magnitude1 * magnitude2)

def retrieve_relevant_chunks(query, top_k=3, document_type=None, source_file=None):
    """
    Kullanıcının sorusunu vektörleştirir ve SQLite'taki en alakalı metin parçalarını bulur.
    Gerekirse sadece belirli bir dosyaya (source_file) odaklanır.
    """
    try:
        query_vector = get_embedding(query)
        
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Hedef daraltma: Eğer belirli bir belge id/isim geldiyse sadece onda ara
        if source_file:
            cursor.execute("SELECT source_file, chunk_text, embedding FROM document_chunks WHERE source_file=?", (source_file,))
        elif document_type and document_type != "genel":
            cursor.execute("SELECT source_file, chunk_text, embedding FROM document_chunks WHERE document_type=?", (document_type,))
        else:
            cursor.execute("SELECT source_file, chunk_text, embedding FROM document_chunks")
            
        rows = cursor.fetchall()
        
        results = []
        for row in rows:
            source, text, emb_str = row
            chunk_vector = json.loads(emb_str)
            
            similarity = cosine_similarity(query_vector, chunk_vector)
            results.append((similarity, source, text))
            
        results.sort(key=lambda x: x[0], reverse=True)
        return results[:top_k]
        
    except Exception as e:
        print(f"❌ Arama (Retrieval) hatası: {e}")
        return []
    finally:
        if conn:
            conn.close()