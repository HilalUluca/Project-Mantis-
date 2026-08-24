import { create } from 'zustand';

export const useChatStore = create((set) => ({
  isOpen: false, // Chat paneli açık mı kapalı mı?
  activeDocumentId: null, // Kullanıcı hangi belgede? (Boşsa genel asistan)
  messages: [{ role: "ai", content: "Mantis Kurumsal Asistanı hazır. Size nasıl yardımcı olabilirim?" }],
  
  // Aksiyonlar (Metodlar)
  toggleChat: () => set((state) => ({ isOpen: !state.isOpen })),
  
  // Sayfa değiştiğinde çağrılacak metod: Hedefi daraltır veya sıfırlar
  setActiveDocument: (docId) => set({ activeDocumentId: docId }),
  
  // Yeni mesaj ekleme
  addMessage: (message) => set((state) => ({ 
    messages: [...state.messages, message] 
  })),
}));