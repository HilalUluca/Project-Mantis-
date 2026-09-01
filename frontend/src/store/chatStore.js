import { create } from 'zustand';

export const useChatStore = create((set, get) => ({
  // --- CHAT & PANEL STATE (Orijinal) ---
  isOpen: false, // Chat paneli açık mı kapalı mı?
  activeDocumentId: null, // Kullanıcı hangi belgede? (Boşsa genel asistan)
  messages: [
    { role: "ai", content: "Mantis Kurumsal Asistanı hazır. Size nasıl yardımcı olabilirim?" }
  ],

  // Chat Aksiyonları
  toggleChat: () => set((state) => ({ isOpen: !state.isOpen })),
  setActiveDocument: (docId) => set({ activeDocumentId: docId }),
  setActiveDocumentId: (docId) => set({ activeDocumentId: docId }),
  documentMessages: [],
  documentRisks: [],
  extractedDocTasks: [],
  isDocProcessing: false,
  isDocChatLoading: false,
  addDocumentMessage: (message) => set((state) => ({ documentMessages: [...state.documentMessages, message] })),
  setDocumentMessages: (documentMessages) => set({ documentMessages }),
  setDocumentRisks: (documentRisks) => set({ documentRisks }),
  setExtractedDocTasks: (extractedDocTasks) => set({ extractedDocTasks }),
  setIsDocProcessing: (isDocProcessing) => set({ isDocProcessing }),
  setIsDocChatLoading: (isDocChatLoading) => set({ isDocChatLoading }),
  addMessage: (message) => set((state) => ({ 
    messages: [...state.messages, message] 
  })),

  // --- GÖREVLER (Tasks.jsx & TeamHub.jsx ortak hafızası) ---
  tasks: [],
  tasksLoaded: false,

  setTasks: (tasks) => set({ tasks, tasksLoaded: true }),

  upsertTask: (task) =>
    set((state) => {
      const exists = state.tasks.some((t) => String(t.id) === String(task.id));
      return {
        tasks: exists
          ? state.tasks.map((t) => (String(t.id) === String(task.id) ? { ...t, ...task } : t))
          : [task, ...state.tasks],
      };
    }),

  updateTaskStatus: (taskId, updates) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        String(t.id) === String(taskId) ? { ...t, ...updates } : t
      ),
    })),

  fetchTasks: async () => {
    const token = localStorage.getItem('mantis_token');
    try {
      const response = await fetch('http://localhost:8000/api/v1/tasks', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json();
      if (response.ok && data.status === 'success') {
        set({ tasks: data.tasks, tasksLoaded: true });
        return data.tasks;
      }
      if (response.ok && Array.isArray(data)) {
        set({ tasks: data, tasksLoaded: true });
        return data;
      }
    } catch (error) {
      console.error('Görevler yüklenemedi:', error);
    }
    return get().tasks;
  },

  // --- TEAMHUB DEVAMSIZLIK KAYITLARI (Sekme değişince sıfırlanmaz) ---
  parsedRecords: [],

  addParsedRecord: (record) =>
    set((state) => ({ parsedRecords: [record, ...state.parsedRecords] })),

  updateParsedRecord: (recordId, updates) =>
    set((state) => ({
      parsedRecords: state.parsedRecords.map((r) =>
        r.id === recordId ? { ...r, ...updates } : r
      ),
    })),
})); 