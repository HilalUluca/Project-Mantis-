import React, { useState } from 'react';
import { useChatStore } from '../store/chatStore';

export default function DocumentsHub({ 
  isAnalyzing, 
  handleRunAudit, 
  setUploadedDocId, 
  setUploadedText, 
  vaultDocuments = [], 
  setVaultDocuments,
  onDocumentRisks
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [docQuestion, setDocQuestion] = useState('');
  const [docAnswer, setDocAnswer] = useState('');
  const [docCitations, setDocCitations] = useState([]);
  const [isSavingDoc, setIsSavingDoc] = useState(false);
  const [isDocChatLoading, setIsDocChatLoading] = useState(false);
  const [isDocProcessing, setIsDocProcessing] = useState(false);
  const [docError, setDocError] = useState('');
  const [docMetrics, setDocMetrics] = useState([]);
  const [docChart, setDocChart] = useState(null);
  const [revisionInstruction, setRevisionInstruction] = useState('');
  const addDocumentMessage = useChatStore((state) => state.addDocumentMessage);
  const setDocumentRisks = useChatStore((state) => state.setDocumentRisks);
  const setExtractedDocTasks = useChatStore((state) => state.setExtractedDocTasks);
  const upsertTask = useChatStore((state) => state.upsertTask);

  const displayedDocs = vaultDocuments || [];

  const saveDocument = async () => {
    if (!selectedDoc?.id) return;
    setIsSavingDoc(true);
    setDocError('');
    try {
      const token = localStorage.getItem('mantis_token');
      const response = await fetch(`http://localhost:8000/api/v1/documents/${selectedDoc.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: selectedDoc.content || '' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || data.message || 'Belge kaydedilemedi.');
      setSelectedDoc((current) => ({ ...current, content: selectedDoc.content }));
      setVaultDocuments?.((docs) => docs.map((doc) => doc.id === selectedDoc.id ? { ...doc, last_active: new Date().toISOString().slice(0, 16).replace('T', ' ') } : doc));
    } catch (error) {
      setDocError(error.message || 'Kaydetme işlemi başarısız oldu.');
    } finally {
      setIsSavingDoc(false);
    }
  };

  const askDocument = async () => {
    if (!selectedDoc?.id || !docQuestion.trim()) return;
    setIsDocChatLoading(true);
    setDocError('');
    try {
      const token = localStorage.getItem('mantis_token');
      const response = await fetch(`http://localhost:8000/api/v1/documents/${selectedDoc.id}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: docQuestion }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || data.message || 'Belge hakkında soru sorulamadı.');
      setDocAnswer(data.reply || data.message || '');
      setDocCitations(data.cited_clauses || []);
      setDocQuestion('');
    } catch (error) {
      setDocError(error.message || 'Doküman sorusu sırasında hata oluştu.');
    } finally {
      setIsDocChatLoading(false);
    }
  };

  const runDocumentAction = async (action) => {
    if (!selectedDoc?.id) return;
    setIsDocProcessing(true);
    setDocError('');
    try {
      const token = localStorage.getItem('mantis_token');
      const response = await fetch(`http://localhost:8000/api/v1/documents/actions/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ document_id: selectedDoc.id, message: docQuestion || 'Doküman analizi' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || data.message || 'İşlem tamamlanamadı.');

      if (action === 'extract-metrics') {
        setDocMetrics(data.metrics || []);
      }
      if (action === 'visualize') {
        setDocChart(data.chart || null);
      }
      if (action === 'extract-tasks') {
        const tasks = Array.isArray(data.tasks) ? data.tasks : [];
        setExtractedDocTasks(tasks);
        if (tasks.length && useChatStore.getState().setTasks) {
          tasks.forEach((task) => useChatStore.getState().upsertTask(task));
        }
      }
      if (action === 'audit-risks') {
        setDocumentRisks(Array.isArray(data.findings) ? data.findings : []);
      }
      if (action === 'executive-summary') {
        setDocAnswer(data.summary || '');
      }
    } catch (error) {
      setDocError(error.message || 'Belge işlemi başarısız oldu.');
    } finally {
      setIsDocProcessing(false);
    }
  };

  const reviseDocument = async () => {
    if (!selectedDoc?.id || !revisionInstruction.trim()) return;
    setIsDocProcessing(true);
    setDocError('');
    try {
      const token = localStorage.getItem('mantis_token');
      const response = await fetch('http://localhost:8000/api/v1/documents/actions/revise', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          document_id: selectedDoc.id,
          message: revisionInstruction,
          instruction: revisionInstruction,
          selected_text: selectedDoc.content?.slice(0, 1200) || '',
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || data.message || 'Revizyon oluşturulamadı.');
      setSelectedDoc((current) => ({ ...current, content: data.new_clause || current.content }));
      setRevisionInstruction('');
      setDocAnswer(data.message || 'Revizyon eklendi.');
    } catch (error) {
      setDocError(error.message || 'Revizyon sırasında hata oluştu.');
    } finally {
      setIsDocProcessing(false);
    }
  };

  React.useEffect(() => {
    const token = localStorage.getItem('mantis_token');
    fetch('http://localhost:8000/api/v1/documents/vault', {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    }).then((response) => response.ok ? response.json() : []).then((docs) => {
      if (setVaultDocuments && Array.isArray(docs)) setVaultDocuments(docs);
    }).catch(() => {});
  }, [setVaultDocuments]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    let textContent = '';
    try {
      textContent = await file.text();
    } catch {
      textContent = file.name;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('mantis_token');
      const response = await fetch('http://localhost:8000/api/v1/documents/upload', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const data = await response.json();

      if (!response.ok || data.status !== 'success') {
        throw new Error(data.detail || data.message || 'Belge yüklenemedi.');
      }

      const document = data.document;
      setUploadedDocId(document.id);
      setUploadedText(textContent || file.name);

      if (setVaultDocuments) {
        const newDoc = {
          id: document.id,
          name: document.name,
          access: 'Yüklendi',
          last_active: new Date().toISOString().slice(0, 16).replace('T', ' '),
          type: document.type || 'uploaded',
        };
        setVaultDocuments((current) => [newDoc, ...(Array.isArray(current) ? current : [])]);
      }
    } catch (error) {
      alert(error.message || 'Dosya yüklenirken hata oluştu.');
    } finally {
      e.target.value = '';
    }
  };

  const handleQuickView = (doc) => {
    if (!doc || !doc.id) return;
    window.open(`http://localhost:8000/api/v1/documents/download/${doc.id}`, '_blank');
  };

  const openDocument = async (doc) => {
    const token = localStorage.getItem('mantis_token');
    const response = await fetch(`http://localhost:8000/api/v1/documents/${doc.id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (!response.ok) return alert('Doküman içeriği açılamadı.');
    setSelectedDoc(await response.json());
    setDocAnswer('');
    setDocCitations([]);
    setDocError('');
  };

  const deleteDocument = async (doc) => {
    if (!window.confirm(`'${doc.name}' Vault'tan kaldırılsın mı?`)) return;
    const token = localStorage.getItem('mantis_token');
    const response = await fetch(`http://localhost:8000/api/v1/documents/${doc.id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) return alert('Doküman kaldırılamadı.');
    setVaultDocuments?.((docs) => docs.filter((item) => item.id !== doc.id));
    if (selectedDoc?.id === doc.id) setSelectedDoc(null);
  };
return (
    <div className="flex-1 flex flex-col space-y-6 max-w-7xl mx-auto w-full pb-10">
      
      {/* 1. VAULT SUMMARY KARTI */}
      <div className="relative overflow-hidden rounded-3xl bg-[#080B11]/80 backdrop-blur-2xl border border-white/[0.07] border-t-white/[0.14] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
        
        {/* Arka plan süzülen hafif ışık */}
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-emerald-500/10 rounded-full blur-[90px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-6">
            
            {/* Yavaşça Dönen Mantis AI Orb Logosu */}
            <div className="relative shrink-0 w-16 h-16 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center shadow-[0_0_25px_rgba(0,0,0,0.8)]">
              <div className="absolute inset-0 rounded-2xl border border-emerald-500/30 animate-[spin_8s_linear_infinite]" />
              <div className="w-9 h-9 rounded-full bg-[radial-gradient(circle_at_35%_35%,_#10b981_0%,_#064e3b_50%,_#021d15_100%)] shadow-[0_0_20px_#10b981] flex items-center justify-center animate-pulse">
                <div className="w-2.5 h-2.5 bg-white rounded-full shadow-[0_0_8px_#ffffff]" />
              </div>
            </div>

            {/* Başlık ve Metin */}
            <div className="space-y-1.5">
              <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-[#C0B4F9] bg-clip-text text-transparent">
                Vault Summary
              </h2>
              <p className="text-sm text-slate-400 font-sans max-w-2xl leading-relaxed">
                You have <span className="font-semibold text-white">14,295</span> documents secured. <span className="font-semibold text-[#f87171]">24 require immediate attention.</span> AI Engine is actively monitoring incoming MSA batches.
              </p>
            </div>
          </div>

          {/* Aksiyon Butonları */}
          <div className="flex items-center gap-3 shrink-0">
            <label className="cursor-pointer bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.15] text-slate-300 hover:text-white px-4 py-2.5 rounded-xl text-xs font-medium tracking-wide transition-all shadow-sm">
              <span>+ Upload Contract</span>
              <input type="file" onChange={handleFileUpload} className="hidden" accept=".txt,.doc,.docx,.pdf" />
            </label>
            <button 
              onClick={handleRunAudit}
              disabled={isAnalyzing}
              className="bg-[#121622] hover:bg-[#1a2030] border border-white/[0.1] hover:border-white/[0.2] text-slate-200 px-5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              {isAnalyzing ? 'Auditing Vault...' : 'Run Global Audit'}
            </button>
          </div>
        </div>
      </div>

      {/* 2. ARAMA VE FİLTRELEME ÇUBUĞU */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Arama Inputu */}
        <div className="relative w-full md:w-80">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ID, counterparty, or keyword..."
            className="w-full bg-[#080B11]/60 text-slate-200 placeholder:text-slate-500 text-xs border border-white/[0.08] rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-white/20 transition-all shadow-inner"
          />
        </div> {/* Filtre Butonları */}
        <div className="flex items-center gap-2.5 overflow-x-auto w-full md:w-auto">
          <button className="flex items-center gap-2 bg-[#080B11]/60 hover:bg-white/[0.04] border border-white/[0.08] text-slate-300 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all">
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <span>Any Date</span>
          </button>
          <button className="flex items-center gap-2 bg-[#080B11]/60 hover:bg-white/[0.04] border border-white/[0.08] text-slate-300 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all">
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
            <span>Risk Level</span>
          </button>
          <button className="flex items-center gap-2 bg-[#080B11]/60 hover:bg-white/[0.04] border border-white/[0.08] text-slate-300 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all">
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            <span>Counterparty</span>
          </button>
        </div>
      </div>

      {/* 3. DOKÜMAN KARTLARI IZGARASI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {displayedDocs.length === 0 ? (
          <div className="md:col-span-2 lg:col-span-3 rounded-2xl border border-dashed border-slate-300 dark:border-white/10 bg-white/40 dark:bg-[#06080D]/30 p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            Henüz vault içinde belge yok. İlk sözleşmeyi yükleyerek analizi başlatabilirsiniz.
          </div>
        ) : displayedDocs.map((doc) => (
          <div 
            key={doc.id}
            className="group relative rounded-2xl bg-[#06080D]/70 backdrop-blur-xl border border-white/[0.06] hover:border-white/[0.14] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-all duration-300 flex flex-col justify-between space-y-6"
          >
            {(() => {
              const status = (doc.status || doc.state || 'pending').toString().toLowerCase();
              const normalized = status.includes('approved') || status.includes('verified') || status.includes('success') ? { statusType: 'success', statusText: 'Verified' } : status.includes('rejected') || status.includes('error') ? { statusType: 'danger', statusText: 'Needs review' } : { statusType: 'neutral', statusText: 'Processing' };
              return (
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase font-semibold">
                    {doc.type || 'uploaded'}
                  </span>
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    normalized.statusType === 'success'
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                      : normalized.statusType === 'danger'
                        ? 'border-red-500/30 bg-red-500/10 text-red-400'
                        : 'border-white/10 bg-white/5 text-slate-400'
                  }`}>
                    {normalized.statusText}
                  </span>
                </div>
              );
            })()}
            {/* Üst Kısım: Tür ve Doğrulama Rozeti */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase font-semibold">
                {doc.type}
              </span>
              {doc.status === 'Verified' && (
                <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Verified
                </span>
              )}
            </div>
{/* Orta Kısım: Belge Başlığı */}
            <div>
              <h3 className="text-base font-bold text-slate-100 group-hover:text-white transition-colors tracking-tight">
                {doc.name || doc.title || 'İsimsiz doküman'}
              </h3>
            </div>

            {/* Alt Kısım: ID ve İşlenme Süresi */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/[0.04]">
              <div>
                <p className="text-[10px] text-slate-500 font-mono">Document ID</p>
                <p className="text-xs font-mono font-medium text-slate-300">{doc.id}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-mono">Processed</p>
                <p className="text-xs font-mono font-medium text-slate-300">{doc.last_active || doc.processed || '-'}</p>
              </div>
            </div>

            {/* Durum Göstergesi ve Aksiyon Butonu */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                {doc.statusType === 'danger' && (
                  <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                )}
                {doc.statusType === 'success' && (
                  <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                )}
                {doc.statusType === 'neutral' && (
                  <div className="w-3.5 h-3.5 border-2 border-t-purple-400 border-white/20 rounded-full animate-spin" />
                )}
                <span className={`text-xs font-medium ${
                  doc.statusType === 'danger' ? 'text-red-400' :
                  doc.statusType === 'success' ? 'text-emerald-400' : 'text-slate-400'
                }`}>
                  {doc.statusText}
                </span>
              </div>

              {/* Koşulsuz Quick View Butonu */}
              <div className="flex gap-2">
                <button onClick={() => openDocument(doc)} className="bg-[#121622] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-[11px] font-medium">Open</button>
                <button onClick={() => handleQuickView(doc)} className="bg-[#121622] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-[11px] font-medium">Download</button>
                <button onClick={() => deleteDocument(doc)} className="text-rose-400 hover:text-rose-300 px-2 py-1.5 text-[11px]">Delete</button>
              </div>
            </div>

          </div>
        ))}
      </div>

      {selectedDoc && (
        <div className="fixed inset-0 z-50 bg-black/70 p-4 flex items-center justify-center">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[#0b0f17] border border-white/10 rounded-2xl p-6 space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">{selectedDoc.name}</h3>
              <button onClick={() => setSelectedDoc(null)} className="text-slate-400 hover:text-white">Close</button>
            </div>
            <textarea value={selectedDoc.content || ''} onChange={(e) => setSelectedDoc({ ...selectedDoc, content: e.target.value })} className="w-full min-h-64 bg-black/30 border border-white/10 rounded-xl p-4 text-sm text-slate-200 leading-relaxed" />
            <div className="flex gap-2">
              <button onClick={saveDocument} disabled={isSavingDoc} className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs">{isSavingDoc ? 'Saving...' : 'Save changes'}</button>
            </div>
            <div className="border-t border-white/10 pt-4 space-y-3">
              <h4 className="text-xs font-semibold text-emerald-300">Ask this document</h4>
              <form onSubmit={(event) => { event.preventDefault(); askDocument(); }} className="flex gap-2"><input value={docQuestion} onChange={(e) => setDocQuestion(e.target.value)} placeholder="Bu doküman ne anlatıyor?" className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" disabled={isDocChatLoading} /><button type="submit" disabled={isDocChatLoading || !docQuestion.trim()} className="px-4 py-2 rounded-lg bg-slate-700 text-white text-xs disabled:opacity-50">{isDocChatLoading ? 'Thinking...' : 'Ask'}</button></form>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2"><button onClick={() => runDocumentAction('extract-metrics')} disabled={isDocProcessing} className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-3 py-3 text-left text-xs font-semibold text-cyan-200 hover:bg-cyan-400/20 disabled:opacity-50">📊<br />Metrics</button><button onClick={() => runDocumentAction('visualize')} disabled={isDocProcessing} className="rounded-xl border border-blue-400/30 bg-blue-400/10 px-3 py-3 text-left text-xs font-semibold text-blue-200 hover:bg-blue-400/20 disabled:opacity-50">▥<br />Chart</button><button onClick={() => runDocumentAction('extract-tasks')} disabled={isDocProcessing} className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-3 text-left text-xs font-semibold text-emerald-200 hover:bg-emerald-400/20 disabled:opacity-50">📋<br />Extract tasks</button><button onClick={() => runDocumentAction('audit-risks')} disabled={isDocProcessing} className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-3 text-left text-xs font-semibold text-amber-200 hover:bg-amber-400/20 disabled:opacity-50">⚠<br />Audit risks</button><button onClick={() => runDocumentAction('executive-summary')} disabled={isDocProcessing} className="rounded-xl border border-slate-400/30 bg-white/5 px-3 py-3 text-left text-xs font-semibold text-slate-200 hover:bg-white/10 disabled:opacity-50">▤<br />Summary</button></div>
              <div className="flex gap-2"><input value={revisionInstruction} onChange={(event) => setRevisionInstruction(event.target.value)} placeholder="Revizyon talimatı: fesih süresini 30 gün yap" className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" /><button onClick={reviseDocument} disabled={isDocProcessing || !revisionInstruction.trim()} className="px-4 py-2 rounded-lg bg-purple-700 text-white text-xs disabled:opacity-50">✍ Revise v2</button></div>
              {docError && <p className="text-xs text-rose-300 border-l-2 border-rose-400 pl-3">{docError}</p>}
              {docAnswer && <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3"><p className="whitespace-pre-wrap text-sm text-slate-300">{docAnswer}</p>{docCitations.length > 0 && <div className="border-t border-white/10 pt-3"><p className="text-[10px] uppercase tracking-widest text-cyan-300 mb-2">Sources</p>{docCitations.map((citation, index) => <p key={`${citation.source}-${index}`} className="text-xs text-slate-500">{citation.source}: {citation.text}</p>)}</div>}</div>}
              {docMetrics.length > 0 && <div className="overflow-x-auto rounded-xl border border-white/10"><table className="w-full text-left text-xs"><thead className="bg-white/5 text-slate-400"><tr><th className="p-3">Category</th><th className="p-3">Item</th><th className="p-3">Value</th><th className="p-3">Risk</th></tr></thead><tbody>{docMetrics.map((metric, index) => <tr key={`${metric.value}-${index}`} className="border-t border-white/10 text-slate-300"><td className="p-3">{metric.category}</td><td className="p-3">{metric.item}</td><td className="p-3">{metric.value}</td><td className="p-3">{metric.risk_level}</td></tr>)}</tbody></table></div>}
              {docChart && <div className="rounded-xl border border-blue-400/20 bg-blue-400/5 p-4 space-y-3"><h4 className="text-xs font-semibold text-blue-200">{docChart.title}</h4>{docChart.data.length === 0 ? <p className="text-xs text-slate-500">Görselleştirilecek sayısal veri bulunamadı.</p> : docChart.data.map((item) => <div key={item.name} className="space-y-1"><div className="flex justify-between text-xs text-slate-300"><span>{item.name}</span><span>{item.value}</span></div><div className="h-2 rounded-full bg-white/10 overflow-hidden"><div className="h-full rounded-full bg-blue-400" style={{ width: `${Math.min(100, item.value * 20)}%` }} /></div></div>)}</div>}
            </div>
          </div>
        </div>
      )}

    </div>
  );
} 