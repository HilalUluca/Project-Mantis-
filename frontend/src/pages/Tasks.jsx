import React, { useState, useEffect } from 'react';
import { useChatStore } from '../store/chatStore';

export default function Tasks() {
  const [activeSubTab, setActiveSubTab] = useState('approval');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDeadline, setNewTaskDeadline] = useState('');
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  // === DÜZELTME: tasks artık component-local değil, global store'da.
  // TeamHub'dan bir görev eklendiğinde (upsertTask), Tasks sekmesi hâlâ
  // mount edilmemiş olsa bile store zaten güncel; Tasks açıldığında hem
  // store'daki veriyi anında gösterir hem de arka planda tazeler.
  const tasks = useChatStore((state) => state.tasks);
  const tasksLoaded = useChatStore((state) => state.tasksLoaded);
  const fetchTasks = useChatStore((state) => state.fetchTasks);
  const updateTaskStatus = useChatStore((state) => state.updateTaskStatus);

  const [isLoading, setIsLoading] = useState(!tasksLoaded);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await fetchTasks();
      if (cancelled) return;
      setIsLoading(false);
    })();
    return () => { cancelled = true; };
  }, [fetchTasks]);

  const displayTasks = tasks;

  const handleAction = async (id, actionType) => {
    const newStatus = actionType === 'approve' ? 'Onaylandı' : 'Reddedildi';
    const token = localStorage.getItem('mantis_token');
    try {
      const response = await fetch('http://localhost:8000/api/v1/tasks/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ task_id: id, action: actionType })
      });
      const result = await response.json();

      if (response.ok && result.status === 'success') {
        updateTaskStatus(id, { status: newStatus, completed: true });
      } else {
        alert(`İşlem başarısız oldu: ${result.message || 'Bilinmeyen hata'}. Görev durumu DEĞİŞTİRİLMEDİ.`);
      }
    } catch (error) {
      console.error("Bağlantı hatası:", error);
      alert("Backend'e ulaşılamadı. Görev durumu değiştirilmedi, tekrar dener misin?");
    }
  };

  const handleCreateTask = async () => {
    const title = newTaskTitle.trim();
    if (!title) return alert('Görev başlığı yazmalısın.');

    setIsCreatingTask(true);
    const token = localStorage.getItem('mantis_token');

    try {
      const response = await fetch('http://localhost:8000/api/v1/tasks/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          title,
          deadline: newTaskDeadline || 'Belirtilmedi',
          status: 'confirmed',
          type: 'Manuel Görev',
          sender: 'User',
        })
      });
      const result = await response.json();

      if (response.ok && result.status === 'success') {
        setNewTaskTitle('');
        setNewTaskDeadline('');
        await fetchTasks();
      } else {
        alert(result.detail || result.message || 'Görev oluşturulamadı.');
      }
    } catch (error) {
      console.error('Görev oluşturma hatası:', error);
      alert('Görev oluşturulamadı. Backend bağlantısını kontrol et.');
    } finally {
      setIsCreatingTask(false);
    }
  };

  const toggleComplete = (id) => {
    updateTaskStatus(id, { completed: !tasks.find(t => t.id === id)?.completed });
  };

  const filteredTasks = displayTasks.filter(task => {
    if (activeSubTab === 'approval') return task.status === 'Onay Bekliyor';
    if (activeSubTab === 'active') return task.status !== 'Onay Bekliyor' && task.status !== 'Reddedildi' && !task.completed;
    if (activeSubTab === 'completed') return task.completed;
    return true;
  });

  const approvalCount = displayTasks.filter(t => t.status === 'Onay Bekliyor').length;
  const criticalCount = displayTasks.filter(t => t.type === 'Kritik' && !t.completed).length;

  return (
    <div className="flex-1 flex flex-col max-w-6xl mx-auto w-full pb-10 mt-2 space-y-8 animate-in fade-in duration-300">

      {/* 1. ÜST BAŞLIK KARTI */}
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-gradient-to-br dark:from-[#0F111A] dark:to-[#0A0C14] backdrop-blur-2xl border border-slate-200 dark:border-white/[0.05] dark:border-t-white/[0.1] p-8 shadow-sm dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)]">

        <div className="hidden dark:block absolute top-[-20%] right-1/4 w-96 h-96 bg-[#2B2353]/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="hidden dark:block absolute bottom-[-20%] left-1/4 w-80 h-80 bg-[#1D2A4A]/20 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">

          <div className="flex flex-col md:flex-row items-center gap-6 w-full md:w-auto text-center md:text-left">

            <div className="relative shrink-0 w-24 h-24 rounded-[2rem] bg-slate-100 dark:bg-transparent flex items-center justify-center">

              <div className="absolute inset-2 border border-slate-300 dark:border-slate-500/20 rounded-full animate-[pulse_4s_cubic-bezier(0.4,0,0.6,1)_infinite]" />
              <div className="absolute inset-4 border border-slate-300 dark:border-slate-500/30 rounded-full animate-[pulse_4s_cubic-bezier(0.4,0,0.6,1)_infinite_1s]" />
              <div className="absolute inset-6 border border-slate-300 dark:border-slate-500/40 rounded-full" />

              <div className="relative z-10 w-12 h-12 rounded-full bg-[radial-gradient(circle_at_35%_35%,_#94a3b8_0%,_#475569_50%,_#1e293b_100%)] dark:bg-[radial-gradient(circle_at_35%_35%,_#64748b_0%,_#334155_50%,_#0f172a_100%)] shadow-inner">
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white/80 shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
              </div>

            </div>

            <div className="space-y-1.5">
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Task Queue
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-sans max-w-md leading-relaxed">
                You have <span className="font-semibold text-slate-900 dark:text-white">{displayTasks.length}</span> active operations. <span className="font-semibold text-rose-500 dark:text-rose-400">{criticalCount} require immediate attention.</span> AI Engine is holding workflows for your approval.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <button className="bg-transparent hover:bg-slate-50 dark:hover:bg-white/[0.02] border border-slate-300 dark:border-white/[0.15] text-slate-700 dark:text-slate-200 px-6 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all">
              + Upload Contract
            </button>
            <button className="bg-slate-900 hover:bg-slate-800 dark:bg-[#121622] dark:hover:bg-[#1a2030] border border-slate-900 dark:border-white/[0.08] text-white dark:text-slate-200 px-6 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all shadow-md">
              Run Global Audit
            </button>
          </div>
        </div>
      </div>

      {/* 2. SEKMELER */}
      <div className="flex flex-col gap-4 border-b border-slate-200 dark:border-white/5 pb-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <input
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Yeni görev başlığı"
            className="flex-1 w-full bg-white dark:bg-[#0A0D14] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 dark:focus:border-slate-500"
          />
          <input
            type="date"
            value={newTaskDeadline}
            onChange={(e) => setNewTaskDeadline(e.target.value)}
            className="w-full md:w-44 bg-white dark:bg-[#0A0D14] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-slate-400 dark:focus:border-slate-500"
          />
          <button
            onClick={handleCreateTask}
            disabled={isCreatingTask}
            className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold disabled:opacity-60"
          >
            {isCreatingTask ? 'Ekleniyor...' : 'Görev Ekle'}
          </button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
          {[
            { id: 'approval', label: 'Pending Approval', count: approvalCount },
            { id: 'active', label: 'Active Tasks' },
            { id: 'completed', label: 'Completed' },
            { id: 'all', label: 'All Operations', count: displayTasks.length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${
                activeSubTab === tab.id
                  ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white border border-slate-200 dark:border-white/20 shadow-sm'
                  : 'bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                  activeSubTab === tab.id
                    ? 'bg-slate-300 dark:bg-white/20 text-slate-800 dark:text-white'
                    : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 3. GÖREV LİSTESİ */}
      <div className="grid gap-4">
        {isLoading ? (
          <div className="text-center py-16 flex flex-col items-center justify-center gap-3">
            <div className="w-6 h-6 border-2 border-t-slate-500 border-slate-200 dark:border-white/10 rounded-full animate-spin" />
            <p className="text-xs text-slate-500 uppercase tracking-widest">Scanning Operations...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-[#06080D]/40 border border-slate-200 dark:border-white/5 rounded-3xl shadow-sm">
            <p className="text-sm text-slate-500 dark:text-slate-400">Queue is empty for this category.</p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`group bg-white dark:bg-[#0A0D14]/60 backdrop-blur-xl border rounded-2xl transition-all duration-300 shadow-sm dark:shadow-[0_10px_30px_rgba(0,0,0,0.4)] flex flex-col overflow-hidden ${
                task.completed
                  ? 'border-emerald-200 dark:border-emerald-500/20 opacity-75'
                  : task.requires_ai_review
                    ? 'border-slate-300 dark:border-slate-500/40 shadow-md'
                    : 'border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.15]'
              }`}
            >
              <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">

                <div className="flex items-start gap-4 w-full">
                  <div className="pt-1">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleComplete(task.id)}
                      className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 text-slate-600 dark:bg-[#0A0C10] focus:ring-slate-500 cursor-pointer transition-all"
                    />
                  </div>

                  <div className="space-y-2 w-full">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded flex items-center gap-1 font-bold tracking-wider uppercase border ${
                        task.requires_ai_review
                          ? 'bg-slate-100 dark:bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-500/30'
                          : task.type === 'Kritik'
                            ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20'
                            : 'bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10'
                      }`}>
                        {task.requires_ai_review && (
                           <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-pulse mr-0.5"></span>
                        )}
                        {task.requires_ai_review ? "AI Review" : task.type}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Source: <strong className="text-slate-700 dark:text-slate-200 font-medium">{task.sender}</strong>
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        • Due: <strong className="text-slate-700 dark:text-slate-200 font-medium">{task.deadline}</strong>
                      </span>
                    </div>

                    <h3 className={`text-base font-semibold tracking-tight transition-colors ${
                      task.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'
                    }`}>
                      {task.title}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto justify-end shrink-0">
                  {task.completed ? (
                    <span className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 rounded-lg text-xs font-semibold">
                      Resolved
                    </span>
                  ) : task.status === 'Onay Bekliyor' ? (
                    <>
                      <button
                        onClick={() => handleAction(task.id, 'reject')}
                        className="px-4 py-2 bg-white dark:bg-[#121622] hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-white/[0.08] hover:border-rose-200 dark:hover:border-rose-500/30 text-xs font-semibold rounded-xl transition-all"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleAction(task.id, 'approve')}
                        className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all border shadow-sm ${
                          task.requires_ai_review
                            ? 'bg-slate-800 hover:bg-slate-900 dark:bg-slate-600/30 dark:hover:bg-slate-600/50 text-white dark:text-slate-200 border-slate-700 dark:border-slate-500/40'
                            : 'bg-slate-900 hover:bg-slate-800 dark:bg-white/10 dark:hover:bg-white/20 text-white dark:text-white border-slate-900 dark:border-white/20'
                        }`}
                      >
                        {task.requires_ai_review ? 'Approve Draft' : 'Approve'}
                      </button>
                    </>
                  ) : (
                    <span className="px-3 py-1.5 bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10 rounded-lg text-[11px] font-semibold uppercase tracking-wider">
                      {task.status}
                    </span>
                  )}
                </div>
              </div>

              {task.requires_ai_review && task.ai_draft && !task.completed && (
                <div className="px-6 pb-6 pt-0">
                  <div className="bg-slate-50 dark:bg-[#040508] border border-slate-200 dark:border-slate-500/20 rounded-xl p-5 shadow-inner">
                    <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-3 flex items-center gap-2 tracking-wider uppercase">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                      AI Generated Draft
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">
                      {task.ai_draft}
                    </p>
                    <div className="mt-4 text-[10px] text-slate-500 flex items-center gap-2 font-medium">
                      <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Approving will automatically route this response to the counterparty.
                    </div>
                  </div>
                </div>
              )}

            </div>
          ))
        )}
      </div>

    </div>
  );
}