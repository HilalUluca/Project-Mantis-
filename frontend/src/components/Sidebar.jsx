import React, { useState } from 'react';

export default function Sidebar({ activeTab, setActiveTab, isAnalyzing, handleRunAudit }) {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  const navItems = [
    { name: 'Dashboard', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="w-[22px] h-[22px]"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" /></svg> },
    { name: 'Documents', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="w-[22px] h-[22px]"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" /></svg> },
    { name: 'Analysis', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="w-[22px] h-[22px]"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" /></svg> },
    { name: 'Team', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="w-[22px] h-[22px]"><path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75v-.008m0 4.516v-.008m0-2.25v-.008m3 1.133v-.008m-3-1.132v-.008m0 2.25v-.008m3-1.132v-.008m-3-1.133v-.008m3 2.25v-.008m-3-2.25v-.008m-3 1.132v-.008M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.974 0-5.692-1.077-7.843-2.87m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" /></svg> }
  ];

  return (
    <aside 
      onMouseEnter={() => setIsSidebarExpanded(true)}
      onMouseLeave={() => setIsSidebarExpanded(false)}
      className={`bg-[#0F111A] border-r border-white/5 flex flex-col justify-between py-6 transition-all duration-300 ease-in-out z-40 select-none ${
        isSidebarExpanded ? 'w-64 px-5' : 'w-[72px] px-3'
      }`}
    >
      <div className="flex flex-col items-center">
        <div className={`flex items-center gap-3 mb-10 overflow-hidden w-full ${isSidebarExpanded ? 'px-2' : 'justify-center'}`}>
          <div className="text-[#C0B4F9] shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
            </svg>
          </div>
          {isSidebarExpanded && (
            <div className="whitespace-nowrap transition-opacity duration-300">
              <h1 className="font-bold text-sm tracking-wide text-white">Project Mantis</h1>
              <p className="text-[10px] text-purple-400 font-medium">Enterprise Legal AI</p>
            </div>
          )}
        </div>
 
        {isSidebarExpanded && (
          <button 
            onClick={handleRunAudit}
            disabled={isAnalyzing}
            className={`w-full mb-6 bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400 hover:opacity-95 text-white font-medium text-xs rounded-xl shadow-lg shadow-purple-500/25 transition-all flex items-center justify-center gap-2 py-3 px-4 animate-in fade-in ${isAnalyzing ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isAnalyzing ? <div className="w-4 h-4 border-2 border-t-white border-white/30 rounded-full animate-spin" /> : <span className="text-base font-bold">+</span>}
            <span className="whitespace-nowrap">{isAnalyzing ? 'Analyzing...' : 'New Audit'}</span>
          </button>
        )}

        <nav className="space-y-3 w-full flex flex-col items-center">
          {navItems.map((item) => (
            <button
              key={item.name}
              onClick={() => setActiveTab(item.name)}
              className={`w-full flex items-center rounded-2xl text-sm font-medium transition-all duration-200 overflow-hidden ${
                isSidebarExpanded ? 'gap-3 px-4 py-3 justify-start' : 'justify-center w-[48px] h-[48px]'
              } ${activeTab === item.name ? 'bg-[#24263A] text-[#C0B4F9]' : 'text-[#76798C] hover:text-[#C0B4F9] hover:bg-white/5'}`}
            >
              <span className="shrink-0">{item.icon}</span>
              {isSidebarExpanded && <span className="whitespace-nowrap">{item.name}</span>}
            </button>
          ))}
        </nav>
      </div>
      <button
  onClick={() => setActiveTab('logs')}
  title="Audit Logs"
  className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-300 ${
    activeTab === 'logs'
      ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30 shadow-lg shadow-purple-500/10'
      : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
  }`}
>
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
</button>

      <div className="w-full flex flex-col items-center border-t border-white/5 pt-4">
        <button
          onClick={() => setActiveTab('Settings')}
          className={`w-full flex items-center rounded-2xl text-sm font-medium transition-all duration-200 overflow-hidden ${
            isSidebarExpanded ? 'gap-3 px-4 py-3 justify-start' : 'justify-center w-[48px] h-[48px]'
          } ${activeTab === 'Settings' ? 'bg-[#24263A] text-[#C0B4F9]' : 'text-[#76798C] hover:text-[#C0B4F9] hover:bg-white/5'}`}
        >
          <span className="shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="w-[22px] h-[22px]">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
          </span>
          {isSidebarExpanded && <span className="whitespace-nowrap">Profile & Settings</span>}
        </button>
      </div>
    </aside>
  );
}