import React, { useState, useEffect } from 'react';
import { useChatStore } from '../store/chatStore';

export default function TeamHub({ teamMembers: initialTeamMembers }) {
  const [activeSubTab, setActiveSubTab] = useState('members');
  const [teamMembers, setTeamMembers] = useState(initialTeamMembers || []);

  const [nlpCommand, setNlpCommand] = useState("");
  const [isNlpLoading, setIsNlpLoading] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);

  // === DÜZELTME: parsedRecords artık component-local değil, global store'da.
  // TeamHub sekmeden çıkıp geri geldiğinde (unmount/remount) bu liste artık
  // sıfırlanmıyor.
  const parsedRecords = useChatStore((state) => state.parsedRecords);
  const addParsedRecord = useChatStore((state) => state.addParsedRecord);
  const updateParsedRecord = useChatStore((state) => state.updateParsedRecord);
  const upsertTask = useChatStore((state) => state.upsertTask);

  const [activeMenuId, setActiveMenuId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newAccessLevel, setNewAccessLevel] = useState('Standard User');
  const [insuranceFile, setInsuranceFile] = useState(null);
  const [wrongEntryModal, setWrongEntryModal] = useState({ isOpen: false, memberId: null, reason: '' });

  const [dispatchModal, setDispatchModal] = useState({ isOpen: false, type: null, recipient: "hukuk-musavirligi@mantis.corp", letterContent: null, targetName: null });

  useEffect(() => {
    fetch('http://localhost:8000/api/v1/team/members')
      .then(res => res.json())
      .then(data => setTeamMembers(data))
      .catch(err => console.error("Takım üyeleri yüklenemedi:", err));
  }, []);

  // === DÜZELTME: kök neden burasıydı. Backend'in /attendance/parse endpoint'i
  // zaten bir task oluşturuyor VE ihtarname taslağını üretiyor
  // (data.task_id, data.letter_draft). Eskiden bu ikisi atılıyor, kullanıcı
  // ayrı bir "İhtarname Üret & Sevk Et" butonuna basınca TAMAMEN FARKLI bir
  // endpoint'e (/attendance/warning-letter) gidiliyordu — o endpoint db_tasks'a
  // hiç dokunmuyor. Sonuç: TeamHub'dan gönderilen ihtar Tasks sekmesinde hiç
  // görünmüyordu, çünkü aslında iki paralel/kopuk akış vardı.
  // Şimdi: parse anında dönen task_id ve letter_draft saklanıyor, "onayla ve
  // gönder" butonu gerçek onay kuyruğu endpoint'ine (/tasks/action) gidiyor —
  // Tasks sekmesiyle AYNI veri kaynağını kullanıyor.
  const handleParseCommand = async () => {
    if (!consentGiven) {
      alert("Hukuki işlem onayı (Consent) verilmeden personel verisi işlenemez.");
      return;
    }
    if (!nlpCommand.trim()) return;

    setIsNlpLoading(true);

    try {
      const response = await fetch("http://localhost:8000/api/v1/attendance/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            command: nlpCommand,
            consent_given: consentGiven,
            operator: "Hilal Uluca (Lead Architect)"
        }),
      });
      const data = await response.json();
      if (data.status === "success") {
        const newRecord = {
          id: Date.now(),
          ...data.data,
          task_id: data.task_id,          // === YENİ
          letterDraft: data.letter_draft,  // === YENİ — taslak parse anında zaten hazır
          isGenerating: false,
          letterResult: null,
          mailStatus: "idle"
        };
        addParsedRecord(newRecord);

        // === YENİ: Tasks sekmesi bu anda açık değilse bile store üzerinden
        // görevi hemen "biliyor" hale getiriyoruz — Tasks'a geçildiğinde
        // kendi fetch'i zaten tazeleyecek ama arada bir gecikme olursa bile
        // store zaten güncel.
        upsertTask({
          id: data.task_id,
          title: `İhtarname Onayı: ${data.data.personnel_name}`,
          status: "Onay Bekliyor",
          type: "Kritik Güvenlik Onayı",
          requires_ai_review: true,
          ai_draft: data.letter_draft,
        });

        setNlpCommand("");
      } else {
        alert("Mantis NLP Hatası: " + data.message);
      }
    } catch (error) {
      alert("Bağlantı hatası: Backend çalışıyor mu?");
    } finally {
      setIsNlpLoading(false);
    }
  };

  // === DÜZELTME: eski handleGenerateAndSendWarning kaldırıldı — artık ayrı
  // bir endpoint'e gitmiyor, doğrudan onay kuyruğunu (aynı Tasks.jsx'in
  // kullandığı /tasks/action) tetikliyor. Böylece Tasks sekmesindeki
  // "Onayla" ile buradaki "Onayla ve Gönder" AYNI kaydı günceller.
  const handleApproveAndSend = async (recordId) => {
    const record = parsedRecords.find(r => r.id === recordId);
    if (!record?.task_id) {
      alert("Bu kayıt için bir task_id bulunamadı — önce kuyruğa eklemeyi tekrar dener misin?");
      return;
    }

    updateParsedRecord(recordId, { isGenerating: true, mailStatus: "idle" });

    try {
      const response = await fetch("http://localhost:8000/api/v1/tasks/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task_id: record.task_id, action: "approve" }),
      });
      const data = await response.json();

      updateParsedRecord(recordId, {
        isGenerating: false,
        letterResult: record.letterDraft,
        mailStatus: data.status === "success" ? "success" : "error",
      });

      if (data.status === "success") {
        upsertTask({ id: record.task_id, status: "Onaylandı", completed: true });
      }
    } catch (error) {
      updateParsedRecord(recordId, { isGenerating: false, mailStatus: "error" });
      alert("Bağlantı hatası oluştu.");
    }
  };

  const handleInviteSubmit = (e) => {
    e.preventDefault();
    if (!newName || !newRole) return alert("İsim ve rol alanlarını doldurun.");
    const newMember = {
      id: Date.now(), name: newName, role: newRole,
      email: newEmail || `${newName.toLowerCase().replace(/\s+/g, '')}@mantis.corp`,
      status: "Active", access: newAccessLevel, hasInsuranceDoc: !!insuranceFile,
      avatar: newName.substring(0, 2).toUpperCase(), color: "from-purple-600 to-indigo-600"
    };
    setTeamMembers([newMember, ...teamMembers]);
    setNewName(''); setNewRole(''); setNewEmail(''); setInsuranceFile(null); setIsModalOpen(false);
  };

  const handleUpdateStatus = (id, newStatus, badgeColor) => {
    setTeamMembers(teamMembers.map(m => m.id === id ? { ...m, status: newStatus, color: badgeColor } : m));
    setActiveMenuId(null);
  };

  const handleWrongEntrySubmit = (e) => {
    e.preventDefault();
    if (!wrongEntryModal.reason.trim()) return alert("Gerekçe belirtin.");
    setTeamMembers(teamMembers.map(m => m.id === wrongEntryModal.memberId ? { ...m, status: "Silme Onayı Bekliyor", color: "from-rose-500/50 to-slate-700" } : m));
    alert(`[Agent Harness] Silme talebi oluşturuldu.`);
    setWrongEntryModal({ isOpen: false, memberId: null, reason: '' });
  };

  const executeDispatch = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        action_type: dispatchModal.type,
        title: dispatchModal.type === "email" ? `Hukuki Taslak: ${dispatchModal.targetName}` : `Jira Görevi: ${dispatchModal.targetName}`,
        description: dispatchModal.letterContent,
        recipient: dispatchModal.recipient
      };
      const res = await fetch('http://localhost:8000/api/action/dispatch', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        alert(dispatchModal.type === "email" ? (data.mail_delivered === false ? `Mail gönderilemedi: ${data.message}` : `E-posta gönderildi.`) : `Jira görevi açıldı.`);
        setDispatchModal({ isOpen: false, type: null, recipient: "hukuk-musavirligi@mantis.corp", letterContent: null, targetName: null });
      } else {
        alert("İşlem gerçekleştirilemedi: " + (data.message || "Bilinmeyen hata"));
      }
    } catch (err) {
      alert("Sunucu bağlantı hatası.");
    }
  };

  return (
    <div className="flex-1 flex flex-col max-w-6xl mx-auto w-full pb-10 mt-2 space-y-8 animate-in fade-in duration-300 font-sans relative" onClick={() => setActiveMenuId(null)}>

      {/* 1. ÜST BAŞLIK KARTI */}
      <div className="relative overflow-hidden rounded-3xl bg-white/80 dark:bg-[#080B14]/90 backdrop-blur-2xl border border-slate-200 dark:border-white/[0.08] dark:border-t-white/[0.15] p-8 shadow-sm dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)]">

        <div className="hidden dark:block absolute top-[-50%] right-[-10%] w-[400px] h-[400px] bg-gradient-to-br from-indigo-600/15 via-purple-600/15 to-transparent rounded-full blur-[100px] pointer-events-none" />
        <div className="hidden dark:block absolute bottom-[-50%] left-[-10%] w-[300px] h-[300px] bg-blue-600/10 rounded-full blur-[90px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-6">

            <div className="relative shrink-0 w-16 h-16 rounded-2xl bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 flex items-center justify-center shadow-sm dark:shadow-[0_0_25px_rgba(0,0,0,0.8)] overflow-hidden">
              <div className="absolute inset-0 rounded-2xl border border-indigo-500/30 animate-[spin_8s_linear_infinite]" />
              <div className="absolute inset-1.5 border border-purple-400/20 rounded-xl animate-[spin_6s_linear_infinite_reverse]" />
              <div className="w-9 h-9 rounded-full bg-[radial-gradient(circle_at_35%_35%,_#6366f1_0%,_#4f46e5_50%,_#1e1b4b_100%)] shadow-[0_0_20px_#4f46e5] flex items-center justify-center animate-pulse">
                <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_8px_#ffffff]" />
              </div>
            </div>

            <div className="space-y-1.5">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                HR & Personnel Hub
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">
                KVKK compliant insurance verification, autonomous offboarding tracking, and NLP-driven HR operations.
              </p>
            </div>
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); }}
            className="group relative inline-flex items-center gap-2.5 px-6 py-3 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 hover:from-indigo-900 hover:to-slate-900 dark:from-indigo-600 dark:via-purple-600 dark:to-indigo-700 dark:hover:from-indigo-500 dark:hover:to-purple-500 border border-slate-800 dark:border-indigo-400/30 transition-all duration-300 shadow-md dark:shadow-[0_4px_20px_rgba(79,70,229,0.3)] active:scale-95 cursor-pointer shrink-0 overflow-hidden"
          >
            <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent_20%,rgba(255,255,255,0.15)_40%,transparent_60%)] translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            <svg className="w-4 h-4 text-indigo-300 dark:text-indigo-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
            <span>Personel Ekle</span>
          </button>
        </div>
      </div>

      {/* 2. SEKMELER */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/5 pb-4 overflow-x-auto hide-scrollbar">
        <button
          onClick={() => setActiveSubTab('members')}
          className={`px-5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${
            activeSubTab === 'members'
              ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white border border-slate-200 dark:border-white/20 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent'
          }`}
        >
          <span>Aktif Kadro</span>
          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300">
            {teamMembers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('offboarding')}
          className={`px-5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shrink-0 relative ${
            activeSubTab === 'offboarding'
              ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white border border-slate-200 dark:border-white/20 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent'
          }`}
        >
          <span>Offboarding İzleme</span>
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
        </button>
      </div>

      {/* 3. İÇERİK BÖLÜMÜ */}
      {activeSubTab === 'members' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teamMembers.length > 0 ? (
            teamMembers.map((member) => (
              <div
                key={member.id}
                className="group bg-white/90 dark:bg-[#0A0D14]/90 border border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-indigo-500/30 rounded-3xl p-6 backdrop-blur-2xl shadow-sm dark:shadow-xl transition-all duration-300 relative flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${member.color || 'from-indigo-600 to-purple-600'} flex items-center justify-center font-bold text-white shadow-md text-sm tracking-wider`}>
                      {member.avatar || member.name.substring(0, 2).toUpperCase()}
                    </div>

                    <div className="relative">
                      <button
                        onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === member.id ? null : member.id); }}
                        className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-500 dark:text-slate-300 transition-all cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                      </button>

                      {activeMenuId === member.id && (
                        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#0F121C] border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl dark:shadow-2xl z-30 py-2 animate-in fade-in zoom-in-95 duration-150">
                          <div className="px-4 py-1.5 text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-white/5 mb-1">
                            İşlem Yap
                          </div>

                          <button
                            onClick={() => handleUpdateStatus(member.id, "İstifa Etti", "from-amber-500 to-orange-600")}
                            className="w-full text-left px-4 py-2 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors flex items-center gap-2 cursor-pointer"
                          >
                            İstifa Etti / Ayrıldı
                          </button>

                          <button
                            onClick={() => handleUpdateStatus(member.id, "İşten Çıkarıldı", "from-rose-600 to-red-800")}
                            className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors flex items-center gap-2 cursor-pointer"
                          >
                            Fesih (Madde 25)
                          </button>

                          <button
                            onClick={() => { setActiveMenuId(null); setWrongEntryModal({ isOpen: true, memberId: member.id, reason: '' }); }}
                            className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors flex items-center gap-2 cursor-pointer border-t border-slate-100 dark:border-white/5 mt-1 pt-2"
                          >
                            Hatalı Kayıt (Silme)
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 space-y-1">
                    <h4 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">{member.name}</h4>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">{member.role}</p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-xs">
                  <span className="px-3 py-1 rounded-lg font-mono text-[10px] font-bold tracking-wider uppercase bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/5">
                    {member.status || "Aktif Personel"}
                  </span>

                  {member.hasInsuranceDoc && (
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium text-[11px] flex items-center gap-1.5">
                      KVKK Okey
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-20 bg-white dark:bg-[#0A0D14]/40 rounded-3xl border border-slate-200 dark:border-white/[0.08] backdrop-blur-xl">
              <p className="text-xs font-mono text-slate-500">Aktif personel verisi bulunamadı.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">

          <div className="bg-white/90 dark:bg-[#0A0D14]/90 border border-slate-200 dark:border-indigo-500/30 rounded-3xl p-6 backdrop-blur-2xl shadow-sm dark:shadow-2xl relative overflow-hidden space-y-4">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white tracking-widest uppercase flex items-center gap-2">
              <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              Autonomous Attendance Detection
            </h3>

            <div className="flex flex-col md:flex-row gap-3">
              <input
                type="text"
                value={nlpCommand}
                onChange={(e) => setNlpCommand(e.target.value)}
                placeholder='Örn: "Ahmet usta dün mazeretsiz işe gelmedi"'
                className="flex-1 bg-slate-50 dark:bg-[#05070A] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-400"
                disabled={isNlpLoading}
                onKeyDown={(e) => e.key === 'Enter' && handleParseCommand()}
              />
              <button
                onClick={handleParseCommand}
                disabled={isNlpLoading || !nlpCommand.trim()}
                className="bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white px-6 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 md:w-auto w-full shadow-md"
              >
                {isNlpLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Kuyruğa Ekle"}
              </button>
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 cursor-pointer w-max">
              <input
                type="checkbox"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-indigo-600 focus:ring-indigo-500"
              />
              Puantaj ve devamsızlık verilerinin otonom olarak işlenmesine yasal onay veriyorum.
            </label>
          </div>

          {/* === DÜZELTME: artık global store'daki parsedRecords render ediliyor */}
          {parsedRecords.map((record) => (
            <div key={record.id} className="bg-white/90 dark:bg-[#0A0D14]/90 border border-rose-200 dark:border-rose-500/30 rounded-3xl p-6 backdrop-blur-2xl shadow-sm dark:shadow-2xl relative overflow-hidden space-y-6">

              <div className="flex justify-between items-start gap-4">
                <div className="space-y-2">
                  <span className="bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 px-3 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase">
                    Unexcused Absence Detected
                  </span>
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">{record.personnel_name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">Status: {record.status} • Date: {record.date}</p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">1 Day</span>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Unexcused</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-[#05070A] p-4 rounded-2xl border border-slate-200 dark:border-white/5">
                <div>
                  <p className="text-[11px] text-slate-500 font-medium">Mazeret Bildirimi:</p>
                  <p className="text-xs font-bold text-slate-800 dark:text-indigo-300 mt-0.5">{record.reason === "null" ? "Bildirilmedi" : record.reason}</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500 font-medium">Yasal Dayanak:</p>
                  <p className="text-xs font-mono text-slate-800 dark:text-slate-300 mt-0.5">İş Kanunu Madde 25/II</p>
                </div>
              </div>

              {/* === YENİ: taslak artık parse anında hazır — onaydan önce de gösteriliyor */}
              {record.letterDraft && !record.letterResult && (
                <div className="bg-slate-50 dark:bg-[#040508] border border-slate-200 dark:border-slate-500/20 rounded-xl p-5 shadow-inner">
                  <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-3 uppercase tracking-wider">
                    AI Taslağı (henüz gönderilmedi — onay bekliyor)
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">
                    {record.letterDraft}
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-slate-100 dark:border-white/5 gap-4">
                <p className="text-xs text-slate-500">Bu kayıt aynı zamanda Tasks sekmesindeki onay kuyruğunda görünür.</p>
                <button
                  onClick={() => handleApproveAndSend(record.id)}
                  disabled={record.isGenerating || !!record.letterResult}
                  className="bg-slate-900 hover:bg-slate-800 dark:bg-rose-600 dark:hover:bg-rose-500 text-white px-5 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-md disabled:opacity-50 cursor-pointer whitespace-nowrap"
                >
                  {record.isGenerating ? "Gönderiliyor..." : record.letterResult ? "Gönderildi" : "Onayla ve Sevk Et"}
                </button>
              </div>

              {record.letterResult && (
                <div className="mt-4 p-5 bg-slate-50 dark:bg-[#040508] border border-slate-200 dark:border-indigo-500/30 rounded-2xl space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <h4 className="text-[10px] font-bold text-slate-700 dark:text-indigo-300 uppercase tracking-widest font-mono">Generated Warning Draft</h4>

                    {record.mailStatus !== 'idle' && (
                      <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-md border ${record.mailStatus === 'success' ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20' : 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20'}`}>
                        {record.mailStatus === 'success' ? 'Delivered' : 'Delivery Error'}
                      </span>
                    )}
                  </div>

                  <pre className="text-xs font-mono text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed p-4 bg-white dark:bg-black/30 rounded-xl border border-slate-200 dark:border-white/5">{record.letterResult}</pre>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      onClick={() => setDispatchModal({ isOpen: true, type: 'email', recipient: "hukuk-musavirligi@mantis.corp", letterContent: record.letterResult, targetName: record.personnel_name })}
                      className="bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                    >
                      Ayrıca Kopyasını Gönder
                    </button>
                    <button
                      onClick={() => setDispatchModal({ isOpen: true, type: 'jira', recipient: "HR-Legal-Board", letterContent: record.letterResult, targetName: record.personnel_name })}
                      className="bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-md cursor-pointer"
                    >
                      Jira Task Aç
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

        </div>
      )}

      {/* MODALLAR (değişmedi) */}
      {dispatchModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#0C0E17] border border-slate-200 dark:border-indigo-500/30 rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{dispatchModal.type === 'email' ? 'Hukuki Taslak Gönderimi' : 'Jira Görevi Oluştur'}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Hedef: {dispatchModal.targetName}</p>

            <form onSubmit={executeDispatch} className="space-y-4">
              <select value={dispatchModal.recipient} onChange={(e) => setDispatchModal({ ...dispatchModal, recipient: e.target.value })} className="w-full bg-slate-50 dark:bg-[#05070A] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500">
                <option value="hukuk-musavirligi@mantis.corp">Hukuk Müşavirliği</option>
                <option value="hr-leader@mantis.corp">İK Liderliği</option>
                {teamMembers.map(m => <option key={m.id} value={m.email}>{m.name} — {m.role}</option>)}
              </select>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setDispatchModal({ isOpen: false, type: null, recipient: "hukuk-musavirligi@mantis.corp", letterContent: null, targetName: null })} className="text-slate-500 text-xs font-semibold px-4 py-2 hover:text-slate-900 dark:hover:text-white">İptal</button>
                <button type="submit" className="bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-md">Gönder</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#0C0E17] border border-slate-200 dark:border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Yeni Personel Kaydı</h3>
            <form onSubmit={handleInviteSubmit} className="space-y-3">
              <input type="text" placeholder="Ad Soyad" value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full bg-slate-50 dark:bg-[#05070A] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500" />
              <input type="text" placeholder="Pozisyon" value={newRole} onChange={(e) => setNewRole(e.target.value)} className="w-full bg-slate-50 dark:bg-[#05070A] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500" />
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-500 text-xs font-semibold px-4 py-2">İptal</button>
                <button type="submit" className="bg-slate-900 dark:bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-md">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {wrongEntryModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#0C0E17] border border-rose-200 dark:border-rose-500/30 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Hatalı Kayıt Silme Talebi</h3>
            <form onSubmit={handleWrongEntrySubmit} className="space-y-4">
              <textarea rows="3" placeholder="Gerekçe..." value={wrongEntryModal.reason} onChange={(e) => setWrongEntryModal({ ...wrongEntryModal, reason: e.target.value })} className="w-full bg-slate-50 dark:bg-[#05070A] border border-slate-200 dark:border-white/10 rounded-xl p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-rose-500 resize-none" />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setWrongEntryModal({ isOpen: false, memberId: null, reason: '' })} className="text-slate-500 text-xs font-semibold px-4 py-2">İptal</button>
                <button type="submit" className="bg-rose-600 text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-md">Onaya Gönder</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}