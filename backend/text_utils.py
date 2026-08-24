def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> list:
    """
    Sözleşme metnini, anlam kopukluğunu önlemek için örtüşmeli (overlap)
    şekilde yönetilebilir parçalara böler. Defensive programming ile boş metin kontrolü yapar.
    """
    if not text:
        return []

    chunks = []
    start = 0
    text_length = len(text)

    while start < text_length:
        end = start + chunk_size
        chunk = text[start:end]
        chunks.append(chunk)
        
        # Bir sonraki parçaya geçerken 'overlap' kadar geriden başla ki bağlam kopmasın
        start += (chunk_size - overlap)

    return chunks