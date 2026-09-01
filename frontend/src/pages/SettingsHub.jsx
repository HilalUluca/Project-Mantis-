import React, { Fragment, useRef, useState, useEffect } from 'react';

export default function SettingsHub() {
  const [activeSection, setActiveSection] = useState('integrations');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark') || localStorage.getItem('mantis_theme') !== 'light';
  });
  const [watchedFolders, setWatchedFolders] = useState([]);
  const [folderPath, setFolderPath] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [integrationStatus, setIntegrationStatus] = useState(null);
  const [isRefreshingStatus, setIsRefreshingStatus] = useState(false);
  const [lastSyncMessage, setLastSyncMessage] = useState('');
  const folderPickerRef = useRef(null);

  const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('mantis_token')}` });

  useEffect(() => {
    fetch('http://localhost:8000/api/v1/settings/watched-folders', { headers: authHeaders() })
      .then((response) => response.json()).then((data) => setWatchedFolders(data.folders || [])).catch(() => {});
  }, []);

  const refreshIntegrationStatus = async () => {
    setIsRefreshingStatus(true);
    try {
      const response = await fetch('http://localhost:8000/api/v1/integrations/status', { headers: authHeaders() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Entegrasyon durumu alınamadı.');
      setIntegrationStatus(data.integrations || null);
    } catch (error) {
      setLastSyncMessage(error.message || 'Entegrasyon durumu alınamadı.');
    } finally {
      setIsRefreshingStatus(false);
    }
  };

  useEffect(() => {
    refreshIntegrationStatus();
  }, []);

  const addFolder = async () => {
    if (!folderPath.trim()) return;
    const response = await fetch('http://localhost:8000/api/v1/settings/watched-folders', {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ path: folderPath, enabled: true })
    });
    const data = await response.json();
    if (!response.ok) return alert(data.detail || 'Klasör eklenemedi.');
    setWatchedFolders(data.folders || []); setFolderPath('');
  };

  const selectFolder = () => folderPickerRef.current?.click();

  const importSelectedFolder = async (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    event.target.value = '';
    if (!selectedFiles.length) return;
    const folderName = selectedFiles[0].webkitRelativePath?.split('/')[0] || 'Selected folder';
    const formData = new FormData();
    formData.append('folder_name', folderName);
    selectedFiles.forEach((file) => formData.append('files', file, file.webkitRelativePath || file.name));
    setIsSyncing(true);
    try {
      const response = await fetch('http://localhost:8000/api/v1/settings/watched-folders/import', {
        method: 'POST', headers: authHeaders(), body: formData
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Klasör alınamadı.');
      setWatchedFolders(data.folders || []);
      setLastSyncMessage(data.message || 'Klasör Mantis tarafından izlenmeye başladı.');
    } catch (error) {
      setLastSyncMessage(error.message || 'Klasör alınamadı.');
    } finally {
      setIsSyncing(false);
    }
  };

  const removeFolder = async (path) => {
    const response = await fetch(`http://localhost:8000/api/v1/settings/watched-folders?path=${encodeURIComponent(path)}`, { method: 'DELETE', headers: authHeaders() });
    const data = await response.json();
    setWatchedFolders(data.folders || []);
  };

  const syncFolders = async () => {
    setIsSyncing(true);
    const response = await fetch('http://localhost:8000/api/v1/settings/watched-folders/sync', { method: 'POST', headers: authHeaders() });
    const data = await response.json();
    setIsSyncing(false);
    setLastSyncMessage(data.message || 'Klasörler senkronlandı.');
  };

  const scanInbox = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch('http://localhost:8000/api/v1/tasks/sync-gmail', { method: 'POST', headers: authHeaders() });
      const data = await response.json();
      setLastSyncMessage(data.message || 'Gelen kutusu tarandı.');
      await refreshIntegrationStatus();
    } catch (error) {
      setLastSyncMessage(error.message || 'Gmail taraması başarısız.');
    } finally {
      setIsSyncing(false);
    }
  };

  const integrationCards = [
    { key: 'gmail', name: 'Gmail', description: 'Inbox scan and task extraction', fallback: 'Unknown', action: scanInbox, actionLabel: 'Scan inbox' },
    { key: 'drive', name: 'Google Drive', description: 'Generated documents and vault backup', fallback: 'Unknown' },
    { key: 'google_tasks', name: 'Google Tasks', description: 'Approved tasks synchronization', fallback: 'Unknown' },
    { key: 'foundry_local', name: 'Foundry Local', description: 'Private local AI inference', fallback: 'Unknown' }
  ];

  const toggleTheme = () => {
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);

    if (nextMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('mantis_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('mantis_theme', 'light');
    }
  };

  const menuItems = [
    {
      id: 'profile',
      title: 'Profile',
      description: 'Manage your personal information and account preferences.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
        </svg>
      )
    },
    {
      id: 'integrations',
      title: 'Integrations & Security',
      description: 'Connect existing tools and manage authentication protocols.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
        </svg>
      )
    },
    {
      id: 'darkmode',
      title: 'Dark Mode',
      description: 'Toggle between light and obsidian dark interface modes.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
        </svg>
      ),
      action: 'toggle'
    },
    {
      id: 'onboarding',
      title: 'Update Onboarding',
      description: 'Re-run the initial setup wizard to calibrate AI routing.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
        </svg>
      )
    },
    {
      id: 'help',
      title: 'Help and Support',
      description: 'Access documentation or contact the engineering team.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
        </svg>
      )
    }
  ];

  return (
    <div className="flex-1 flex flex-col w-full max-w-4xl pb-10">
      
      {/* SOLA BİTİŞİK BAŞLIK */}
      <div className="mb-8 space-y-1.5 text-left">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
          Settings & Preferences
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-sans max-w-xl leading-relaxed">
          Configure security protocols, interface appearance, and automated workflow parameters.
        </p>
      </div>

      {/* LİSTE AYARLARI */}
      <div className="flex flex-col space-y-3 w-full">
        {menuItems.map((item) => (
          <Fragment key={item.id}>
          <div 
            onClick={() => {
              if (item.action === 'toggle') {
                toggleTheme();
              } else {
                setActiveSection(activeSection === item.id ? null : item.id);
              }
            }}
            className="group flex items-center justify-between p-4.5 rounded-2xl bg-white dark:bg-[#06080D]/40 hover:bg-slate-50 dark:hover:bg-[#06080D]/80 border border-slate-200 dark:border-white/[0.04] hover:border-slate-300 dark:hover:border-white/[0.1] transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] group-hover:bg-slate-200 dark:group-hover:bg-white/[0.05] flex items-center justify-center text-slate-600 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors shrink-0">
                {item.icon}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-white transition-colors tracking-wide">
                  {item.title}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-500 mt-0.5">
                  {item.description}
                </span>
              </div>
            </div>

            <div className="shrink-0 pl-4">
              {item.action === 'toggle' ? (
                <button 
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTheme();
                  }}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 border cursor-pointer ${
                    isDarkMode 
                      ? 'bg-emerald-500/20 border-emerald-500/50' 
                      : 'bg-slate-200 border-slate-300'
                  }`}
                >
                  <div className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 rounded-full transition-transform duration-200 ${
                    isDarkMode 
                      ? 'translate-x-5 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' 
                      : 'translate-x-0 bg-white shadow-sm'
                  }`} />
                </button>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-slate-400 dark:text-slate-600 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              )}
            </div>
          </div>

          {activeSection === item.id && item.id === 'integrations' && (
            <div className="ml-0 sm:ml-15 mt-1 mb-2 rounded-2xl border border-cyan-400/20 bg-[#071018]/80 p-5 space-y-5 shadow-inner">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-sm font-semibold text-white">Integrations & Workflows</h2>
                  <p className="text-xs text-slate-400 mt-1">Connectors and local sources that Mantis is allowed to inspect.</p>
                </div>
                <button onClick={refreshIntegrationStatus} disabled={isRefreshingStatus} className="text-[10px] uppercase tracking-widest text-emerald-300 border border-emerald-400/20 bg-emerald-400/10 rounded-full px-2 py-1 disabled:opacity-50">{isRefreshingStatus ? 'Refreshing...' : 'Refresh status'}</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {integrationCards.map(({ key, name, description, fallback, action, actionLabel }) => {
                  const status = integrationStatus?.[key]?.status || fallback;
                  return (
                  <div key={name} className="rounded-xl border border-white/10 bg-black/20 p-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-slate-200">{name}</p>
                      <p className="text-[11px] text-slate-500 mt-1">{description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {action && <button onClick={action} disabled={isSyncing} className="text-[10px] text-cyan-300 hover:text-cyan-200 disabled:opacity-50">{isSyncing ? 'Scanning...' : actionLabel}</button>}
                      <span className={`text-[10px] whitespace-nowrap ${status === 'Connected' ? 'text-emerald-300' : status.includes('Needs') || status.includes('Unavailable') ? 'text-amber-300' : 'text-slate-300'}`}>{status}</span>
                    </div>
                  </div>
                  );
                })}
              </div>

              {lastSyncMessage && <p className="text-xs text-slate-300 border-l-2 border-cyan-400 pl-3">{lastSyncMessage}</p>}

              <div className="border-t border-white/10 pt-5 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-white">Watched folders</h3>
                  <p className="text-xs text-slate-400 mt-1">Yalnızca izin verdiğin klasörlerdeki TXT, Markdown ve DOCX dosyaları Vault’a alınır.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input value={folderPath} onChange={(e) => setFolderPath(e.target.value)} placeholder="C:\\Users\\...\\Contracts" className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600" />
                  <button onClick={selectFolder} disabled={isSyncing} className="px-4 py-2 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white text-xs">Choose folder</button>
                  <input ref={folderPickerRef} type="file" webkitdirectory="true" directory="true" multiple onChange={importSelectedFolder} className="hidden" />
                  <button onClick={addFolder} className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs">Add path</button>
                  <button onClick={syncFolders} disabled={isSyncing} className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs">{isSyncing ? 'Syncing...' : 'Sync now'}</button>
                </div>
                <div className="space-y-2">
                  {watchedFolders.length === 0 ? <p className="text-xs text-slate-500">Henüz izlenen klasör yok.</p> : watchedFolders.map((folder) => (
                    <div key={folder.path} className="flex items-center justify-between gap-3 border border-white/10 rounded-lg px-3 py-2">
                      <span className="text-xs text-slate-300 truncate">{folder.path}</span>
                      <button onClick={() => removeFolder(folder.path)} className="text-xs text-rose-300 hover:text-rose-200">Remove</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          </Fragment>
        ))}
      </div>

    </div>
  );
}