import React from 'react';

export default function DashboardHub({ auditLogs, riskFindings }) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200 flex-1 flex flex-col">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Good morning, Analyst.</h2>
          <p className="text-xs text-slate-400 mt-1">
            I've completed the overnight scan. <span className="text-cyan-400 font-semibold">{riskFindings.length} open risks</span> require your attention today.
          </p>
        </div>
        <div className="px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300 font-medium flex items-center gap-2 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> AI Engine Active
        </div>
      </header>

      <div className="grid grid-cols-3 gap-6">
        <div className="p-5 rounded-2xl bg-[#121622]/80 border border-white/10 backdrop-blur-xl shadow-2xl">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-2 font-semibold">Documents Audited</p>
          <h3 className="text-3xl font-extrabold text-white">14,295</h3>
        </div>
        <div className="p-5 rounded-2xl bg-[#121622]/80 border border-white/10 backdrop-blur-xl shadow-2xl">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-2 font-semibold">Open Risks</p>
          <h3 className="text-3xl font-extrabold text-white">{riskFindings.length}</h3>
        </div>
        <div className="p-5 rounded-2xl bg-[#121622]/80 border border-white/10 backdrop-blur-xl shadow-2xl flex flex-col justify-between">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">System Status</p>
          <div className="text-emerald-400 text-xs font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> API Connected
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 rounded-2xl bg-[#121622]/50 border border-white/10 backdrop-blur-xl shadow-2xl">
        <h3 className="text-xs font-semibold text-slate-300 mb-4 flex items-center gap-2 tracking-wide uppercase">
          <span>⚡</span> Mantis AI Activity Log (Agent Tracing)
        </h3>
        <div className="space-y-2.5">
          {auditLogs.length > 0 ? auditLogs.map((log) => (
            <div key={log.id} className="p-3 rounded-xl bg-black/30 border border-white/5 flex justify-between items-center font-mono text-[11px]">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-purple-400 font-bold">[{log.agent_name}]</span>
                  <span className="text-cyan-400">Action: {log.action}</span>
                  <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[10px]">Conf: {log.confidence_score * 100}%</span>
                </div>
                <p className="text-slate-400">{log.message} (Doc: {log.source_doc_id})</p>
              </div>
              <span className="text-slate-500">{log.timestamp}</span>
            </div>
          )) : <p className="text-xs text-slate-500">Aktivite logu bulunamadı. Backend bağlantısını kontrol edin.</p>}
        </div>
      </div>
    </div>
  );
}