import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import { CashLine, Transfer } from '../types';
import { 
  User as UserIcon, 
  Settings, 
  HelpCircle, 
  LogOut, 
  Mail, 
  ShieldCheck, 
  ArrowRight, 
  X, 
  Camera, 
  Upload, 
  Trash2, 
  Lock, 
  Key, 
  Save, 
  Check, 
  AlertCircle, 
  Phone, 
  AtSign, 
  Moon, 
  Sun, 
  ChevronDown,
  MessageCircleQuestion,
  Headphones,
  CheckCircle2,
  FileText,
  Clock,
  Sparkles
} from 'lucide-react';

interface UserAccountMenuProps {
  onSelectTab: (tab: string) => void;
  onOpenNewTransfer?: (lineId?: string) => void;
  onOpenReceiveMoney?: (lineId?: string) => void;
}

type DetailViewType = 
  | null 
  | 'profile' 
  | 'settings' 
  | 'help';

// Default official account avatar
export const DEFAULT_ACCOUNT_AVATAR = '/avatar-adel.jpg';

// Preset avatars for rapid selection (with official photo as primary)
const PRESET_AVATARS = [
  DEFAULT_ACCOUNT_AVATAR,
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
];

export const UserAccountMenu: React.FC<UserAccountMenuProps> = ({
  onSelectTab,
  onOpenNewTransfer,
  onOpenReceiveMoney,
}) => {
  const { user, logout, updateProfile } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();

  const [isOpen, setIsOpen] = useState(false);
  const [activeDetail, setActiveDetail] = useState<DetailViewType>(null);
  const menuContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile Form State
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [username, setUsername] = useState(user?.username || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatarUrl, setAvatarUrl] = useState<string>(user?.avatarUrl || DEFAULT_ACCOUNT_AVATAR);

  // Password / Security State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status & Feedback State
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Sync state with logged in user
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setUsername(user.username || '');
      setPhone(user.phone || '');
      setEmail(user.email || '');
      setAvatarUrl(user.avatarUrl || DEFAULT_ACCOUNT_AVATAR);
    }
  }, [user]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuContainerRef.current && !menuContainerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setActiveDetail(null);
        setShowLogoutConfirm(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('الرجاء اختيار ملف صورة صالح (PNG, JPG, WebP)');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setErrorMessage('حجم الصورة كبير جداً، الحد الأقصى 3 ميجابايت');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result);
        setErrorMessage(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!fullName.trim()) {
      setErrorMessage('الاسم الكامل مطلوب');
      return;
    }

    if (!username.trim()) {
      setErrorMessage('اسم المستخدم مطلوب');
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile({
        fullName: fullName.trim(),
        username: username.trim(),
        phone: phone.trim(),
        email: email.trim(),
        avatarUrl,
      });

      setSuccessMessage('تم حفظ بيانات الملف الشخصي بنجاح');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ أثناء حفظ البيانات');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('كلمة المرور الجديدة وتأكيدها غير متطابقين');
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile({
        currentPassword,
        newPassword,
      });

      setSuccessMessage('تم تحديث كلمة المرور بنجاح');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      setErrorMessage(err.message || 'تعذر تحديث كلمة المرور');
    } finally {
      setIsSaving(false);
    }
  };

  const roleTitle = 
    user?.role === 'admin' ? 'مدير' :
    user?.role === 'operations' ? 'مدير عمليات' :
    user?.role === 'accountant' ? 'محاسب' : 'كاشير';

  const userInitial = user?.fullName?.charAt(0) || 'أ';

  return (
    <div className="relative z-50" ref={menuContainerRef} dir="rtl">
      {/* =========================================================================
       * Trigger Button: Profile Avatar at the Extreme Far Left of Header
       * ========================================================================= */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setActiveDetail(null);
          setShowLogoutConfirm(false);
        }}
        className={`flex items-center gap-2.5 p-1.5 pl-3 rounded-[24px] transition cursor-pointer group border active:scale-95 shadow-sm ${
          isOpen 
            ? 'bg-[#dfe6ef] dark:bg-slate-800 border-teal-500 ring-2 ring-teal-500/30' 
            : 'bg-[#e8edf5] hover:bg-[#dfe6ef] dark:bg-slate-800 dark:hover:bg-slate-750 border-[#cbd5e1] dark:border-slate-700/80'
        }`}
        title="الملف الشخصي وقائمة الحساب"
      >
        {/* Avatar Container: Deep Teal Squircle with Ring */}
        <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-[16px] bg-[#00796b] overflow-hidden flex items-center justify-center ring-2 ring-teal-400/40 shrink-0">
          <img
            src={user?.avatarUrl || DEFAULT_ACCOUNT_AVATAR}
            alt={user?.fullName || 'المستخدم'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = DEFAULT_ACCOUNT_AVATAR;
            }}
          />
          {/* Active status indicator */}
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-white dark:border-slate-900 rounded-full" />
        </div>

        {/* User Name & Role */}
        <div className="hidden sm:block text-right">
          <span className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-white block max-w-[120px] truncate leading-tight">
            {user?.fullName || 'عادل فتحي'}
          </span>
          <span className="text-[10px] sm:text-[11px] text-[#00897b] dark:text-teal-300 font-bold block mt-0.5">
            {roleTitle}
          </span>
        </div>

        <ChevronDown 
          className={`w-4 h-4 text-slate-500 dark:text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-teal-600 dark:text-teal-400' : ''
          }`} 
        />
      </button>

      {/* =========================================================================
       * Compact Notification-Sized Popup Menu with Harmonious Cairo Typography
       * Elevated above everything with z-[100] and deep shadow
       * ========================================================================= */}
      {isOpen && (
        <div 
          className={`absolute left-0 top-full mt-2 w-64 sm:w-[264px] ${
            isDark 
              ? 'bg-slate-900 text-slate-100 border-slate-700/80 shadow-2xl shadow-black/80' 
              : 'bg-white text-slate-800 border-slate-200/90 shadow-2xl shadow-slate-900/30'
          } rounded-2xl z-[100] flex flex-col overflow-hidden border backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 transition-colors font-sans`}
          style={{ fontFamily: "'Cairo', -apple-system, sans-serif" }}
        >
          {/* -------------------------------------------------------------
           * SUB-VIEW HEADER (If user drilled into a specific menu)
           * ------------------------------------------------------------- */}
          {activeDetail !== null ? (
            <div className={`px-2.5 py-1.5 border-b flex items-center justify-between ${
              isDark ? 'border-slate-800 bg-slate-950/90' : 'border-slate-100 bg-slate-50'
            }`}>
              <button
                type="button"
                onClick={() => {
                  setActiveDetail(null);
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10.5px] font-bold border transition cursor-pointer group ${
                  isDark 
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' 
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <ArrowRight className="w-3 h-3 text-teal-500 group-hover:-translate-x-0.5 transition-transform" />
                <span>العودة</span>
              </button>

              <span className={`text-[11px] font-extrabold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                {activeDetail === 'profile' && 'الملف الشخصي'}
                {activeDetail === 'settings' && 'إعدادات الحساب'}
                {activeDetail === 'help' && 'المساعدة والدعم'}
              </span>

              <button
                onClick={() => setIsOpen(false)}
                className={`p-1 rounded-md transition cursor-pointer ${
                  isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                }`}
                title="إغلاق"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            /* -------------------------------------------------------------
             * COMPACT USER PROFILE HERO: Notification-sized card
             * ------------------------------------------------------------- */
            <div className={`m-1.5 p-2 rounded-xl border relative overflow-hidden transition-all shadow-xs ${
              isDark
                ? 'bg-gradient-to-l from-slate-800/90 via-slate-850 to-slate-900 border-slate-700/80 text-white'
                : 'bg-slate-50 border-slate-200 text-slate-900'
            }`}>
              <div className="relative z-10 flex items-center gap-2">
                {/* 1. Sleek Compact Avatar */}
                <div className="relative w-8 h-8 rounded-lg bg-teal-600/20 border border-teal-500/30 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                  <img 
                    src={user?.avatarUrl || DEFAULT_ACCOUNT_AVATAR} 
                    alt="" 
                    className="w-full h-full object-cover" 
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = DEFAULT_ACCOUNT_AVATAR;
                    }}
                  />
                  <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 border border-white dark:border-slate-900 rounded-full" />
                </div>

                {/* 2. Text Stack with Harmonious Cairo Font */}
                <div className="min-w-0 flex-1 text-right">
                  <div className="flex items-center justify-between gap-1">
                    <h3 className={`font-extrabold text-[12px] leading-tight truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {user?.fullName || 'عادل فتحي'}
                    </h3>
                    <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${
                      isDark 
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                        : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    }`}>
                      {roleTitle}
                    </span>
                  </div>
                  <div className={`flex items-center gap-1 text-[10px] mt-0.5 truncate ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
                    <Mail className="w-2.5 h-2.5 shrink-0 opacity-80" />
                    <span className="truncate">{user?.email || 'admin@fintech.com'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------
           * MENU BODY: Compact Notification-Sized Action Rows
           * ------------------------------------------------------------- */}
          <div className="p-1 space-y-0.5">
            {/* Success / Error Messages */}
            {successMessage && (
              <div className={`p-1.5 mx-1 my-1 rounded-lg border text-xs flex items-center gap-1.5 ${
                isDark ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}>
                <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                <span className="font-bold text-[10px]">{successMessage}</span>
              </div>
            )}
            {errorMessage && (
              <div className={`p-1.5 mx-1 my-1 rounded-lg border text-xs flex items-center gap-1.5 ${
                isDark ? 'bg-rose-950/80 border-rose-500/40 text-rose-200' : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />
                <span className="font-bold text-[10px]">{errorMessage}</span>
              </div>
            )}

            {/* ---------------------------------------------------------
             * PRIMARY VIEW: Compact Notification Items
             * --------------------------------------------------------- */}
            {activeDetail === null && (
              <div className="space-y-0.5">
                {/* 1. الملف الشخصي */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveDetail('profile');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className={`w-full px-2 py-1.5 rounded-lg transition-colors flex items-center gap-2 text-right cursor-pointer group active:scale-[0.99] ${
                    isDark 
                      ? 'hover:bg-slate-800/80 text-slate-200' 
                      : 'hover:bg-slate-100 text-slate-900'
                  }`}
                >
                  <div className={`w-6.5 h-6.5 rounded-md flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                    isDark ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                  }`}>
                    <UserIcon className="w-3.5 h-3.5 stroke-[2.2]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={`font-extrabold text-[12px] block leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      الملف الشخصي
                    </span>
                    <span className={`text-[10px] mt-0.5 block leading-tight truncate ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
                      عرض وتعديل البيانات والصورة
                    </span>
                  </div>
                </button>

                {/* 2. إعدادات الحساب */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveDetail('settings');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className={`w-full px-2 py-1.5 rounded-lg transition-colors flex items-center gap-2 text-right cursor-pointer group active:scale-[0.99] ${
                    isDark ? 'hover:bg-slate-800/80 text-slate-200' : 'hover:bg-slate-100 text-slate-900'
                  }`}
                >
                  <div className={`w-6.5 h-6.5 rounded-md flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                    isDark ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20' : 'bg-blue-100 text-blue-700 border border-blue-300'
                  }`}>
                    <Settings className="w-3.5 h-3.5 stroke-[2.2]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={`font-extrabold text-[12px] block leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      إعدادات الحساب
                    </span>
                    <span className={`text-[10px] mt-0.5 block leading-tight truncate ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
                      تفضيلات النظام وضبط الأمان
                    </span>
                  </div>
                </button>

                {/* Divider Line */}
                <div className={`border-b mx-1.5 my-0.5 ${isDark ? 'border-slate-800' : 'border-slate-200'}`} />

                {/* 3. مركز المساعدة */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveDetail('help');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className={`w-full px-2 py-1.5 rounded-lg transition-colors flex items-center gap-2 text-right cursor-pointer group active:scale-[0.99] ${
                    isDark ? 'hover:bg-slate-800/80 text-slate-200' : 'hover:bg-slate-100 text-slate-900'
                  }`}
                >
                  <div className={`w-6.5 h-6.5 rounded-md flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                    isDark ? 'bg-purple-500/15 text-purple-400 border border-purple-500/20' : 'bg-purple-100 text-purple-700 border border-purple-300'
                  }`}>
                    <HelpCircle className="w-3.5 h-3.5 stroke-[2.2]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={`font-extrabold text-[12px] block leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      مركز المساعدة
                    </span>
                    <span className={`text-[10px] mt-0.5 block leading-tight truncate ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
                      الأسئلة الشائعة والدعم الفني
                    </span>
                  </div>
                </button>

                {/* Divider Line */}
                <div className={`border-b mx-1.5 my-0.5 ${isDark ? 'border-slate-800' : 'border-slate-200'}`} />

                {/* 4. تسجيل الخروج */}
                {showLogoutConfirm ? (
                  <div className={`p-2 mx-0.5 border rounded-lg text-center space-y-1.5 animate-in fade-in ${
                    isDark ? 'bg-rose-950/70 border-rose-500/40 text-rose-200' : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}>
                    <span className="text-[10.5px] font-bold block">هل أنت متأكد من تسجيل الخروج؟</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={async () => {
                          setIsOpen(false);
                          await logout();
                        }}
                        className="flex-1 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-md text-[10px] font-bold transition cursor-pointer"
                      >
                        تأكيد
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowLogoutConfirm(false)}
                        className={`flex-1 py-1 rounded-md text-[10px] font-bold transition cursor-pointer ${
                          isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                        }`}
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowLogoutConfirm(true)}
                    className={`w-full px-2 py-1.5 rounded-lg transition-colors flex items-center gap-2 text-right cursor-pointer group active:scale-[0.99] ${
                      isDark ? 'hover:bg-rose-950/40' : 'hover:bg-rose-50'
                    }`}
                  >
                    <div className={`w-6.5 h-6.5 rounded-md flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                      isDark ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20' : 'bg-rose-100 text-rose-600 border border-rose-300'
                    }`}>
                      <LogOut className="w-3.5 h-3.5 stroke-[2.2] rotate-180" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-extrabold text-[12px] block leading-tight text-rose-600 dark:text-rose-400">
                        تسجيل الخروج
                      </span>
                      <span className={`text-[10px] mt-0.5 block leading-tight truncate ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
                        إنهاء جلسة العمل الحالية
                      </span>
                    </div>
                  </button>
                )}
              </div>
            )}


            {/* ---------------------------------------------------------
             * DETAIL VIEW 1: تفاصيل الملف الشخصي
             * --------------------------------------------------------- */}
            {activeDetail === 'profile' && (
              <form onSubmit={handleSaveProfile} className="p-2 space-y-2.5 max-h-[360px] overflow-y-auto">
                {/* Avatar Uploader & Presets */}
                <div className={`p-2 rounded-xl border space-y-2 ${
                  isDark ? 'bg-slate-800/80 border-slate-700/80' : 'bg-slate-50 border-slate-200/80'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-tr from-[#00695c] to-[#00897b] p-0.5 shadow-xs shrink-0">
                      <div className={`w-full h-full rounded-[10px] overflow-hidden flex items-center justify-center ${
                        isDark ? 'bg-slate-900' : 'bg-slate-100'
                      }`}>
                        <img 
                          src={avatarUrl || DEFAULT_ACCOUNT_AVATAR} 
                          alt="" 
                          className="w-full h-full object-cover" 
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = DEFAULT_ACCOUNT_AVATAR;
                          }}
                        />
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <span className={`text-[11px] font-bold block ${isDark ? 'text-white' : 'text-slate-800'}`}>الصورة الشخصية</span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileUpload}
                          accept="image/*"
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border shadow-xs cursor-pointer flex items-center gap-1 ${
                            isDark ? 'bg-slate-700 hover:bg-slate-600 text-slate-200 border-slate-600' : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          <Upload className="w-2.5 h-2.5 text-teal-500" />
                          <span>رفع</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setAvatarUrl(DEFAULT_ACCOUNT_AVATAR)}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border shadow-xs cursor-pointer flex items-center gap-1 transition ${
                            avatarUrl === DEFAULT_ACCOUNT_AVATAR 
                              ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30' 
                              : isDark ? 'bg-slate-700 hover:bg-slate-600 text-slate-200 border-slate-600' : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                          title="استعادة الصورة الرسمية الافتراضية"
                        >
                          <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                          <span>الافتراضية</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Preset Avatars Bar */}
                  <div className={`pt-1.5 border-t ${isDark ? 'border-slate-700/80' : 'border-slate-200'}`}>
                    <span className={`text-[9.5px] font-bold block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>رموز سريعة:</span>
                    <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
                      {PRESET_AVATARS.map((url, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setAvatarUrl(url)}
                          className={`w-6 h-6 rounded-lg overflow-hidden border-2 shrink-0 transition cursor-pointer ${
                            avatarUrl === url ? 'border-teal-500 scale-105 shadow-xs' : 'border-transparent opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img src={url} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-2 text-right">
                  <div>
                    <label className={`block text-[10px] font-bold mb-0.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>الاسم الكامل</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-bold focus:outline-none focus:border-teal-500 shadow-xs ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-[10px] font-bold mb-0.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>اسم المستخدم (Username)</label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-mono font-bold focus:outline-none focus:border-teal-500 shadow-xs ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
                      }`}
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className={`block text-[10px] font-bold mb-0.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>البريد الإلكتروني</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@fintech.com"
                      className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-mono focus:outline-none focus:border-teal-500 shadow-xs ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
                      }`}
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className={`block text-[10px] font-bold mb-0.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>رقم الهاتف</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="01012345678"
                      className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-mono focus:outline-none focus:border-teal-500 shadow-xs ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
                      }`}
                      dir="ltr"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-2 px-3 bg-[#00897b] hover:bg-[#00796b] text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <Save className="w-3 h-3" />
                  <span>{isSaving ? 'جاري الحفظ...' : 'حفظ التعديلات'}</span>
                </button>
              </form>
            )}

            {/* ---------------------------------------------------------
             * DETAIL VIEW 2: إعدادات الحساب والأمان
             * --------------------------------------------------------- */}
            {activeDetail === 'settings' && (
              <div className="p-2 space-y-2.5 max-h-[360px] overflow-y-auto text-right">
                {/* Theme Mode Toggle Inside Settings */}
                <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                  isDark ? 'bg-slate-800/80 border-slate-700/80' : 'bg-slate-50 border-slate-200/80'
                }`}>
                  <div>
                    <span className={`text-[11px] font-bold block ${isDark ? 'text-white' : 'text-slate-800'}`}>مظهر النظام</span>
                    <span className={`text-[9.5px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>الوضع الليلي والنهاري</span>
                  </div>
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className={`px-2 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1 shadow-xs cursor-pointer ${
                      isDark ? 'bg-slate-700 text-slate-200 border-slate-600 hover:bg-slate-650' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {isDark ? (
                      <>
                        <Sun className="w-3 h-3 text-amber-400" />
                        <span>فاتح</span>
                      </>
                    ) : (
                      <>
                        <Moon className="w-3 h-3 text-indigo-500" />
                        <span>مظلم</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Password Change Form */}
                <form onSubmit={handleSavePassword} className={`p-2.5 rounded-xl border space-y-2 ${
                  isDark ? 'bg-slate-800/80 border-slate-700/80' : 'bg-slate-50 border-slate-200/80'
                }`}>
                  <span className={`text-[11px] font-bold block flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    <Lock className="w-3 h-3 text-teal-500" />
                    <span>تغيير كلمة المرور</span>
                  </span>

                  <div>
                    <label className={`block text-[9.5px] mb-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>كلمة المرور الحالية</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full px-2 py-1 rounded-lg border text-xs focus:outline-none focus:border-teal-500 shadow-xs ${
                        isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
                      }`}
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className={`block text-[9.5px] mb-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>كلمة المرور الجديدة</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="6 أحرف على الأقل"
                      className={`w-full px-2 py-1 rounded-lg border text-xs focus:outline-none focus:border-teal-500 shadow-xs ${
                        isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
                      }`}
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className={`block text-[9.5px] mb-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>تأكيد كلمة المرور</label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="إعادة إدخال كلمة المرور"
                      className={`w-full px-2 py-1 rounded-lg border text-xs focus:outline-none focus:border-teal-500 shadow-xs ${
                        isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
                      }`}
                      dir="ltr"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1 transition cursor-pointer shadow-xs"
                  >
                    <Key className="w-3 h-3" />
                    <span>{isSaving ? 'جاري التحديث...' : 'تحديث كلمة المرور'}</span>
                  </button>
                </form>

                {/* Direct Link to System Settings */}
                <button
                  type="button"
                  onClick={() => {
                    onSelectTab('settings');
                    setIsOpen(false);
                  }}
                  className={`w-full py-1.5 px-2.5 rounded-lg border text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                    isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  <Settings className="w-3 h-3 text-blue-500" />
                  <span>فتح شاشة إعدادات النظام بالكامل</span>
                </button>
              </div>
            )}

            {/* ---------------------------------------------------------
             * DETAIL VIEW 3: مركز المساعدة والدعم
             * --------------------------------------------------------- */}
            {activeDetail === 'help' && (
              <div className="p-2 space-y-2 max-h-[360px] overflow-y-auto text-right">
                <div className={`p-2.5 rounded-xl border space-y-0.5 ${
                  isDark ? 'bg-purple-950/40 border-purple-500/30' : 'bg-purple-50/70 border-purple-100'
                }`}>
                  <span className={`text-[11px] font-bold block flex items-center gap-1.5 ${
                    isDark ? 'text-purple-300' : 'text-purple-900'
                  }`}>
                    <Headphones className="w-3.5 h-3.5 text-purple-500" />
                    <span>فريق الدعم المالي والتقني</span>
                  </span>
                  <p className={`text-[9.5px] leading-relaxed ${
                    isDark ? 'text-purple-300/80' : 'text-purple-700'
                  }`}>
                    متاحون على مدار الساعة لأي استفسار يخص خطوط الكاش والتحويلات.
                  </p>
                </div>

                <div className="space-y-1 text-xs">
                  <div className={`p-2 rounded-lg border ${
                    isDark ? 'bg-slate-800/70 border-slate-700/70' : 'bg-slate-50 border-slate-200/80'
                  }`}>
                    <span className={`font-bold text-[10.5px] block mb-0.5 ${isDark ? 'text-white' : 'text-slate-800'}`}>إضافة خط كاش جديد؟</span>
                    <p className={`text-[9.5px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>من "خطوط الكاش" انقر على "إضافة خط جديد".</p>
                  </div>

                  <div className={`p-2 rounded-lg border ${
                    isDark ? 'bg-slate-800/70 border-slate-700/70' : 'bg-slate-50 border-slate-200/80'
                  }`}>
                    <span className={`font-bold text-[10.5px] block mb-0.5 ${isDark ? 'text-white' : 'text-slate-800'}`}>تجاوز الحد اليومي؟</span>
                    <p className={`text-[9.5px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>يتم تنبيهك آلياً عند بلوغ 80% من الحد اليومي.</p>
                  </div>

                  <div className={`p-2 rounded-lg border ${
                    isDark ? 'bg-slate-800/70 border-slate-700/70' : 'bg-slate-50 border-slate-200/80'
                  }`}>
                    <span className={`font-bold text-[10.5px] block mb-0.5 ${isDark ? 'text-white' : 'text-slate-800'}`}>طباعة الإيصال؟</span>
                    <p className={`text-[9.5px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>يظهر زر "طباعة الإيصال" بعد كل تحويل ومن سجل العمليات.</p>
                  </div>
                </div>

                <div className={`p-2 rounded-lg border text-[9.5px] space-y-0.5 ${
                  isDark ? 'bg-slate-900/80 border-slate-800 text-slate-300' : 'bg-slate-100/70 border-slate-200 text-slate-600'
                }`}>
                  <div className="flex justify-between">
                    <span>البريد:</span>
                    <span className="font-mono text-teal-600 dark:text-teal-400 font-bold">support@fintech.com</span>
                  </div>
                  <div className="flex justify-between">
                    <span>الهاتف:</span>
                    <span className="font-mono text-teal-600 dark:text-teal-400 font-bold">19000 (داخلي 4)</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* -------------------------------------------------------------
           * FOOTER: Notification-Proportioned Footer Strip
           * ------------------------------------------------------------- */}
          <div className={`py-1.5 px-2.5 border-t flex items-center justify-between ${
            isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            {/* Right Side (RTL): Green Shield + Trust Note */}
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className={`text-[10px] font-bold ${
                isDark ? 'text-slate-300' : 'text-slate-800'
              }`}>
                سيولة — حلول مالية آمنة
              </span>
            </div>

            {/* Left Side (RTL): Version Label */}
            <span className={`text-[9.5px] font-mono shrink-0 font-semibold ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>
              v 1.0.0
            </span>
          </div>

        </div>
      )}
    </div>
  );
};
