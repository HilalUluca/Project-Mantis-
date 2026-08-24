import React, { useState, useRef } from 'react';

// Props'a setUploadedText eklendi
export default function DocumentsHub({ isAnalyzing, handleRunAudit, setUploadedDocId, setUploadedText, vaultDocuments, setVaultDocuments }) {
  const [documentSubTab, setDocumentSubTab] = useState('Upload Doc');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatus(null);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/api/upload', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      
      if (response.ok) {
        setUploadStatus({ type: 'success', message: result.message, docId: result.document_id });
        
        // YENİ: ID'yi ve Gerçek Metni Sisteme Kaydediyoruz
        setUploadedDocId(result.document_id); 
        setUploadedText(result.extracted_text); 
        
        setVaultDocuments(prev => [
          { id: result.document_id, name: `📄 ${result.filename}`, access: "Tam Erişim (Analiz Bekliyor)", last_active: "Şimdi", type: "file" },
          ...prev
        ]);
        
        setTimeout(() => setDocumentSubTab('Doc Vault'), 1500);
      } else {
        setUploadStatus({ type: 'error', message: result.detail || 'Yükleme başarısız.' });
      }
    } catch (error) {
      setUploadStatus({ type: 'error', message: 'Sunucuya bağlanılamadı. Backend açık mı?' });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 flex-1 flex flex-col">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Document Vault</h2>
          <p className="text-xs text-slate-400 mt-1">Manage your secure contracts, sources, and uploads.</p>
        </div>
        <button onClick={() => setDocumentSubTab('Upload Doc')} className="bg-purple-600/20 border border-purple-500/30 hover:bg-purple-500/30 text-purple-300 px-4 py-2 rounded-xl text-xs font-bold transition-all">
          + Kaynak Ekle
        </button>
      </div>

      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        {['Doc Vault', 'Upload Doc', 'Connected Sources'].map((subTab) => (
          <button
            key={subTab}
            onClick={() => setDocumentSubTab(subTab)}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 ${
              documentSubTab === subTab ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>{subTab}</span>
          </button>
        ))}
      </div>

      {documentSubTab === 'Doc Vault' && (
        <div className="flex-1 flex flex-col space-y-6 mt-2">
          <div className="p-6 rounded-2xl bg-[#121622]/90 border border-white/10 backdrop-blur-xl flex justify-between items-center shadow-xl">
            <div>
              <h2 className="text-xl font-bold text-white">Vault Summary</h2>
              <p className="text-xs text-slate-400 mt-1">You have <span className="text-white font-semibold">{vaultDocuments?.length || 0} documents</span> secured.</p>
            </div>
            <button 
              onClick={handleRunAudit}
              disabled={isAnalyzing || vaultDocuments?.length === 0}
              className={`bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 ${
                (isAnalyzing || vaultDocuments?.length === 0) ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isAnalyzing && <div className="w-3 h-3 border-2 border-t-white border-white/30 rounded-full animate-spin" />}
              {isAnalyzing ? 'Running Audit...' : 'Run Global Audit'}
            </button>
          </div>
          <div className="bg-[#121622]/80 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-2xl">
            <h3 className="text-sm font-bold text-white mb-4">Aktif Dizinler ve Dosyalar</h3>
            
            {vaultDocuments && vaultDocuments.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead><tr className="border-b border-white/10 text-[10px] uppercase text-slate-400 font-semibold"><th className="pb-3 px-3">Kaynak Yolu</th><th className="pb-3 px-3">Erişim Seviyesi</th><th className="pb-3 px-3">Son Etkinlik</th></tr></thead>
                <tbody className="divide-y divide-white/5 text-xs text-slate-300 font-mono">
                  {vaultDocuments.map((doc) => (
                    <tr key={doc.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-3">{doc.name}</td>
                      <td className="py-3.5 px-3">
                        <span className={`px-2 py-0.5 rounded ${doc.type === 'folder' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-cyan-500/10 text-cyan-400'}`}>
                          {doc.access}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-slate-500">{doc.last_active}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-10">
                <span className="text-4xl">📭</span>
                <p className="text-sm text-slate-400 mt-4">Kasa şu an boş. Analiz etmek için bir doküman yükleyin.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {documentSubTab === 'Upload Doc' && (
        <div className="flex-1 flex flex-col mt-4">
          <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} accept=".pdf,.doc,.docx,.txt" />
          <div 
            onClick={() => !isUploading && fileInputRef.current.click()}
            className={`relative p-[1px] rounded-2xl bg-gradient-to-r from-purple-500/40 via-cyan-400/40 to-transparent group cursor-pointer mb-6 transition-all ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <div className="bg-[#0E1117] rounded-2xl p-20 flex flex-col items-center justify-center transition-all group-hover:bg-[#121622]/90">
              <div className="w-16 h-16 rounded-full bg-[#1A1D24] border border-white/5 flex items-center justify-center mb-6 shadow-xl">
                {isUploading ? <div className="w-6 h-6 border-2 border-t-cyan-400 border-purple-500 rounded-full animate-spin" /> : <span className="text-cyan-400 text-3xl">☁️</span>}
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{isUploading ? 'Yükleniyor...' : 'Drag & Drop Contracts'}</h3>
              {!isUploading && <p className="text-sm text-slate-400">Or <span className="text-purple-400 underline hover:text-purple-300 transition-colors">browse files</span></p>}
            </div>
          </div>
          {uploadStatus && (
            <div className={`p-4 rounded-xl text-xs font-medium border flex items-center gap-3 ${uploadStatus.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
              <span>{uploadStatus.type === 'success' ? '✅' : '❌'}</span>
              <div><p>{uploadStatus.message}</p>{uploadStatus.docId && <p className="font-mono text-[10px] mt-1 opacity-80">Doc ID: {uploadStatus.docId}</p>}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}