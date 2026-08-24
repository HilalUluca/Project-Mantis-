import React, { useState, useEffect } from 'react';

export default function TeamHub({ teamMembers: initialTeamMembers }) {
  const [activeSubTab, setActiveSubTab] = useState('members');
  const [teamMembers, setTeamMembers] = useState(initialTeamMembers || []);
  const [offboardingData, setOffboardingData] = useState(null);
  const [letterResult, setLetterResult] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Aktif üç nokta menüsü ID'si
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Modal State'leri
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newAccessLevel, setNewAccessLevel] = useState('Standard User');
  const [insuranceFile, setInsuranceFile] = useState(null);

  // Yanlış Ekleme Gerekçe ve Yönetici Onay Modalı
  const [wrongEntryModal, setWrongEntryModal] = useState({ isOpen: false, memberId: null, reason: '' });

  // İhtarname / Aksiyon Gönderim Modal State'i (Aksiyon türü ve alıcı yönetimi için)
  const [dispatchModal, setDispatchModal] = useState({ isOpen: false, type: null, recipient: "hukuk-musavirligi@mantis.corp" });

  // Verileri çek
  useEffect(() => {
    fetch('http://localhost:8000/api/v1/team/members')
      .then(res => res.json())
      .then(data => setTeamMembers(data))
      .catch(err => console.error("Takım üyeleri yüklenemedi:", err));

    fetch('http://localhost:8000/api/v1/offboarding/tracker')
      .then(res => res.json())
      .then(data => setOffboardingData(data))
      .catch(err => console.error("Offboarding verisi yüklenemedi:", err));
  }, []);

  const handleGenerateLetter = async () => {
    setIsGenerating(true);
    setLetterResult(null);
    try {
      const response = await fetch('http://localhost:8000/api/v1/offboarding/generate-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee_name: offboardingData?.employee || "Ahmet Yılmaz (Ahmet Usta)" })
      });
      const data = await response.json();
      if (response.ok) {
        setLetterResult(data.letter_content);
      } else {
        alert("İhtarname üretilemedi.");
      }
    } catch (error) {
      alert("Sunucu bağlantı hatası.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInviteSubmit = (e) => {
    e.preventDefault();
    if (!newName || !newRole) {
      alert("Lütfen isim ve rol alanlarını doldurun.");
      return;
    }

    const newMember = {
      id: Date.now(),
      name: newName,
      role: newRole,
      email: newEmail || `${newName.toLowerCase().replace(/\s+/g, '')}@mantis.corp`,
      status: "Active",
      access: newAccessLevel,
      hasInsuranceDoc: !!insuranceFile,
      avatar: newName.substring(0, 2).toUpperCase(),
      color: "from-purple-500 to-indigo-600"
    };

    setTeamMembers([newMember, ...teamMembers]);
    setNewName('');
    setNewRole('');
    setNewEmail('');
    setInsuranceFile(null);
    setIsModalOpen(false);
  };

  // Durum Güncelleme (İstifa / İşten Çıkarma)
  const handleUpdateStatus = (id, newStatus, badgeColor) => {
    setTeamMembers(teamMembers.map(m => {
      if (m.id === id) {
        return { ...m, status: newStatus, color: badgeColor };
      }
      return m;
    }));
    setActiveMenuId(null);
  };

  // Yanlış Ekleme Onay Talebi Gönder
  const handleWrongEntrySubmit = (e) => {
    e.preventDefault();
    if (!wrongEntryModal.reason.trim()) {
      alert("Lütfen bir gerekçe belirtin.");
      return;
    }
    setTeamMembers(teamMembers.map(m => {
      if (m.id === wrongEntryModal.memberId) {
        return { ...m, status: "Silme Onayı Bekliyor", color: "from-rose-500/50 to-slate-700" };
      }
      return m;
    }));
    alert(`[Agent Harness] Yanlış kayıt silme talebi oluşturuldu. Yönetici onay verdiğinde sistemden tamamen kaldırılacaktır.`);
    setWrongEntryModal({ isOpen: false, memberId: null, reason: '' });
  };

  // Dispatch Gerçekleştirme (Modal içinden onaylandığında çalışır)
  const executeDispatch = async (e) => {
    e.preventDefault();
    try {
      const endpoint = 'http://localhost:8000/api/action/dispatch';
      const payload = {
        action_type: dispatchModal.type, // "email" veya "jira"
        title: dispatchModal.type === "email" 
          ? `Hukuki Taslak Onay Talebi: ${offboardingData?.employee}` 
          : `Fesih ve Süreç Takibi: ${offboardingData?.employee}`,
        description: letterResult,
        recipient: dispatchModal.recipient
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (res.ok) {
        if (dispatchModal.type === "email") {
          alert(`📨 İhtarname taslağı başarıyla ${dispatchModal.recipient} adresine e-posta ile gönderildi.`);
        } else {
          alert(`🎯 ${dispatchModal.recipient} için Jira görevi açıldı: ${data.message || 'Başarılı'}`);
        }
        setDispatchModal({ isOpen: false, type: null, recipient: "hukuk-musavirligi@mantis.corp" });
      } else {
        alert("İşlem gerçekleştirilemedi.");
      }
    } catch (err) {
      alert("Sunucu bağlantı hatası.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 flex-1 flex flex-col font-sans relative" onClick={() => setActiveMenuId(null)}>
      {/* Header */}
      <div className="bg-[#121622]/60 p-6 rounded-3xl border border-white/[0.08] backdrop-blur-2xl shadow-2xl flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-white bg-gradient-to-r from-white via-slate-200 to-purple-400 bg-clip-text text-transparent">
            HR & Personnel Hub
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-medium">KVKK uyumlu sigorta dökümü entegrasyonu ve otonom offboarding takip paneli.</p>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); }}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-4 py-2.5 rounded-2xl text-xs font-bold shadow-lg shadow-purple-500/25 transition-all flex items-center gap-2 cursor-pointer"
        >
          <span>+ Personel Ekle</span>
        </button>
      </div>

      {/* Sub-Tabs */}
      <div className="flex gap-3 border-b border-white/5 pb-4">
        <button
          onClick={() => setActiveSubTab('members')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
            activeSubTab === 'members'
              ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30 shadow-lg shadow-purple-500/10'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          Aktif Kadro ({teamMembers.length})
        </button>
        <button
          onClick={() => setActiveSubTab('offboarding')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all relative ${
            activeSubTab === 'offboarding'
              ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30 shadow-lg shadow-purple-500/10'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          Offboarding İzleme
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse" />
        </button>
      </div>

      {/* Content Area */}
      {activeSubTab === 'members' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teamMembers.length > 0 ? (
            teamMembers.map((member) => (
              <div 
                key={member.id} 
                className="bg-[#121622]/80 border border-white/[0.08] hover:border-white/20 rounded-3xl p-6 backdrop-blur-2xl shadow-xl transition-all relative flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${member.color || 'from-purple-500 to-indigo-600'} flex items-center justify-center font-bold text-white shadow-lg`}>
                      {member.avatar || member.name.substring(0, 2).toUpperCase()}
                    </div>

                    <div className="relative">
                      <button
                        onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === member.id ? null : member.id); }}
                        className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-300 transition-all cursor-pointer"
                      >
                        ⋮
                      </button>

                      {activeMenuId === member.id && (
                        <div className="absolute right-0 mt-2 w-52 bg-[#1a1f30] border border-white/10 rounded-2xl shadow-2xl z-20 py-2 animate-in fade-in zoom-in-95 duration-150">
                          <div className="px-3 py-1.5 text-[10px] font-mono text-slate-400 uppercase tracking-wider border-b border-white/5 mb-1">
                            İşlem Seçin
                          </div>
                          <button
                            onClick={() => handleUpdateStatus(member.id, "İstifa Etti", "from-amber-500 to-orange-600")}
                            className="w-full text-left px-4 py-2 text-xs text-amber-300 hover:bg-white/5 transition-colors flex items-center gap-2 cursor-pointer"
                          >
                            <span>⚡</span> İstifa Etti / Ayrıldı
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(member.id, "İşten Çıkarıldı", "from-rose-600 to-red-800")}
                            className="w-full text-left px-4 py-2 text-xs text-rose-400 hover:bg-white/5 transition-colors flex items-center gap-2 cursor-pointer"
                          >
                            <span>⚖️</span> İşten Çıkarıldı (Madde 25)
                          </button>
                          <button
                            onClick={() => { setActiveMenuId(null); setWrongEntryModal({ isOpen: true, memberId: member.id, reason: '' }); }}
                            className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-white/5 transition-colors flex items-center gap-2 cursor-pointer border-t border-white/5 mt-1 pt-2"
                          >
                            <span>⚠️</span> Yanlış Ekleme (Onaya Gönder)
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    <h4 className="text-sm font-bold text-white">{member.name}</h4>
                    <p className="text-xs text-purple-400 font-medium">{member.role}</p>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between text-[11px]">
                  <span className="px-2.5 py-1 rounded-md font-mono bg-white/5 text-slate-300 border border-white/5">
                    {member.status || "Aktif Personel"}
                  </span>
                  {member.hasInsuranceDoc && (
                    <span className="text-emerald-400 font-mono text-[10px] flex items-center gap-1">
                      🛡️ KVKK Sigorta Okey
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-slate-500 text-xs font-mono">Aktif personel bulunamadı.</div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {offboardingData ? (
            <div className="bg-[#121622]/90 border border-rose-500/30 rounded-3xl p-6 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex justify-between items-start">
                <div>
                  <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase">
                    🚨 Kritik Devamsızlık / İhbar Süreci
                  </span>
                  <h3 className="text-lg font-bold text-white mt-3">{offboardingData.employee}</h3>
                  <p className="text-xs text-slate-400">{offboardingData.position} • İşe Giriş: {offboardingData.hire_date}</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-rose-400">{offboardingData.absent_days} Gün</span>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Mazeretsiz Devamsızlık</p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                <div>
                  <p className="text-xs text-slate-400 font-medium">Yasal Dayanak:</p>
                  <p className="text-xs font-bold text-purple-300 mt-0.5">{offboardingData.article}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Demirbaş Takibi:</p>
                  <p className="text-xs font-mono text-slate-300 mt-0.5">{offboardingData.assets.join(", ")}</p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between pt-4 border-t border-white/5">
                <p className="text-xs text-slate-400">Süre aşımı doğrulandı. İş Kanunu Madde 25/II kapsamında ihtarname üretilebilir.</p>
                <button
                  onClick={handleGenerateLetter}
                  disabled={isGenerating}
                  className="bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white px-5 py-2.5 rounded-2xl text-xs font-bold shadow-lg shadow-rose-500/20 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isGenerating ? "İhtarname Üretiliyor..." : "⚖️ İhtarname Taslağı Üret"}
                </button>
              </div>

              {/* Otonom Üretilen İhtarname ve Aksiyon Butonları */}
              {letterResult && (
                <div className="mt-6 p-5 bg-black/40 border border-purple-500/30 rounded-2xl animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider font-mono">Otonom Üretilen İhtarname Taslağı</h4>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                      ✅ Hukuki Denetim Hazır
                    </span>
                  </div>
                  
                  <pre className="text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed bg-black/20 p-4 rounded-xl border border-white/5">{letterResult}</pre>

                  {/* Dispatch Butonları */}
                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
                    <button
                      onClick={() => setDispatchModal({ isOpen: true, type: 'email', recipient: "hukuk-musavirligi@mantis.corp" })}
                      className="bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <span>📧 E-posta ile Gönder</span>
                    </button>

                    <button
                      onClick={() => setDispatchModal({ isOpen: true, type: 'jira', recipient: "HR-Legal-Board" })}
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-purple-500/20 transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <span>🚀 Task Aç</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs font-mono">Offboarding verisi yükleniyor...</div>
          )}
        </div>
      )}

      {/* Alıcı Seçim ve Onay Modalı (E-posta veya Jira Dispatch için) */}
      {dispatchModal.isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#121622] border border-purple-500/30 rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-white mb-1">
              {dispatchModal.type === 'email' ? '📨 Hukuki Taslak Gönderimi' : '🎯 Jira Görevi Oluştur'}
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Bu taslağı göndermek istediğiniz ilgili kişiyi (Team Members) veya departmanı seçin.
            </p>
            
            <form onSubmit={executeDispatch} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Alıcı (Team Members veya Hukuk Birimi)</label>
                <select
                  value={dispatchModal.recipient}
                  onChange={(e) => setDispatchModal({ ...dispatchModal, recipient: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-purple-500 transition-colors cursor-pointer"
                >
                  <option value="hukuk-musavirligi@mantis.corp">⚖️ Şirket Dış Müşavir / Hukuk Müşavirliği (Varsayılan)</option>
                  <option value="hr-leader@mantis.corp">👥 İK Liderliği / Yönetim</option>
                  {teamMembers.map(m => (
                    <option key={m.id} value={m.email}>{m.name} — {m.role} ({m.email})</option>
                  ))}
                </select>
              </div>

              <div className="bg-purple-600/10 border border-purple-500/20 p-3 rounded-xl">
                <p className="text-[11px] text-purple-300">
                  ℹ️ Not: Seçilen alıcıya sistem üzerinden resmi inceleme bildirimi iletilecektir.
                </p>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setDispatchModal({ isOpen: false, type: null, recipient: "hukuk-musavirligi@mantis.corp" })}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-purple-500/20 transition-all cursor-pointer"
                >
                  {dispatchModal.type === 'email' ? 'Onaya Gönder (E-posta)' : 'Jira Görevi Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Personel Ekleme Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#121622] border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-white mb-1">Yeni Personel Kaydı</h3>
            <p className="text-xs text-slate-400 mb-6">KVKK uyumlu güvenli personel ekleme ve sigorta dökümü tanımlama.</p>
            
            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Ad Soyad / Unvan</label>
                <input
                  type="text"
                  placeholder="Örn: Ahmet Usta"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Pozisyon</label>
                <input
                  type="text"
                  placeholder="Örn: Kıdemli Atölye Ustası"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Kurumsal E-posta</label>
                <input
                  type="email"
                  placeholder="personel@mantis.corp"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <div className="bg-white/[0.02] border border-white/10 p-3.5 rounded-2xl">
                <label className="block text-xs font-bold text-purple-300 mb-1">🛡️ KVKK Onaylı Sigorta / İşe Giriş Bildirgesi</label>
                <p className="text-[10px] text-slate-400 mb-2">Yasal uyumluluk gereği şifrelenmiş SGK dökümünü ekleyin.</p>
                <input
                  type="file"
                  onChange={(e) => setInsuranceFile(e.target.files[0])}
                  className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-purple-600/20 file:text-purple-300 hover:file:bg-purple-600/30 cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-lg shadow-purple-500/20 transition-all cursor-pointer"
                >
                  Kaydet & Şifrele
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Yanlış Ekleme Gerekçe ve Yönetici Onay Modalı */}
      {wrongEntryModal.isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#121622] border border-rose-500/30 rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-white mb-1">⚠️ Yanlış Kayıt Silme Talebi</h3>
            <p className="text-xs text-slate-400 mb-6">Bu kaydın silinebilmesi için gerekçe belirtin. Talep yönetici onayına sunulacak, onaylandığında sistemden tamamen kaldırılacaktır.</p>
            
            <form onSubmit={handleWrongEntrySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">İptal Gerekçesi / Açıklama</label>
                <textarea
                  rows="3"
                  placeholder="Örn: Mükerrer kayıt oluşturuldu, düzeltilmesi talep ediliyor."
                  value={wrongEntryModal.reason}
                  onChange={(e) => setWrongEntryModal({ ...wrongEntryModal, reason: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-rose-500 transition-colors resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setWrongEntryModal({ isOpen: false, memberId: null, reason: '' })}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="bg-rose-600 hover:bg-rose-500 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-lg shadow-rose-500/20 transition-all cursor-pointer"
                >
                  Yönetici Onayına Gönder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}