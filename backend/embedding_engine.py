from sentence_transformers import SentenceTransformer

class FoundryLocalEmbedder:
    def __init__(self, model_name: str = 'paraphrase-multilingual-MiniLM-L12-v2'):
        # Modeli bir kez yükleyip bellekte tutuyoruz (Singleton yaklaşımı).
        # Türkçe ve İngilizce hukuki metinlerde yüksek performans veren hafif bir model.
        print("Foundry Local Embedding Modeli yükleniyor...")
        self.model = SentenceTransformer(model_name)
        print("Model başarıyla ayağa kalktı.")

    def generate_embeddings(self, chunks: list) -> list:
        """
        Defensive Programming: Gelen verinin doğruluğunu test et.
        Parçalanmış metinleri (chunks) alır ve vektör listesi döner.
        """
        if not chunks:
            return []
        
        # Yerel model üzerinden metinleri vektörlere dönüştür (numpy array olarak döner)
        embeddings = self.model.encode(chunks)
        
        # Veritabanına (SQLite) kaydedebilmek için standart Python listelerine çeviriyoruz
        return embeddings.tolist()

# Orkestrasyon için nesneyi hazırda tutuyoruz
embedder = FoundryLocalEmbedder()