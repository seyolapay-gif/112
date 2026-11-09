import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  X, 
  User as UserIcon, 
  Upload, 
  Camera, 
  Trash2, 
  Check, 
  Lock, 
  ShieldCheck, 
  Phone, 
  Mail, 
  AtSign, 
  LogOut, 
  AlertCircle,
  Save,
  Sparkles
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Default official account avatar
export const DEFAULT_ACCOUNT_AVATAR = '/avatar-adel.jpg';

// Preset modern professional avatars for quick selection (with official photo as primary)
const PRESET_AVATARS = [
  DEFAULT_ACCOUNT_AVATAR,
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, updateProfile, logout } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [username, setUsername] = useState(user?.username || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatarUrl, setAvatarUrl] = useState<string>(user?.avatarUrl || DEFAULT_ACCOUNT_AVATAR);
  
  // Password change state
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('الرجاء اختيار ملف صورة صالح (PNG, JPG, WebP)');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setErrorMsg('حجم الصورة كبير جداً، الحد الأقصى 3 ميجابايت');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result);
        setErrorMsg(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!fullName.trim()) {
      setErrorMsg('الاسم الكامل مطلوب');
      return;
    }

    if (!username.trim()) {
      setErrorMsg('اسم المستخدم مطلوب');
      return;
    }

    if (showPasswordSection && newPassword) {
      if (newPassword.length < 6) {
        setErrorMsg('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMsg('كلمة المرور الجديدة وتأكيدها غير متطابقين');
        return;
      }
    }

    setIsSaving(true);
    try {
      await updateProfile({
        fullName: fullName.trim(),
        username: username.trim(),
        phone: phone.trim(),
        email: email.trim(),
        avatarUrl,
        ...(showPasswordSection && newPassword ? { currentPassword, newPassword } : {}),
      });

      setSuccessMsg('تم حفظ بيانات الملف الشخصي والصورة بنجاح!');
      setTimeout(() => {
        setSuccessMsg(null);
      }, 3500);
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء حفظ البيانات، يرجى المحاولة ثانية');
    } finally {
      setIsSaving(false);
    }
  };

  const roleTitle = 
    user.role === 'admin' ? 'مدير عام للنظام' :
    user.role === 'operations' ? 'مدير العمليات والتحويلات' :
    user.role === 'accountant' ? 'محاسب مالي' : 'كاشير ومسؤول تحويلات';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200" dir="rtl">
      <div 
        className="w-full max-w-xl max-h-[92vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <UserIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">الملف الشخصي وإعدادات الحساب</h2>
              <p className="text-xs text-slate-400">تعديل الصورة الشخصية والبيانات وكلمة المرور</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-6 flex-1">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2.5">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Avatar Section */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Avatar Preview */}
              <div className="relative group shrink-0">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-700 p-0.5 shadow-xl border-2 border-emerald-500/30">
                  <img
                    src={avatarUrl || user.avatarUrl || DEFAULT_ACCOUNT_AVATAR}
                    alt={fullName || 'المستخدم'}
                    className="w-full h-full object-cover rounded-[14px]"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = DEFAULT_ACCOUNT_AVATAR;
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1.5 -left-1.5 w-7 h-7 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg transition cursor-pointer"
                  title="رفع صورة جديدة"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Upload Actions & Role */}
              <div className="space-y-1.5 text-center sm:text-right flex-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="text-sm font-bold text-white">{fullName || 'المستخدم'}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {roleTitle}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  الصورة الشخصية المعتمدة للحساب، يمكنك أيضاً رفع صورة جديدة أو الاختيار من الرموز الجاهزة
                </p>

                <div className="flex items-center justify-center sm:justify-start gap-2 pt-1.5">
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
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-emerald-400" />
                    <span>رفع صورة</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAvatarUrl(DEFAULT_ACCOUNT_AVATAR)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition cursor-pointer ${
                      avatarUrl === DEFAULT_ACCOUNT_AVATAR
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                    title="استعادة الصورة الرسمية المعتمدة للحساب"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>الصورة الافتراضية</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Preset Avatars Bar */}
            <div className="pt-2 border-t border-slate-800/80">
              <span className="text-[11px] font-bold text-slate-400 block mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>أو اختر صورة جاهزة سريعة:</span>
              </span>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {PRESET_AVATARS.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAvatarUrl(url)}
                    className={`w-10 h-10 rounded-xl overflow-hidden border-2 shrink-0 transition-transform hover:scale-105 cursor-pointer ${
                      avatarUrl === url ? 'border-emerald-500 ring-2 ring-emerald-500/40 scale-105' : 'border-slate-700 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={url} alt={`Avatar ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* User Information Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                الاسم بالكامل
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="عادل فتحي"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-white focus:outline-none focus:border-emerald-500 transition"
                />
                <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                اسم المستخدم للولوج (Username)
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-white focus:outline-none focus:border-emerald-500 transition font-mono"
                  dir="ltr"
                />
                <AtSign className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                رقم الهاتف المحمول
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01012345678"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-white focus:outline-none focus:border-emerald-500 transition font-mono"
                  dir="ltr"
                />
                <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-white focus:outline-none focus:border-emerald-500 transition font-mono"
                  dir="ltr"
                />
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              </div>
            </div>
          </div>

          {/* Role Info Box */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-400">الصلاحية في النظام:</span>
              <span className="text-white font-extrabold">{roleTitle}</span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              تاريخ الانضمام: {user.createdAt ? user.createdAt.slice(0, 10) : '2026-01-01'}
            </span>
          </div>

          {/* Change Password Section (Collapsible) */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
            <button
              type="button"
              onClick={() => setShowPasswordSection(!showPasswordSection)}
              className="w-full flex items-center justify-between text-xs font-bold text-slate-300 hover:text-white transition cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>تغيير كلمة المرور الخاصة بك</span>
              </span>
              <span className="text-[11px] text-emerald-400">
                {showPasswordSection ? 'إخفاء الحقول' : 'تعديل كلمة المرور'}
              </span>
            </button>

            {showPasswordSection && (
              <div className="pt-3 border-t border-slate-800/80 space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    كلمة المرور الحالية
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                    dir="ltr"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      كلمة المرور الجديدة
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="6 أحرف على الأقل"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      تأكيد كلمة المرور الجديدة
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="تأكيد كلمة المرور"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons: Save */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'جاري حفظ التعديلات...' : 'حفظ تعديلات الملف الشخصي'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-3 px-5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl text-xs transition cursor-pointer border border-slate-700"
            >
              إلغاء
            </button>
          </div>
        </form>

        {/* Footer: Prominent Logout Button as explicitly requested */}
        {/* "ثالثا اريد عند الضغط علي صورة المستخدم يظهر في اسفل الصفحه المنبثقه زر تسجيل الخروج" */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/80 rounded-b-3xl">
          <button
            type="button"
            onClick={async () => {
              onClose();
              await logout();
            }}
            className="w-full py-3 px-4 bg-rose-600/15 hover:bg-rose-600 text-rose-300 hover:text-white font-extrabold rounded-2xl text-xs flex items-center justify-center gap-2.5 border border-rose-500/30 transition shadow-sm cursor-pointer group"
          >
            <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>تسجيل الخروج من النظام</span>
          </button>
        </div>
      </div>
    </div>
  );
};
