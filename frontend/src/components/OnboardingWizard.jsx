import React, { useState } from 'react';
import axios from 'axios';

export default function OnboardingWizard({ onComplete }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    // Soru 1: Kimlik
    entityName: '',
    sector: '',
    companySize: '25 kişi',
    
    // Soru 2: Riskler ve Kırmızı Çizgiler
    selectedRisks: [],
    customRedLine: '',

    // Soru 3: İletişim Tonu (Agent Persona)
    communicationTone: 'Keskin, net, kurumsal ve stratejik',

    // Soru 4: Otonomi Eşiği (Human-in-the-Loop)
    humanInTheLoop: 'İhtarname, resmi sözleşme, dışarıya mail gönderme',
    autonomousTasks: 'Düşük öncelikli task ekleme, gelen kutusu spam eleme',

    // Soru 5: Zeka Filtresi & Öncelikler
    priorityKeywords: 'Onay, sözleşme, yarına kadar, rapor, bütçe',
    
    uploadedFileNames: [],
  });

  const riskOptions = [
    { id: 'liability', label: 'Liability Caps (Sorumluluk Sınırları)' },
    { id: 'termination', label: 'Termination Rights (Fesih Hakları)' },
    { id: 'privacy', label: 'Data Privacy & KVKK' },
    { id: 'ip', label: 'Intellectual Property (Fikri Mülkiyet)' },
    { id: 'indemnification', label: 'Indemnification (Tazminat)' },
    { id: 'force_majeure', label: 'Force Majeure (Mücbir Sebepler)' },
  ];

  const handleRiskToggle = (riskId) => {
    setFormData((prev) => {
      const exists = prev.selectedRisks.includes(riskId);
      return {
        ...prev,
        selectedRisks: exists
          ? prev.selectedRisks.filter((id) => id !== riskId)
          : [...prev.selectedRisks, riskId],
      };
    });
  };

  const handleFileUploadMock = () => {
    setFormData((prev) => ({
      ...prev,
      uploadedFileNames: [...prev.uploadedFileNames, `MSA_Template_2023_${prev.uploadedFileNames.length + 1}.pdf`],
    }));
  };

  const handleFinish = async () => {
    setLoading(true);
    const token = localStorage.getItem('mantis_token');
    
    const payload = {
      identity: {
        name: formData.entityName || 'Project Mantis Corp',
        sector: formData.sector || 'Yazılım ve Otonom Sistemler',
        team_size: formData.companySize,
      },
      communication_tone: formData.communicationTone,
      key_contacts: { Hukuk: "hukuk@sirket.com", İK: "ik@sirket.com" },
      standards: {
        working_hours: "09:00 - 18:00",
        red_lines: `Öncelikli Riskler: ${formData.selectedRisks.join(', ')}. Özel Kırmızı Çizgi: ${formData.customRedLine || 'Yok'}`,
      },
      automation_policy: {
        autonomous: formData.autonomousTasks,
        human_in_the_loop: formData.humanInTheLoop,
        priority_keywords: formData.priorityKeywords,
      },
    };

    try {
      await axios.post('http://localhost:8000/api/v1/onboarding/setup', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.warn("Backend onboarding kayıt uyarısı (lokal geçiş yapılıyor):", err);
    } finally {
      localStorage.setItem('onboarding_completed', 'true');
      setLoading(false);
      
      if (onComplete) {
        onComplete();
      } else {
        window.location.reload();
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-[#e2e8f0] flex flex-col items-center justify-center font-sans selection:bg-purple-500 selection:text-white relative overflow-hidden p-6">
      
      {/* Gradyan Arka Plan Efekti */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-tr from-purple-950/30 via-indigo-950/20 to-cyan-950/20 rounded-full blur-[160px] pointer-events-none"></div>

      {/* Üst Logo ve Adım İlerleme Çubuğu */}
      <div className="w-full max-w-[700px] flex justify-between items-center mb-8 px-4 relative z-10">
        <h2 className="text-white font-bold tracking-wider text-lg flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-cyan-400 animate-pulse"></span>
          Project Mantis Core Setup
        </h2>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                s === step ? 'w-10 bg-gradient-to-r from-purple-500 to-cyan-400 shadow-[0_0_12px_rgba(168,85,247,0.5)]' : s < step ? 'w-6 bg-purple-900/60' : 'w-6 bg-white/10'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Ana Kart */}
      <div className="relative z-10 w-full max-w-[700px] p-10 bg-gradient-to-b from-[#121826]/95 to-[#0b0f19]/98 border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.8)] rounded-[28px] backdrop-blur-2xl">
        
        {/* --- ADIM 1: Company Profile & Kimlik --- */}
        {step === 1 && (
          <div className="space-y-6 text-left animate-fadeIn">
            <div>
              <span className="text-xs font-mono text-purple-400 uppercase tracking-widest">Step 1 of 4: Organization Identity</span>
              <h1 className="text-2xl font-bold text-white mt-1">Company Profile & Scale</h1>
              <p className="text-xs text-[#94a3b8] mt-1 leading-relaxed">
                Let's establish your core corporate identity. Mantis AI will tailor legal intelligence and compliance checks based on your sector.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-2">Entity Name</label>
                <input
                  type="text"
                  placeholder="e.g. Project Mantis Corp"
                  value={formData.entityName}
                  onChange={(e) => setFormData({ ...formData, entityName: e.target.value })}
                  className="w-full bg-[#0b0f19] text-white border border-[#1e293b] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 transition-all placeholder:text-gray-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-2">Primary Sector</label>
                  <select
                    value={formData.sector}
                    onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                    className="w-full bg-[#0b0f19] text-white border border-[#1e293b] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 transition-all cursor-pointer"
                  >
                    <option value="">Select Sector...</option>
                    <option value="Yazılım ve Otonom Sistemler">Yazılım ve Otonom Sistemler</option>
                    <option value="Fintech">Fintech</option>
                    <option value="Üretim ve Mühendislik">Üretim ve Mühendislik</option>
                    <option value="Hukuk ve Danışmanlık">Hukuk ve Danışmanlık</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-2">Company Size</label>
                  <select
                    value={formData.companySize}
                    onChange={(e) => setFormData({ ...formData, companySize: e.target.value })}
                    className="w-full bg-[#0b0f19] text-white border border-[#1e293b] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 transition-all cursor-pointer"
                  >
                    <option value="10 kişi">1-10 kişi</option>
                    <option value="25 kişi">25 kişi (Aktif Ekip)</option>
                    <option value="50+ kişi">50+ kişi</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- ADIM 2: Riskler, Kırmızı Çizgiler ve İletişim Tonu --- */}
        {step === 2 && (
          <div className="space-y-6 text-left animate-fadeIn">
            <div>
              <span className="text-xs font-mono text-purple-400 uppercase tracking-widest">Step 2 of 4: Risk Strategy & Tone</span>
              <h1 className="text-2xl font-bold text-white mt-1">Contract Worries & Agent Persona</h1>
              <p className="text-xs text-[#94a3b8] mt-1 leading-relaxed">
                Select priority risk categories and define how strictly your AI agent should communicate.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              {riskOptions.map((opt) => {
                const isSelected = formData.selectedRisks.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleRiskToggle(opt.id)}
                    className={`p-3 rounded-xl border text-left text-[11px] font-medium transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-purple-600/20 border-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                        : 'bg-[#0b0f19] border-[#1e293b] text-[#94a3b8] hover:border-white/20'
                    }`}
                  >
                    <span>{opt.label}</span>
                    <span className={`w-3.5 h-3.5 rounded-md border flex items-center justify-center text-[9px] ${isSelected ? 'bg-purple-500 border-purple-400 text-white' : 'border-gray-700'}`}>
                      {isSelected ? '✓' : ''}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-2">Agent Communication Tone</label>
                <select
                  value={formData.communicationTone}
                  onChange={(e) => setFormData({ ...formData, communicationTone: e.target.value })}
                  className="w-full bg-[#0b0f19] text-white border border-[#1e293b] rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-purple-500 cursor-pointer"
                >
                  <option value="Keskin, net, kurumsal ve stratejik">Keskin, net, kurumsal ve stratejik</option>
                  <option value="Doğrudan, tavizsiz ve sonuç odaklı">Doğrudan, tavizsiz ve sonuç odaklı</option>
                  <option value="Analitik, rasyonel ve detaycı">Analitik, rasyonel ve detaycı</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-2">Özel Kırmızı Çizgi Kuralı</label>
                <input
                  type="text"
                  placeholder="Örn: Onaysız dış veri paylaşımı yasak"
                  value={formData.customRedLine}
                  onChange={(e) => setFormData({ ...formData, customRedLine: e.target.value })}
                  className="w-full bg-[#0b0f19] text-white border border-[#1e293b] rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-purple-500 placeholder:text-gray-600"
                />
              </div>
            </div>
          </div>
        )}

        {/* --- ADIM 3: AI Calibration & Document Upload (RAG) --- */}
        {step === 3 && (
          <div className="space-y-6 text-left animate-fadeIn">
            <div>
              <span className="text-xs font-mono text-purple-400 uppercase tracking-widest">Step 3 of 4: RAG Vectorization</span>
              <h1 className="text-2xl font-bold text-white mt-1">AI Calibration & Baseline Docs</h1>
              <p className="text-xs text-[#94a3b8] mt-1 leading-relaxed">
                Upload 2-3 past contracts to help Mantis AI learn your corporate preferences and baseline standards.
              </p>
            </div>

            <div 
              onClick={handleFileUploadMock}
              className="border-2 border-dashed border-[#1e293b] hover:border-purple-500/50 bg-[#0b0f19]/60 rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 text-lg">📄</div>
              <div>
                <p className="text-xs font-semibold text-white">Drag & Drop Contracts</p>
                <p className="text-[11px] text-[#64748b] mt-0.5">or click to browse. Supported formats: PDF, DOCX (Max 10MB each)</p>
              </div>
            </div>

            {formData.uploadedFileNames.length > 0 && (
              <div className="space-y-2">
                {formData.uploadedFileNames.map((name, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-[#0b0f19] border border-purple-500/20 px-4 py-2.5 rounded-xl text-xs text-purple-300">
                    <span>📄 {name}</span>
                    <span className="text-emerald-400 font-mono text-[10px]">Ready for RAG Vectorization</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- ADIM 4: Human-in-the-Loop & Data Security --- */}
        {step === 4 && (
          <div className="space-y-6 text-left animate-fadeIn">
            <div>
              <span className="text-xs font-mono text-purple-400 uppercase tracking-widest">Step 4 of 4: Otonomi & Security</span>
              <h1 className="text-2xl font-bold text-white mt-1">Human-in-the-Loop & Data Vault</h1>
              <p className="text-xs text-[#94a3b8] mt-1 leading-relaxed">
                Define operational boundaries and review strict data privacy rules.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-1.5">Zorunlu İnsan Onayı Gerektiren İşlemler</label>
                <input
                  type="text"
                  value={formData.humanInTheLoop}
                  onChange={(e) => setFormData({ ...formData, humanInTheLoop: e.target.value })}
                  className="w-full bg-[#0b0f19] text-white border border-[#1e293b] rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-1.5">Gelen Kutu / Task Tetikleyici Anahtar Kelimeler</label>
                <input
                  type="text"
                  value={formData.priorityKeywords}
                  onChange={(e) => setFormData({ ...formData, priorityKeywords: e.target.value })}
                  className="w-full bg-[#0b0f19] text-white border border-[#1e293b] rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="p-3.5 bg-[#0b0f19] border border-emerald-500/20 rounded-xl text-xs space-y-1">
              <p className="font-semibold text-emerald-400 flex items-center gap-1.5">
                <span>🔒</span> Data Security Guarantee
              </p>
              <p className="text-gray-400 text-[11px] leading-relaxed">
                Sözleşme verileriniz yalnızca sizin hesabınızda kalır — pazar analizlerinde asla kullanılmaz.
              </p>
            </div>
          </div>
        )}

        {/* Butonlar Alanı */}
        <div className="flex justify-between items-center mt-8 pt-5 border-t border-white/5">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-5 py-2.5 bg-[#0b0f19] border border-[#1e293b] text-[#94a3b8] hover:text-white rounded-xl text-xs font-medium transition-all cursor-pointer"
            >
              ← Back
            </button>
          ) : (
            <div></div>
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-semibold rounded-xl text-xs shadow-[0_4px_20px_rgba(168,85,247,0.4)] hover:opacity-95 transition-all cursor-pointer flex items-center gap-2"
            >
              Next →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-teal-400 to-cyan-500 text-[#0b0f19] font-bold rounded-xl text-xs shadow-[0_4px_25px_rgba(45,212,191,0.5)] hover:opacity-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Initializing Core...' : 'Complete Setup →'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}