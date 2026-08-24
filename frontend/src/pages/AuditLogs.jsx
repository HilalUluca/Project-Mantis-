import React, { useEffect, useState } from 'react';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    fetch('http://localhost:8000/api/v1/dashboard/logs')
      .then(res => res.json())
      .then(data => setLogs(data))
      .catch(err => console.error("Loglar yüklenemedi:", err));
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 flex-1 flex flex-col font-sans">
      <div className="bg-[#121622]/60 p-6 rounded-3xl border border-white/[0.08] backdrop-blur-2xl shadow-2xl">
        <h2 className="text-2xl font-black tracking-tight text-white bg-gradient-to-r from-white via-slate-200 to-purple-400 bg-clip-text text-transparent">
          Agent Tracing & Audit Logs
        </h2>
        <p className="text-xs text-slate-400 mt-1 font-medium">Otonom ajanların (Extractor, Auditor, Builder) gerçekleştirdiği operasyonel izler.</p>
      </div>

      <div className="bg-[#121622]/80 border border-white/[0.08] rounded-3xl p-6 backdrop-blur-2xl shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-white/10 text-slate-400">
                <th className="pb-3 px-4">Log ID</th>
                <th className="pb-3 px-4">Agent Name</th>
                <th className="pb-3 px-4">Action</th>
                <th className="pb-3 px-4">Confidence</th>
                <th className="pb-3 px-4">Timestamp</th>
                <th className="pb-3 px-4">Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {logs.length > 0 ? (
                logs.map((log, idx) => (
                  <tr key={log.id || idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 font-bold text-purple-400">{log.id}</td>
                    <td className="py-3 px-4 text-slate-200">{log.agent_name}</td>
                    <td className="py-3 px-4">
                      <span className="bg-purple-500/10 text-purple-300 px-2.5 py-1 rounded-lg border border-purple-500/20 text-[10px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-emerald-400">%{Math.round(log.confidence_score * 100)}</td>
                    <td className="py-3 px-4 text-slate-400">{log.timestamp}</td>
                    <td className="py-3 px-4 text-slate-300">{log.message}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-slate-500">Henüz kayıtlı bir audit log bulunmuyor.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}