import React, { useState, useRef, useEffect } from 'react';
import { useChatStore } from '../store/chatStore'; // Zustand Store bağlantısı

export default function ChatPanel() {
  // Global State'ten gelen veriler ve fonksiyonlar
  const { isOpen, toggleChat, activeDocumentId, messages, addMessage } = useChatStore();
  
  // Sadece bu bileşeni ilgilendiren yerel UI State'leri
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef(null);

  // Otomatik aşağı kaydırma
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping, isOpen]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = inputText.trim();
    // Yeni mesajı global state'e ekle
    addMessage({ role: 'user', content: userMessage });
    setInputText("");
    setIsTyping(true);

    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage,
          document_id: activeDocumentId // Asistanı belirli bir belgeye kilitleyen parametre
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        addMessage({ role: 'ai', content: data.reply });
      } else {
        addMessage({ role: 'ai', content: `HTTP Hatası: ${response.status}` });
      }
    } catch (error) {
      console.error("Chat API Error:", error);
      addMessage({ role: 'ai', content: "Ağ hatası: FastAPI motoruna ulaşılamıyor. Sunucunun açık olduğundan emin olun." });
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSendMessage();
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <div className="mb-4 w-80 h-96 bg-[#121622]/95 border border-purple-500/30 backdrop-blur-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-2">
          
          {/* Header */}
          <div className="p-3.5 bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border-b border-white/10 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-white">Mantis AI</span>
            </div>
            <button onClick={toggleChat} className="text-slate-400 hover:text-white text-xs transition-colors">✕</button>
          </div>

          {/* Otonom Hedef Uyarıcısı (Context Banner) */}
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

          {/* Girdi Alanı */}
          <div className="p-3 border-t border-white/10 bg-black/40 flex gap-2">
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Mantis AI'ya sor..." 
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500 transition-colors" 
              disabled={isTyping}
            />
            <button 
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isTyping}
              className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-2 rounded-xl text-xs font-bold transition-all"
            >
              ➔
            </button>
          </div>
        </div>
      )}

      {/* Yüzen Buton (Floating Action Button) */}
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