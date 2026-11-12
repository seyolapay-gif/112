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
import { ProviderBadge } from './ProviderBadge';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  AlertCircle, 
  Building2, 
  UserCheck, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Calculator, 
  Wallet, 
  Check, 
  Sparkles, 
  Scale, 
  RefreshCw, 
  X, 
  Coins, 
  Plus, 
  Minus, 
  Equal, 
  ArrowRight, 
  ShieldCheck, 
  CheckSquare, 
  Square,
  FileText,
  TrendingUp,
  TrendingDown,
  Layers,
  Printer
} from 'lucide-react';
import { ShiftReportPrintModal } from './ShiftReportPrintModal';

// Helper to convert any Eastern Arabic numerals to standard Western/English numerals (0-9)
const cleanNumber = (val: string): string => {
  if (!val) return '';
  const eng = val.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
  return eng.replace(/[^0-9.]/g, '');
};

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
  const [selectedHandoverForPrint, setSelectedHandoverForPrint] = useState<ShiftHandover | null>(null);
  const [isPrintDraft, setIsPrintDraft] = useState(false);

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm dark:shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-xs">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>التسليم والتسلّم وجرد العهدة النقدية</span>
              {pendingForCurrentUser.length > 0 && (
                <span className="text-xs bg-amber-500 text-slate-950 font-black px-2.5 py-0.5 rounded-full animate-bounce">
                  {pendingForCurrentUser.length} بانتظار استلامك
                </span>
              )}
            </h1>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              محاضر إغلاق وتسليم النوبات اليومية، فحص خطوط الكاش، ونقل مسؤولية الخزن بين الكاشيرات
            </p>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsNewHandoverOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>بدء تسليم نوبة جديدة</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-600/50 text-emerald-800 dark:text-emerald-300 text-sm flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-700 dark:text-emerald-400 hover:underline text-xs font-bold cursor-pointer">
            إغلاق
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-600/50 text-rose-800 dark:text-rose-300 text-sm flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-700 dark:text-rose-400 hover:underline text-xs font-bold cursor-pointer">
            تخطي
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">إجمالي المحاضر المسجلة</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">{handovers.length}</div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">محاضر تسليم عهدة ونوبات</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-amber-600 dark:text-amber-400 block mb-1">بانتظار استلام الموظف</span>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
            {handovers.filter(h => h.status === 'pending_receiver_approval').length}
          </div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">تتطلب مراجعة وقبول المستلم</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-emerald-600 dark:text-emerald-400 block mb-1">محاضر مطابقة 100%</span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{matchedCount}</div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">بدون أي عجز أو فروق نقدية</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-rose-600 dark:text-rose-400 block mb-1">فروق مسجلة (عجز / زيادة)</span>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">{discrepancyCount}</div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">تتطلب اعتماد الإدارة</span>
        </div>
      </div>

      {/* Pending Banner for Current User if any */}
      {pendingForCurrentUser.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-400 dark:border-amber-500/50 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-400/40">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-black text-amber-900 dark:text-amber-300">
                لديك {pendingForCurrentUser.length} محضر تسليم عهدة بانتظار استلامك وتأكيدك!
              </h4>
              <p className="text-xs text-amber-800 dark:text-slate-300">
                الموظف المسلّم بانتظار تأكيدك لجرد النقدية وخطوط الكاش ونقل مسؤولية الخزنة إلى عهدتك.
              </p>
            </div>
          </div>

          <button
            onClick={() => setSelectedHandoverForReview(pendingForCurrentUser[0])}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-md transition-all shrink-0 cursor-pointer text-center"
          >
            معاينة واستلام المحضر الآن
          </button>
        </div>
      )}

      {/* Filter and Table of Handovers */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md overflow-hidden">
        {/* Filter bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3 bg-slate-50 dark:bg-slate-950/40">
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>سجل محاضر التسليم والتسلم</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">({filteredHandovers.length})</span>
          </h3>

          <div className="flex items-center gap-2.5">
            <select
              value={vaultFilter}
              onChange={(e) => setVaultFilter(e.target.value)}
              className="py-1.5 px-3 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">كل الخزن</option>
              {vaults.map((v) => (
                <option key={v.id} value={v.id}>{v.name} ({v.code})</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1.5 px-3 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
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
            <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-xs">
              لا توجد محاضر تسليم مسجلة حالياً
            </div>
          ) : (
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
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
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredHandovers.map((h) => {
                  const isRecipient = h.receivingUserId === currentUser.id;
                  const isPending = h.status === 'pending_receiver_approval';
                  return (
                    <tr key={h.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5">
                        <span className="font-mono font-bold text-slate-900 dark:text-slate-200 block">{h.handoverNumber}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                          {formatDateTime(h.createdAt)}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <strong className="text-slate-900 dark:text-white block">{h.vaultName}</strong>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">{h.branch}</span>
                      </td>

                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                          <span className="text-slate-500 dark:text-slate-400">{h.deliveringUserName}</span>
                          <span className="text-emerald-600 dark:text-indigo-400 font-bold">➔</span>
                          <span className="text-slate-900 dark:text-white font-bold">{h.receivingUserName}</span>
                        </div>
                      </td>

                      <td className="p-3.5 text-slate-500 dark:text-slate-400">
                        <span className="block font-mono text-[11px]">
                          {formatTime(h.shiftEndTime)}
                        </span>
                      </td>

                      <td className="p-3.5 text-center">
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          متوقع: {formatAmount(h.expectedEndingBalance)} {settings.currency}
                        </div>
                        <div className="font-bold text-slate-900 dark:text-white font-mono">
                          فعلي: {formatAmount(h.actualEndingBalance)} {settings.currency}
                        </div>
                      </td>

                      <td className="p-3.5 text-center">
                        {h.differenceStatus === 'matched' ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 text-[10px] font-bold inline-flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            <span>مطابق 100%</span>
                          </span>
                        ) : h.differenceStatus === 'deficit' ? (
                          <span className="px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 text-[10px] font-bold font-mono">
                            عجز: {formatAmount(Math.abs(h.differenceAmount))} {settings.currency}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 text-[10px] font-bold font-mono">
                            زيادة: +{formatAmount(h.differenceAmount)} {settings.currency}
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          h.status === 'completed'
                            ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                            : h.status === 'pending_receiver_approval'
                            ? 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 animate-pulse'
                            : 'bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30'
                        }`}>
                          {h.status === 'completed'
                            ? 'مكتمل ومعتمد'
                            : h.status === 'pending_receiver_approval'
                            ? 'بانتظار الاستلام'
                            : 'مرفوض'}
                        </span>
                      </td>

                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedHandoverForReview(h)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              isPending && (isRecipient || isAdmin)
                                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-sm'
                                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {isPending && (isRecipient || isAdmin) ? 'معاينة واستلام' : 'عرض المحضر'}
                          </button>

                          <button
                            onClick={() => {
                              setSelectedHandoverForPrint(h);
                              setIsPrintDraft(h.status !== 'completed');
                            }}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                            title="طباعة تقرير التسليم والاستلام (A4)"
                          >
                            <Printer className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 4. Official Printable Shift Report Bottom Action Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">
            <Printer className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>طباعة تقرير التسليم والاستلام</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                مستند رسمي A4
              </span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              طباعة كشف مالي رسمي شامل لجميع خطوط الكاش والمحافظ الإلكترونية، وحسابات InstaPay، والحسابات البنكية، وتفاصيل الخزينة الفرعية وخزنة العملاء ودرج النقدية مع التوقيعات اليدوية والإقرار القانوني.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            if (filteredHandovers.length > 0) {
              setSelectedHandoverForPrint(filteredHandovers[0]);
              setIsPrintDraft(filteredHandovers[0].status !== 'completed');
            } else {
              // Create current snapshot draft
              const draftHandover: ShiftHandover = {
                id: 'temp_draft',
                handoverNumber: `HND-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-DRAFT`,
                shiftNumber: `SHF-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-01`,
                vaultId: vaults[0]?.id || 'vlt_sub_1',
                vaultName: vaults[0]?.name || 'خزنة فرع رئيسي',
                branch: vaults[0]?.branch || 'الفرع الرئيسي',
                deliveringUserId: currentUser.id,
                deliveringUserName: currentUser.fullName,
                receivingUserId: users[0]?.id || '',
                receivingUserName: users[0]?.fullName || 'الموظف المستلم',
                shiftStartTime: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
                shiftEndTime: new Date().toISOString(),
                startBalance: vaults[0]?.balance || 0,
                totalDeposits: 0,
                totalWithdrawals: 0,
                totalTransfersIn: 0,
                totalTransfersOut: 0,
                successfulOperationsCount: 0,
                failedOperationsCount: 0,
                pendingOperationsCount: 0,
                expectedEndingBalance: vaults[0]?.balance || 0,
                actualEndingBalance: vaults[0]?.balance || 0,
                drawerActualBalance: vaults[0]?.balance || 0,
                drawerExpectedBalance: vaults[0]?.balance || 0,
                subVaultBalance: vaults[0]?.balance || 0,
                customerVaultBalance: (vaults.find(v => v.type === 'customer')?.balance) || 0,
                differenceAmount: 0,
                differenceStatus: 'matched',
                lineVerifications: cashLines.map(l => ({
                  lineId: l.id,
                  lineName: l.name,
                  provider: l.provider,
                  phoneNumber: l.phoneNumber,
                  systemBalance: l.balance,
                  verified: true,
                })),
                status: 'draft',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              setSelectedHandoverForPrint(draftHandover);
              setIsPrintDraft(true);
            }
          }}
          className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <Printer className="w-4 h-4" />
          <span>طباعة التقرير</span>
        </button>
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
          onOpenPrintPreview={(previewObj, isDraft) => {
            setSelectedHandoverForPrint(previewObj);
            setIsPrintDraft(isDraft);
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
          onOpenPrintPreview={(previewObj, isDraft) => {
            setSelectedHandoverForPrint(previewObj);
            setIsPrintDraft(isDraft);
          }}
        />
      )}

      {/* MODAL 3: Official Shift Handover Printable Report (A4) */}
      {selectedHandoverForPrint && (
        <ShiftReportPrintModal
          handover={selectedHandoverForPrint}
          allLines={cashLines}
          allVaults={vaults}
          currentUser={currentUser}
          settings={settings}
          isDraft={isPrintDraft}
          onClose={() => setSelectedHandoverForPrint(null)}
        />
      )}
    </div>
  );
};

