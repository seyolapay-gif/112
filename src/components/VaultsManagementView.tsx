import React, { useState, useEffect, useMemo } from 'react';
import { 
  Vault, 
  VaultTransaction, 
  User, 
  SystemSettings 
} from '../types';
import { api } from '../services/api';
import { 
  formatAmount, 
  formatDateTime, 
  formatTime 
} from '../utils/formatters';
import { 
  Building2, 
  Layers, 
  ShieldCheck, 
  ArrowLeftRight, 
  Plus, 
  ArrowDownLeft, 
  Coins, 
  RefreshCw, 
  Search, 
  Edit, 
  Trash2, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  UserCheck, 
  X, 
  Check, 
  ShieldAlert,
  SlidersHorizontal,
  Settings,
  Activity,
  Lock,
  Unlock,
  FileText,
  DollarSign
} from 'lucide-react';

interface VaultsManagementViewProps {
  currentUser: User;
  settings: SystemSettings;
  onNavigateTab?: (tab: string) => void;
}

export const VaultsManagementView: React.FC<VaultsManagementViewProps> = ({
  currentUser,
  settings,
  onNavigateTab,
}) => {
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modals state
  const [isFullAdminModalOpen, setIsFullAdminModalOpen] = useState(false);
  const [selectedVaultForDetails, setSelectedVaultForDetails] = useState<Vault | null>(null);
  const [vaultTransactions, setVaultTransactions] = useState<VaultTransaction[]>([]);
  const [txLoading, setTxLoading] = useState(false);

  const [isNewSubVaultOpen, setIsNewSubVaultOpen] = useState(false);
  const [isDepositMainOpen, setIsDepositMainOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferDefaultSource, setTransferDefaultSource] = useState<string>('');
  const [transferDefaultTarget, setTransferDefaultTarget] = useState<string>('');
  const [selectedVaultForCapital, setSelectedVaultForCapital] = useState<Vault | null>(null);
  const [selectedVaultForEdit, setSelectedVaultForEdit] = useState<Vault | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  const isAdmin = currentUser.role === 'admin';
  const canManage = currentUser.role === 'admin' || currentUser.role === 'operations';

  // Load vaults and users
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const vaultsRes = await api.getVaults();
      setVaults(vaultsRes.vaults || []);

      if (isAdmin || canManage) {
        try {
          const userList = await api.getUsers();
          setUsers(userList || []);
        } catch {
          // Users list optional
        }
      }
    } catch (err: any) {
      setError(err?.message || 'تعذر تحميل بيانات الخزن المالية');
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

  // Filtered Sub-Vaults & Main Vaults
  const mainVault = useMemo(() => vaults.find(v => v.type === 'main') || vaults[0], [vaults]);
  const customerVault = useMemo(() => vaults.find(v => v.type === 'customer'), [vaults]);
  const subVaultsList = useMemo(() => vaults.filter(v => v.type === 'sub'), [vaults]);
  
  const totalSubVaultsBalance = useMemo(() => {
    return subVaultsList.reduce((acc, v) => acc + (v.balance || 0), 0);
  }, [subVaultsList]);

  // View Vault Transactions
  const handleOpenDetails = async (vault: Vault) => {
    setSelectedVaultForDetails(vault);
    setTxLoading(true);
    try {
      const res = await api.getVaultById(vault.id);
      setVaultTransactions(res.transactions || []);
    } catch {
      setVaultTransactions([]);
    } finally {
      setTxLoading(false);
    }
  };

  // Quick Open Transfer with specific flow
  const handleOpenTransfer = (sourceId?: string, targetId?: string) => {
    setTransferDefaultSource(sourceId || mainVault?.id || '');
    setTransferDefaultTarget(targetId || (subVaultsList[0]?.id || ''));
    setIsTransferModalOpen(true);
  };

  const [syncingLines, setSyncingLines] = useState(false);

  const handleSyncLines = async () => {
    try {
      setSyncingLines(true);
      const res = await api.syncLinesWithCustomerVault();
      showToast(`تمت مزامنة رصيد خزنة العملاء بنجاح (${formatAmount(res.totalLinesLiquidity)} ${settings.currency})`);
      loadData();
    } catch (err: any) {
      setError(err?.message || 'فشلت المزامنة مع محافظ العملاء');
    } finally {
      setSyncingLines(false);
    }
  };

  const showToast = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12 max-w-[1440px] mx-auto" dir="rtl">
      
      {/* 1. TOP HEADER */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Title and Tag */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-500 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                إدارة الخزن المالية
              </h1>
              <span className="text-xs bg-blue-100/70 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-3 py-0.5 rounded-full font-black">
                نظام الخزن الثلاثي
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              متابعة حركة السيولة النقدية المركزية، الفروع والكاشيرات، وخزنة عمليات خطوط العملاء
            </p>
          </div>
        </div>

        {/* Header Action Button - Single Prominent Button (Handover button removed per user request) */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsFullAdminModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-black transition-all shadow-md shadow-blue-600/20 flex items-center gap-2 cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>عرض إدارة الخزن بالكامل</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-600/50 text-emerald-900 dark:text-emerald-300 text-sm flex items-center justify-between shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-bold">{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-700 dark:text-emerald-400 hover:underline text-xs font-bold cursor-pointer">
            إغلاق
          </button>
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-600/50 text-rose-900 dark:text-rose-300 text-sm flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            <span className="font-bold">{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-700 dark:text-rose-400 hover:underline text-xs font-bold cursor-pointer">
            تخطي
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. THE 3 CANONICAL VAULTS (Exact Dimensions & Boxes)    */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-[2.1fr_1.7fr_1.2fr] gap-5 items-stretch">
        
        {/* CARD 1: الخزنة المركزية الرئيسية (Main Vault - Right in RTL, 42% width) */}
        {mainVault && (
          <div className="bg-white dark:bg-slate-900 border-2 border-blue-400 dark:border-blue-500/50 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              {/* Top Row: Icon + Status Pill + Code Pill */}
              <div className="flex items-center justify-between gap-2">
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center text-slate-800 dark:text-slate-200 shrink-0">
                  <Building2 className="w-6 h-6" />
                </div>
                
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  <span className="text-xs px-3.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-bold flex items-center gap-1.5">
                    <span>نشطة (المصدر المركزي)</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  </span>

                  <span className="text-xs font-mono font-bold px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {mainVault.code}
                  </span>
                </div>
              </div>

              {/* Title */}
              <div className="text-center mt-5 mb-4">
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                  الخزنة المركزية الرئيسية
                </h3>
              </div>

              {/* Enclosed Big Amount Box (Exact replica of image) */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center shadow-sm">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1.5">
                  الرصيد المركزي المتاح
                </span>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400 select-none">ج.م</span>
                  <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-emerald-600 dark:text-emerald-400" dir="ltr">
                    {formatAmount(mainVault.balance)}
                  </span>
                </div>
              </div>

              {/* Two Side-by-Side Metric Blocks */}
              <div className="grid grid-cols-2 gap-3 mt-3">
                {/* Right: المخصص للخزن الفرعية */}
                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center shadow-sm">
                  <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1 font-bold">
                    المخصص للخزن الفرعية
                  </span>
                  <div className="flex items-baseline justify-center gap-1.5 my-0.5">
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400">ج.م</span>
                    <span className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400 font-mono" dir="ltr">
                      {formatAmount(totalSubVaultsBalance)}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    وفقاً لسجلات الفروع
                  </span>
                </div>

                {/* Left: آخر عملية مالية */}
                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center shadow-sm">
                  <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1 font-bold">
                    آخر عملية مالية
                  </span>
                  <div className="flex items-baseline justify-center gap-1.5 my-0.5">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">ج.م</span>
                    <span className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-200 font-mono" dir="ltr">
                      {formatAmount(mainVault.lastTransactionAmount || 1000000)}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono block mt-1">
                    {mainVault.updatedAt ? formatTime(mainVault.updatedAt) : '02:59 م'}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-5 space-y-2.5">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleOpenTransfer(mainVault.id, subVaultsList[0]?.id)}
                  className="flex-1 px-4 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-black shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                  <span>تحويل إلى خزنة فرعية</span>
                </button>

                <button
                  onClick={() => handleOpenDetails(mainVault)}
                  className="px-5 py-3 rounded-2xl bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-bold transition-all cursor-pointer"
                >
                  عرض التفاصيل
                </button>
              </div>

              {/* Admin Quick Control Row for Central Vault */}
              {isAdmin && (
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-dashed border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => setIsDepositMainOpen(true)}
                    className="px-2 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-[11px] font-black transition flex items-center justify-center gap-1 cursor-pointer border border-emerald-200 dark:border-emerald-800/60 shadow-xs"
                    title="تعبئة وضخ سيولة في الخزنة المركزية"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>تعبئة سيولة</span>
                  </button>

                  <button
                    onClick={() => setSelectedVaultForEdit(mainVault)}
                    className="px-2 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 text-[11px] font-black transition flex items-center justify-center gap-1 cursor-pointer border border-indigo-200 dark:border-indigo-800/60 shadow-xs"
                    title="تعديل بيانات وإعدادات الخزنة"
                  >
                    <Edit className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>تعديل الخزنة</span>
                  </button>

                  <button
                    onClick={() => setSelectedVaultForCapital(mainVault)}
                    className="px-2 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 text-[11px] font-black transition flex items-center justify-center gap-1 cursor-pointer border border-amber-200 dark:border-amber-800/60 shadow-xs"
                    title="تسوية وتعديل رصيد الخزنة مباشرة"
                  >
                    <Coins className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>تسوية الرصيد</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CARD 2: الخزن الفرعية (Sub-Vaults - Middle in RTL, 34% width) */}
        <div className="bg-white dark:bg-slate-900 border-2 border-indigo-300 dark:border-indigo-400/50 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            {/* Top Row: Icon + Title + Count Badge */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 shrink-0">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    SUB-VAULTS
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
                    الخزن الفرعية
                  </h3>
                </div>
              </div>
              
              <span className="text-xs font-black px-3.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {subVaultsList.length} خزن
              </span>
            </div>

            {/* Enclosed Big Amount Box (Exact replica of image) */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center shadow-sm my-3">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1.5">
                إجمالي رصيد الخزن التشغيلية
              </span>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400 select-none">ج.م</span>
                <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-slate-900 dark:text-white" dir="ltr">
                  {formatAmount(totalSubVaultsBalance)}
                </span>
              </div>
            </div>

            {/* Sub-Vaults Item Chips List (Exact replica of image + admin actions) */}
            <div className="space-y-2.5 my-3">
              {subVaultsList.map((sv) => (
                <div
                  key={sv.id}
                  className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:border-indigo-300"
                >
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <strong className="text-slate-900 dark:text-white font-bold block truncate max-w-[160px]">
                      {sv.name}
                    </strong>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">ج.م</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm sm:text-base" dir="ltr">
                        {formatAmount(sv.balance)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-1.5 text-xs text-slate-400">
                    <span className="truncate max-w-[130px]">{sv.assignedEmployeeName || 'عادل فتحي'}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenTransfer(sv.id, customerVault?.id)}
                        className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer text-xs"
                      >
                        تحويل
                      </button>
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => setSelectedVaultForEdit(sv)}
                            className="text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-300 font-bold cursor-pointer text-xs flex items-center gap-0.5"
                            title="تعديل بيانات الخزنة الفرعية"
                          >
                            <Edit className="w-3 h-3" />
                            <span>تعديل</span>
                          </button>
                          <button
                            onClick={() => setSelectedVaultForCapital(sv)}
                            className="text-amber-600 hover:text-amber-700 dark:text-amber-400 font-bold cursor-pointer text-xs flex items-center gap-0.5"
                            title="تسوية وتعديل رصيد الخزنة"
                          >
                            <Coins className="w-3 h-3" />
                            <span>تسوية</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-5 space-y-2.5">
            <div className="flex items-center gap-3">
              {isAdmin && (
                <button
                  onClick={() => setIsNewSubVaultOpen(true)}
                  className="px-5 py-3 rounded-2xl bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/50 dark:hover:bg-indigo-800/60 text-indigo-700 dark:text-indigo-300 text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ جديدة</span>
                </button>
              )}

              <button
                onClick={() => setIsFullAdminModalOpen(true)}
                className="flex-1 px-4 py-3 rounded-2xl bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-bold transition-all text-center cursor-pointer"
              >
                عرض التفاصيل
              </button>
            </div>

            {/* Transfer to Customer Vault */}
            <button
              onClick={() => handleOpenTransfer(subVaultsList[0]?.id, customerVault?.id)}
              className="w-full px-3 py-2.5 rounded-2xl bg-indigo-50/70 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border border-indigo-100 dark:border-indigo-900/50"
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>نقل أموال من الخزنة الفرعية إلى خزنة العملاء</span>
            </button>
          </div>
        </div>

        {/* CARD 3: خزنة العملاء (Customer Vault - Left in RTL, 24% width) */}
        {customerVault && (
          <div className="bg-white dark:bg-slate-900 border-2 border-emerald-500 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              {/* Top Row: Icon + Code + Title + Status Pill */}
              <div className="flex items-center justify-between gap-2">
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-800 dark:text-slate-200 shrink-0">
                  <ShieldCheck className="w-6 h-6 text-slate-700 dark:text-slate-300" />
                </div>
                
                <div className="text-center">
                  <span className="text-[11px] font-mono font-black text-emerald-600 dark:text-emerald-400 block">
                    {customerVault.code}
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-tight">
                    خزنة العملاء
                  </h3>
                </div>

                <span className="text-xs px-3 py-1 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-bold">
                  نشطة
                </span>
              </div>

              {/* Enclosed Big Amount Box (Exact replica of image) */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center shadow-sm my-3">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1.5">
                  سيولة خطوط ومحافظ العملاء
                </span>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400 select-none">ج.م</span>
                  <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-emerald-600 dark:text-emerald-400" dir="ltr">
                    {formatAmount(customerVault.balance)}
                  </span>
                </div>
              </div>

              {/* Protection Alert Box (Matches image) */}
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-2.5 my-3 text-slate-800 dark:text-slate-200 text-xs">
                <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0" />
                <span className="text-[11px] leading-tight font-medium">
                  حماية ضد العجز: لا يمكن أن يكون الرصيد سالباً
                </span>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-5 space-y-2">
              <button
                onClick={() => handleOpenDetails(customerVault)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-bold transition-all text-center cursor-pointer"
              >
                عرض التفاصيل والحركات
              </button>

              {isAdmin && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSelectedVaultForEdit(customerVault)}
                    className="px-3 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>تعديل الخزنة</span>
                  </button>
                  <button
                    onClick={handleSyncLines}
                    disabled={syncingLines}
                    className="px-3 py-2.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 border border-emerald-200 dark:border-emerald-800"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${syncingLines ? 'animate-spin' : ''}`} />
                    <span>{syncingLines ? 'جاري المزامنة...' : 'مزامنة المحافظ'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* ======================================================== */}
      {/* 3. MODALS (Cleanly Triggered via Cards & Header Buttons) */}
      {/* ======================================================== */}

      {/* MODAL: Full Admin Management Table & Ledger */}
      {isFullAdminModalOpen && (
        <FullVaultsAdminModal
          vaults={vaults}
          currentUser={currentUser}
          settings={settings}
          onClose={() => setIsFullAdminModalOpen(false)}
          onOpenDetails={(v) => handleOpenDetails(v)}
          onOpenTransfer={(v) => handleOpenTransfer(v.id)}
          onOpenEdit={(v) => setSelectedVaultForEdit(v)}
          onOpenCapital={(v) => setSelectedVaultForCapital(v)}
          onOpenDeposit={() => setIsDepositMainOpen(true)}
          onOpenNewSub={() => setIsNewSubVaultOpen(true)}
        />
      )}

      {/* Modal: Transfer Between Vaults */}
      {isTransferModalOpen && (
        <TransferBetweenVaultsModal
          vaults={vaults}
          defaultSourceId={transferDefaultSource}
          defaultTargetId={transferDefaultTarget}
          currency={settings.currency}
          onClose={() => setIsTransferModalOpen(false)}
          onSuccess={(msg) => {
            setIsTransferModalOpen(false);
            showToast(msg);
            loadData();
          }}
        />
      )}

      {/* Modal: Deposit Capital to Main Vault */}
      {isDepositMainOpen && mainVault && (
        <DepositMainVaultModal
          mainVault={mainVault}
          currency={settings.currency}
          onClose={() => setIsDepositMainOpen(false)}
          onSuccess={(msg) => {
            setIsDepositMainOpen(false);
            showToast(msg);
            loadData();
          }}
        />
      )}

      {/* Modal: Create New Sub-Vault */}
      {isNewSubVaultOpen && (
        <NewSubVaultModal
          users={users}
          currency={settings.currency}
          onClose={() => setIsNewSubVaultOpen(false)}
          onSuccess={(msg) => {
            setIsNewSubVaultOpen(false);
            showToast(msg);
            loadData();
          }}
        />
      )}

      {/* Modal: Edit Vault Information */}
      {selectedVaultForEdit && (
        <EditVaultModal
          vault={selectedVaultForEdit}
          users={users}
          currency={settings.currency}
          onClose={() => setSelectedVaultForEdit(null)}
          onSuccess={(msg) => {
            setSelectedVaultForEdit(null);
            showToast(msg);
            loadData();
          }}
        />
      )}

      {/* Modal: Adjust Capital Directly */}
      {selectedVaultForCapital && (
        <AdjustCapitalModal
          vault={selectedVaultForCapital}
          currency={settings.currency}
          onClose={() => setSelectedVaultForCapital(null)}
          onSuccess={(msg) => {
            setSelectedVaultForCapital(null);
            showToast(msg);
            loadData();
          }}
        />
      )}

      {/* Modal: Vault Ledger & Transactions */}
      {selectedVaultForDetails && (
        <VaultDetailsModal
          vault={selectedVaultForDetails}
          transactions={vaultTransactions}
          loading={txLoading}
          currency={settings.currency}
          onClose={() => setSelectedVaultForDetails(null)}
        />
      )}

    </div>
  );
};

// ==========================================
// SUB-MODAL 1: Full Admin Management Modal (Modern Command Center)
// ==========================================
interface FullAdminModalProps {
  vaults: Vault[];
  currentUser: User;
  settings: SystemSettings;
  onClose: () => void;
  onOpenDetails: (vault: Vault) => void;
  onOpenTransfer: (vault: Vault) => void;
  onOpenEdit: (vault: Vault) => void;
  onOpenCapital: (vault: Vault) => void;
  onOpenDeposit: () => void;
  onOpenNewSub: () => void;
}

const FullVaultsAdminModal: React.FC<FullAdminModalProps> = ({
  vaults,
  currentUser,
  settings,
  onClose,
  onOpenDetails,
  onOpenTransfer,
  onOpenEdit,
  onOpenCapital,
  onOpenDeposit,
  onOpenNewSub,
}) => {
  const [activeTab, setActiveTab] = useState<'cards' | 'table' | 'architecture'>('cards');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'main' | 'sub' | 'customer'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const isAdmin = currentUser.role === 'admin';

  // Computed metrics
  const mainVault = vaults.find(v => v.type === 'main') || vaults[0];
  const subVaults = vaults.filter(v => v.type === 'sub');
  const customerVault = vaults.find(v => v.type === 'customer');

  const totalVaultsBalance = vaults.reduce((acc, v) => acc + (v.balance || 0), 0);
  const totalSubBalance = subVaults.reduce((acc, v) => acc + (v.balance || 0), 0);
  const activeCount = vaults.filter(v => v.status === 'active').length;

  const filtered = vaults.filter(v => {
    const matchesSearch = 
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.code.toLowerCase().includes(search.toLowerCase()) ||
      (v.branch && v.branch.toLowerCase().includes(search.toLowerCase())) ||
      (v.assignedEmployeeName && v.assignedEmployeeName.toLowerCase().includes(search.toLowerCase()));

    const matchesType = typeFilter === 'all' || v.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fadeIn" dir="rtl">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-6xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden text-slate-800 dark:text-white">
        
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-50 via-slate-100/60 to-blue-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950/30">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-500 text-white flex items-center justify-center shadow-md shadow-blue-500/25 shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  نظام الإدارة والتحكم الشامل بالخزن المالية
                </h3>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800">
                  تحكم الأدمن الكامل
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                مراقبة وضبط أرصدة الخزنة المركزية، الفروع والكاشيرات، مع صلاحيات التسوية والتعديل المباشر
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <>
                <button
                  onClick={onOpenDeposit}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                  title="تعبئة الخزنة المركزية برأس مال جديد"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">تعبئة سيولة المركزية</span>
                </button>
                <button
                  onClick={onOpenNewSub}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                  title="إضافة خزنة فرعية لفرع أو كاشير"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">خزنة فرعية جديدة</span>
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center cursor-pointer transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Executive KPI Cards Bar */}
        <div className="p-4 bg-slate-50/70 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card 1: Total Liquidity */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                إجمالي سيولة الخزن
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-xs font-bold text-slate-500">ج.م</span>
                <span className="text-base sm:text-lg font-black font-mono text-slate-900 dark:text-white" dir="ltr">
                  {formatAmount(totalVaultsBalance)}
                </span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          {/* Card 2: Central Vault */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                الخزنة المركزية
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-xs font-bold text-emerald-600">ج.م</span>
                <span className="text-base sm:text-lg font-black font-mono text-emerald-600 dark:text-emerald-400" dir="ltr">
                  {formatAmount(mainVault?.balance || 0)}
                </span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
          </div>

          {/* Card 3: Sub-Vaults Total */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                الخزن الفرعية ({subVaults.length})
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-xs font-bold text-indigo-600">ج.م</span>
                <span className="text-base sm:text-lg font-black font-mono text-indigo-600 dark:text-indigo-400" dir="ltr">
                  {formatAmount(totalSubBalance)}
                </span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
          </div>

          {/* Card 4: Customer Operations Vault */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                خزنة عمليات العملاء
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-xs font-bold text-teal-600">ج.م</span>
                <span className="text-base sm:text-lg font-black font-mono text-teal-600 dark:text-teal-400" dir="ltr">
                  {formatAmount(customerVault?.balance || 0)}
                </span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Tab Navigation and Controls */}
        <div className="p-3 sm:px-5 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 self-start">
            <button
              onClick={() => setActiveTab('cards')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'cards'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>بطاقات التحكم السريع</span>
            </button>
            <button
              onClick={() => setActiveTab('table')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'table'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>جدول الأرصدة الشامل</span>
            </button>
            <button
              onClick={() => setActiveTab('architecture')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'architecture'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>دورة وقواعد السيولة</span>
            </button>
          </div>

          {/* Search & Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative min-w-[220px]">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث بالاسم، الكود، الفرع، الموظف..."
                className="w-full pl-3 pr-8 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="py-1.5 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="all">جميع الأنواع</option>
              <option value="main">المركزية فقط</option>
              <option value="sub">الفرعية فقط</option>
              <option value="customer">خزنة العملاء</option>
            </select>
          </div>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {/* TAB 1: Command Cards */}
          {activeTab === 'cards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((vault) => {
                const isMain = vault.type === 'main';
                const isCustomer = vault.type === 'customer';
                const isSub = vault.type === 'sub';

                return (
                  <div
                    key={vault.id}
                    className={`rounded-3xl p-5 border-2 shadow-sm flex flex-col justify-between transition-all bg-white dark:bg-slate-900 ${
                      isMain
                        ? 'border-blue-400/80 dark:border-blue-500/50'
                        : isCustomer
                        ? 'border-emerald-500/80 dark:border-emerald-500/50'
                        : 'border-indigo-300 dark:border-indigo-400/50'
                    }`}
                  >
                    <div>
                      {/* Top Header of Card */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isMain ? 'bg-blue-100 dark:bg-blue-950 text-blue-600' : isCustomer ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600' : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600'
                          }`}>
                            {isMain ? <Building2 className="w-5 h-5" /> : isCustomer ? <ShieldCheck className="w-5 h-5" /> : <Layers className="w-5 h-5" />}
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 font-mono block">
                              {vault.code}
                            </span>
                            <strong className="text-sm font-black text-slate-900 dark:text-white block truncate max-w-[170px]">
                              {vault.name}
                            </strong>
                          </div>
                        </div>

                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          vault.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}>
                          {vault.status === 'active' ? 'نشطة' : 'موقوفة'}
                        </span>
                      </div>

                      {/* Balance Big Box */}
                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-center my-3">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">الرصيد المتاح</span>
                        <div className="flex items-baseline justify-center gap-1.5">
                          <span className="text-xs font-bold text-slate-500">ج.م</span>
                          <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-emerald-600 dark:text-emerald-400" dir="ltr">
                            {formatAmount(vault.balance)}
                          </span>
                        </div>
                      </div>

                      {/* Details specs */}
                      <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 pt-1">
                        <div className="flex items-center justify-between">
                          <span>الفرع / الموقع:</span>
                          <strong className="text-slate-800 dark:text-slate-200 font-medium">{vault.branch || 'الفرع الرئيسي'}</strong>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>المسؤول المباشر:</span>
                          <strong className="text-slate-800 dark:text-slate-200 font-medium">{vault.assignedEmployeeName || 'عادل فتحي (مدير)'}</strong>
                        </div>
                        {vault.minBalance && (
                          <div className="flex items-center justify-between text-[11px]">
                            <span>حد التنبيه الأدنى:</span>
                            <span className="font-mono text-slate-700 dark:text-slate-300">{formatAmount(vault.minBalance)} ج.م</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quick Admin Actions on every card */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 mt-4 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => onOpenTransfer(vault)}
                          className="px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <ArrowLeftRight className="w-3.5 h-3.5" />
                          <span>تحويل نقدية</span>
                        </button>

                        <button
                          onClick={() => onOpenDetails(vault)}
                          className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>سجل العمليات</span>
                        </button>
                      </div>

                      {isAdmin && (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => onOpenEdit(vault)}
                            className="px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer border border-indigo-200 dark:border-indigo-800/50"
                          >
                            <Edit className="w-3.5 h-3.5 text-indigo-600" />
                            <span>تعديل شامل</span>
                          </button>

                          <button
                            onClick={() => onOpenCapital(vault)}
                            className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer border border-amber-200 dark:border-amber-800/50"
                          >
                            <Coins className="w-3.5 h-3.5 text-amber-600" />
                            <span>تسوية الرصيد</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: Table Ledger View */}
          {activeTab === 'table' && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5">الخزنة والنوع</th>
                    <th className="p-3.5">الكود والفرع</th>
                    <th className="p-3.5">المسؤول المباشر</th>
                    <th className="p-3.5 text-center">الرصيد المتاح</th>
                    <th className="p-3.5 text-center">الحالة التشغيلية</th>
                    <th className="p-3.5 text-center">إجراءات وتحكم الأدمن</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filtered.map((vault) => {
                    const isMain = vault.type === 'main';
                    const isCustomer = vault.type === 'customer';

                    return (
                      <tr key={vault.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                        <td className="p-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                              isMain ? 'bg-blue-100 text-blue-700' : isCustomer ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'
                            }`}>
                              {isMain ? <Building2 className="w-4 h-4" /> : isCustomer ? <ShieldCheck className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
                            </div>
                            <div>
                              <strong className="text-slate-900 dark:text-white block font-bold">{vault.name}</strong>
                              <span className="text-[10px] text-slate-400">
                                {isMain ? 'الخزنة المركزية الرئيسية' : isCustomer ? 'خزنة عمليات العملاء' : 'خزنة فرعية / كاشير'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5 font-mono">
                          <span className="font-bold text-slate-700 dark:text-slate-300 block">{vault.code}</span>
                          <span className="text-[10px] text-slate-400 font-sans">{vault.branch || 'الفرع الرئيسي'}</span>
                        </td>
                        <td className="p-3.5 text-slate-700 dark:text-slate-300">
                          {vault.assignedEmployeeName || '-'}
                        </td>
                        <td className="p-3.5 text-center font-mono">
                          <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                            {formatAmount(vault.balance)}
                          </span>
                          <span className="text-[10px] text-slate-400 mr-1">{settings.currency}</span>
                        </td>
                        <td className="p-3.5 text-center">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                            vault.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}>
                            {vault.status === 'active' ? 'نشطة' : 'موقوفة'}
                          </span>
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => onOpenTransfer(vault)}
                              className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-bold transition flex items-center gap-1"
                              title="تحويل نقدية"
                            >
                              <ArrowLeftRight className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">تحويل</span>
                            </button>
                            <button
                              onClick={() => onOpenDetails(vault)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
                              title="سجل العمليات"
                            >
                              <Clock className="w-3.5 h-3.5" />
                            </button>
                            {isAdmin && (
                              <>
                                <button
                                  onClick={() => onOpenEdit(vault)}
                                  className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 transition"
                                  title="تعديل بيانات وإعدادات الخزنة"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => onOpenCapital(vault)}
                                  className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950 dark:hover:bg-amber-900 text-amber-700 dark:text-amber-300 transition"
                                  title="تسوية وتعديل رأس المال المباشر"
                                >
                                  <Coins className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: Treasury Architecture & Flow Rules */}
          {activeTab === 'architecture' && (
            <div className="space-y-4">
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-tr from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 border border-blue-200 dark:border-blue-900/60">
                <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <span>دورة حركة السيولة وقواعد النظام المالي المعتمدة</span>
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  تم تصميم هيكل الخزن الثلاثي وفقاً لأعلى معايير الرقابة المالية لمنع العجز والتلاعب المحاسبي:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-black text-xs">
                    <Building2 className="w-4 h-4" />
                    <span>1. الخزنة المركزية (المصدر المركزي)</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    يتم تغذيتها حصرياً من قبل الإدارة العامة (المدير العام) بضخ رأس مال أو تمويل بنكي. لا يُصرف منها مباشرة للعملاء، بل تغذي الخزن الفرعية بالفروع.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black text-xs">
                    <Layers className="w-4 h-4" />
                    <span>2. الخزن الفرعية (الكاشيرات والفروع)</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    تستقبل السيولة من الخزنة المركزية وتوزع على نقاط البيع. تقوم بنقل السيولة إلى خزنة العملاء لعمليات التحويل أو إرجاع الفوائض للمركزية.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-xs">
                    <ShieldCheck className="w-4 h-4" />
                    <span>3. خزنة العملاء (خطوط ومحافظ الكاش)</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    تمثل إجمالي الرصيد الفعلي في خطوط ومحافظ الكاش والشبكات البنكية. محمية بنظام صارم لمنع العجز ولا يمكن أن يصبح رصيدها سالباً.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-bold">
            عدد الخزن المسجلة: {vaults.length} | النشطة: {activeCount}
          </span>
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-bold cursor-pointer transition"
          >
            إغلاق النافذة
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// SUB-MODAL 2: Transfer Between Vaults
// ==========================================
interface TransferModalProps {
  vaults: Vault[];
  defaultSourceId?: string;
  defaultTargetId?: string;
  currency: string;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

const TransferBetweenVaultsModal: React.FC<TransferModalProps> = ({
  vaults,
  defaultSourceId,
  defaultTargetId,
  currency,
  onClose,
  onSuccess,
}) => {
  const [sourceId, setSourceId] = useState(defaultSourceId || vaults[0]?.id || '');
  const [targetId, setTargetId] = useState(
    defaultTargetId && defaultTargetId !== defaultSourceId
      ? defaultTargetId
      : vaults.find(v => v.id !== (defaultSourceId || vaults[0]?.id))?.id || ''
  );
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sourceVault = vaults.find(v => v.id === sourceId);
  const targetVault = vaults.find(v => v.id === targetId);

  const numAmount = Number(amount) || 0;
  const isInvalidAmount = numAmount <= 0;
  const isInsufficient = sourceVault ? sourceVault.balance < numAmount : false;

  const quickPresets = [
    { label: '+5,000', add: 5000 },
    { label: '+10,000', add: 10000 },
    { label: '+25,000', add: 25000 },
    { label: '+50,000', add: 50000 },
    { label: '+100,000', add: 100000 },
  ];

  const handleAddPreset = (val: number) => {
    const current = Number(amount) || 0;
    setAmount(String(current + val));
  };

  const handleMaxAmount = () => {
    if (sourceVault && sourceVault.balance > 0) {
      setAmount(String(sourceVault.balance));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isInvalidAmount) {
      setError('الرجاء إدخال مبلغ تحويل صحيح أكبر من صفر');
      return;
    }
    if (isInsufficient) {
      setError('الرصيد في الخزنة المصدر غير كافٍ. يُمنع الرصيد السالب بشكل قاطع.');
      return;
    }
    if (sourceId === targetId) {
      setError('لا يمكن التحويل من وإلى نفس الخزنة');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const res = await api.transferBetweenVaults(
        sourceId,
        targetId,
        numAmount,
        notes.trim() || undefined
      );
      onSuccess(`تم تحويل ${formatAmount(numAmount)} ${currency} بنجاح من ${res.sourceVault.name} إلى ${res.targetVault.name}`);
    } catch (err: any) {
      setError(err?.message || 'فشل تنفيذ التحويل');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn" dir="rtl">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-800 dark:text-white">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-800">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">تحويل نقدية بين الخزن</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">قيد مزدوج فوري مع التحقق من كفاية الرصيد</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center cursor-pointer transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-600/40 text-rose-800 dark:text-rose-300 text-xs font-bold">
              {error}
            </div>
          )}

          {/* Source Vault */}
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              الخزنة المصدر (الخصم) *
            </label>
            <select
              value={sourceId}
              onChange={(e) => {
                setSourceId(e.target.value);
                if (e.target.value === targetId) {
                  const other = vaults.find(v => v.id !== e.target.value);
                  if (other) setTargetId(other.id);
                }
              }}
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-bold"
              required
            >
              {vaults.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.code}) - الرصيد: {formatAmount(v.balance)} {currency}
                </option>
              ))}
            </select>
            {sourceVault && (
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                <span>
                  الرصيد المتاح: <strong className="font-mono text-emerald-600 dark:text-emerald-400">{formatAmount(sourceVault.balance)} {currency}</strong>
                </span>
                {sourceVault.balance > 0 && (
                  <button
                    type="button"
                    onClick={handleMaxAmount}
                    className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                  >
                    استخدام أقصى رصيد متاح
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Target Vault */}
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              الخزنة الوجهة (الإيداع) *
            </label>
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-bold"
              required
            >
              {vaults.filter(v => v.id !== sourceId).map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.code}) - الرصيد الحالي: {formatAmount(v.balance)} {currency}
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                المبلغ المراد تحويله ({currency}) *
              </label>
              {isInsufficient && (
                <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
                  المبلغ يتجاوز رصيد الخزنة المصدر!
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type="number"
                min="1"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className={`w-full p-3 pr-4 pl-12 rounded-xl bg-slate-50 dark:bg-slate-950 border font-mono text-xl font-bold tracking-wider text-slate-900 dark:text-white focus:outline-none transition ${
                  isInsufficient 
                    ? 'border-rose-500 focus:border-rose-500' 
                    : 'border-slate-300 dark:border-slate-800 focus:border-blue-500'
                }`}
                required
              />
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                {currency}
              </span>
            </div>

            {/* Quick Add Presets */}
            <div className="flex items-center flex-wrap gap-1.5 mt-2">
              <span className="text-[10px] text-slate-400">إضافة سريعة:</span>
              {quickPresets.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => handleAddPreset(p.add)}
                  className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-mono font-bold cursor-pointer transition border border-slate-200 dark:border-slate-700"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              بيان وملاحظات التحويل (اختياري)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="سبب التحويل، رقم الإذن أو مستند القيد..."
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={submitting || isInvalidAmount || isInsufficient}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-lg shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>{submitting ? 'جاري التحويل...' : 'تأكيد وقيد التحويل'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// SUB-MODAL 3: Deposit Capital to Main Vault
// ==========================================
interface DepositMainModalProps {
  mainVault: Vault;
  currency: string;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

const DepositMainVaultModal: React.FC<DepositMainModalProps> = ({
  mainVault,
  currency,
  onClose,
  onSuccess,
}) => {
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const num = Number(amount) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (num <= 0) {
      setError('الرجاء إدخال مبلغ صحيح أكبر من صفر');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await api.depositToMainVault(mainVault.id, num, notes.trim() || undefined);
      onSuccess(`تم إيداع وتعبئة ${formatAmount(num)} ${currency} بنجاح في ${mainVault.name}`);
    } catch (err: any) {
      setError(err?.message || 'فشل إيداع رأس المال');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn" dir="rtl">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden text-slate-800 dark:text-white">
        
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">تعبئة وتوريد سيولة للخزنة الرئيسية</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">إيداع رأسمال جديد بواسطة الإدارة</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-600/40 text-rose-800 dark:text-rose-300 text-xs font-bold">
              {error}
            </div>
          )}

          <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40">
            <span className="text-[11px] text-blue-700 dark:text-blue-300 block font-bold">الخزنة المستفيدة:</span>
            <div className="flex items-center justify-between mt-1">
              <strong className="text-slate-900 dark:text-white">{mainVault.name} ({mainVault.code})</strong>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                الرصيد الحالي: {formatAmount(mainVault.balance)} {currency}
              </span>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              مبلغ الإيداع / رأس المال ({currency}) *
            </label>
            <input
              type="number"
              min="1"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 font-mono text-xl font-bold tracking-wider text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              مصدر التوريد / ملاحظات القيد *
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: توريد نقدي من الإدارة العامة، سحب من البنك، رأس مال تشغيلي..."
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={submitting || num <= 0}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-lg shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              <Coins className="w-4 h-4" />
              <span>{submitting ? 'جاري الإيداع...' : 'تأكيد الإيداع وإضافة الرصيد'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// SUB-MODAL 4: Create New Sub-Vault
// ==========================================
interface NewSubVaultModalProps {
  users: User[];
  currency: string;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

const NewSubVaultModal: React.FC<NewSubVaultModalProps> = ({
  users,
  currency,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [branch, setBranch] = useState('فرع المهندسين');
  const [assignedEmployeeId, setAssignedEmployeeId] = useState('');
  const [initialBalance, setInitialBalance] = useState('');
  const [minBalance, setMinBalance] = useState('10000');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('الرجاء إدخال اسم الخزنة الفرعية');
      return;
    }

    try {
      setSubmitting(true);
      const createdVault = await api.createSubVault({
        name: name.trim(),
        branch: branch.trim(),
        assignedEmployeeId: assignedEmployeeId || undefined,
        minBalance: minBalance ? Number(minBalance) : undefined,
      });
      if (Number(initialBalance) > 0) {
        await api.adjustVaultCapital(createdVault.id, Number(initialBalance), 'رصيد بداية عند إنشاء الخزنة').catch(() => null);
      }
      onSuccess(`تم إنشاء الخزنة الفرعية "${name}" بنجاح`);
    } catch (err: any) {
      setError(err?.message || 'فشل إنشاء الخزنة الفرعية');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn" dir="rtl">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden text-slate-800 dark:text-white">
        
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">إضافة خزنة فرعية جديدة</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">للفروع، الكاشيرات، أو نقاط البيع</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3.5 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-600/40 text-rose-800 dark:text-rose-300 text-xs font-bold">
              {error}
            </div>
          )}

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              اسم الخزنة الفرعية *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: خزنة فرع المهندسين (نوبة 1)"
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-bold"
              required
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              الفرع أو الموقع *
            </label>
            <input
              type="text"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="مثال: فرع مدينة نصر، فرع التجمع..."
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              الموظف / الكاشير المسؤول (اختياري)
            </label>
            <select
              value={assignedEmployeeId}
              onChange={(e) => setAssignedEmployeeId(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">- بدون تعيين مبدئي -</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.fullName} ({u.role})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                رصيد البداية ({currency})
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                placeholder="0"
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                الحد الأدنى للتنبيه ({currency})
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={minBalance}
                onChange={(e) => setMinBalance(e.target.value)}
                placeholder="10000"
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-lg shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{submitting ? 'جاري الإنشاء...' : 'إنشاء الخزنة'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// SUB-MODAL 5: Comprehensive Edit Vault & Balance Control
// ==========================================
interface EditVaultModalProps {
  vault: Vault;
  users: User[];
  currency: string;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

const EditVaultModal: React.FC<EditVaultModalProps> = ({
  vault,
  users,
  currency,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState(vault.name);
  const [code, setCode] = useState(vault.code);
  const [branch, setBranch] = useState(vault.branch || 'الفرع الرئيسي');
  const [assignedEmployeeId, setAssignedEmployeeId] = useState(vault.assignedEmployeeId || '');
  const [minBalance, setMinBalance] = useState(vault.minBalance ? String(vault.minBalance) : '');
  const [maxBalance, setMaxBalance] = useState(vault.maxBalance ? String(vault.maxBalance) : '');
  const [status, setStatus] = useState<'active' | 'suspended'>(vault.status);
  const [notes, setNotes] = useState(vault.notes || '');

  // Direct balance adjustment control within the same modal
  const [enableBalanceAdjustment, setEnableBalanceAdjustment] = useState(false);
  const [newBalance, setNewBalance] = useState(String(vault.balance));
  const [adjustmentReason, setAdjustmentReason] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const numBalance = Number(newBalance);
  const balanceDiff = numBalance - vault.balance;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('الرجاء إدخال اسم الخزنة');
      return;
    }
    if (!code.trim()) {
      setError('الرجاء إدخال كود الخزنة');
      return;
    }

    if (enableBalanceAdjustment) {
      if (isNaN(numBalance) || numBalance < 0) {
        setError('الرصيد الجديد يجب أن يكون رقماً صحيحاً أو صفراً أو أكبر (يُمنع الرصيد السالب)');
        return;
      }
      if (numBalance !== vault.balance && !adjustmentReason.trim()) {
        setError('الرجاء كتابة سبب التسوية / الملاحظة المحاسبية لتعديل الرصيد');
        return;
      }
    }

    try {
      setSubmitting(true);
      setError(null);

      // 1. Direct balance adjustment if enabled and changed
      if (enableBalanceAdjustment && numBalance !== vault.balance) {
        await api.adjustVaultCapital(
          vault.id,
          numBalance,
          adjustmentReason.trim() || `تسوية رصيد الخزنة أثناء تعديل البيانات من قبل الأدمن`
        );
      }

      // 2. Update vault details
      await api.updateVault(vault.id, {
        name: name.trim(),
        code: code.trim(),
        branch: branch.trim(),
        assignedEmployeeId: assignedEmployeeId || undefined,
        minBalance: minBalance ? Number(minBalance) : undefined,
        maxBalance: maxBalance ? Number(maxBalance) : undefined,
        status,
        notes: notes.trim() || undefined,
      });

      onSuccess(`تم حفظ وتحديث بيانات وإعدادات الخزنة "${name}" بنجاح`);
    } catch (err: any) {
      setError(err?.message || 'فشل تحديث بيانات الخزنة');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSubVault = async () => {
    if (vault.type !== 'sub') return;
    try {
      setDeleting(true);
      setError(null);
      await api.deleteVault(vault.id);
      onSuccess(`تم حذف الخزنة الفرعية "${vault.name}" بنجاح`);
    } catch (err: any) {
      setError(err?.message || 'فشل حذف الخزنة الفرعية');
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm animate-fadeIn" dir="rtl">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-800 dark:text-white">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800 shrink-0">
              <Edit className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                لوحة التحكم وتعديل بيانات الخزنة
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {vault.code} - {vault.name} ({vault.type === 'main' ? 'خزنة مركزية' : vault.type === 'customer' ? 'خزنة العملاء' : 'خزنة فرعية'})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center cursor-pointer transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-600/40 text-rose-800 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Basic Information */}
          <div className="space-y-3">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                اسم الخزنة *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-bold"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  كود الخزنة المالي *
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  الحالة التشغيلية
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-bold"
                >
                  <option value="active">نشطة (متاحة للعمليات)</option>
                  <option value="suspended">موقوفة مؤقتاً</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  الفرع أو الموقع
                </label>
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  الموظف / الكاشير المسؤول
                </label>
                <select
                  value={assignedEmployeeId}
                  onChange={(e) => setAssignedEmployeeId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-bold"
                >
                  <option value="">- بدون تعيين موظف -</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.fullName} ({u.role})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  الحد الأدنى للتنبيه ({currency})
                </label>
                <input
                  type="number"
                  min="0"
                  value={minBalance}
                  onChange={(e) => setMinBalance(e.target.value)}
                  placeholder="مثال: 50000"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 font-mono text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  الحد الأقصى الاستيعابي ({currency})
                </label>
                <input
                  type="number"
                  min="0"
                  value={maxBalance}
                  onChange={(e) => setMaxBalance(e.target.value)}
                  placeholder="مثال: 2000000"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 font-mono text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                ملاحظات وبيان إداري
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="بيان الغرض التشغيلي للخزنة والصلاحيات الممنوحة..."
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Section 2: Direct Balance / Capital Adjustment Box */}
          <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="font-black text-slate-900 dark:text-white">
                  تسوية وتعديل الرصيد الفعلي المباشر
                </span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableBalanceAdjustment}
                  onChange={(e) => setEnableBalanceAdjustment(e.target.checked)}
                  className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
                <span className="text-[11px] font-bold text-amber-900 dark:text-amber-300">
                  تفعيل تعديل الرصيد
                </span>
              </label>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-amber-200/60 dark:border-amber-800/40">
              <span className="text-slate-600 dark:text-slate-400">الرصيد الدفتري الحالي:</span>
              <strong className="font-mono text-sm text-slate-900 dark:text-white" dir="ltr">
                {formatAmount(vault.balance)} {currency}
              </strong>
            </div>

            {enableBalanceAdjustment && (
              <div className="space-y-3 pt-2">
                <div>
                  <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                    الرصيد الفعلي الجديد المطلوب تثبيته ({currency}) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={newBalance}
                    onChange={(e) => setNewBalance(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-amber-300 dark:border-amber-700 font-mono text-lg font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                    required
                  />
                  <div className="flex items-center justify-between text-[11px] mt-1 font-mono">
                    <span className="text-slate-500">فارق التسوية المحاسبية:</span>
                    <strong className={balanceDiff === 0 ? 'text-slate-400' : balanceDiff > 0 ? 'text-emerald-600' : 'text-rose-600'}>
                      {balanceDiff === 0 ? 'مطابق للرصيد الدفتري' : (balanceDiff > 0 ? `+${formatAmount(balanceDiff)} زيادة` : `${formatAmount(balanceDiff)} عجز`)} {currency}
                    </strong>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                    سبب التسوية والسند الإداري *
                  </label>
                  <input
                    type="text"
                    value={adjustmentReason}
                    onChange={(e) => setAdjustmentReason(e.target.value)}
                    placeholder="مثال: مطابقة الجرد الفعلي، معالجة قيد خاطئ، إثبات عهدة..."
                    className="w-full p-2 rounded-xl bg-white dark:bg-slate-950 border border-amber-300 dark:border-amber-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Sub-Vault Deletion (if sub-vault) */}
          {vault.type === 'sub' && (
            <div className="p-3 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 flex items-center justify-between">
              <div>
                <strong className="text-rose-900 dark:text-rose-300 text-xs block font-bold">
                  حذف الخزنة الفرعية
                </strong>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  {vault.balance > 0 ? `الرصيد الحالي ${formatAmount(vault.balance)} ج.م (يُفضل تصفيرها أولاً)` : 'رصيد الخزنة صفري ويمكن حذفها بأمان'}
                </span>
              </div>

              {!confirmDelete ? (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="px-3 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/40 text-rose-800 dark:text-rose-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>حذف الخزنة</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleDeleteSubVault}
                    disabled={deleting}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition cursor-pointer disabled:opacity-50"
                  >
                    {deleting ? 'جاري الحذف...' : 'تأكيد الحذف نهائياً'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="px-2 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-lg shadow-indigo-600/25 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{submitting ? 'جاري الحفظ والتثبيت...' : 'حفظ التعديلات وتثبيت الرصيد'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// SUB-MODAL 6: Adjust Capital Directly
// ==========================================
interface AdjustCapitalProps {
  vault: Vault;
  currency: string;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

const AdjustCapitalModal: React.FC<AdjustCapitalProps> = ({
  vault,
  currency,
  onClose,
  onSuccess,
}) => {
  const [newBalance, setNewBalance] = useState(String(vault.balance));
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const num = Number(newBalance);
  const diff = num - vault.balance;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isNaN(num) || num < 0) {
      setError('يُمنع الرصيد السالب بشكل قاطع. يجب أن يكون الرصيد صفراً أو أكبر.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await api.adjustVaultCapital(vault.id, num, notes.trim() || undefined);
      onSuccess(`تم تعديل وتسوية رصيد الخزنة "${vault.name}" ليصبح ${formatAmount(num)} ${currency}`);
    } catch (err: any) {
      setError(err?.message || 'فشلت تسوية الرصيد');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn" dir="rtl">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden text-slate-800 dark:text-white">
        
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">تعديل وتسوية رأس المال المباشر</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{vault.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3.5 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-600/40 text-rose-800 dark:text-rose-300 text-xs font-bold">
              {error}
            </div>
          )}

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400">الرصيد الدفتري الحالي:</span>
            <strong className="font-mono text-sm text-slate-900 dark:text-white">{formatAmount(vault.balance)} {currency}</strong>
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              الرصيد الفعلي الجديد المستهدف ({currency}) *
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={newBalance}
              onChange={(e) => setNewBalance(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 font-mono text-xl font-bold tracking-wider text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
              required
            />
            <div className="flex items-center justify-between text-[11px] mt-1 font-mono">
              <span>الفارق المحاسبي:</span>
              <strong className={diff === 0 ? 'text-slate-400' : diff > 0 ? 'text-emerald-600' : 'text-rose-600'}>
                {diff === 0 ? 'لا تغيير' : (diff > 0 ? `+${formatAmount(diff)}` : formatAmount(diff))} {currency}
              </strong>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              سبب التسوية / السند المحاسبي *
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: تسوية جرد دوري، معالجة خطأ قيد، إثبات عهدة..."
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-black shadow-lg shadow-amber-600/20 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              <Coins className="w-4 h-4" />
              <span>{submitting ? 'جاري التسوية...' : 'تثبيت الرصيد الجديد'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// SUB-MODAL 7: Vault Ledger & Transactions
// ==========================================
interface VaultDetailsModalProps {
  vault: Vault;
  transactions: VaultTransaction[];
  loading: boolean;
  currency: string;
  onClose: () => void;
}

const VaultDetailsModal: React.FC<VaultDetailsModalProps> = ({
  vault,
  transactions,
  loading,
  currency,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn" dir="rtl">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-800 dark:text-white">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/70">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>سجل حركات وعمليات الخزنة: {vault.name}</span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {vault.code}
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              الرصيد الدفتري الحالي: <strong className="font-mono text-emerald-600 dark:text-emerald-400">{formatAmount(vault.balance)} {currency}</strong>
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Transactions Table */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
              <span>جاري تحميل سجل العمليات...</span>
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              لا توجد عمليات مقيدة على هذه الخزنة حتى الآن
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950/70 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-2.5">الرقم المرجعي</th>
                    <th className="p-2.5">التاريخ والوقت</th>
                    <th className="p-2.5">نوع القيد</th>
                    <th className="p-2.5 text-center">المبلغ</th>
                    <th className="p-2.5">الملاحظات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="p-2.5 font-mono text-[11px] text-slate-500">{tx.referenceNumber}</td>
                      <td className="p-2.5 font-mono text-[11px] text-slate-600 dark:text-slate-400" dir="ltr">
                        {formatDateTime(tx.timestamp)}
                      </td>
                      <td className="p-2.5 font-bold">
                        {tx.type === 'transfer_main_to_sub' ? 'تحويل من الرئيسية لفرعية' :
                         tx.type === 'transfer_sub_to_main' ? 'تحويل من فرعية للرئيسية' :
                         tx.type === 'deposit_main' ? 'إيداع بالخزنة الرئيسية' :
                         tx.type === 'adjustment' ? 'تسوية محاسبية' : tx.type}
                      </td>
                      <td className="p-2.5 text-center font-mono font-bold text-slate-900 dark:text-white">
                        {formatAmount(tx.amount)} {currency}
                      </td>
                      <td className="p-2.5 text-slate-600 dark:text-slate-400 text-[11px] max-w-xs truncate">
                        {tx.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-bold cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

