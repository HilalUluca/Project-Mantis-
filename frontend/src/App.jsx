import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatPanel from './components/ChatPanel';
import DashboardHub from './pages/DashboardHub';
import DocumentsHub from './pages/DocumentsHub';
import AnalysisHub from './pages/AnalysisHub';
import TeamHub from './pages/TeamHub';
import Tasks from './pages/Tasks';
import SettingsHub from './pages/SettingsHub';
import Login from './components/Login';
import OnboardingWizard from './components/OnboardingWizard';
import { useChatStore } from './store/chatStore';

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('mantis_token'));
  
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [auditLogs, setAuditLogs] = useState([]);
  const [riskFindings, setRiskFindings] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [vaultDocuments, setVaultDocuments] = useState([]);
  const [dashboardSummary, setDashboardSummary] = useState(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [uploadedDocId, setUploadedDocId] = useState(null);
  const [uploadedText, setUploadedText] = useState(""); 

  const [isChatActive, setIsChatActive] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');

  const setActiveDocument = useChatStore((state) => state.setActiveDocument);

  // Tema yükleme ve takip kontrolü
  useEffect(() => {
    const savedTheme = localStorage.getItem('mantis_theme');
    if (savedTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  }, []);

  useEffect(() => {
    if ((activeTab === 'Documents' || activeTab === 'Analysis') && uploadedDocId) {
      setActiveDocument(uploadedDocId);
    } else {
      setActiveDocument(null);
    }
  }, [activeTab, uploadedDocId, setActiveDocument]);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const headers = { 'Authorization': `Bearer ${token}` };
        const [logsRes, risksRes, teamRes, docsRes, summaryRes] = await Promise.all([
          fetch('http://localhost:8000/api/v1/dashboard/logs', { headers }).catch(() => null),
          fetch('http://localhost:8000/api/v1/analysis/risks', { headers }).catch(() => null),
          fetch('http://localhost:8000/api/v1/team/members', { headers }).catch(() => null),
          fetch('http://localhost:8000/api/v1/documents/vault', { headers }).catch(() => null),
          fetch('http://localhost:8000/api/v1/dashboard/summary', { headers }).catch(() => null)
        ]);

        if (logsRes && logsRes.ok) setAuditLogs(await logsRes.json());
        if (risksRes && risksRes.ok) setRiskFindings(await risksRes.json());
        if (teamRes && teamRes.ok) setTeamMembers(await teamRes.json());
        if (docsRes && docsRes.ok) setVaultDocuments(await docsRes.json());
        if (summaryRes && summaryRes.ok) setDashboardSummary(await summaryRes.json());
      } catch (error) {
        console.error("Backend bağlantı hatası:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const handleRunAudit = async () => {
    if (!uploadedText) {
      alert("Lütfen önce Vault'a bir sözleşme yükleyin.");
      return;
    }

    setIsAnalyzing(true);
    setActiveTab('Analysis');

    try {
      const payload = {
        document_id: uploadedDocId || "VX-NEW",
        text: uploadedText,
      };

      const response = await fetch('http://localhost:8000/api/v1/analyze', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (response.ok && data.status === 'success') {
        setRiskFindings(data.findings);
        const summaryResponse = await fetch('http://localhost:8000/api/v1/dashboard/summary', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (summaryResponse.ok) setDashboardSummary(await summaryResponse.json());
      } else {
        const errorMessage = data.detail || data.message || 'Motor hatası.';
        alert(`Analiz başarısız: ${errorMessage}`);
      }
    } catch (error) {
      alert('Analiz motoruna bağlanılamadı.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const [isSendingChat, setIsSendingChat] = useState(false);
  const chatAbortControllerRef = React.useRef(null);

  const handleSendMessage = async (queryText) => {
    const textToSend = (queryText || chatInput).trim();
    if (!textToSend || isSendingChat) return;

    const newMsg = { role: 'user', content: textToSend };
    const updatedMessages = [...chatMessages, newMsg];
    setChatMessages(updatedMessages);
    setChatInput('');
    setIsChatActive(true);
    setIsSendingChat(true);

    try {
      const controller = new AbortController();
      chatAbortControllerRef.current = controller;
      const timeout = setTimeout(() => controller.abort(), 120000);

      const response = await fetch('http://localhost:8000/api/v1/orchestrator/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: textToSend }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const data = await response.json();
      if (response.ok) {
        if (Array.isArray(data.tasks) && data.tasks.length) {
          useChatStore.getState().setTasks(data.tasks);
        }
        if (Array.isArray(data.risks) && data.risks.length) {
          setRiskFindings(data.risks);
        }
        if (Array.isArray(data.citations) && data.citations.length) {
          setChatMessages([...updatedMessages, { role: 'assistant', content: data.reply || data.message, citations: data.citations }]);
        } else {
          setChatMessages([...updatedMessages, { role: 'assistant', content: data.reply || data.message }]);
        }

        const summaryResponse = await fetch('http://localhost:8000/api/v1/dashboard/summary', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (summaryResponse.ok) {
          setDashboardSummary(await summaryResponse.json());
        }
      } else {
        setChatMessages([...updatedMessages, { role: 'assistant', content: data.detail || data.message || 'Sistem yanıt üretirken hata oluştu.' }]);
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        setChatMessages([...updatedMessages, { role: 'assistant', content: 'Yanıt üretimi durduruldu veya zaman aşımına uğradı. Komutu daha kısa yazarak tekrar deneyebilirsin.' }]);
      } else {
        setChatMessages([...updatedMessages, { role: 'assistant', content: 'Backend bağlantı hatası.' }]);
      }
    } finally {
      setIsSendingChat(false);
      chatAbortControllerRef.current = null;
    }
  };

  const stopChatGeneration = () => {
    chatAbortControllerRef.current?.abort();
    setIsSendingChat(false);
  };

  if (!token) {
    return <Login onLoginSuccess={() => setToken(localStorage.getItem('mantis_token'))} />;
  }

  const isOnboardingDone = localStorage.getItem('onboarding_completed') === 'true';
  if (!isOnboardingDone) {
    return <OnboardingWizard onComplete={() => window.location.reload()} />;
  }

  return (
    <div className="flex h-screen bg-[#F4F6F9] dark:bg-[#0A0C10] text-slate-800 dark:text-slate-100 font-sans overflow-hidden transition-colors duration-300 selection:bg-purple-500 selection:text-white">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isAnalyzing={isAnalyzing} handleRunAudit={handleRunAudit} />
      
      <main className="flex-1 flex flex-col h-screen overflow-y-auto bg-[#F8FAFC] dark:bg-[#070707] p-8 transition-colors duration-300">
        
        {/* Üst Bar: Çıkış Butonu */}
        <div className="flex justify-end items-center mb-6 pb-4 border-b border-slate-200 dark:border-white/[0.03] relative z-20">
          <button 
            onClick={() => {
              localStorage.removeItem('mantis_token');
              setToken(null);
            }}
            title="Terminate Session (Signout)"
            className="w-10 h-10 rounded-xl bg-white dark:bg-black hover:bg-red-50 dark:hover:bg-red-500/10 border border-slate-200 dark:border-white/[0.05] hover:border-red-300 dark:hover:border-red-500/30 text-slate-500 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 flex items-center justify-center transition-all cursor-pointer shadow-sm dark:shadow-lg group"
          >
            <svg className="w-4 h-4 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>

        {isLoading ? (
           <div className="flex-1 flex items-center justify-center">
             <div className="flex flex-col items-center gap-4">
               <div className="w-8 h-8 rounded-full border-t-2 border-r-2 border-purple-500 animate-spin" />
               <p className="text-xs text-purple-600 dark:text-purple-400 font-mono tracking-widest uppercase">Connecting to Mantis Core API...</p>
             </div>
           </div>
        ) : (
          <>
            {activeTab === 'Dashboard' && (
              <div className="flex-1 flex flex-col transition-all duration-300 ease-in-out relative">
                {!isChatActive ? (
                  <DashboardHub 
                    riskFindings={riskFindings} 
                    dashboardSummary={dashboardSummary}
                    onStartChat={(query) => {
                      setIsChatActive(true);
                      handleSendMessage(query);
                    }} 
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col max-w-4xl mx-auto w-full p-4 space-y-6 animate-in fade-in duration-300 justify-between">
                    <div className="absolute inset-0 bg-white dark:bg-[#030303] rounded-3xl shadow-xl dark:shadow-2xl overflow-hidden pointer-events-none -z-10 border border-slate-200 dark:border-white/[0.02]"></div>

                    <div className="relative z-10 flex justify-between items-center border-b border-slate-200 dark:border-white/[0.03] pb-4 shrink-0 px-2 mt-2">
                      <h3 className="text-sm font-bold text-slate-800 dark:text-white tracking-widest uppercase">
                        Mantis AI
                      </h3>
                      <button 
                        onClick={() => setIsChatActive(false)}
                        title="Return to Dashboard"
                        className="w-10 h-10 bg-slate-100 dark:bg-[#0a0a0a] hover:bg-slate-200 dark:hover:bg-[#111] border border-slate-300 dark:border-gray-800 hover:border-slate-400 dark:hover:border-gray-600 text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white rounded-xl transition-all cursor-pointer flex items-center justify-center shadow-sm dark:shadow-lg group"
                      >
                        <svg className="w-4 h-4 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                      </button>
                    </div>

                    <div className="relative z-10 space-y-6 flex-1 overflow-y-auto pr-2 py-4 px-2">
                      {chatMessages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          {msg.role === 'assistant' && (
                            <div className="mr-3 mt-1 shrink-0">
                              <div className="relative w-7 h-7 bg-slate-100 dark:bg-[#050505] rounded-full border border-slate-300 dark:border-gray-800 shadow-sm flex items-center justify-center overflow-hidden">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981] relative z-10"></div>
                              </div>
                            </div>
                          )}

                          <div className={`relative max-w-[78%] px-5 py-4 rounded-2xl text-sm leading-relaxed shadow-sm dark:shadow-[0_10px_30px_rgba(0,0,0,0.8)] overflow-hidden ${
                            msg.role === 'user' 
                              ? 'bg-slate-900 dark:bg-[#050505] border border-slate-800 dark:border-gray-700 text-white' 
                              : 'bg-white dark:bg-[#050505] border border-slate-200 dark:border-white/[0.04] text-slate-800 dark:text-slate-200'
                          }`}>
                            <p className="relative z-10 font-sans tracking-wide">{msg.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="relative z-10 pt-4 pb-2 shrink-0 px-2">
                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (!isSendingChat) handleSendMessage(chatInput);
                        }} 
                        className="relative w-full overflow-hidden rounded-2xl shadow-sm dark:shadow-[0_15px_40px_rgba(0,0,0,0.8)]"
                      >
                        <input
                          type="text"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          placeholder={isSendingChat ? 'Yanıt üretiliyor...' : 'Command Mantis AI...'}
                          disabled={isSendingChat}
                          className="w-full bg-white dark:bg-[#050505] text-slate-900 dark:text-white border border-slate-300 dark:border-white/[0.05] px-5 py-4 pl-5 pr-14 text-sm focus:outline-none focus:border-slate-500 dark:focus:border-gray-500 transition-all placeholder:text-slate-400 dark:placeholder:text-gray-600 relative z-10 disabled:opacity-60"
                        />
                        <button
                          type={isSendingChat ? 'button' : 'submit'}
                          onClick={isSendingChat ? stopChatGeneration : undefined}
                          disabled={!isSendingChat && !chatInput.trim()}
                          className={`absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 ${isSendingChat ? 'bg-amber-600 border-amber-500' : 'bg-slate-900 dark:bg-black border-slate-700 dark:border-gray-800'} hover:border-slate-500 dark:hover:border-gray-500 text-white dark:text-gray-400 hover:text-white rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-sm dark:shadow-md z-20 disabled:opacity-60 disabled:cursor-not-allowed`}
                          title={isSendingChat ? 'Yanıtı durdur' : 'Gönder'}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {isSendingChat ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 6h12v12H6z" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M12 5l7 7-7 7" />}
                          </svg>
                        </button>
                      </form>
                    </div>

                  </div>
                )}
              </div>
            )}

            {activeTab === 'Documents' && (
              <DocumentsHub 
                isAnalyzing={isAnalyzing} 
                handleRunAudit={handleRunAudit} 
                setUploadedDocId={setUploadedDocId} 
                setUploadedText={setUploadedText} 
                vaultDocuments={vaultDocuments} 
                setVaultDocuments={setVaultDocuments} 
                onDocumentRisks={(findings) => {
                  setRiskFindings(findings);
                  setActiveTab('Analysis');
                }}
              />
            )}
            {activeTab === 'Analysis' && <AnalysisHub riskFindings={riskFindings} />}
            {activeTab === 'Team' && <TeamHub teamMembers={teamMembers} />}
            {activeTab === 'Tasks' && <Tasks />}
            {activeTab === 'Settings' && <SettingsHub />}
          </>
        )}
      </main>

      <ChatPanel />
    </div>
  );
}