// ==========================================
// SUB-COMPONENT: Create New Shift Handover (WORLD-CLASS REDESIGN)
// ==========================================
interface NewHandoverModalProps {
  currentUser: User;
  vaults: Vault[];
  users: User[];
  cashLines: CashLine[];
  currency: string;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onOpenPrintPreview: (handover: ShiftHandover, isDraft: boolean) => void;
}

const NewShiftHandoverModal: React.FC<NewHandoverModalProps> = ({
  currentUser,
  vaults,
  users,
  cashLines,
  currency,
  onClose,
  onSuccess,
  onOpenPrintPreview,
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

  // Cash Denominations Calculator
  const [showDenominations, setShowDenominations] = useState(false);
  const [denominations, setDenominations] = useState<{ [key: string]: number }>({
    '200': 0,
    '100': 0,
    '50': 0,
    '20': 0,
    '10': 0,
    '5': 0,
    'coins': 0,
  });

  const handleDenominationChange = (denomKey: string, countStr: string) => {
    const count = parseInt(cleanNumber(countStr)) || 0;
    const updated = { ...denominations, [denomKey]: count };
    setDenominations(updated);
    const sum = (updated['200'] * 200) + 
                (updated['100'] * 100) + 
                (updated['50'] * 50) + 
                (updated['20'] * 20) + 
                (updated['10'] * 10) + 
                (updated['5'] * 5) + 
                (updated['coins'] || 0);
    setActualEndingBalance(String(sum));
  };

  // Expandable advanced inputs
  const [showAdvancedInputs, setShowAdvancedInputs] = useState(false);
  const [isSyncingStats, setIsSyncingStats] = useState(false);

  // Cash Lines Checklist
  const [lineChecks, setLineChecks] = useState<LineVerificationCheck[]>(() => {
    return cashLines.map(line => ({
      lineId: line.id,
      lineName: line.name,
      provider: line.provider,
      phoneNumber: line.phoneNumber,
      systemBalance: line.balance,
      verified: true, // Default to true
      notes: '',
    }));
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Automatically calculate shift metrics from live completed transfers
  const syncShiftMetrics = async () => {
    try {
      setIsSyncingStats(true);
      const res = await api.getTransfers({ limit: 1000 });
      const txs = res.transfers || [];
      
      // Filter for today's completed transactions
      const today = new Date().toISOString().split('T')[0];
      const todayCompleted = txs.filter(t => {
        const isToday = t.timestamp && t.timestamp.startsWith(today);
        return isToday && (!t.status || t.status === 'completed');
      });

      let inSum = 0;
      let outSum = 0;
      let opCount = todayCompleted.length;

      todayCompleted.forEach(t => {
        const amt = Number(t.amount) || 0;
        if (t.transferType === 'receive_money') {
          inSum += amt;
        } else {
          outSum += amt;
        }
      });

      setTotalTransfersIn(String(inSum));
      setTotalTransfersOut(String(outSum));
      setSuccessfulOperationsCount(String(opCount));
    } catch {
      // Fallback to manual
    } finally {
      setIsSyncingStats(false);
    }
  };

  useEffect(() => {
    syncShiftMetrics();
  }, []);

  // Accounting formula with English numbers
  const numStart = Number(cleanNumber(startBalance)) || 0;
  const numDeposits = Number(cleanNumber(totalDeposits)) || 0;
  const numTransIn = Number(cleanNumber(totalTransfersIn)) || 0;
  const numWithdrawals = Number(cleanNumber(totalWithdrawals)) || 0;
  const numTransOut = Number(cleanNumber(totalTransfersOut)) || 0;
  const numActual = Number(cleanNumber(actualEndingBalance)) || 0;

  const totalInflow = numDeposits + numTransIn;
  const totalOutflow = numWithdrawals + numTransOut;
  const expectedEndingBalance = numStart + totalInflow - totalOutflow;
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

  const toggleAllLines = () => {
    const allChecked = lineChecks.every(l => l.verified);
    setLineChecks(prev => prev.map(c => ({ ...c, verified: !allChecked })));
  };

  const handleVaultChange = (vaultId: string) => {
    setSelectedVaultId(vaultId);
    const v = vaults.find(item => item.id === vaultId);
    if (v) {
      setStartBalance(String(v.balance));
    }
  };

  const selectedVaultObj = vaults.find(v => v.id === selectedVaultId) || initialVault;
  const selectedRecipientObj = users.find(u => u.id === receivingUserId);

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
        successfulOperationsCount: Number(cleanNumber(successfulOperationsCount)) || 0,
        actualEndingBalance: numActual,
        drawerActualBalance: numActual,
        denominations,
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

  const verifiedLinesCount = lineChecks.filter(l => l.verified).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-md animate-fadeIn" dir="rtl">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden transition-all">
        
        {/* Modern Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>بدء تسليم نوبة وجرد عهدة الخزنة</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                  معتمد
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                مطابقة الرصيد الدفتري والفعلي وجرد محافظ الكاش
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer"
            title="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-600/40 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Custody Transfer Parties (الخزنة المسلّمة والكاشير المستلم) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Vault Selection */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>الخزنة المسلّمة *</span>
                </span>
                {selectedVaultObj && (
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                    رصيد: {formatAmount(selectedVaultObj.balance)} {currency}
                  </span>
                )}
              </label>
              <select
                value={selectedVaultId}
                onChange={(e) => handleVaultChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-emerald-500 shadow-2xs"
              >
                {vaults.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.code}) - {v.branch}
                  </option>
                ))}
              </select>
            </div>

            {/* Next Cashier Selection */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>الموظف المستلم (الكاشير التالي) *</span>
                </span>
                {selectedRecipientObj && (
                  <span className="text-[10px] text-slate-500 font-bold">
                    {selectedRecipientObj.role}
                  </span>
                )}
              </label>
              <select
                value={receivingUserId}
                onChange={(e) => setReceivingUserId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-emerald-500 shadow-2xs"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} ({u.username})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 2. Accounting Equation & Ledger Breakdown (معادلة الحساب الدفتري) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-3.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">
                  حسابات النوبة (المعادلة المحاسبية المعتمدة)
                </h4>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={syncShiftMetrics}
                  disabled={isSyncingStats}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 flex items-center gap-1.5 transition-all cursor-pointer"
                  title="إعادة احتساب العمليات المنفذة خلال اليوم"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncingStats ? 'animate-spin' : ''}`} />
                  <span>مزامنة العمليات تلقائياً</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAdvancedInputs(!showAdvancedInputs)}
                  className="px-2 py-1 text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white underline cursor-pointer"
                >
                  {showAdvancedInputs ? 'إخفاء الحقول اليدوية' : 'تعديل يدوي'}
                </button>
              </div>
            </div>

            {/* Visual Formula Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              {/* Box 1: Start */}
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">رصيد البداية</span>
                <span className="text-sm font-black font-mono text-slate-900 dark:text-white">
                  {formatAmount(numStart)}
                </span>
                <span className="text-[10px] text-slate-400 mr-1">ج.م</span>
              </div>

              {/* Box 2: Total Inflow (+) */}
              <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-center">
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 block mb-0.5">
                  إجمالي المقبوضات (+)
                </span>
                <span className="text-sm font-black font-mono text-emerald-700 dark:text-emerald-400">
                  +{formatAmount(totalInflow)}
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-500 mr-1">ج.م</span>
              </div>

              {/* Box 3: Total Outflow (-) */}
              <div className="p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 text-center">
                <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 block mb-0.5">
                  إجمالي المنصرفات (-)
                </span>
                <span className="text-sm font-black font-mono text-rose-700 dark:text-rose-400">
                  -{formatAmount(totalOutflow)}
                </span>
                <span className="text-[10px] text-rose-600 dark:text-rose-500 mr-1">ج.م</span>
              </div>

              {/* Box 4: Expected Balance */}
              <div className="p-3 rounded-xl bg-teal-50/80 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/50 text-center">
                <span className="text-[10px] font-bold text-teal-800 dark:text-teal-300 block mb-0.5">
                  الرصيد الدفتري المتوقع
                </span>
                <span className="text-sm font-black font-mono text-teal-800 dark:text-teal-300">
                  {formatAmount(expectedEndingBalance)}
                </span>
                <span className="text-[10px] text-teal-600 dark:text-teal-400 mr-1">ج.م</span>
              </div>
            </div>

            {/* Advanced / Fine-Grained Inputs (Shown when user clicks "تعديل يدوي") */}
            {showAdvancedInputs && (
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    رصيد بداية النوبة (ج.م)
                  </label>
                  <input
                    type="text"
                    lang="en"
                    dir="ltr"
                    value={startBalance}
                    onChange={(e) => setStartBalance(cleanNumber(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold text-center text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 block mb-1">
                    تحويلات واردة (+)
                  </label>
                  <input
                    type="text"
                    lang="en"
                    dir="ltr"
                    value={totalTransfersIn}
                    onChange={(e) => setTotalTransfersIn(cleanNumber(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold text-center text-emerald-700 dark:text-emerald-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 block mb-1">
                    إيداعات نقدية مباشرة (+)
                  </label>
                  <input
                    type="text"
                    lang="en"
                    dir="ltr"
                    value={totalDeposits}
                    onChange={(e) => setTotalDeposits(cleanNumber(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold text-center text-emerald-700 dark:text-emerald-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-rose-700 dark:text-rose-400 block mb-1">
                    تحويلات صادرة (-)
                  </label>
                  <input
                    type="text"
                    lang="en"
                    dir="ltr"
                    value={totalTransfersOut}
                    onChange={(e) => setTotalTransfersOut(cleanNumber(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold text-center text-rose-700 dark:text-rose-400 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-rose-700 dark:text-rose-400 block mb-1">
                    سحوبات نقدية مباشرة (-)
                  </label>
                  <input
                    type="text"
                    lang="en"
                    dir="ltr"
                    value={totalWithdrawals}
                    onChange={(e) => setTotalWithdrawals(cleanNumber(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold text-center text-rose-700 dark:text-rose-400 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    عدد العمليات الناجحة
                  </label>
                  <input
                    type="text"
                    lang="en"
                    dir="ltr"
                    value={successfulOperationsCount}
                    onChange={(e) => setSuccessfulOperationsCount(cleanNumber(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold text-center text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 3. HERO CENTERPIECE: Actual Cash Count & Live Settlement (جرد الدرج الفعلي ومطابقة العهدة) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-emerald-500/30 dark:border-emerald-500/40 shadow-sm dark:shadow-xl space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              
              {/* Left Column: Input with large visible Western Digits */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-800 dark:text-slate-200 block">
                  <span>الرصيد الفعلي في الخزنة / الدرج بعد الجرد ({currency}) *</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    lang="en"
                    dir="ltr"
                    value={actualEndingBalance}
                    onChange={(e) => setActualEndingBalance(cleanNumber(e.target.value))}
                    placeholder="0"
                    className="w-full pr-12 pl-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-2xl font-black text-center tracking-wider focus:outline-none focus:border-emerald-500 transition-all shadow-inner"
                    required
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 dark:text-slate-500 pointer-events-none">
                    {currency}
                  </span>
                </div>
                
                {/* Quick Fill & Denominations Toggle */}
                <div className="flex items-center justify-between gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setActualEndingBalance(String(expectedEndingBalance))}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                  >
                    مطابقة بالرصيد الدفتري ({formatAmount(expectedEndingBalance)})
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowDenominations(!showDenominations)}
                    className="text-[10px] font-bold px-2.5 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition cursor-pointer flex items-center gap-1"
                  >
                    <span>{showDenominations ? 'إخفاء حاسبة الفئات' : 'حاسبة فئات النقدية (200، 100، ...)'}</span>
                  </button>
                </div>

                {/* Denominations Inputs Drawer */}
                {showDenominations && (
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 mt-2">
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block">
                      أدخل عدد الأوراق النقدية لكل فئة (سيتم احتساب الإجمالي تلقائياً):
                    </span>
                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 block mb-0.5">فئة 200</span>
                        <input
                          type="number"
                          min="0"
                          value={denominations['200'] || ''}
                          onChange={(e) => handleDenominationChange('200', e.target.value)}
                          placeholder="0"
                          className="w-full p-1.5 text-center font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block mb-0.5">فئة 100</span>
                        <input
                          type="number"
                          min="0"
                          value={denominations['100'] || ''}
                          onChange={(e) => handleDenominationChange('100', e.target.value)}
                          placeholder="0"
                          className="w-full p-1.5 text-center font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block mb-0.5">فئة 50</span>
                        <input
                          type="number"
                          min="0"
                          value={denominations['50'] || ''}
                          onChange={(e) => handleDenominationChange('50', e.target.value)}
                          placeholder="0"
                          className="w-full p-1.5 text-center font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block mb-0.5">فئة 20</span>
                        <input
                          type="number"
                          min="0"
                          value={denominations['20'] || ''}
                          onChange={(e) => handleDenominationChange('20', e.target.value)}
                          placeholder="0"
                          className="w-full p-1.5 text-center font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block mb-0.5">فئة 10</span>
                        <input
                          type="number"
                          min="0"
                          value={denominations['10'] || ''}
                          onChange={(e) => handleDenominationChange('10', e.target.value)}
                          placeholder="0"
                          className="w-full p-1.5 text-center font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block mb-0.5">فئة 5</span>
                        <input
                          type="number"
                          min="0"
                          value={denominations['5'] || ''}
                          onChange={(e) => handleDenominationChange('5', e.target.value)}
                          placeholder="0"
                          className="w-full p-1.5 text-center font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div className="col-span-2">
                        <span className="text-[10px] text-slate-500 block mb-0.5">فكة ومعدن (ج.م)</span>
                        <input
                          type="number"
                          min="0"
                          value={denominations['coins'] || ''}
                          onChange={(e) => handleDenominationChange('coins', e.target.value)}
                          placeholder="0"
                          className="w-full p-1.5 text-center font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Dynamic Live Settlement Diagnostic */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                  <span>الرصيد الدفتري المتوقع:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {formatAmount(expectedEndingBalance)} {currency}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                  <span>المبلغ الفعلي المدخل:</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {formatAmount(numActual)} {currency}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">الفرق الناتج:</span>
                  <div>
                    {differenceStatus === 'matched' ? (
                      <span className="text-xs font-black text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-500/20 px-2.5 py-1 rounded-lg border border-emerald-300 dark:border-emerald-500/30 inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>مطابق 100% (صفر فرق)</span>
                      </span>
                    ) : differenceStatus === 'deficit' ? (
                      <span className="text-xs font-black text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-500/20 px-2.5 py-1 rounded-lg border border-rose-300 dark:border-rose-500/40 font-mono inline-flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>عجز: {formatAmount(Math.abs(differenceAmount))} {currency}</span>
                      </span>
                    ) : (
                      <span className="text-xs font-black text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-500/20 px-2.5 py-1 rounded-lg border border-blue-300 dark:border-blue-500/40 font-mono inline-flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>زيادة: +{formatAmount(differenceAmount)} {currency}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* 4. Digital Wallet & Cash Lines Inventory (جرد وتأكيد خطوط ومحافظ الكاش) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>فحص وتأكيد خطوط ومحافظ الكاش التابعة للنوبة</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                  {verifiedLinesCount} / {lineChecks.length}
                </span>
              </label>

              <button
                type="button"
                onClick={toggleAllLines}
                className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                {lineChecks.every(l => l.verified) ? 'إلغاء تحديد الكل' : 'تحديد وتأكيد الكل'}
              </button>
            </div>

            {/* Wallets Roster List */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/80 bg-slate-50/60 dark:bg-slate-950/60 max-h-52 overflow-y-auto">
              {lineChecks.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  لا توجد خطوط كاش نشطة مرتبطة حالياً
                </div>
              ) : (
                lineChecks.map((item) => (
                  <div
                    key={item.lineId}
                    onClick={() => toggleLineVerified(item.lineId)}
                    className="p-3 flex items-center justify-between text-xs hover:bg-slate-100/60 dark:hover:bg-slate-900/60 transition-colors cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl overflow-hidden shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center p-0.5">
                        <ProviderBadge provider={item.provider} size="sm" showLabel={false} />
                      </div>
                      <div>
                        <strong className="text-slate-900 dark:text-white block text-xs">{item.lineName}</strong>
                        <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400" dir="ltr">{item.phoneNumber}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3.5">
                      <div className="text-left">
                        <span className="text-[10px] text-slate-400 block">الرصيد المتاح</span>
                        <strong className="text-emerald-600 dark:text-emerald-400 font-mono text-xs font-bold">
                          {formatAmount(item.systemBalance)} {currency}
                        </strong>
                      </div>

                      <div className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${
                        item.verified
                          ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700'
                      }`}>
                        {item.verified ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            <span>تم التأكيد</span>
                          </>
                        ) : (
                          <span>غير مؤكد</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 5. Notes */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-400 block mb-1.5 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />
              <span>ملاحظات المسلّم على المحضر</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="أي ملاحظات حول عجز، زيادة، أو تسليم شيكات/فواتير معلقة..."
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* 6. Actions Footer */}
          <div className="flex items-center justify-between flex-wrap gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                const currentSelectedVault = vaults.find(v => v.id === selectedVaultId) || initialVault || vaults[0];
                const previewObj: ShiftHandover = {
                  id: 'temp_draft_preview',
                  handoverNumber: `HND-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-PREVIEW`,
                  shiftNumber: `SHF-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-01`,
                  vaultId: currentSelectedVault ? currentSelectedVault.id : 'vlt_sub_1',
                  vaultName: currentSelectedVault ? currentSelectedVault.name : 'خزنة فرع رئيسي',
                  branch: (currentSelectedVault && currentSelectedVault.branch) || 'الفرع الرئيسي',
                  deliveringUserId: currentUser.id,
                  deliveringUserName: currentUser.fullName,
                  receivingUserId: receivingUserId,
                  receivingUserName: users.find(u => u.id === receivingUserId)?.fullName || 'الموظف المستلم',
                  shiftStartTime: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
                  shiftEndTime: new Date().toISOString(),
                  startBalance: numStart,
                  totalDeposits: numDeposits,
                  totalWithdrawals: numWithdrawals,
                  totalTransfersIn: numTransIn,
                  totalTransfersOut: numTransOut,
                  successfulOperationsCount: Number(cleanNumber(successfulOperationsCount)) || 0,
                  failedOperationsCount: 0,
                  pendingOperationsCount: 0,
                  expectedEndingBalance,
                  actualEndingBalance: numActual,
                  drawerActualBalance: numActual,
                  drawerExpectedBalance: expectedEndingBalance,
                  subVaultBalance: currentSelectedVault ? currentSelectedVault.balance : numActual,
                  customerVaultBalance: (vaults.find(v => v.type === 'customer')?.balance) || 0,
                  denominations,
                  differenceAmount,
                  differenceStatus,
                  lineVerifications: lineChecks,
                  notes: notes.trim(),
                  status: 'draft',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                };
                onOpenPrintPreview(previewObj, true);
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>معاينة وطباعة تقرير أولي</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-lg shadow-emerald-600/20 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{submitting ? 'جاري التقديم...' : 'اعتماد وتقديم المحضر للمستلم'}</span>
              </button>
            </div>
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
  onOpenPrintPreview?: (handover: ShiftHandover, isDraft: boolean) => void;
}

const ReviewHandoverModal: React.FC<ReviewHandoverModalProps> = ({
  handover,
  currentUser,
  currency,
  canApprove,
  onClose,
  onSuccess,
  onOpenPrintPreview,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-md animate-fadeIn" dir="rtl">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden transition-all">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>محضر تسليم عهدة نقدية: {handover.handoverNumber}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                الخزنة: {handover.vaultName} ({handover.branch})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-600/40 text-rose-800 dark:text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Parties Banner */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500 block">الموظف المسلّم</span>
              <strong className="text-slate-900 dark:text-white text-sm">{handover.deliveringUserName}</strong>
            </div>

            <div className="text-center px-4">
              <span className="text-emerald-600 dark:text-indigo-400 text-lg">➔</span>
              <span className="text-[10px] text-slate-400 block">نقل مسؤولية</span>
            </div>

            <div className="text-left">
              <span className="text-slate-500 block">الموظف المستلم</span>
              <strong className="text-emerald-600 dark:text-emerald-400 text-sm">{handover.receivingUserName}</strong>
            </div>
          </div>

          {/* Numbers Comparison */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">رصيد بداية النوبة</span>
              <div className="text-sm font-black text-slate-900 dark:text-white font-mono">
                {formatAmount(handover.startBalance)} {currency}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">الرصيد الدفتري المتوقع</span>
              <div className="text-sm font-black text-teal-600 dark:text-blue-400 font-mono">
                {formatAmount(handover.expectedEndingBalance)} {currency}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 col-span-2 sm:col-span-1">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">الرصيد الفعلي بالجرد</span>
              <div className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {formatAmount(handover.actualEndingBalance)} {currency}
              </div>
            </div>
          </div>

          {/* Discrepancy Notice */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between ${
            handover.differenceStatus === 'matched'
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-600/40 text-emerald-800 dark:text-emerald-300'
              : handover.differenceStatus === 'deficit'
              ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-600/40 text-rose-800 dark:text-rose-300'
              : 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-600/40 text-blue-800 dark:text-blue-300'
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

            <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-black/5 dark:bg-black/30 font-mono">
              {handover.differenceStatus === 'matched' ? 'مطابق' : (handover.differenceAmount > 0 ? '+' : '') + formatAmount(handover.differenceAmount) + ' ' + currency}
            </span>
          </div>

          {/* Cash Lines Verifications */}
          {handover.lineVerifications && handover.lineVerifications.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>فحص خطوط ومحافظ الكاش المعتمدة بالمحضر ({handover.lineVerifications.length})</span>
              </h4>

              <div className="divide-y divide-slate-100 dark:divide-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50/60 dark:bg-slate-950/60 max-h-40 overflow-y-auto">
                {handover.lineVerifications.map((item) => (
                  <div key={item.lineId} className="p-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg overflow-hidden shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center p-0.5">
                        <ProviderBadge provider={item.provider} size="sm" showLabel={false} />
                      </div>
                      <div>
                        <strong className="text-slate-900 dark:text-white block">{item.lineName}</strong>
                        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400" dir="ltr">{item.phoneNumber}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        {formatAmount(item.systemBalance)} {currency}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold">
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
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-600/40 space-y-2">
              <label className="text-xs font-bold text-rose-800 dark:text-rose-300 block">سبب رفض استلام العهدة *</label>
              <input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="أدخل سبب عدم التطابق أو سبب الرفض..."
                className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-rose-500"
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setShowRejectInput(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
                >
                  تراجع
                </button>
                <button
                  onClick={handleReject}
                  disabled={actionLoading}
                  className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
                >
                  {actionLoading ? 'جاري الرفض...' : 'تأكيد رفض المحضر'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer / Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-bold cursor-pointer transition-all"
            >
              إغلاق
            </button>

            {onOpenPrintPreview && (
              <button
                type="button"
                onClick={() => onOpenPrintPreview(handover, handover.status !== 'completed')}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5"
                title="طباعة تقرير التسليم والاستلام (A4)"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>طباعة التقرير</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isPending && (isAssignedReceiver || currentUser.role === 'admin') && !showRejectInput && (
              <>
                <button
                  onClick={() => setShowRejectInput(true)}
                  className="px-4 py-2 rounded-xl bg-rose-100 hover:bg-rose-200 dark:bg-rose-600/20 dark:hover:bg-rose-600/30 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-500/40 text-xs font-bold cursor-pointer transition-all"
                >
                  رفض الاستلام
                </button>

                <button
                  onClick={handleAccept}
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-lg shadow-emerald-600/20 cursor-pointer flex items-center gap-1.5 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{actionLoading ? 'جاري التأكيد...' : 'تأكيد الاستلام ونقل مسؤولية الخزنة إليك'}</span>
                </button>
              </>
            )}

            {hasDiscrepancy && canApprove && handover.status !== 'completed' && (
              <button
                onClick={handleManagerApprove}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md cursor-pointer transition-all"
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
