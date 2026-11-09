import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { onConnectionStatusChange, api } from '../services/api';
const loginBanner = '/cash_transfers_banner.jpg';
import { 
  ShieldCheck, 
  Lock, 
  User as UserIcon, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  Loader2, 
  AlertCircle, 
  CheckCircle2,
  Sparkles,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { ConnectionStatusBadge } from './ConnectionStatusBadge';
import { ThemeToggleButton } from './ThemeToggleButton';
import { useTheme } from '../context/ThemeContext';

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const { isDark } = useTheme();
  const [username, setUsername] = useState('Adel');
  const [password, setPassword] = useState('ZXb01121');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    const unsubscribe = onConnectionStatusChange((isErr, msg) => {
      setConnectionError(isErr ? (msg || 'تعذّر الاتصال بالخادم، تحقق من الاتصال وحاول مجددًا') : null);
    });
    return unsubscribe;
  }, []);

  const handleRetryConnection = async () => {
    setIsRetrying(true);
    try {
      const isHealthy = await api.checkHealth();
      if (isHealthy) {
        setConnectionError(null);
        setValidationError(null);
      }
    } finally {
      setIsRetrying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setValidationError('يرجى إدخال اسم المستخدم وكلمة المرور');
      return;
    }

    setIsLoading(true);
    setValidationError(null);
    setSuccessMsg(null);

    try {
      await login(username.trim(), password);
      setSuccessMsg('تم التحقق بنجاح! جاري تحويلك إلى لوحة التحكم...');
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('تعذّر الاتصال') || msg.includes('Failed to fetch') || msg.includes('network')) {
        setConnectionError('تعذّر الاتصال بالخادم، تحقق من الاتصال وحاول مجددًا');
      } else {
        setValidationError(msg || 'فشل تسجيل الدخول. يرجى التحقق من البيانات والمحاولة مجدداً');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col justify-between font-sans selection:bg-emerald-500 selection:text-white transition-colors duration-300 ${
      isDark ? 'bg-slate-950' : 'bg-[#f1f5f9]'
    }`} dir="rtl">
      
      {/* Top Navbar with Connection Status & Theme Toggle */}
      <header className={`w-full px-4 sm:px-8 py-3.5 flex items-center justify-between border-b backdrop-blur-md sticky top-0 z-30 transition-colors duration-300 ${
        isDark ? 'border-slate-800/80 bg-slate-900/80' : 'border-slate-200 bg-white/90 shadow-xs'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center p-1 shadow-md shadow-emerald-500/10">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <span className={`text-xs sm:text-sm font-extrabold block ${isDark ? 'text-white' : 'text-slate-900'}`}>نظام إدارة الكاش والمحافظ المصرية</span>
            <span className={`text-[10px] font-medium block ${isDark ? 'text-emerald-400' : 'text-teal-700 font-bold'}`}>نسخة سطح المكتب الآمنة v1.0.0</span>
          </div>
        </div>
        
        {/* Left Side (in RTL): Connection Status & Dark Mode Toggle Button */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <ConnectionStatusBadge />
          <ThemeToggleButton />
        </div>
      </header>

      {/* Sleek Compact Server Connection Error Banner at Top of Page as requested */}
      {connectionError && (
        <div className="w-full bg-rose-950/95 border-b border-rose-500/50 px-4 sm:px-8 py-2.5 text-xs flex items-center justify-between text-rose-200 shadow-lg animate-fade-in z-50">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="font-medium">{connectionError}</span>
          </div>
          <button
            onClick={handleRetryConnection}
            disabled={isRetrying}
            className="px-3.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold flex items-center gap-1.5 transition text-[11px] cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
            <span>إعادة المحاولة</span>
          </button>
        </div>
      )}

      {/* Main Login Card Area */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className={`w-full max-w-5xl rounded-3xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px] transition-all duration-300 ${
          isDark 
            ? 'bg-slate-900 border border-slate-800 shadow-2xl' 
            : 'bg-white border border-slate-200 shadow-xl shadow-slate-200/70'
        }`}>
          
          {/* Right side (Form area in RTL) */}
          <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-between">
            <div>
              {/* Header / Brand */}
              <div className="flex flex-col items-center sm:items-start text-center sm:text-right mb-8">
                <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center p-2 shadow-lg shadow-emerald-500/10 mb-4">
                  <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                </div>
                <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  إدارة التحويلات المالية
                </h1>
                <p className={`text-sm font-medium mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  تحويلات بنكية · محافظ إلكترونية · خطوط كاش
                </p>
              </div>

              <div className="mb-6">
                <h2 className={`text-xl font-bold mb-1 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>تسجيل الدخول</h2>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>أدخل بيانات الاعتماد الخاصة بك للوصول إلى لوحة التحكم المالية</p>
              </div>

              {/* Form Validation Error (Subtle and compact) */}
              {validationError && (
                <div className="mb-5 p-3 rounded-xl bg-red-950/50 border border-red-500/40 flex items-center gap-2.5 text-red-200 text-xs animate-shake">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Success Message */}
              {successMsg && (
                <div className="mb-5 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/50 flex items-center gap-2.5 text-emerald-200 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Username Input */}
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                    اسم المستخدم
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                      <UserIcon className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      disabled={isLoading}
                      placeholder="مثال: Adel"
                      className={`w-full pr-11 pl-4 py-3 rounded-xl transition text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 ${
                        isDark 
                          ? 'bg-slate-950/80 border border-slate-700/80 text-slate-100 placeholder:text-slate-500' 
                          : 'bg-slate-50 border border-slate-300 text-slate-900 placeholder:text-slate-400 font-bold shadow-xs'
                      }`}
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                    كلمة المرور
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      placeholder="••••••••"
                      className={`w-full pr-11 pl-11 py-3 rounded-xl transition text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 ${
                        isDark 
                          ? 'bg-slate-950/80 border border-slate-700/80 text-slate-100 placeholder:text-slate-500' 
                          : 'bg-slate-50 border border-slate-300 text-slate-900 placeholder:text-slate-400 font-bold shadow-xs'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 hover:text-slate-200 transition"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 text-slate-400 hover:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
                    />
                    <span>تذكرني على هذا الجهاز</span>
                  </label>
                  <span className="text-slate-500 text-[11px]">
                    نسخة مشفرة وآمنة
                  </span>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition duration-200 disabled:opacity-50 cursor-pointer mt-4"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>جاري التحقق والمصادقة...</span>
                    </>
                  ) : (
                    <>
                      <span>تسجيل الدخول</span>
                      <ArrowLeft className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>

              {/* Supported Networks Compact Summary for smaller screens / responsive window resize */}
              <div className={`lg:hidden mt-6 pt-5 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <span className={`text-[11px] font-bold block mb-2.5 ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>
                  الشبكات والمحافظ المدعومة:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-semibold">
                  <div className={`provider-pill flex items-center gap-1.5 p-2 rounded-xl border shadow-sm transition-all ${
                    isDark
                      ? 'bg-red-950/60 text-white border-red-500/30'
                      : 'bg-white text-slate-900 border-slate-200/90 hover:border-red-400'
                  }`}>
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
                    <span className="truncate font-bold">فودافون كاش</span>
                  </div>
                  <div className={`provider-pill flex items-center gap-1.5 p-2 rounded-xl border shadow-sm transition-all ${
                    isDark
                      ? 'bg-orange-950/60 text-white border-orange-500/30'
                      : 'bg-white text-slate-900 border-slate-200/90 hover:border-orange-400'
                  }`}>
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0" />
                    <span className="truncate font-bold">أورنج موني</span>
                  </div>
                  <div className={`provider-pill flex items-center gap-1.5 p-2 rounded-xl border shadow-sm transition-all ${
                    isDark
                      ? 'bg-lime-950/60 text-white border-lime-500/30'
                      : 'bg-white text-slate-900 border-slate-200/90 hover:border-lime-500'
                  }`}>
                    <span className="w-2.5 h-2.5 rounded-full bg-lime-500 shrink-0" />
                    <span className="truncate font-bold">اتصالات كاش</span>
                  </div>
                  <div className={`provider-pill flex items-center gap-1.5 p-2 rounded-xl border shadow-sm transition-all ${
                    isDark
                      ? 'bg-emerald-950/60 text-white border-emerald-500/30'
                      : 'bg-white text-slate-900 border-slate-200/90 hover:border-emerald-400'
                  }`}>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                    <span className="truncate font-bold">إنستاباي IPN</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Left side (Visual Banner in RTL) - Fully Dynamic & Theme-Responsive for Dark/Light Mode */}
          <div className={`login-visual-banner hidden lg:block lg:col-span-5 relative overflow-hidden transition-all duration-500 select-none ${
            isDark 
              ? 'bg-slate-950 border-r border-slate-800' 
              : 'bg-gradient-to-br from-[#e8f6f6] via-[#f0fbf7] to-[#f8fafc] border-r border-slate-200'
          }`}>
            
            {/* 1. THEME-RESPONSIVE GRADIENT LAYER */}
            {isDark ? (
              <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/80 transition-opacity duration-500" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-teal-200/35 via-emerald-100/40 to-cyan-100/30 transition-opacity duration-500" />
            )}
            
            {/* 2. THEME-RESPONSIVE VECTOR SVG GRID & GLOW */}
            {isDark ? (
              <svg 
                className="absolute inset-0 w-full h-full opacity-25 pointer-events-none transition-opacity duration-500" 
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="xMidYMid slice"
                viewBox="0 0 400 600"
              >
                <defs>
                  <linearGradient id="gradDark" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.1" />
                  </linearGradient>
                  <pattern id="gridDark" width="30" height="30" patternUnits="userSpaceOnUse">
                    <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#10b981" strokeWidth="0.5" strokeOpacity="0.15" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#gridDark)" />
                <circle cx="200" cy="150" r="120" fill="url(#gradDark)" filter="blur(40px)" />
                <circle cx="320" cy="450" r="140" fill="url(#gradDark)" filter="blur(50px)" />
                <path d="M50 120 Q 200 80 350 200 T 200 450" fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="6 4" strokeOpacity="0.4" />
                <circle cx="50" cy="120" r="5" fill="#10b981" />
                <circle cx="350" cy="200" r="7" fill="#06b6d4" />
                <circle cx="200" cy="450" r="6" fill="#10b981" />
              </svg>
            ) : (
              <svg 
                className="absolute inset-0 w-full h-full opacity-50 pointer-events-none transition-opacity duration-500" 
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="xMidYMid slice"
                viewBox="0 0 400 600"
              >
                <defs>
                  <linearGradient id="gradLight" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0d9488" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#0284c7" stopOpacity="0.2" />
                  </linearGradient>
                  <pattern id="gridLight" width="28" height="28" patternUnits="userSpaceOnUse">
                    <path d="M 28 0 L 0 0 0 28" fill="none" stroke="#0d9488" strokeWidth="0.7" strokeOpacity="0.18" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#gridLight)" />
                <circle cx="200" cy="140" r="130" fill="url(#gradLight)" filter="blur(50px)" />
                <circle cx="300" cy="440" r="140" fill="url(#gradLight)" filter="blur(60px)" />
                <path d="M50 120 Q 200 80 350 200 T 200 450" fill="none" stroke="#0d9488" strokeWidth="2.5" strokeDasharray="6 4" strokeOpacity="0.35" />
                <circle cx="50" cy="120" r="5" fill="#0d9488" />
                <circle cx="350" cy="200" r="7" fill="#0284c7" />
                <circle cx="200" cy="450" r="6" fill="#0d9488" />
              </svg>
            )}

            {/* 3. THEME-RESPONSIVE BANNER IMAGE */}
            <img
              src={loginBanner}
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                if (!target.dataset.triedFallback) {
                  target.dataset.triedFallback = 'true';
                  target.src = './cash_transfers_banner.jpg';
                } else {
                  target.style.display = 'none';
                }
              }}
              alt="Cash Transfer Network"
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${
                isDark 
                  ? 'opacity-60 mix-blend-luminosity' 
                  : 'opacity-25 mix-blend-multiply filter contrast-125 saturate-125'
              }`}
              referrerPolicy="no-referrer"
            />
            
            {/* 4. THEME-RESPONSIVE FADE GRADIENT OVERLAY */}
            {isDark ? (
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/85 to-transparent transition-all duration-500" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/70 to-transparent transition-all duration-500" />
            )}
            
            {/* 5. VISUAL CONTENT */}
            <div className="relative h-full p-8 flex flex-col justify-between z-10">
              {/* Top Badge */}
              <div className="flex items-center gap-2">
                <span className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold flex items-center gap-2 shadow-sm transition-all duration-300 ${
                  isDark
                    ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                    : 'bg-white/95 text-teal-800 border border-teal-200/90 shadow-sm backdrop-blur-sm'
                }`}>
                  <Sparkles className={`w-4 h-4 shrink-0 ${isDark ? 'text-emerald-400' : 'text-teal-600'}`} />
                  <span>منظومة مالية مصرفية مشفرة</span>
                </span>
              </div>

              {/* Provider icons cluster & Slogan */}
              <div className="space-y-6">
                <div className={`login-banner-card p-5 rounded-2xl transition-all duration-300 space-y-3.5 ${
                  isDark 
                    ? 'bg-slate-900/95 backdrop-blur-md border border-slate-700 shadow-2xl' 
                    : 'bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-xl shadow-teal-950/5'
                }`}>
                  <div className="text-xs font-bold tracking-wide flex items-center justify-between">
                    <span className={`card-title ${isDark ? 'text-white font-extrabold' : 'text-slate-900 font-black'}`}>
                      الشبكات والمحافظ المدعومة:
                    </span>
                    <span className={`text-[10px] ${
                      isDark 
                        ? 'text-emerald-400 font-mono font-bold' 
                        : 'text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-bold'
                    }`}>
                      ربط فوري 24/7
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 text-xs font-bold">
                    <div className={`provider-pill flex items-center gap-2.5 p-2.5 rounded-xl border shadow-sm transition-all ${
                      isDark
                        ? 'bg-red-950/90 text-white border-red-500/40 hover:bg-red-900/90'
                        : 'bg-white text-slate-900 border-slate-200/90 hover:border-red-400 hover:bg-red-50/30'
                    }`}>
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500/80 shrink-0" />
                      <span className="truncate font-bold">فودافون كاش</span>
                    </div>
                    <div className={`provider-pill flex items-center gap-2.5 p-2.5 rounded-xl border shadow-sm transition-all ${
                      isDark
                        ? 'bg-orange-950/90 text-white border-orange-500/40 hover:bg-orange-900/90'
                        : 'bg-white text-slate-900 border-slate-200/90 hover:border-orange-400 hover:bg-orange-50/30'
                    }`}>
                      <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm shadow-orange-500/80 shrink-0" />
                      <span className="truncate font-bold">أورنج موني</span>
                    </div>
                    <div className={`provider-pill flex items-center gap-2.5 p-2.5 rounded-xl border shadow-sm transition-all ${
                      isDark
                        ? 'bg-lime-950/90 text-white border-lime-500/40 hover:bg-lime-900/90'
                        : 'bg-white text-slate-900 border-slate-200/90 hover:border-lime-500 hover:bg-lime-50/30'
                    }`}>
                      <span className="w-2.5 h-2.5 rounded-full bg-lime-500 shadow-sm shadow-lime-500/80 shrink-0" />
                      <span className="truncate font-bold">اتصالات كاش</span>
                    </div>
                    <div className={`provider-pill flex items-center gap-2.5 p-2.5 rounded-xl border shadow-sm transition-all ${
                      isDark
                        ? 'bg-emerald-950/90 text-white border-emerald-500/40 hover:bg-emerald-900/90'
                        : 'bg-white text-slate-900 border-slate-200/90 hover:border-emerald-400 hover:bg-emerald-50/30'
                    }`}>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/80 shrink-0" />
                      <span className="truncate font-bold">شبكة إنستاباي IPN</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Slogan - Perfect High-Contrast Legibility in Both Modes */}
                <div className="login-banner-slogan pt-2">
                  <h3 className={`text-xl sm:text-2xl font-black mb-2 leading-relaxed transition-colors duration-300 ${
                    isDark ? 'text-white drop-shadow-md' : 'text-slate-900'
                  }`}>
                    أمان .. سرعة .. ثقة
                  </h3>
                  <p className={`text-xs sm:text-sm leading-relaxed font-semibold transition-colors duration-300 ${
                    isDark ? 'text-slate-200 drop-shadow-sm' : 'text-slate-700'
                  }`}>
                    إدارة ذكية متكاملة لتحويلاتك البنكية، تتبع فوري للسيولة النقدية، وحماية صارمة للحدود اليومية والشهرية.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Footer copyright */}
      <div className={`py-3 text-center text-xs border-t transition-colors duration-300 ${
        isDark ? 'border-slate-900 text-slate-500' : 'border-slate-200 text-slate-600 bg-white'
      }`}>
        نظام إدارة التحويلات المالية الذكي © 2026 · جميع الحقوق محفوظة
      </div>

    </div>
  );
};
