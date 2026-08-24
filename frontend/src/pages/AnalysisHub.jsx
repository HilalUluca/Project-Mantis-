import React, { useState } from 'react';

export default function AnalysisHub({ riskFindings }) {
  const [editableClauses, setEditableClauses] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [approvalStatuses, setApprovalStatuses] = useState({});
  const [notification, setNotification] = useState(null);

  const handleTextChange = (riskId, newText) => {
    setEditableClauses(prev => ({ ...prev, [riskId]: newText }));
  };

  const handleExport = (format) => {
    window.open(`http://localhost:8000/api/export/${format}`, '_blank');
  };

  // Agent Harness Onay / Red İşlemi
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
        setNotification(`Risk ${riskId} için işlem başarılı: ${action.toUpperCase()}`);
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (error) {
      console.error("Onay hatası:", error);
    }
  };

  // Jira veya Mail Gönderme Aksiyonu (ActionAdapter Tetikleme)
  const handleDispatchAction = async (actionType, title, description) => {
    try {
      const response = await fetch('http://localhost:8000/api/action/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action_type: actionType, title, description, recipient: "Legal-Team" })
      });
      const data = await response.json();
      if (data.status === 'success') {
        setNotification(`✨ ${data.message}`);
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (error) {
      console.error("Aksiyon dispatch hatası:", error);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 flex-1 flex flex-col font-sans">
      {/* Üst Başlık ve Dışa Aktarım Butonları */}
      <div className="flex justify-between items-center bg-[#121622]/60 p-6 rounded-3xl border border-white/[0.08] backdrop-blur-2xl shadow-2xl">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-white bg-gradient-to-r from-white via-slate-200 to-purple-400 bg-clip-text text-transparent">
            Risk Analysis & Autonomous Redlines
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-medium">Qwen 2.5 Local LLM Motoru ve Agent Harness Denetim Merkezi</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => handleExport('csv')} 
            className="group relative px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-300 bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] hover:border-white/20 transition-all duration-300 shadow-lg active:scale-95"
          >
            <span className="flex items-center gap-2">📊 Export CSV</span>
          </button>
          <button 
            onClick={() => handleExport('excel')} 
            className="relative px-5 py-2.5 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition-all duration-300 shadow-lg shadow-purple-500/25 active:scale-95 border border-purple-400/30"
          >
            <span className="flex items-center gap-2">📥 Export Excel (XLSX)</span>
          </button>
        </div>
      </div>

      {/* Bildirim Alanı (Toast Alert) */}
      {notification && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-5 py-3.5 rounded-2xl text-xs font-mono font-semibold backdrop-blur-xl shadow-xl animate-in slide-in-from-top-2 duration-300 flex items-center gap-3">
          <span className="text-emerald-400 text-sm">⚡</span> {notification}
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
                className="bg-[#121622]/80 border border-white/[0.08] rounded-3xl p-7 backdrop-blur-2xl shadow-2xl space-y-5 transition-all duration-300 hover:border-purple-500/30 hover:shadow-purple-500/10"
              >
                {/* Kart Üst Bilgisi */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-xl text-[10px] font-mono font-extrabold bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-inner">
                      {finding.severity}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-400">{finding.risk_id}</span>
                    <span className={`text-[10px] font-mono font-bold px-3 py-1 rounded-xl tracking-wide ${
                      state === 'APPROVED_BY_HUMAN' 
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' 
                        : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    }`}>
                      {state}
                    </span>
                  </div>

                  {/* Renk Kodlu Güven Rozeti (Confidence Badge) */}
                  <span className={`text-xs font-mono font-bold px-3 py-1 rounded-xl border shadow-inner ${
                    finding.confidence_score >= 90 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                      : finding.confidence_score >= 75 
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' 
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  }`}>
                    Confidence: %{finding.confidence_score}
                  </span>
                </div>

                {/* Orijinal Madde ve AI Gerekçesi */}
                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Original Clause & AI Reasoning</h4>
                  <p className="text-sm text-slate-200 font-mono bg-[#090C14] p-4 rounded-2xl border border-white/[0.05] shadow-inner">{finding.clause_text}</p>
                  <p className="text-xs text-purple-300/90 font-medium italic pl-1">💡 <strong>AI Reasoning:</strong> {finding.ai_reasoning}</p>
                </div>

                {/* Builder Redline / Taslak Alanı */}
                <div className="pt-4 border-t border-white/[0.06] space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      ✨ Builder Redline / Editable Draft
                    </span>
                    <button
                      onClick={() => setEditingId(isEditing ? null : finding.risk_id)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-purple-300 bg-purple-600/15 border border-purple-500/30 hover:bg-purple-600/25 transition-all duration-200 shadow-sm active:scale-95"
                    >
                      {isEditing ? '🔒 Kaydet & Kilitle' : '✏️ Taslağı Düzenle'}
                    </button>
                  </div>

                  {isEditing ? (
                    <textarea
                      value={currentText}
                      onChange={(e) => handleTextChange(finding.risk_id, e.target.value)}
                      className="w-full h-32 bg-[#090C14] border border-purple-500/50 rounded-2xl p-4 text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/50 shadow-inner resize-none transition-all"
                    />
                  ) : (
                    <div className="bg-[#090C14] border border-white/[0.05] rounded-2xl p-4 text-xs text-emerald-300/90 font-mono shadow-inner">
                      {currentText}
                    </div>
                  )}
                </div>

                {/* Modern Premium Alt Butonlar (Onay, Red, Jira, Mail) */}
                <div className="flex flex-wrap justify-between items-center pt-5 border-t border-white/[0.06] gap-3">
                  {/* Sol Taraf: Onay ve Red Butonları */}
                  <div className="flex gap-2.5">
                    <button
                      onClick={() => handleApproval(finding.risk_id, 'approve')}
                      className="px-4 py-2 rounded-2xl text-xs font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all duration-200 shadow-lg shadow-emerald-900/20 active:scale-95 flex items-center gap-1.5"
                    >
                      <span>✓</span> Onayla
                    </button>
                    <button
                      onClick={() => handleApproval(finding.risk_id, 'reject')}
                      className="px-4 py-2 rounded-2xl text-xs font-bold text-rose-300 bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 hover:border-rose-500/50 transition-all duration-200 shadow-lg shadow-rose-900/20 active:scale-95 flex items-center gap-1.5"
                    >
                      <span>✕</span> Reddet
                    </button>
                  </div>

                  {/* Sağ Taraf: Jira ve E-Posta Gönderme Butonları */}
                  <div className="flex gap-2.5">
                    <button
                      onClick={() => handleDispatchAction('jira', `Risk Bileti: ${finding.risk_id}`, finding.ai_reasoning)}
                      className="px-4 py-2 rounded-2xl text-xs font-bold text-blue-300 bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 hover:border-blue-500/50 transition-all duration-200 shadow-lg shadow-blue-900/20 active:scale-95 flex items-center gap-1.5"
                    >
                      <span>🔷</span> Jira'ya Gönder
                    </button>
                    <button
                      onClick={() => handleDispatchAction('email', `Kritik Risk Bildirimi - ${finding.risk_id}`, finding.ai_reasoning)}
                      className="px-4 py-2 rounded-2xl text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 hover:border-amber-500/50 transition-all duration-200 shadow-lg shadow-amber-900/20 active:scale-95 flex items-center gap-1.5"
                    >
                      <span>✉️</span> E-Posta Gönder
                    </button>
                  </div>
                </div>

              </div>
            );
          })
        ) : (
          <div className="text-center py-24 bg-[#121622]/40 rounded-3xl border border-white/[0.08] backdrop-blur-xl">
            <span className="text-5xl">🛡️</span>
            <p className="text-sm font-semibold text-slate-300 mt-4">Aktif bir risk bulgusu bulunamadı.</p>
            <p className="text-xs text-slate-500 mt-1">"Documents" sekmesinden bir sözleşme yükleyerek otonom denetimi başlatabilirsiniz.</p>
          </div>
        )}
      </div>
    </div>
  );
}