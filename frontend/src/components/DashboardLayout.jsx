import React, { useState } from 'react';

export default function DashboardLayout() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Overview');

  return (
    <div className="flex h-screen bg-[#0F1117] text-[#F8FAFC] font-sans overflow-hidden">
      
      {/* 1. SOL MENÜ (SIDEBAR) */}
      <aside className="w-64 bg-[#141721]/80 backdrop-blur-md border-r border-white/10 flex flex-col justify-between p-4 select-none">
        <div>
          {/* Logo Alanı */}
          <div className="flex items-center gap-3 px-2 mb-8">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-wide">Project Mantis</h1>
              <p className="text-[10px] text-purple-400 font-medium">Enterprise AI Workplace</p>
            </div>
          </div>

          {/* New File Analysis Butonu */}
          <button className="w-full mb-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium text-sm py-2.5 px-4 rounded-xl shadow-lg shadow-purple-600/25 transition-all flex items-center justify-center gap-2">
            <span>+</span> New File Analysis
          </button>

          {/* Navigasyon Linkleri */}
          <nav className="space-y-1.5">
            {['Overview', 'Documents', 'Analysis', 'Team'].map((item) => (
              <button
                key={item}
                onClick={() => setActiveTab(item)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === item
                    ? 'bg-purple-600/15 text-purple-300 border border-purple-500/30 shadow-inner'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{item === 'Overview' && '📊'}</span>
                <span>{item === 'Documents' && '📁'}</span>
                <span>{item === 'Analysis' && '⚡'}</span>
                <span>{item === 'Team' && '👥'}</span>
                {item}
              </button>
            ))}
          </nav>
        </div>

        {/* Footer / Settings Alanı */}
        <div className="pt-4 border-t border-white/10">
          <button
            onClick={() => setActiveTab('Settings')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'Settings'
                ? 'bg-purple-600/15 text-purple-300 border border-purple-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>⚙️</span> Settings
          </button>
        </div>
      </aside>

      {/* 2. ANA İÇERİK ALANI (DASHBOARD WORKSPACE) */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto bg-gradient-to-br from-[#0F1117] via-[#12151F] to-[#1A1625] p-8">
        
        {/* Üst Header / Karşılama */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Good morning, Analyst.</h2>
            <p className="text-sm text-slate-400 mt-1">
              I've completed the overnight scan. <span className="text-emerald-400 font-semibold">24 open risks</span> require your attention today.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300 font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> AI Engine Active
            </div>
          </div>
        </header>

        {/* İstatistik Kartları */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="p-5 rounded-2xl bg-[#171B26]/80 border border-white/10 backdrop-blur-md shadow-xl">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Documents Audited</p>
            <h3 className="text-3xl font-extrabold text-white">14,295</h3>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-cyan-400 h-full w-[70%]" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#171B26]/80 border border-white/10 backdrop-blur-md shadow-xl">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Open Risks</p>
            <div className="flex items-baseline gap-3">
              <h3 className="text-3xl font-extrabold text-white">24</h3>
              <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-medium">12 High / 12 Med</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#171B26]/80 border border-white/10 backdrop-blur-md shadow-xl flex flex-col justify-between">
            <p className="text-xs text-slate-400 uppercase tracking-wider">System Status</p>
            <div className="flex items-center gap-2 text-emerald-400 font-medium text-sm">
              <span>🟢</span> All Modules Operational
            </div>
            <p className="text-[11px] text-slate-500">Last sync: 2 mins ago</p>
          </div>
        </div>

        {/* Alt Kısım / Aktivite Logu veya Bilgi Alanı */}
        <div className="flex-1 p-6 rounded-2xl bg-[#141721]/50 border border-white/10 backdrop-blur-md">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <span>⚡</span> Mantis AI Activity Log
          </h3>
          <div className="space-y-3 font-mono text-xs text-slate-400">
            <div className="p-3 rounded-xl bg-black/20 border border-white/5 flex items-center justify-between">
              <span>[SYS] Batch analysis of 450 documents concluded. No critical breaches found.</span>
              <span className="text-purple-400">08:14:22 UTC</span>
            </div>
            <div className="p-3 rounded-xl bg-black/20 border border-white/5 flex items-center justify-between">
              <span>[AI] Timesheet structured parsing template applied successfully.</span>
              <span className="text-cyan-400">08:10:05 UTC</span>
            </div>
          </div>
        </div>

      </main>

      {/* 3. SAĞ ALT: KALICI MANTIS AI CHAT PANELİ (EPIC-10) */}
      <div className="fixed bottom-6 right-6 z-50">
        {isChatOpen && (
          <div className="mb-4 w-80 h-96 bg-[#171B26]/95 border border-purple-500/30 backdrop-blur-xl rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
            {/* Chat Header */}
            <div className="p-3.5 bg-purple-900/20 border-b border-white/10 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-tr from-purple-500 to-cyan-400 animate-pulse" />
                <span className="text-xs font-bold text-white tracking-wide">Mantis AI</span>
              </div>
              <button 
                onClick={() => setIsChatOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold px-1.5 py-0.5 rounded bg-white/5"
              >
                ✕
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-3 overflow-y-auto space-y-3 text-xs">
              <div className="p-2.5 rounded-xl bg-white/5 text-slate-300 border border-white/5">
                Merhaba! Bugün analiz ettiğim dosyalarda operasyonel yük ve devamsızlık durumlarıyla ilgili notlar buldum. Detayları görmek ister misiniz?
                <div className="mt-1.5 text-[10px] text-purple-400 font-mono">Kaynak: Modül 2 / Puantaj</div>
              </div>
            </div>

            {/* Chat Input */}
            <div className="p-2.5 border-t border-white/10 bg-black/20 flex gap-2">
              <input 
                type="text" 
                placeholder="Mantis AI'ya bir şey sorun..." 
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
              <button className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all">
                ➔
              </button>
            </div>
          </div>
        )}

        {/* Sağ Alt Orb İkonu (Tıklayınca Paneli Açar) */}
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="w-14 h-14 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 p-0.5 shadow-xl shadow-purple-600/30 hover:scale-105 transition-all flex items-center justify-center group relative"
        >
          <div className="w-full h-full rounded-full bg-[#12151F] flex items-center justify-center group-hover:bg-transparent transition-all">
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-400 to-cyan-300 animate-pulse shadow-lg shadow-cyan-400/50" />
          </div>
          {/* Bildirim Noktası */}
          <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-emerald-400 border-2 border-[#0F1117] rounded-full" />
        </button>
      </div>

    </div>
  );
}