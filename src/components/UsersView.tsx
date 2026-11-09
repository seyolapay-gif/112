import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/api';
import { formatDateTime } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import { 
  Users as UsersIcon, 
  UserPlus, 
  KeyRound, 
  ShieldCheck, 
  Edit, 
  Check, 
  X, 
  Lock, 
  AlertCircle,
  RefreshCw,
  BadgeCheck
} from 'lucide-react';

export const UsersView: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Add User Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('agent');
  const [newPassword, setNewPassword] = useState('');
  const [addError, setAddError] = useState<string | null>(null);

  // Reset Password Modal
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [resetTargetName, setResetTargetName] = useState('');
  const [newPassVal, setNewPassVal] = useState('');
  const [resetError, setResetError] = useState<string | null>(null);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    try {
      await api.createUser({
        username: newUsername,
        fullName: newFullName,
        role: newRole,
        password: newPassword,
      });
      setIsAddOpen(false);
      setNewUsername('');
      setNewFullName('');
      setNewPassword('');
      loadUsers();
    } catch (err: any) {
      setAddError(err.message || 'فشل إنشاء المستخدم');
    }
  };

  const handleToggleStatus = async (user: User) => {
    if (user.id === 'usr_admin') {
      alert('لا يمكن تعطيل حساب المدير العام الرئيسي');
      return;
    }
    try {
      await api.updateUser(user.id, { isActive: !user.isActive });
      loadUsers();
    } catch (err: any) {
      alert(err.message || 'فشل تعديل حالة الحساب');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetUserId || !newPassVal) return;
    setResetError(null);
    try {
      await api.resetUserPassword(resetUserId, newPassVal);
      setResetUserId(null);
      setNewPassVal('');
      alert('تمت إعادة تعيين كلمة المرور بنجاح');
    } catch (err: any) {
      setResetError(err.message || 'فشل إعادة التعيين');
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">مدير عام</span>;
      case 'operations':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">مدير عمليات</span>;
      case 'accountant':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">محاسب مالي</span>;
      case 'agent':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">موظف تحويلات</span>;
      case 'viewer':
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-500/10 text-slate-400 border border-slate-500/30">مشاهدة وتقارير</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans selection:bg-emerald-500 selection:text-white" dir="rtl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-3xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            إدارة المستخدمين والموظفين والصلاحيات
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            التحكم في وصول الموظفين وتعيين الأدوار الوظيفية وإعادة تعيين كلمات المرور بأمان
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition duration-200 cursor-pointer text-xs"
        >
          <UserPlus className="w-4 h-4" />
          <span>إنشاء حساب موظف جديد</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="rounded-3xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                <th className="py-3.5 px-4 font-semibold">الموظف / الاسم الكامل</th>
                <th className="py-3.5 px-4 font-semibold">اسم الدخول</th>
                <th className="py-3.5 px-4 font-semibold">الدور والصلاحية</th>
                <th className="py-3.5 px-4 font-semibold">الحالة</th>
                <th className="py-3.5 px-4 font-semibold">تاريخ الإنشاء</th>
                <th className="py-3.5 px-4 font-semibold">آخر دخول</th>
                <th className="py-3.5 px-4 font-semibold text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/30 transition">
                  <td className="py-3 px-4 font-bold text-white flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl overflow-hidden bg-slate-800 border border-slate-700/80 shrink-0 shadow-xs">
                      <img
                        src={u.avatarUrl || '/avatar-adel.jpg'}
                        alt={u.fullName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/avatar-adel.jpg';
                        }}
                      />
                    </div>
                    <span>{u.fullName}</span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-300">{u.username}</td>
                  <td className="py-3 px-4">{getRoleBadge(u.role)}</td>
                  <td className="py-3 px-4">
                    {u.isActive ? (
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        نشط
                      </span>
                    ) : (
                      <span className="text-rose-400 font-semibold flex items-center gap-1">
                        <X className="w-3.5 h-3.5" />
                        موقوف
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-[11px]">
                    {u.createdAt.slice(0, 10)}
                  </td>
                  <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                    {u.lastLogin ? formatDateTime(u.lastLogin) : 'لم يسجل دخول'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => {
                          setResetUserId(u.id);
                          setResetTargetName(u.fullName);
                        }}
                        className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition"
                        title="إعادة تعيين كلمة المرور"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                      </button>

                      {u.id !== 'usr_admin' && (
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`p-1.5 rounded-lg transition text-[11px] font-semibold ${
                            u.isActive ? 'text-slate-400 hover:text-rose-400' : 'text-slate-400 hover:text-emerald-400'
                          }`}
                          title={u.isActive ? 'تعطيل الحساب' : 'تفعيل الحساب'}
                        >
                          {u.isActive ? 'تعطيل' : 'تفعيل'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Permissions Matrix */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          مصفوفة الصلاحيات حسب الأدوار الوظيفية
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 pb-2">
                <th className="py-2.5 font-semibold">الصلاحية / الإجراء</th>
                <th className="py-2.5 text-center font-semibold">مدير عام</th>
                <th className="py-2.5 text-center font-semibold">مدير عمليات</th>
                <th className="py-2.5 text-center font-semibold">محاسب</th>
                <th className="py-2.5 text-center font-semibold">موظف تحويلات</th>
                <th className="py-2.5 text-center font-semibold">مشاهد</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              <tr>
                <td className="py-2.5">تسجيل وتنفيذ تحويل مالي</td>
                <td className="py-2.5 text-center text-emerald-400 font-bold">✓</td>
                <td className="py-2.5 text-center text-emerald-400 font-bold">✓</td>
                <td className="py-2.5 text-center text-emerald-400 font-bold">✓</td>
                <td className="py-2.5 text-center text-emerald-400 font-bold">✓</td>
                <td className="py-2.5 text-center text-slate-600">✗</td>
              </tr>
              <tr>
                <td className="py-2.5">إلغاء واسترداد عملية مالية</td>
                <td className="py-2.5 text-center text-emerald-400 font-bold">✓</td>
                <td className="py-2.5 text-center text-emerald-400 font-bold">✓</td>
                <td className="py-2.5 text-center text-slate-600">✗</td>
                <td className="py-2.5 text-center text-slate-600">✗</td>
                <td className="py-2.5 text-center text-slate-600">✗</td>
              </tr>
              <tr>
                <td className="py-2.5">إضافة وتعديل خطوط الكاش</td>
                <td className="py-2.5 text-center text-emerald-400 font-bold">✓</td>
                <td className="py-2.5 text-center text-emerald-400 font-bold">✓</td>
                <td className="py-2.5 text-center text-slate-600">✗</td>
                <td className="py-2.5 text-center text-slate-600">✗</td>
                <td className="py-2.5 text-center text-slate-600">✗</td>
              </tr>
              <tr>
                <td className="py-2.5">تعديل الحدود اليومية والشهرية</td>
                <td className="py-2.5 text-center text-emerald-400 font-bold">✓</td>
                <td className="py-2.5 text-center text-emerald-400 font-bold">✓</td>
                <td className="py-2.5 text-center text-slate-600">✗</td>
                <td className="py-2.5 text-center text-slate-600">✗</td>
                <td className="py-2.5 text-center text-slate-600">✗</td>
              </tr>
              <tr>
                <td className="py-2.5">إدارة المستخدمين والموظفين</td>
                <td className="py-2.5 text-center text-emerald-400 font-bold">✓</td>
                <td className="py-2.5 text-center text-slate-600">✗</td>
                <td className="py-2.5 text-center text-slate-600">✗</td>
                <td className="py-2.5 text-center text-slate-600">✗</td>
                <td className="py-2.5 text-center text-slate-600">✗</td>
              </tr>
              <tr>
                <td className="py-2.5">النسخ الاحتياطي والإعدادات</td>
                <td className="py-2.5 text-center text-emerald-400 font-bold">✓</td>
                <td className="py-2.5 text-center text-slate-600">✗</td>
                <td className="py-2.5 text-center text-slate-600">✗</td>
                <td className="py-2.5 text-center text-slate-600">✗</td>
                <td className="py-2.5 text-center text-slate-600">✗</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" dir="rtl">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-white text-base">إضافة مستخدم موظف جديد</h3>
              <button onClick={() => setIsAddOpen(false)} className="p-1 text-slate-400 hover:text-white rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              {addError && (
                <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-red-300 text-xs">
                  {addError}
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">اسم الموظف الكامل *</label>
                <input
                  type="text"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  required
                  placeholder="مثال: يوسف أحمد"
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">اسم المستخدم (للدخول) *</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  required
                  placeholder="مثال: youssef"
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">الدور الوظيفي *</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                >
                  <option value="agent">موظف تحويلات / كاشير</option>
                  <option value="accountant">محاسب مالي</option>
                  <option value="operations">مدير عمليات</option>
                  <option value="admin">مدير عام للنظام</option>
                  <option value="viewer">مشاهدة وتقارير فقط</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">كلمة المرور المبدئية *</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs"
                >
                  إنشاء الحساب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" dir="rtl">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-white text-sm">إعادة تعيين كلمة المرور</h3>
              <button onClick={() => setResetUserId(null)} className="p-1 text-slate-400 hover:text-white rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleResetPassword} className="p-6 space-y-4">
              {resetError && (
                <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-red-300 text-xs">
                  {resetError}
                </div>
              )}
              <p className="text-xs text-slate-300">
                تعيين كلمة مرور جديدة للموظف: <strong className="text-white">{resetTargetName}</strong>
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">كلمة المرور الجديدة</label>
                <input
                  type="password"
                  value={newPassVal}
                  onChange={(e) => setNewPassVal(e.target.value)}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResetUserId(null)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs"
                >
                  تأكيد التعيين
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
