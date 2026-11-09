import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShiftHandover, 
  Vault, 
  User, 
  CashLine, 
  LineVerificationCheck, 
  SystemSettings 
} from '../types';
import { api } from '../services/api';
import { 
  formatAmount, 
  formatCount, 
  formatDateTime, 
  formatTime 
} from '../utils/formatters';

interface ShiftHandoverViewProps {
  currentUser: User;
  settings: SystemSettings;
}

export const ShiftHandoverView: React.FC<ShiftHandoverViewProps> = ({
  currentUser,
  settings,
}) => {
  const [handovers, setHandovers] = useState<ShiftHandover[]>([]);
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [cashLines, setCashLines] = useState<CashLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [vaultFilter, setVaultFilter] = useState('all');

  // Modals
  const [isNewHandoverOpen, setIsNewHandoverOpen] = useState(false);
  const [selectedHandoverForReview, setSelectedHandoverForReview] = useState<ShiftHandover | null>(null);

  const isAdmin = currentUser.role === 'admin';
  const canApprove = currentUser.role === 'admin' || currentUser.role === 'operations';

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [hList, vRes, lList] = await Promise.all([
        api.getHandovers(),
        api.getVaults(),
        api.getLines(),
      ]);
      setHandovers(hList || []);
      setVaults(vRes.vaults || []);
      setCashLines(lList || []);

      try {
        const uList = await api.getUsers();
        setUsers(uList || []);
      } catch {
        // Optional
      }
    } catch (err: any) {
      setError(err?.message || 'تعذر تحميل بيانات التسليم والتسلم');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleGlobalRefresh = () => loadData();
    window.addEventListener('app:global-refresh', handleGlobalRefresh);
    return () => window.removeEventListener('app:global-refresh', handleGlobalRefresh);
  }, []);

  const showToast = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  // Filtered handovers
  const filteredHandovers = useMemo(() => {
    return handovers.filter((h) => {
      const matchStatus = statusFilter === 'all' || h.status === statusFilter;
      const matchVault = vaultFilter === 'all' || h.vaultId === vaultFilter;
      return matchStatus && matchVault;
    });
  }, [handovers, statusFilter, vaultFilter]);

  // Statistics
  const pendingForCurrentUser = useMemo(() => {
    return handovers.filter(
      (h) => h.status === 'pending_receiver_approval' && (h.receivingUserId === currentUser.id || isAdmin)
    );
  }, [handovers, currentUser.id, isAdmin]);

  const matchedCount = useMemo(() => {
    return handovers.filter((h) => h.status === 'completed' && h.differenceStatus === 'matched').length;
  }, [handovers]);

  const discrepancyCount = useMemo(() => {
    return handovers.filter((h) => h.differenceStatus !== 'matched').length;
  }, [handovers]);

  return (
    <div className="space-y-6 animate-fadeIn pb-12" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-5 rounded-2xl backdrop-blur-md shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-900/30">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
              التسليم والتسلّم وجرد العهدة النقدية
              {pendingForCurrentUser.length > 0 && (
                <span className="text-xs bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded-full animate-bounce">
                  {pendingForCurrentUser.length} بانتظار استلامك
                </span>
              )}
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-0.5">
              محاضر إغلاق وتسليم النوبات اليومية، فحص خطوط الكاش، ونقل مسؤولية الخزن بين الكاشيرات
            </p>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsNewHandoverOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-900/30 flex items-center gap-1.5 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            بدء تسليم نوبة جديدة
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-600/50 text-emerald-300 text-sm flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-white text-xs font-bold">
            إغلاق
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-600/50 text-rose-300 text-sm flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-rose-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-white text-xs font-bold">
            تخطي
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <span className="text-xs text-slate-400 block mb-1">إجمالي المحاضر المسجلة</span>
          <div className="text-2xl font-black text-white">{handovers.length}</div>
          <span className="text-[10px] text-slate-500 block mt-0.5">محاضر تسليم عهدة ونوبات</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <span className="text-xs text-amber-400 block mb-1">بانتظار استلام الموظف</span>
          <div className="text-2xl font-black text-amber-400">
            {handovers.filter(h => h.status === 'pending_receiver_approval').length}
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">تتطلب مراجعة وقبول المستلم</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <span className="text-xs text-emerald-400 block mb-1">محاضر مطابقة 100%</span>
          <div className="text-2xl font-black text-emerald-400">{matchedCount}</div>
          <span className="text-[10px] text-slate-500 block mt-0.5">بدون أي عجز أو فروق نقدية</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <span className="text-xs text-rose-400 block mb-1">فروق مسجلة (عجز / زيادة)</span>
          <div className="text-2xl font-black text-rose-400">{discrepancyCount}</div>
          <span className="text-[10px] text-slate-500 block mt-0.5">تتطلب اعتماد الإدارة</span>
        </div>
      </div>

      {/* Pending Banner for Current User if any */}
      {pendingForCurrentUser.length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/40 border-2 border-amber-500/50 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
              <svg className="w-5 h-5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-black text-amber-300">
                لديك {pendingForCurrentUser.length} محضر تسليم عهدة بانتظار استلامك وتأكيدك!
              </h4>
              <p className="text-xs text-slate-300">
                الموظف المسلّم بانتظار تأكيدك لجرد النقدية وخطوط الكاش ونقل مسؤولية الخزنة إلى عهدتك.
              </p>
            </div>
          </div>

          <button
            onClick={() => setSelectedHandoverForReview(pendingForCurrentUser[0])}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-lg shadow-amber-900/30 transition-all shrink-0 cursor-pointer text-center"
          >
            معاينة واستلام المحضر الآن
          </button>
        </div>
      )}

      {/* Filter and Table of Handovers */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl overflow-hidden">
        {/* Filter bar */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3 bg-slate-950/40">
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            سجل محاضر التسليم والتسلم
            <span className="text-xs text-slate-400 font-normal">({filteredHandovers.length})</span>
          </h3>

          <div className="flex items-center gap-2.5">
            <select
              value={vaultFilter}
              onChange={(e) => setVaultFilter(e.target.value)}
              className="py-1.5 px-3 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="all">كل الخزن</option>
              {vaults.map((v) => (
                <option key={v.id} value={v.id}>{v.name} ({v.code})</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1.5 px-3 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="all">كل الحالات</option>
              <option value="pending_receiver_approval">بانتظار الاستلام</option>
              <option value="completed">مكتمل ومعتمد</option>
              <option value="rejected">مرفوض</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {filteredHandovers.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              لا توجد محاضر تسليم مسجلة حالياً
            </div>
          ) : (
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3.5 font-bold">رقم المحضر</th>
                  <th className="p-3.5 font-bold">الخزنة / الفرع</th>
                  <th className="p-3.5 font-bold">المسلّم ➔ المستلم</th>
                  <th className="p-3.5 font-bold">وقت النوبة</th>
                  <th className="p-3.5 font-bold text-center">المتوقع / الفعلي</th>
                  <th className="p-3.5 font-bold text-center">حالة الفروق</th>
                  <th className="p-3.5 font-bold text-center">الحالة</th>
                  <th className="p-3.5 font-bold text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredHandovers.map((h) => {
                  const isRecipient = h.receivingUserId === currentUser.id;
                  const isPending = h.status === 'pending_receiver_approval';
                  return (
                    <tr key={h.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5">
                        <span className="font-mono font-bold text-slate-200 block">{h.handoverNumber}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {formatDateTime(h.createdAt)}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <strong className="text-white block">{h.vaultName}</strong>
                        <span className="text-[11px] text-slate-400">{h.branch}</span>
                      </td>

                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <span className="text-slate-400">{h.deliveringUserName}</span>
                          <span className="text-indigo-400 font-bold">➔</span>
                          <span className="text-white font-bold">{h.receivingUserName}</span>
                        </div>
                      </td>

                      <td className="p-3.5 text-slate-400">
                        <span className="block font-mono text-[11px]">
                          {formatTime(h.shiftEndTime)}
                        </span>
                      </td>

                      <td className="p-3.5 text-center">
                        <div className="text-[11px] text-slate-400 font-mono">
                          متوقع: {formatAmount(h.expectedEndingBalance)} {settings.currency}
                        </div>
                        <div className="font-bold text-white font-mono">
                          فعلي: {formatAmount(h.actualEndingBalance)} {settings.currency}
                        </div>
                      </td>

                      <td className="p-3.5 text-center">
                        {h.differenceStatus === 'matched' ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold inline-flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            مطابق 100%
                          </span>
                        ) : h.differenceStatus === 'deficit' ? (
                          <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold font-mono">
                            عجز: {formatAmount(Math.abs(h.differenceAmount))} {settings.currency}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-bold font-mono">
                            زيادة: +{formatAmount(h.differenceAmount)} {settings.currency}
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          h.status === 'completed'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : h.status === 'pending_receiver_approval'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}>
                          {h.status === 'completed'
                            ? 'مكتمل ومعتمد'
                            : h.status === 'pending_receiver_approval'
                            ? 'بانتظار الاستلام'
                            : 'مرفوض'}
                        </span>
                      </td>

                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => setSelectedHandoverForReview(h)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isPending && (isRecipient || isAdmin)
                              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-md'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                          }`}
                        >
                          {isPending && (isRecipient || isAdmin) ? 'معاينة واستلام' : 'عرض المحضر'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* MODAL 1: Create New Shift Handover */}
      {isNewHandoverOpen && (
        <NewShiftHandoverModal
          currentUser={currentUser}
          vaults={vaults.filter(v => v.status === 'active' && v.type === 'sub')}
          users={users.filter(u => u.id !== currentUser.id && u.isActive)}
          cashLines={cashLines.filter(l => l.status === 'active')}
          currency={settings.currency}
          onClose={() => setIsNewHandoverOpen(false)}
          onSuccess={(msg) => {
            setIsNewHandoverOpen(false);
            showToast(msg);
            loadData();
          }}
        />
      )}

      {/* MODAL 2: Review & Approve Handover */}
      {selectedHandoverForReview && (
        <ReviewHandoverModal
          handover={selectedHandoverForReview}
          currentUser={currentUser}
          currency={settings.currency}
          canApprove={canApprove}
          onClose={() => setSelectedHandoverForReview(null)}
          onSuccess={(msg) => {
            setSelectedHandoverForReview(null);
            showToast(msg);
            loadData();
          }}
        />
      )}
    </div>
  );
};

// ==========================================
// SUB-COMPONENT: Create New Shift Handover
// ==========================================
interface NewHandoverModalProps {
  currentUser: User;
  vaults: Vault[];
  users: User[];
  cashLines: CashLine[];
  currency: string;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

const NewShiftHandoverModal: React.FC<NewHandoverModalProps> = ({
  currentUser,
  vaults,
  users,
  cashLines,
  currency,
  onClose,
  onSuccess,
}) => {
  // Try to pre-select vault currently assigned to this user
  const initialVault = vaults.find(v => v.assignedEmployeeId === currentUser.id) || vaults[0];

  const [selectedVaultId, setSelectedVaultId] = useState(initialVault?.id || '');
  const [receivingUserId, setReceivingUserId] = useState(users[0]?.id || '');
  
  // Starting balance
  const [startBalance, setStartBalance] = useState<string>(initialVault ? String(initialVault.balance) : '0');
  
  // Shift financial counts
  const [totalDeposits, setTotalDeposits] = useState('0');
  const [totalWithdrawals, setTotalWithdrawals] = useState('0');
  const [totalTransfersIn, setTotalTransfersIn] = useState('0');
  const [totalTransfersOut, setTotalTransfersOut] = useState('0');
  const [successfulOperationsCount, setSuccessfulOperationsCount] = useState('0');
  
  // Actual counted balance
  const [actualEndingBalance, setActualEndingBalance] = useState('');
  const [notes, setNotes] = useState('');

  // Cash Lines Checklist
  const [lineChecks, setLineChecks] = useState<LineVerificationCheck[]>(() => {
    return cashLines.map(line => ({
      lineId: line.id,
      lineName: line.name,
      provider: line.provider,
      phoneNumber: line.phoneNumber,
      systemBalance: line.balance,
      verified: true, // Default to checked for cashier query confirmation
      notes: '',
    }));
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Accounting formula
  const numStart = Number(startBalance) || 0;
  const numDeposits = Number(totalDeposits) || 0;
  const numTransIn = Number(totalTransfersIn) || 0;
  const numWithdrawals = Number(totalWithdrawals) || 0;
  const numTransOut = Number(totalTransfersOut) || 0;
  const numActual = Number(actualEndingBalance) || 0;

  const expectedEndingBalance = numStart + numDeposits + numTransIn - numWithdrawals - numTransOut;
  const differenceAmount = numActual - expectedEndingBalance;

  let differenceStatus: 'matched' | 'deficit' | 'surplus' = 'matched';
  if (differenceAmount > 0.01) {
    differenceStatus = 'surplus';
  } else if (differenceAmount < -0.01) {
    differenceStatus = 'deficit';
  }

  const toggleLineVerified = (lineId: string) => {
    setLineChecks(prev => prev.map(c => c.lineId === lineId ? { ...c, verified: !c.verified } : c));
  };

  const handleVaultChange = (vaultId: string) => {
    setSelectedVaultId(vaultId);
    const v = vaults.find(item => item.id === vaultId);
    if (v) {
      setStartBalance(String(v.balance));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVaultId) {
      setError('الرجاء اختيار الخزنة المراد تسليمها');
      return;
    }
    if (!receivingUserId) {
      setError('الرجاء اختيار الموظف المستلم');
      return;
    }
    if (actualEndingBalance === '' || isNaN(numActual)) {
      setError('الرجاء إدخال المبلغ الفعلي الموجود في الخزنة بعد الجرد');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const handoverData = {
        vaultId: selectedVaultId,
        receivingUserId,
        shiftStartTime: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
        shiftEndTime: new Date().toISOString(),
        startBalance: numStart,
        totalDeposits: numDeposits,
        totalWithdrawals: numWithdrawals,
        totalTransfersIn: numTransIn,
        totalTransfersOut: numTransOut,
        successfulOperationsCount: Number(successfulOperationsCount) || 0,
        actualEndingBalance: numActual,
        lineVerifications: lineChecks,
        notes: notes.trim(),
      };

      const res = await api.createHandover(handoverData);
      onSuccess(`تم تقديم محضر التسليم رقم (${res.handoverNumber}) بنجاح وبانتظار اعتماد الموظف المستلم`);
    } catch (err: any) {
      setError(err?.message || 'فشل تقديم محضر التسليم');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn" dir="rtl">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-black text-white">بدء تسليم نوبة وجرد عهدة الخزنة</h3>
              <p className="text-xs text-slate-400">تطبيق معادلة الحساب الدقيقة وجرد خطوط الكاش</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer">
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-600/40 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Vault & Recipient */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1 font-bold">الخزنة المسلّمة *</label>
              <select
                value={selectedVaultId}
                onChange={(e) => handleVaultChange(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
              >
                {vaults.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.code}) - {v.branch}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1 font-bold">الموظف المستلم (الكاشير التالي) *</label>
              <select
                value={receivingUserId}
                onChange={(e) => setReceivingUserId(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Shift Financial Metrics Form */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>حسابات النوبة (المعادلة المحاسبية)</span>
              <span className="text-[10px] text-slate-500 font-normal">
                (رصيد البداية + إيداعات + وارد - سحوبات - صادر = الرصيد المتوقع)
              </span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">رصيد بداية النوبة</label>
                <input
                  type="number"
                  step="any"
                  value={startBalance}
                  onChange={(e) => setStartBalance(e.target.value)}
                  className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">إجمالي الإيداعات (+)</label>
                <input
                  type="number"
                  step="any"
                  value={totalDeposits}
                  onChange={(e) => setTotalDeposits(e.target.value)}
                  className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">تحويلات واردة (+)</label>
                <input
                  type="number"
                  step="any"
                  value={totalTransfersIn}
                  onChange={(e) => setTotalTransfersIn(e.target.value)}
                  className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">إجمالي السحوبات (-)</label>
                <input
                  type="number"
                  step="any"
                  value={totalWithdrawals}
                  onChange={(e) => setTotalWithdrawals(e.target.value)}
                  className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">تحويلات صادرة (-)</label>
                <input
                  type="number"
                  step="any"
                  value={totalTransfersOut}
                  onChange={(e) => setTotalTransfersOut(e.target.value)}
                  className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">عدد العمليات الناجحة</label>
                <input
                  type="number"
                  value={successfulOperationsCount}
                  onChange={(e) => setSuccessfulOperationsCount(e.target.value)}
                  className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Actual Balance & Discrepancy Live Box */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div>
                <label className="text-xs text-amber-400 block mb-1.5 font-bold">
                  الرصيد الفعلي في الخزنة / الدرج بعد الجرد ({currency}) *
                </label>
                <input
                  type="number"
                  step="any"
                  value={actualEndingBalance}
                  onChange={(e) => setActualEndingBalance(e.target.value)}
                  placeholder="أدخل المبلغ بعد العد اليدوي..."
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-emerald-400 font-mono text-lg font-black focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              {/* Dynamic Comparison */}
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>الرصيد الدفتري المتوقع:</span>
                  <span className="font-mono font-bold text-white">
                    {formatAmount(expectedEndingBalance)} {currency}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span>المبلغ الفعلي المدخل:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {formatAmount(numActual)} {currency}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">الفرق الناتج:</span>
                  <div>
                    {differenceStatus === 'matched' ? (
                      <span className="text-xs font-black text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                        مطابق 100% (صفر فرق)
                      </span>
                    ) : differenceStatus === 'deficit' ? (
                      <span className="text-xs font-black text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded border border-rose-500/30 font-mono">
                        عجز: {formatAmount(Math.abs(differenceAmount))} {currency}
                      </span>
                    ) : (
                      <span className="text-xs font-black text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded border border-blue-500/30 font-mono">
                        زيادة: +{formatAmount(differenceAmount)} {currency}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cash Lines Checklist (User Requirement: يظهر فيها جميع الخطوط والحسابات الحالية وبجوار كل خط الرصيد المتاح وبجواره علامة صح للتأكيد يدوياً) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                فحص وتأكيد خطوط ومحافظ الكاش التابعة للنوبة
              </label>
              <span className="text-[11px] text-slate-400">
                (تأكيد يدوي من الاستعلام عن الرصيد الفعلي لكل خط)
              </span>
            </div>

            <div className="rounded-xl border border-slate-800 overflow-hidden divide-y divide-slate-800/80 bg-slate-950/60 max-h-48 overflow-y-auto">
              {lineChecks.map((item) => (
                <div key={item.lineId} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-900/40">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      id={`chk_${item.lineId}`}
                      checked={item.verified}
                      onChange={() => toggleLineVerified(item.lineId)}
                      className="w-4 h-4 text-emerald-600 rounded bg-slate-900 border-slate-700 focus:ring-emerald-500 cursor-pointer"
                    />
                    <label htmlFor={`chk_${item.lineId}`} className="cursor-pointer">
                      <strong className="text-white block">{item.lineName}</strong>
                      <span className="text-[11px] font-mono text-slate-400">{item.phoneNumber}</span>
                    </label>
                  </div>

                  <div className="text-left flex items-center gap-3">
                    <div>
                      <span className="text-[10px] text-slate-400 block">الرصيد المتاح</span>
                      <strong className="text-emerald-400 font-mono text-xs">
                        {item.systemBalance.toLocaleString()} {currency}
                      </strong>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      item.verified
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {item.verified ? 'تم الاستعلام اليدوي' : 'لم يتم التأكيد'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs text-slate-400 block mb-1 font-bold">ملاحظات المسلّم على المحضر</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="أي ملاحظات حول عجز، زيادة، أو تسليم شيكات/فواتير معلقة..."
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/40 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {submitting ? 'جاري التقديم...' : 'اعتماد وتقديم المحضر للمستلم'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// SUB-COMPONENT: Review & Accept Handover
// ==========================================
interface ReviewHandoverModalProps {
  handover: ShiftHandover;
  currentUser: User;
  currency: string;
  canApprove: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

const ReviewHandoverModal: React.FC<ReviewHandoverModalProps> = ({
  handover,
  currentUser,
  currency,
  canApprove,
  onClose,
  onSuccess,
}) => {
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAssignedReceiver = handover.receivingUserId === currentUser.id;
  const isPending = handover.status === 'pending_receiver_approval';
  const hasDiscrepancy = handover.differenceStatus !== 'matched';

  // Accept Handover -> Transfers custody
  const handleAccept = async () => {
    try {
      setActionLoading(true);
      setError(null);
      await api.acceptHandover(handover.id);
      onSuccess(`تم تأكيد استلام عهدة الخزنة (${handover.vaultName}) ونقل المسؤولية إليك بنجاح`);
    } catch (err: any) {
      setError(err?.message || 'فشل تأكيد الاستلام');
    } finally {
      setActionLoading(false);
    }
  };

  // Reject Handover
  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setError('الرجاء كتابة سبب رفض الاستلام');
      return;
    }
    try {
      setActionLoading(true);
      setError(null);
      await api.rejectHandover(handover.id, rejectReason.trim());
      onSuccess(`تم رفض محضر الاستلام وإعادته للمسلّم`);
    } catch (err: any) {
      setError(err?.message || 'فشل رفض المحضر');
    } finally {
      setActionLoading(false);
    }
  };

  // Manager Approve Discrepancy
  const handleManagerApprove = async () => {
    try {
      setActionLoading(true);
      setError(null);
      await api.managerApproveHandover(handover.id);
      onSuccess(`تم اعتماد الفروق المالية للمحضر إدارياً`);
    } catch (err: any) {
      setError(err?.message || 'فشل اعتماد المحضر');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn" dir="rtl">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>محضر تسليم عهدة نقدية: {handover.handoverNumber}</span>
              </h3>
              <p className="text-xs text-slate-400">
                الخزنة: {handover.vaultName} ({handover.branch})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer">
            ✕
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-600/40 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Parties Banner */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500 block">الموظف المسلّم</span>
              <strong className="text-white text-sm">{handover.deliveringUserName}</strong>
            </div>

            <div className="text-center px-4">
              <span className="text-indigo-400 text-lg">➔</span>
              <span className="text-[10px] text-slate-500 block">نقل مسؤولية</span>
            </div>

            <div className="text-left">
              <span className="text-slate-500 block">الموظف المستلم</span>
              <strong className="text-emerald-400 text-sm">{handover.receivingUserName}</strong>
            </div>
          </div>

          {/* Numbers Comparison */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-1">رصيد بداية النوبة</span>
              <div className="text-sm font-black text-white font-mono">
                {formatAmount(handover.startBalance)} {currency}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-1">الرصيد الدفتري المتوقع</span>
              <div className="text-sm font-black text-blue-400 font-mono">
                {formatAmount(handover.expectedEndingBalance)} {currency}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 col-span-2 sm:col-span-1">
              <span className="text-[11px] text-slate-400 block mb-1">الرصيد الفعلي بالجرد</span>
              <div className="text-base font-black text-emerald-400 font-mono">
                {formatAmount(handover.actualEndingBalance)} {currency}
              </div>
            </div>
          </div>

          {/* Discrepancy Notice */}
          <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
            handover.differenceStatus === 'matched'
              ? 'bg-emerald-950/30 border-emerald-600/40 text-emerald-300'
              : handover.differenceStatus === 'deficit'
              ? 'bg-rose-950/30 border-rose-600/40 text-rose-300'
              : 'bg-blue-950/30 border-blue-600/40 text-blue-300'
          }`}>
            <div>
              <span className="text-xs font-bold block">
                {handover.differenceStatus === 'matched'
                  ? 'الجرد مطابق تماماً للرصيد الدفتري (صفر فرق)'
                  : handover.differenceStatus === 'deficit'
                  ? `يوجد عجز نقدي بقيمة ${formatAmount(Math.abs(handover.differenceAmount))} ${currency}`
                  : `توجد زيادة نقدية بقيمة +${formatAmount(handover.differenceAmount)} ${currency}`}
              </span>
              {handover.notes && (
                <span className="text-[11px] opacity-80 block mt-0.5">ملاحظة المسلّم: {handover.notes}</span>
              )}
            </div>

            <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-black/30 font-mono">
              {handover.differenceStatus === 'matched' ? 'مطابق' : (handover.differenceAmount > 0 ? '+' : '') + formatAmount(handover.differenceAmount) + ' ' + currency}
            </span>
          </div>

          {/* Cash Lines Verifications */}
          {handover.lineVerifications && handover.lineVerifications.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                فحص خطوط ومحافظ الكاش المعتمدة بالمحضر
              </h4>

              <div className="divide-y divide-slate-800/80 rounded-xl border border-slate-800 overflow-hidden bg-slate-950/60 max-h-40 overflow-y-auto">
                {handover.lineVerifications.map((item) => (
                  <div key={item.lineId} className="p-2.5 flex items-center justify-between text-xs">
                    <div>
                      <strong className="text-white block">{item.lineName}</strong>
                      <span className="text-[10px] font-mono text-slate-400">{item.phoneNumber}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono text-emerald-400 font-bold">
                        {formatAmount(item.systemBalance)} {currency}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                        تم التأكيد اليدوي
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rejection input if triggered */}
          {showRejectInput && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-600/40 space-y-2">
              <label className="text-xs font-bold text-rose-300 block">سبب رفض استلام العهدة *</label>
              <input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="أدخل سبب عدم التطابق أو سبب الرفض..."
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-rose-500"
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setShowRejectInput(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  تراجع
                </button>
                <button
                  onClick={handleReject}
                  disabled={actionLoading}
                  className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
                >
                  {actionLoading ? 'جاري الرفض...' : 'تأكيد رفض المحضر'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer / Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between flex-wrap gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer"
          >
            إغلاق
          </button>

          <div className="flex items-center gap-2">
            {isPending && (isAssignedReceiver || currentUser.role === 'admin') && !showRejectInput && (
              <>
                <button
                  onClick={() => setShowRejectInput(true)}
                  className="px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-bold cursor-pointer"
                >
                  رفض الاستلام
                </button>

                <button
                  onClick={handleAccept}
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-lg shadow-emerald-900/40 cursor-pointer flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {actionLoading ? 'جاري التأكيد...' : 'تأكيد الاستلام ونقل مسؤولية الخزنة إليك'}
                </button>
              </>
            )}

            {hasDiscrepancy && canApprove && handover.status !== 'completed' && (
              <button
                onClick={handleManagerApprove}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                اعتماد إداري للفروق
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
