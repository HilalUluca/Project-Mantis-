import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatPanel from './components/ChatPanel';
import DashboardHub from './pages/DashboardHub';
import DocumentsHub from './pages/DocumentsHub';
import AnalysisHub from './pages/AnalysisHub';
import TeamHub from './pages/TeamHub';
import AuditLogs from './pages/AuditLogs';
import { useChatStore } from './store/chatStore'; // YENİ: Zustand Store importu

export default function App() {
  const [activeTab, setActiveTab] = useState('Documents');
  const [auditLogs, setAuditLogs] = useState([]);
  const [riskFindings, setRiskFindings] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [vaultDocuments, setVaultDocuments] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [uploadedDocId, setUploadedDocId] = useState(null);
  const [uploadedText, setUploadedText] = useState(""); 

  // YENİ: Zustand üzerinden asistanın hedefini (focus) ayarlayan fonksiyonu çekiyoruz
  const setActiveDocument = useChatStore((state) => state.setActiveDocument);

  // TAKTİKSEL ENTEGRASYON: Sekme veya belge değiştiğinde asistanın beynini yönlendir
  useEffect(() => {
    // Eğer 'Documents' veya 'Analysis' sayfasındaysak ve bir belge yüklüyse/seçiliyse, asistanı oraya kilitle
    if ((activeTab === 'Documents' || activeTab === 'Analysis') && uploadedDocId) {
      setActiveDocument(uploadedDocId);
    } else {
      // Başka bir sayfaya geçildiyse (Team, Dashboard vs.) asistanı genel şirket moduna döndür
      setActiveDocument(null);
    }
  }, [activeTab, uploadedDocId, setActiveDocument]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [logsRes, risksRes, teamRes, docsRes] = await Promise.all([
          fetch('http://localhost:8000/api/v1/dashboard/logs').catch(() => null),
          fetch('http://localhost:8000/api/v1/analysis/risks').catch(() => null),
          fetch('http://localhost:8000/api/v1/team/members').catch(() => null),
          fetch('http://localhost:8000/api/v1/documents').catch(() => null)
        ]);

        if (logsRes && logsRes.ok) setAuditLogs(await logsRes.json());
        if (risksRes && risksRes.ok) setRiskFindings(await risksRes.json());
        if (teamRes && teamRes.ok) setTeamMembers(await teamRes.json());
        if (docsRes && docsRes.ok) setVaultDocuments(await docsRes.json());
      } catch (error) {
        console.error("Backend bağlantı hatası:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

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

      const response = await fetch('http://localhost:8000/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (response.ok && data.status === 'success') {
        setRiskFindings(data.findings);
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

  return (
    <div className="flex h-screen bg-[#0A0C10] text-slate-100 font-sans overflow-hidden selection:bg-purple-500 selection:text-white">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isAnalyzing={isAnalyzing} handleRunAudit={handleRunAudit} />
      
      <main className="flex-1 flex flex-col h-screen overflow-y-auto bg-gradient-to-br from-[#0A0C10] via-[#0E1117] to-[#141226] p-8 transition-all duration-300">
        {isLoading ? (
           <div className="flex-1 flex items-center justify-center">
             <div className="flex flex-col items-center gap-4">
               <div className="w-8 h-8 rounded-full border-t-2 border-r-2 border-purple-500 animate-spin" />
               <p className="text-xs text-purple-400 font-mono tracking-widest uppercase">Connecting to Mantis Core API...</p>
             </div>
           </div>
        ) : (
          <>
            {activeTab === 'Dashboard' && <DashboardHub auditLogs={auditLogs} riskFindings={riskFindings} />}
            {activeTab === 'Documents' && (
              <DocumentsHub 
                isAnalyzing={isAnalyzing} 
                handleRunAudit={handleRunAudit} 
                setUploadedDocId={setUploadedDocId} 
                setUploadedText={setUploadedText} 
                vaultDocuments={vaultDocuments} 
                setVaultDocuments={setVaultDocuments} 
              />
            )}
            {activeTab === 'Analysis' && <AnalysisHub riskFindings={riskFindings} />}
            {activeTab === 'Team' && <TeamHub teamMembers={teamMembers} />}
            {activeTab === 'logs' && <AuditLogs />}
            {activeTab === 'Settings' && <div className="space-y-6"><h2 className="text-2xl font-bold text-white">Settings</h2></div>}
          </>
        )}
      </main>

      <ChatPanel />
    </div>
  );
}