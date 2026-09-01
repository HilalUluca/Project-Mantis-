import React, { useState, useRef, useEffect } from 'react';
import { useChatStore } from '../store/chatStore';

export default function ChatPanel() {
  const { isOpen, toggleChat, activeDocumentId, messages, addMessage } = useChatStore();
  
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  
  // İstekteki akışı durdurmak (abort etmek) için useRef controller
  const abortControllerRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping, isOpen]);

  // Mesaj Gönderme ve Abort (Durdurma) Mekanizması
  const handleSendMessage = async (textToSend = inputText) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isSending) return;

    const userMessage = trimmed;
    addMessage({ role: 'user', content: userMessage });
    setInputText("");
    setIsTyping(true);
    setIsSending(true);

    abortControllerRef.current = new AbortController();

    try {
      const timeout = setTimeout(() => abortControllerRef.current?.abort(), 120000);
      const response = await fetch('http://localhost:8000/api/v1/orchestrator/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('mantis_token')
            ? { Authorization: `Bearer ${localStorage.getItem('mantis_token')}` }
            : {})
        },
        body: JSON.stringify({ 
          message: userMessage,
          document_id: activeDocumentId 
        }),
        signal: abortControllerRef.current.signal
      });
      clearTimeout(timeout);

      const data = await response.json();

      const reply = data.reply || data.message || 'Yanıt üretilemedi.';
      const citations = Array.isArray(data.citations) && data.citations.length ? data.citations : Array.isArray(data.cited_clauses) ? data.cited_clauses.map((item) => ({
        source_doc: item.source || item.doc_name || 'Belge',
        page: item.page || item.page_number || 1,
        excerpt: item.text || item.excerpt || '',
      })) : [];

      if (response.ok) {
        if (Array.isArray(data.tasks) && data.tasks.length) {
          useChatStore.getState().setTasks(data.tasks);
        }
        if (Array.isArray(data.risks) && data.risks.length) {
          useChatStore.getState().setDocumentRisks(data.risks);
        }

        addMessage({
          role: 'ai',
          content: reply,
          citations,
        });
      } else {
        addMessage({ role: 'ai', content: data.detail || data.message || `HTTP Hatası: ${response.status}` });
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        addMessage({ role: 'ai', content: "Yanıt üretimi durduruldu veya zaman aşımına uğradı. Komutu daha kısa yazarak tekrar deneyebilirsin." });
      } else {
        console.error("Chat API Error:", error);
        addMessage({ role: 'ai', content: "Ağ hatası: FastAPI motoruna ulaşılamıyor." });
      }
    } finally {
      setIsTyping(false);
      setIsSending(false);
      abortControllerRef.current = null;
    }
  };

  // Yanıtı Durdurma Butonu Fonksiyonu
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort(); // Aktif fetch isteğini keser
    }
    setIsTyping(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !isTyping) handleSendMessage();
  };

  // Sesli komut vb. diğer fonksiyonlar aynı kalır...
  const startRecording = async () => { /* ... */ };
  const stopRecording = () => { /* ... */ };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <div className="mb-4 w-80 h-96 bg-[#121622]/95 border border-purple-500/30 backdrop-blur-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-2">
          
          {/* Header */}
          <div className="p-3.5 bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border-b border-white/10 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-white">Mantis AI Karargah</span>
            </div>
            <button onClick={toggleChat} className="text-slate-400 hover:text-white text-xs transition-colors">✕</button>
          </div>

          {/* Otonom Hedef Uyarıcısı */}
          {activeDocumentId && (
            <div className="bg-cyan-900/30 border-b border-cyan-500/20 px-3 py-1.5 flex items-center gap-2">
              <span className="text-[10px] text-cyan-400 animate-pulse">🎯</span>
              <span className="text-[10px] text-cyan-200/80 truncate">
                Odak: {activeDocumentId.replace("rag_", "")}
              </span>
            </div>
          )}
          
          {/* Mesaj Alanı */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`px-3 py-2 rounded-xl text-xs max-w-[85%] leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-purple-600 text-white rounded-br-sm' 
                    : 'bg-white/5 border border-white/10 text-slate-300 rounded-bl-sm'
                }`}>
                  {msg.content}
                </div>
                {msg.role === 'ai' && Array.isArray(msg.citations) && msg.citations.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2 max-w-[85%]">
                    {msg.citations.map((citation, citationIndex) => (
                      <button
                        key={`${citation.source_doc}-${citation.page}-${citationIndex}`}
                        type="button"
                        className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-1 text-[10px] text-cyan-200 hover:bg-cyan-500/20 transition-colors"
                        title={citation.excerpt || 'Kaynak'}
                      >
                        {citation.source_doc || 'Belge'} · Sayfa {citation.page || 1}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            {/* Yazıyor Animasyonu */}
            {isTyping && (
              <div className="flex items-start">
                <div className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 rounded-bl-sm flex gap-1">
                  <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                  <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Girdi Alanı ve Akıllı Gönder / Durdur Butonu */}
          <div className="p-3 border-t border-white/10 bg-black/40 flex items-center gap-2">
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isTyping ? "Yanıt üretiliyor..." : "Mantis AI'ya komut ver..."} 
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500 transition-colors disabled:opacity-60" 
              disabled={isTyping || isSending}
            />

            {/* Mikrofon */}
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`p-2 rounded-xl transition-all duration-300 text-xs flex items-center justify-center ${
                isRecording 
                  ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/50' 
                  : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
              title={isRecording ? "Kaydı Durdur ve Gönder" : "Sesli Komut Ver"}
              disabled={isTyping || isSending}
            >
              {isRecording ? "⏹" : "🎤"}
            </button>

            {/* DİNAMİK BUTON: Gönder veya Durdur (Pause) */}
            {isTyping ? (
              <button 
                onClick={handleStopGeneration}
                className="bg-amber-600 hover:bg-amber-500 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-amber-600/30 flex items-center justify-center"
                title="Yanıtı Durdur"
              >
                ⏹
              </button>
            ) : (
              <button 
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim()}
                className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-2 rounded-xl text-xs font-bold transition-all"
                title="Gönder"
              >
                ➔
              </button>
            )}
          </div>
        </div>
      )}

      {/* Yüzen Buton */}
      <button
        onClick={toggleChat}
        className="w-14 h-14 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-500 to-cyan-400 p-0.5 shadow-2xl shadow-purple-600/40 hover:scale-105 transition-all flex items-center justify-center relative group"
      >
        <div className="w-full h-full rounded-full bg-[#0E1117] flex items-center justify-center transition-colors group-hover:bg-[#121622]">
          <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-purple-400 to-cyan-300 animate-pulse" />
        </div>
        <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-emerald-400 border-2 border-[#0A0C10] rounded-full" />
      </button>
    </div>
  );
}  