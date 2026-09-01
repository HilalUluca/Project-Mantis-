import React, { useState } from 'react';

export default function DashboardHub({ riskFindings, dashboardSummary, onStartChat }) {
  const [query, setQuery] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    if (onStartChat) {
      onStartChat(query);
    }
    setQuery('');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200 flex-1 flex flex-col justify-between max-w-5xl mx-auto w-full py-2">
      
      {/* 1. Üst Kısım: Mor Renkli Premium AI Orb ve Başlık */}
      <header className="flex justify-between items-center w-full">
        <div className="flex items-center gap-6">
          
          {/* Vault Summary tarzı Dönen/Nefes Alan Mor Çekirdek (Orb) */}
          <div className="relative shrink-0 w-16 h-16 rounded-2xl bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.05)] dark:shadow-[0_0_25px_rgba(0,0,0,0.8)] overflow-hidden">
            <div className="absolute inset-0 rounded-2xl border border-purple-500/30 animate-[spin_8s_linear_infinite]" />
            <div className="absolute inset-1.5 border border-indigo-400/20 rounded-xl animate-[spin_6s_linear_infinite_reverse]" />
            <div className="w-9 h-9 rounded-full bg-[radial-gradient(circle_at_35%_35%,_#a855f7_0%,_#4c1d95_50%,_#1e1b4b_100%)] shadow-[0_0_20px_#9333ea] flex items-center justify-center animate-pulse">
              <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_8px_#ffffff]" />
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">Good morning, Analyst.</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              System operational. <span className="text-purple-600 dark:text-cyan-400 font-semibold">{dashboardSummary?.open_risks ?? 0} open risks</span> pending review.
            </p>
          </div>
        </div>
      </header>

      {/* 2. Orta Kısım: Ortalanmış "How can I assist you today?" ve Sohbet Input Alanı */}
      <div className="flex flex-col items-center justify-center text-center my-auto space-y-4 py-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          How can I assist you today?
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
          Query contract clauses, identify hidden liabilities, or request autonomous document generation.
        </p>

        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-2xl mt-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Command Mantis AI or ask a question..."
            className="w-full bg-white dark:bg-[#121622]/90 text-slate-900 dark:text-white border border-slate-300 dark:border-white/10 rounded-2xl px-5 py-4 pl-5 pr-14 text-sm shadow-[0_5px_15px_rgba(0,0,0,0.05)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-xl focus:outline-none focus:border-purple-500 dark:focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
          <button
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-purple-100 hover:bg-purple-200 dark:bg-purple-600/30 dark:hover:bg-purple-600/50 border border-purple-200 dark:border-purple-500/40 text-purple-600 dark:text-purple-300 rounded-xl flex items-center justify-center transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </form>
      </div>

      {/* 3. Alt Kısım: Yan Yana Metrik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        
        {/* Kart 1: Documents Audited */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#121622]/80 border border-slate-200 dark:border-white/10 backdrop-blur-xl shadow-sm dark:shadow-2xl relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-2">
              <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-semibold">Documents Audited</p>
              <svg className="w-4 h-4 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            </div>
            <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white font-mono tracking-tight">{dashboardSummary?.documents_audited ?? 0}</h3>
          </div>
          <div className="w-full bg-slate-100 dark:bg-purple-950/60 h-1 rounded-full mt-4 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full shadow-[0_0_10px_#a855f7]" style={{ width: `${Math.min(100, (dashboardSummary?.documents_audited || 0) * 10)}%` }}></div>
          </div>
        </div>

        {/* Kart 2: Open Risks */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#121622]/80 border border-slate-200 dark:border-white/10 backdrop-blur-xl shadow-sm dark:shadow-2xl relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-2">
              <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-semibold">Open Risks</p>
              <span className="text-amber-500 dark:text-amber-400 text-sm">⚠️</span>
            </div>
            <div className="flex items-baseline gap-3">
              <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white font-mono tracking-tight">{dashboardSummary?.open_risks ?? 0}</h3>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <span className="px-2 py-0.5 rounded bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-300 text-[10px] font-mono font-bold">{dashboardSummary?.risk_breakdown?.high ?? 0} HIGH</span>
            <span className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-500/30 text-amber-600 dark:text-amber-300 text-[10px] font-mono font-bold">{dashboardSummary?.risk_breakdown?.medium ?? 0} MED</span>
          </div>
        </div>

        {/* Kart 3: Pending Approvals */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#121622]/80 border border-slate-200 dark:border-white/10 backdrop-blur-xl shadow-sm dark:shadow-2xl relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-2">
              <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-semibold">Pending Approvals</p>
              <span className="text-emerald-500 dark:text-emerald-400 text-sm">✅</span>
            </div>
            <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white font-mono tracking-tight">{dashboardSummary?.pending_approvals ?? 0}</h3>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-4 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 dark:bg-purple-400"></span> Requires Legal Sign-off
          </p>
        </div>

      </div>

    </div>
  );
}