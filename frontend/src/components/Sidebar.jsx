import React, { useState } from 'react';

export default function Sidebar({ activeTab, setActiveTab, isAnalyzing, handleRunAudit }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  
  const isExpanded = isLocked || isHovered;

  const navItems = [
    { 
      name: 'Dashboard', 
      icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="w-[20px] h-[20px]"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" /></svg> 
    },
    { 
      name: 'Documents', 
      icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="w-[20px] h-[20px]"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" /></svg> 
    },
    { 
      name: 'Tasks', 
      icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="w-[20px] h-[20px]"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg> 
    },
    { 
      name: 'Analysis', 
      icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="w-[20px] h-[20px]"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" /></svg> 
    },
    { 
      name: 'Team', 
      icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="w-[20px] h-[20px]"><path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75v-.008m0 4.516v-.008m0-2.25v-.008m3 1.133v-.008m-3-1.132v-.008m0 2.25v-.008m3-1.132v-.008m-3-1.133v-.008m3 2.25v-.008m-3-2.25v-.008m-3 1.132v-.008M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.974 0-5.692-1.077-7.843-2.87m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" /></svg> 
    }
  ];

  return (
    <aside 
      onMouseEnter={() => !isLocked && setIsHovered(true)}
      onMouseLeave={() => !isLocked && setIsHovered(false)}
      className={`relative my-4 ml-4 bg-[#07090E]/60 backdrop-blur-2xl border border-white/[0.08] border-t-white/[0.14] shadow-[0_20px_50px_rgba(0,0,0,0.6)] rounded-[2rem] flex flex-col justify-between py-6 transition-all duration-300 ease-in-out z-40 select-none h-[calc(100vh-32px)] shrink-0 ${
        isExpanded ? 'w-60 px-4' : 'w-[72px] px-3'
      }`}
    >
      <div className="flex flex-col items-center w-full">
        
        {/* LOGO & MARKA BAŞLIĞI */}
        <div className={`flex items-center mb-8 overflow-hidden w-full ${isExpanded ? 'px-1 justify-between' : 'justify-center'}`}>
          <div className="flex items-center gap-2.5">
            <div className="text-white/80 shrink-0 flex items-center justify-center w-8 h-8 rounded-xl bg-white/[0.03] border border-white/[0.08]">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="w-4 h-4 text-emerald-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
              </svg>
            </div>
            {isExpanded && (
              <span className="text-xs font-semibold tracking-[0.25em] text-white/90 uppercase font-sans">
                MANTIS
              </span>
            )}
          </div>
          
          {/* KİLİT BUTONU */}
          {isExpanded && (
            <button
              onClick={() => setIsLocked(!isLocked)}
              className={`shrink-0 transition-all duration-200 flex items-center justify-center w-7 h-7 rounded-lg border cursor-pointer ${
                isLocked 
                  ? 'bg-white/[0.08] border-white/[0.15] text-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.15)]' 
                  : 'bg-transparent border-transparent text-slate-500 hover:text-white hover:bg-white/[0.04]'
              }`}
              title={isLocked ? "Kilidi Aç" : "Paneli Kilitle"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="w-3.5 h-3.5">
                {isLocked ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                )}
              </svg>
            </button>
          )}
        </div>
 
        {/* NEW AUDIT BUTONU (Sessiz, Ağırbaşlı Koyu Gradyan) */}
        {isExpanded && (
          <button 
            onClick={handleRunAudit}
            disabled={isAnalyzing}
            className={`w-full mb-6 bg-gradient-to-r from-white/[0.08] via-white/[0.05] to-white/[0.02] hover:bg-white/[0.12] border border-white/[0.1] border-t-white/[0.2] text-slate-200 hover:text-white font-medium text-xs tracking-wider uppercase rounded-xl transition-all duration-200 flex items-center justify-center gap-2 py-2.5 px-4 shadow-[0_4px_16px_rgba(0,0,0,0.4)] ${isAnalyzing ? 'opacity-60 cursor-not-allowed' : 'active:scale-[0.98]'}`}
          >
            {isAnalyzing ? (
              <div className="w-3.5 h-3.5 border-2 border-t-white border-white/20 rounded-full animate-spin" />
            ) : (
              <span className="text-sm font-light leading-none text-emerald-400">+</span>
            )}
            <span className="whitespace-nowrap">{isAnalyzing ? 'Analyzing...' : 'New Audit'}</span>
          </button>
        )}

        {/* MENÜ ELEMANLARI */}
        <nav className="space-y-2 w-full flex flex-col items-center">
          {navItems.map((item) => (
            <button
              key={item.name}
              onClick={() => setActiveTab(item.name)}
              className={`w-full flex items-center rounded-xl text-xs tracking-wide font-medium transition-all duration-200 ${
                isExpanded ? 'gap-3 px-3.5 py-2.5 justify-start' : 'justify-center w-11 h-11'
              } ${activeTab === item.name 
                  ? 'bg-white/[0.08] border border-white/[0.1] text-white shadow-[0_2px_8px_rgba(0,0,0,0.3)]' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'}`}
            >
              <span className="shrink-0">{item.icon}</span>
              {isExpanded && <span className="whitespace-nowrap">{item.name}</span>}
            </button>
          ))}
        </nav>
      </div>

      {/* AYARLAR / PROFİL */}
      <div className="w-full flex flex-col items-center border-t border-white/[0.06] pt-3 shrink-0">
        <button
          onClick={() => setActiveTab('Settings')}
          className={`w-full flex items-center rounded-xl text-xs tracking-wide font-medium transition-all duration-200 ${
            isExpanded ? 'gap-3 px-3.5 py-2.5 justify-start' : 'justify-center w-11 h-11'
          } ${activeTab === 'Settings' 
              ? 'bg-white/[0.08] border border-white/[0.1] text-white' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'}`}
        >
          <span className="shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="w-[20px] h-[20px]">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
          </span>
          {isExpanded && <span className="whitespace-nowrap">Settings</span>}
        </button>
      </div>
    </aside>
  );
}