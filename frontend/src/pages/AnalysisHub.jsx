import React, { useEffect, useState } from 'react';

export default function AnalysisHub({ riskFindings }) {
  const [editableClauses, setEditableClauses] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [approvalStatuses, setApprovalStatuses] = useState({});
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (!riskFindings?.length) return;
    setNotification(`${riskFindings.length} risk bulgusu Analysis kuyruğuna eklendi ve insan onayı bekliyor.`);
    const timeoutId = setTimeout(() => setNotification(null), 6000);
    return () => clearTimeout(timeoutId);
  }, [riskFindings]);

  const handleTextChange = (riskId, newText) => {
    setEditableClauses(prev => ({ ...prev, [riskId]: newText }));
  };

  const handleExport = (format) => {
    window.open(`http://localhost:8000/api/export/${format}`, '_blank');
  };

  const handleApproval = async (riskId, action) => {
    try {
      const response = await fetch('http://localhost:8000/api/harness/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ risk_id: riskId, action: action })
      });
      const data = await response.json();
      if (data.status === 'success') {
        setApprovalStatuses(prev => ({ ...prev, [riskId]: data.approval_state }));
        setNotification(`Action successful for Risk ${riskId}: ${action.toUpperCase()}`);
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (error) {
      console.error("Onay hatası:", error);
    }
  };

  const handleDispatchAction = async (actionType, title, description) => {
    try {
      const response = await fetch('http://localhost:8000/api/action/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action_type: actionType, title, description, recipient: "Legal-Team" })
      });
      const data = await response.json();
      if (data.status === 'success') {
        setNotification(`${data.message}`);
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (error) {
      console.error("Aksiyon dispatch hatası:", error);
    }
  };

  return (
    <div className="flex-1 flex flex-col max-w-6xl mx-auto w-full pb-10 mt-2 space-y-8 animate-in fade-in duration-300 font-sans">
      
      {/* Üst Başlık ve Mor AI Orb Alanı */}
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-[#080B12]/80 backdrop-blur-2xl border border-slate-200 dark:border-white/[0.07] dark:border-t-white/[0.12] p-8 shadow-sm dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        
        {/* Karanlık Mod Zemin Parıltısı */}
        <div className="hidden dark:block absolute top-[-50%] right-[-10%] w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-6">
            
            {/* Dashboard Mor AI Orb Logosu */}
            <div className="relative shrink-0 w-16 h-16 rounded-2xl bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.05)] dark:shadow-[0_0_25px_rgba(0,0,0,0.8)] overflow-hidden">
              <div className="absolute inset-0 rounded-2xl border border-purple-500/30 animate-[spin_8s_linear_infinite]" />
              <div className="absolute inset-1.5 border border-indigo-400/20 rounded-xl animate-[spin_6s_linear_infinite_reverse]" />
              <div className="w-9 h-9 rounded-full bg-[radial-gradient(circle_at_35%_35%,_#a855f7_0%,_#4c1d95_50%,_#1e1b4b_100%)] shadow-[0_0_20px_#9333ea] flex items-center justify-center animate-pulse">
                <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_8px_#ffffff]" />
              </div>
            </div>

            <div className="space-y-1.5">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Risk Analysis & Redlines
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">
                Powered by Qwen 2.5 Local LLM. Review autonomous redlines and manage Agent Harness operations.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={() => handleExport('csv')} 
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border border-slate-300 dark:border-white/10 transition-all shadow-sm active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              Export CSV
            </button>
            <button 
              onClick={() => handleExport('excel')} 
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-[#121622] dark:hover:bg-[#1a2030] border border-slate-900 dark:border-white/[0.08] transition-all shadow-md active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Export XLSX
            </button>
          </div>
        </div>
      </div>

      {/* Bildirim Alanı (Toast Alert) */}
      {notification && (
        <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 px-5 py-4 rounded-2xl text-xs font-semibold backdrop-blur-xl shadow-sm dark:shadow-xl animate-in fade-in slide-in-from-top-2 flex items-center gap-3">
          <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          {notification}
        </div>
      )}

      {/* Risk Listesi */}
      <div className="grid grid-cols-1 gap-6">
        {riskFindings && riskFindings.length > 0 ? (
          riskFindings.map((finding, idx) => {
            const currentText = editableClauses[finding.risk_id] ?? finding.clause_text;
            const isEditing = editingId === finding.risk_id;
            const state = approvalStatuses[finding.risk_id] || "PENDING_APPROVAL";

            return (
              <div 
                key={finding.risk_id || idx} 
                className="group bg-white dark:bg-[#0A0D14]/80 border border-slate-200 dark:border-white/[0.08] rounded-3xl p-7 backdrop-blur-2xl shadow-sm dark:shadow-2xl space-y-6 transition-all duration-300 hover:border-slate-300 dark:hover:border-purple-500/30 overflow-hidden relative"
              >
                {/* Kart Üst Bilgisi */}
                <div className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-100 dark:border-white/[0.06] pb-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-widest uppercase bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">
                      {finding.severity}
                    </span>
                    <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400">
                      {finding.risk_id}
                    </span>
                    <span className={`text-[10px] font-bold px-3 py-1.5 rounded-lg tracking-widest uppercase border ${
                      state === 'APPROVED_BY_HUMAN' 
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' 
                        : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'
                    }`}>
                      {state.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <span className={`text-[10px] font-mono font-bold px-3 py-1.5 rounded-lg tracking-wider border flex items-center gap-1.5 ${
                    finding.confidence_score >= 90 
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' 
                      : finding.confidence_score >= 75 
                      ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20' 
                      : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20'
                  }`}>
                    CONF: {finding.confidence_score}%
                  </span>
                </div>

                {/* Orijinal Madde ve AI Gerekçesi */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-500 flex items-center gap-2">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      Original Clause
                    </h4>
                    <p className="text-sm text-slate-700 dark:text-slate-300 font-mono bg-slate-50 dark:bg-[#05070A] p-5 rounded-2xl border border-slate-200 dark:border-white/[0.04] shadow-inner leading-relaxed">
                      {finding.clause_text}
                    </p>
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400 flex items-center gap-2">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      AI Reasoning
                    </h4>
                    <div className="bg-purple-50 dark:bg-purple-900/10 p-5 rounded-2xl border border-purple-100 dark:border-purple-500/20 shadow-inner h-[calc(100%-28px)]">
                      <p className="text-sm text-slate-700 dark:text-purple-100/80 font-medium leading-relaxed">
                        {finding.ai_reasoning}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Builder Redline / Taslak Alanı */}
                <div className="pt-4 border-t border-slate-100 dark:border-white/[0.06] space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      Editable Draft
                    </span>
                    <button
                      onClick={() => setEditingId(isEditing ? null : finding.risk_id)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-purple-300 bg-slate-100 hover:bg-slate-200 dark:bg-purple-600/10 border border-slate-200 dark:border-purple-500/20 dark:hover:bg-purple-600/20 transition-all duration-200 shadow-sm active:scale-95 flex items-center gap-1.5"
                    >
                      {isEditing ? (
                        <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg> Save & Lock</>
                      ) : (
                        <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg> Edit Redline</>
                      )}
                    </button>
                  </div>

                  {isEditing ? (
                    <textarea
                      value={currentText}
                      onChange={(e) => handleTextChange(finding.risk_id, e.target.value)}
                      className="w-full h-32 bg-white dark:bg-[#05070A] border border-emerald-300 dark:border-emerald-500/50 rounded-2xl p-5 text-sm text-slate-800 dark:text-emerald-100 font-mono focus:outline-none focus:ring-4 focus:ring-emerald-500/10 dark:focus:ring-emerald-500/20 shadow-inner resize-none transition-all"
                    />
                  ) : (
                    <div className="bg-emerald-50 dark:bg-[#05070A] border border-emerald-100 dark:border-emerald-500/10 rounded-2xl p-5 text-sm text-emerald-800 dark:text-emerald-300/90 font-mono shadow-inner leading-relaxed">
                      {currentText}
                    </div>
                  )}
                </div>

                {/* Alt Aksiyon Butonları */}
                <div className="flex flex-col md:flex-row justify-between items-center pt-6 mt-2 border-t border-slate-100 dark:border-white/[0.06] gap-4">
                  <div className="flex w-full md:w-auto gap-3">
                    <button
                      onClick={() => handleApproval(finding.risk_id, 'approve')}
                      className="flex-1 md:flex-none flex justify-center items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-emerald-500/10 dark:border border-emerald-500/30 dark:hover:bg-emerald-500/20 dark:text-emerald-300 transition-all duration-200 shadow-md active:scale-95"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                      Approve
                    </button>
                    <button
                      onClick={() => handleApproval(finding.risk_id, 'reject')}
                      className="flex-1 md:flex-none flex justify-center items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-rose-50 border border-slate-300 dark:bg-transparent dark:border-rose-500/30 dark:hover:bg-rose-500/10 dark:text-rose-400 transition-all duration-200 shadow-sm active:scale-95"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                      Reject
                    </button>
                  </div>

                  <div className="flex w-full md:w-auto gap-3">
                    <button
                      onClick={() => handleDispatchAction('jira', `Risk Ticket: ${finding.risk_id}`, finding.ai_reasoning)}
                      className="flex-1 md:flex-none flex justify-center items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-blue-300 bg-slate-100 hover:bg-slate-200 dark:bg-blue-500/10 border border-slate-200 dark:border-blue-500/20 dark:hover:bg-blue-500/20 transition-all duration-200 shadow-sm active:scale-95"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      Send to Jira
                    </button>
                    <button
                      onClick={() => handleDispatchAction('email', `Critical Risk Notice - ${finding.risk_id}`, finding.ai_reasoning)}
                      className="flex-1 md:flex-none flex justify-center items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 border border-slate-200 dark:border-white/10 dark:hover:bg-white/10 transition-all duration-200 shadow-sm active:scale-95"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      Email Legal
                    </button>
                  </div>
                </div>

              </div>
            );
          })
        ) : (
          /* Ortalanmış "Upload Contract" Boş Durum Alanı */
          <div className="text-center py-20 bg-white dark:bg-[#0A0D14]/40 rounded-3xl border border-slate-200 dark:border-white/[0.08] backdrop-blur-xl shadow-sm flex flex-col items-center justify-center space-y-4 px-4">
            
            {/* Merkez Dönen Mor AI Orb */}
            <div className="relative w-16 h-16 rounded-2xl bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 flex items-center justify-center shadow-md overflow-hidden">
              <div className="absolute inset-0 rounded-2xl border border-purple-500/30 animate-[spin_8s_linear_infinite]" />
              <div className="w-8 h-8 rounded-full bg-[radial-gradient(circle_at_35%_35%,_#a855f7_0%,_#4c1d95_50%,_#1e1b4b_100%)] shadow-[0_0_15px_#9333ea] flex items-center justify-center animate-pulse">
                <div className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_6px_#ffffff]" />
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-base font-bold text-slate-800 dark:text-slate-200">No active risk findings.</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">Upload a contract to initiate autonomous AI analysis.</p>
            </div>

            <button
              onClick={() => window.location.hash = '#documents'} 
              className="mt-2 flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-white/10 dark:hover:bg-white/20 border border-slate-900 dark:border-white/20 transition-all shadow-md active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
              Upload Contract
            </button>
          </div>
        )}
      </div>
    </div>
  );
}