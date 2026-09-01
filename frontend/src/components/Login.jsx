import React, { useState } from 'react';
import axios from 'axios';

export default function Login({ onLoginSuccess }) {
  const [mode, setMode] = useState('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setInfoMessage('');

    try {
      const response = await axios.post('http://localhost:8000/api/v1/auth/signin', {
        email,
        password,
      });

      if (response.data.status === 'success') {
        const { access_token, onboarding_completed, full_name } = response.data;
        localStorage.setItem('mantis_token', access_token);
        localStorage.setItem('user_name', full_name);
        localStorage.setItem('onboarding_completed', onboarding_completed);

        if (onLoginSuccess) {
          onLoginSuccess();
        } else {
          window.location.reload();
        }
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Kimlik doğrulama başarısız. Lütfen bilgilerinizi kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setInfoMessage('');

    try {
      const response = await axios.post('http://localhost:8000/api/v1/auth/signup', {
        email,
        password,
        full_name: fullName,
      });

      if (response.data.status === 'success') {
        setInfoMessage('Kayıt başarıyla oluşturuldu. Giriş ekranına geçiliyor...');
        setMode('login');
        setPassword('');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Kayıt sırasında hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider) => {
    setInfoMessage(`🔒 ${provider} SSO protokolü entegrasyon aşamasındadır. Yakında aktif edilecektir.`);
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    setInfoMessage("🔑 Şifre sıfırlama talimatları için sistem yöneticisine (Lead Architect) başvurun.");
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-[#e2e8f0] flex items-center justify-center font-sans selection:bg-purple-500 selection:text-white relative overflow-hidden">
      {/* Arka plan hafif yeşilden mora geçişli neon parıltı efekti */}
      <div className="absolute w-[600px] h-[600px] bg-gradient-to-tr from-emerald-950/20 via-teal-950/10 to-purple-950/20 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="relative w-full max-w-[440px] p-8 mx-4 bg-gradient-to-b from-[#121826]/90 to-[#0b0f19]/95 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.7)] rounded-[24px] text-center backdrop-blur-xl">
        
        {/* DÖNEN YÖRÜNGELİ VE YEŞİL-MOR IŞIK YAYAN ÖZEL MANTİS CORE ORB LOGOSU */}
        <div className="relative w-[90px] h-[90px] mx-auto mb-6 flex items-center justify-center">
          
          {/* 1. Dıştaki Mor/Mavi Yörünge Halkası (Saat Yönü) */}
          <div className="absolute inset-0 rounded-full border border-purple-500/30 animate-[spin_12s_linear_infinite]"></div>
          <div className="absolute -top-1 left-1/3 w-2.5 h-2.5 bg-purple-400 rounded-full shadow-[0_0_10px_#a855f7]"></div>

          {/* 2. İçteki Yeşil Yörünge Halkası (Saat Yönünün Tersi - Küçük Işıklı Nokta İle) */}
          <div className="absolute inset-2.5 rounded-full border border-emerald-400/40 animate-[spin_7s_linear_infinite_reverse]"></div>
          <div className="absolute bottom-1 right-1/4 w-2 h-2 bg-emerald-300 rounded-full shadow-[0_0_10px_#34d399]"></div>

          {/* 3. Merkezdeki Yeşilden Mora Işık Yayan Saf Küre */}
          <div className="w-[52px] h-[52px] bg-[radial-gradient(circle_at_30%_30%,_#34d399_0%,_#059669_40%,_#7c3aed_80%,_#3b0764_100%)] rounded-full shadow-[0_0_25px_rgba(124,58,237,0.4)] border border-emerald-300/30"></div>
        </div>

        {/* Başlıklar */}
        <h1 className="text-[28px] font-bold text-white tracking-tight mb-1">Project Mantis</h1>
        <p className="text-[13px] text-[#94a3b8] uppercase tracking-[1.5px] mb-6">Secure Authentication Protocol</p>

        {/* Hata ve Bilgilendirme Mesajları */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
            {error}
          </div>
        )}

        {infoMessage && (
          <div className="mb-4 p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-300 text-xs leading-relaxed">
            {infoMessage}
          </div>
        )}

        {/* Form Alanı */}
        <div className="mb-4 flex rounded-xl border border-white/10 bg-[#121826] p-1">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition ${mode === 'login' ? 'bg-gradient-to-r from-emerald-500 to-purple-600 text-white' : 'text-slate-300'}`}
          >
            Giriş Yap
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition ${mode === 'signup' ? 'bg-gradient-to-r from-emerald-500 to-purple-600 text-white' : 'text-slate-300'}`}
          >
            Kayıt Ol
          </button>
        </div>

        <form onSubmit={mode === 'signup' ? handleSignup : handleLogin} className="space-y-4 text-left">
          {mode === 'signup' && (
            <div>
              <label className="block text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ahmet Yılmaz"
                required
                className="w-full bg-[#121826] text-white border border-[#1e293b] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all placeholder:text-gray-600"
              />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-2">
              Corporate ID / Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@mantis.ai"
              required
              className="w-full bg-[#121826] text-white border border-[#1e293b] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all placeholder:text-gray-600"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wider">
                {mode === 'signup' ? 'Create Access Key' : 'Access Key'}
              </label>
              {mode === 'login' && (
                <button 
                  type="button" 
                  onClick={handleForgotPassword}
                  className="text-[11px] text-purple-400 hover:text-purple-300 transition-colors bg-transparent border-none cursor-pointer p-0"
                >
                  Şifremi Unuttum?
                </button>
              )}
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              className="w-full bg-[#121826] text-white border border-[#1e293b] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all placeholder:text-gray-600"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 via-teal-600 to-purple-600 text-white font-semibold rounded-xl py-3 shadow-[0_4px_20px_rgba(124,58,237,0.3)] hover:shadow-[0_6px_25px_rgba(124,58,237,0.5)] hover:opacity-95 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (mode === 'signup' ? 'Creating account...' : 'Authenticating...') : (mode === 'signup' ? 'Create Account' : 'Initialize Session')}
            </button>
          </div>
        </form>

        <div className="flex items-center my-5 text-[#475569] text-[11px] uppercase tracking-wider">
          <div className="flex-1 border-t border-[#1e293b]"></div>
          <span className="px-3">or SSO</span>
          <div className="flex-1 border-t border-[#1e293b]"></div>
        </div>

        {/* SSO Butonları */}
        <div className="space-y-2.5">
          <button
            onClick={() => handleSocialLogin("Microsoft")}
            className="w-full bg-[#121826] border border-[#1e293b] text-[#cbd5e1] rounded-xl py-2.5 px-4 font-medium text-xs flex items-center justify-center gap-3 hover:bg-[#1a2234] hover:border-white/10 transition-all cursor-pointer"
          >
            <svg width="15" height="15" viewBox="0 0 21 21">
              <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
              <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
              <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
              <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
            </svg>
            Continue with Microsoft
          </button>

          <button
            onClick={() => handleSocialLogin("Google")}
            className="w-full bg-[#121826] border border-[#1e293b] text-[#cbd5e1] rounded-xl py-2.5 px-4 font-medium text-xs flex items-center justify-center gap-3 hover:bg-[#1a2234] hover:border-white/10 transition-all cursor-pointer"
          >
            <svg width="15" height="15" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.13 0-5.78-2.11-6.73-4.96H1.18v3.15C3.15 21.32 7.21 24 12 24z"/>
              <path fill="#FBBC05" d="M5.27 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.6H1.18C.43 8.13 0 9.87 0 12s.43 3.87 1.18 5.4l4.09-3.16z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.21 0 3.15 2.68 1.18 6.6l4.09 3.15c.95-2.85 3.6-4.96 6.73-4.96z"/>
            </svg>
            Continue with Google
          </button>

          <button
            onClick={() => handleSocialLogin("Apple")}
            className="w-full bg-[#121826] border border-[#1e293b] text-[#cbd5e1] rounded-xl py-2.5 px-4 font-medium text-xs flex items-center justify-center gap-3 hover:bg-[#1a2234] hover:border-white/10 transition-all cursor-pointer"
          >
            <svg width="15" height="15" viewBox="0 0 170 170" fill="currentColor">
              <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.91-3.15-7.85-7.92-11.83-14.31-7.5-12.1-13.3-25.07-17.4-38.9-4.1-13.84-6.15-26.74-6.15-38.71 0-14.54 3.73-26.4 11.19-35.59 7.46-9.19 16.9-13.88 28.32-14.05 4.67 0 9.8 1.15 15.4 3.45 5.6 2.3 9.06 3.45 10.38 3.45 1.52 0 5.17-1.22 10.96-3.65 5.79-2.43 11.05-3.56 15.78-3.39 12.39.65 22.05 5.09 28.98 13.32-10.96 6.64-16.34 15.96-16.14 27.97.22 9.08 3.86 16.71 10.92 22.9 7.07 6.19 15.39 9.38 24.96 9.58-2.22 6.84-5.14 13.84-8.75 21zm-28.52-102.5c0 7.39-2.67 14.12-8.01 20.2-5.34 6.08-12.01 9.52-20.01 10.32-.22-1.09-.33-2.18-.33-3.27 0-7.18 2.76-13.9 8.28-20.16 5.52-6.26 12.31-9.84 20.37-10.74.22.54.33 1.19.33 1.65z"/>
            </svg>
            Continue with Apple
          </button>
        </div>

        <div className="mt-6 flex items-center justify-center gap-3 text-[11px] text-slate-400">
          <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer" className="text-purple-400 hover:text-purple-300 underline underline-offset-2">
            Swagger UI
          </a>
          <span>•</span>
          <span>By accessing this system, you comply with Mantis Protocol directives.</span>
        </div>

      </div>
    </div>
  );
}