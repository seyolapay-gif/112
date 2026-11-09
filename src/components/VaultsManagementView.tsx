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
  formatCount, 
  formatDateTime, 
  formatTime 
} from '../utils/formatters';

interface VaultsManagementViewProps {
  currentUser: User;
  settings: SystemSettings;
}

export const VaultsManagementView: React.FC<VaultsManagementViewProps> = ({
  currentUser,
  settings,
}) => {
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [branchFilter, setBranchFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals state
  const [selectedVaultForDetails, setSelectedVaultForDetails] = useState<Vault | null>(null);
  const [vaultTransactions, setVaultTransactions] = useState<VaultTransaction[]>([]);
  const [txLoading, setTxLoading] = useState(false);

  const [isNewSubVaultOpen, setIsNewSubVaultOpen] = useState(false);
  const [isDepositMainOpen, setIsDepositMainOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferDefaultSource, setTransferDefaultSource] = useState<string>('');
  const [selectedVaultForCapital, setSelectedVaultForCapital] = useState<Vault | null>(null);
  const [selectedVaultForEdit, setSelectedVaultForEdit] = useState<Vault | null>(null);
  const [isSyncingLines, setIsSyncingLines] = useState(false);

  const isAdmin = currentUser.role === 'admin';
  const canManage = currentUser.role === 'admin' || currentUser.role === 'operations';

  // Load vaults & users
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getVaults();
      setVaults(res.vaults || []);
      setSummary(res.summary || null);

      if (isAdmin || canManage) {
        try {
          const userList = await api.getUsers();
          setUsers(userList || []);
        } catch {
          // Users list optional for lower roles
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

  // Filtered Sub-Vaults
  const mainVault = useMemo(() => vaults.find(v => v.type === 'main'), [vaults]);
  const customerVault = useMemo(() => vaults.find(v => v.type === 'customer'), [vaults]);
  
  const subVaults = useMemo(() => {
    return vaults.filter(v => v.type === 'sub').filter(v => {
      const matchSearch = 
        v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.branch && v.branch.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (v.assignedEmployeeName && v.assignedEmployeeName.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchBranch = branchFilter === 'all' || v.branch === branchFilter;
      const matchStatus = statusFilter === 'all' || v.status === statusFilter;

      return matchSearch && matchBranch && matchStatus;
    });
  }, [vaults, searchQuery, branchFilter, statusFilter]);

  const uniqueBranches = useMemo(() => {
    const list = vaults.filter(v => v.type === 'sub' && v.branch).map(v => v.branch as string);
    return Array.from(new Set(list));
  }, [vaults]);

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

  // Quick Open Transfer
  const handleOpenTransfer = (sourceId?: string) => {
    setTransferDefaultSource(sourceId || mainVault?.id || '');
    setIsTransferModalOpen(true);
  };

  const showToast = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const handleSyncLines = async () => {
    try {
      setIsSyncingLines(true);
      const res = await api.syncLinesWithCustomerVault();
      showToast(`تمت مزامنة رصيد خزينة العمليات بنجاح ليطابق إجمالي سيولة خطوط الكاش: ${formatAmount(res.totalLinesLiquidity)} ${settings.currency} عبر ${res.linesCount} خط`);
      loadData();
    } catch (err: any) {
      setError(err?.message || 'فشلت مزامنة سيولة الخطوط');
    } finally {
      setIsSyncingLines(false);
    }
  };

  const handleDeleteVault = async (vault: Vault) => {
    if (!window.confirm(`هل أنت متأكد من حذف الخزنة "${vault.name}" (${vault.code})؟`)) return;
    try {
      await api.deleteVault(vault.id);
      showToast(`تم حذف الخزنة "${vault.name}" بنجاح`);
      loadData();
    } catch (err: any) {
      setError(err?.message || 'تعذر حذف الخزنة');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-5 rounded-2xl backdrop-blur-md shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-blue-900/30">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
              إدارة الخزن المالية المركزية والفرعية
              <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold">
                نظام الخزن الثلاثي
              </span>
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-0.5">
              إشراف وتتبع حركة السيولة النقدية بين الخزنة الرئيسية، الخزن الفرعية، وخزنة عمليات العملاء
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center flex-wrap gap-2.5">
          {canManage && (
            <button
              onClick={handleSyncLines}
              disabled={isSyncingLines}
              className="px-4 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
              title="مزامنة فورية لسيولة خزينة عمليات العملاء مع إجمالي أرصدة خطوط الكاش"
            >
              <svg className={`w-4 h-4 text-purple-400 ${isSyncingLines ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{isSyncingLines ? 'جاري المزامنة...' : 'مزامنة سيولة الخطوط'}</span>
            </button>
          )}

          {canManage && (
            <button
              onClick={() => handleOpenTransfer()}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-900/30 flex items-center gap-1.5 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              تحويل نقدية بين الخزن
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => setIsDepositMainOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-900/30 flex items-center gap-1.5 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              إيداع سيولة بالخزنة الرئيسية
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => setIsNewSubVaultOpen(true)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/40 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              إضافة خزنة فرعية
            </button>
          )}
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-600/50 text-emerald-300 text-sm flex items-center justify-between shadow-lg animate-fadeIn">
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

      {/* Error Notification */}
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

      {/* PRIMARY VAULTS HIGHLIGHT SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 1. Main Central Vault (Prominent - 7 cols) */}
        {mainVault && (
          <div className="lg:col-span-7 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/60 border-2 border-blue-600/40 p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between">
            {/* Ambient Glow */}
            <div className="absolute -top-16 -right-16 w-52 h-52 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-52 h-52 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-inner">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black tracking-widest px-2.5 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {mainVault.code}
                      </span>
                      <span className="text-xs px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        {mainVault.status === 'active' ? 'نشطة - المصدر المركزي' : 'موقوفة'}
                      </span>
                    </div>
                    <h2 className="text-xl font-black text-white mt-1">
                      {mainVault.name}
                    </h2>
                    <p className="text-xs text-slate-400">
                      المستودع المالي المركزي - تغذية وتوزيع السيولة النقدية للخزن الفرعية
                    </p>
                  </div>
                </div>

                <div className="text-left">
                  <span className="text-xs text-slate-400 block font-medium">الرصيد المتاح المركزي</span>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight font-mono mt-0.5">
                    {formatAmount(mainVault.balance, 2)}
                    <span className="text-xs font-bold text-slate-400 mr-1.5">{settings.currency}</span>
                  </div>
                </div>
              </div>

              {/* Sub-Metrics inside Main Vault */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-5">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-1">المخصص للخزن الفرعية</span>
                  <div className="text-base font-black text-amber-400 font-mono">
                    {formatAmount(mainVault.allocatedBalance || 0)} {settings.currency}
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">وفقاً لسجلات الفروع</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-1">إجمالي التوريدات (الوارد)</span>
                  <div className="text-base font-black text-emerald-400 font-mono">
                    {formatAmount(mainVault.totalIn || 0)} {settings.currency}
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">رأس المال والتحويلات</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 col-span-2 sm:col-span-1">
                  <span className="text-[11px] text-slate-400 block mb-1">إجمالي الصادر للفروع</span>
                  <div className="text-base font-black text-rose-400 font-mono">
                    {formatAmount(mainVault.totalOut || 0)} {settings.currency}
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">تحويلات تغذية الفروع</span>
                </div>
              </div>

              {/* Recent Activity Footnote */}
              <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-900/40 text-xs text-slate-300 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>آخر حركة: <strong className="font-mono">{mainVault.lastTransactionAmount ? `${formatAmount(mainVault.lastTransactionAmount)} ${settings.currency}` : 'لا توجد حركات اليوم'}</strong></span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {mainVault.updatedAt ? formatTime(mainVault.updatedAt) : '-'}
                </span>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="flex items-center gap-2.5 pt-5 border-t border-slate-800/80 mt-4 flex-wrap">
              <button
                onClick={() => handleOpenDetails(mainVault)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all border border-slate-700 flex items-center gap-1.5 cursor-pointer"
              >
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                سجل العمليات
              </button>

              {isAdmin && (
                <button
                  onClick={() => setSelectedVaultForCapital(mainVault)}
                  className="px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  title="تعديل رأس المال المباشر للخزنة"
                >
                  <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  تعديل رأس المال
                </button>
              )}

              {isAdmin && (
                <button
                  onClick={() => setSelectedVaultForEdit(mainVault)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  title="تعديل اسم وبيانات الخزنة"
                >
                  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  تعديل البيانات
                </button>
              )}

              {canManage && (
                <button
                  onClick={() => handleOpenTransfer(mainVault.id)}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-900/30 flex items-center gap-1.5 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                  تحويل لخزنة فرعية
                </button>
              )}

              {isAdmin && (
                <button
                  onClick={() => setIsDepositMainOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer mr-auto"
                >
                  <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  توريد سيولة
                </button>
              )}
            </div>
          </div>
        )}

        {/* 2. Customer Operations Vault (Dedicated - 5 cols) */}
        {customerVault && (
          <div className="lg:col-span-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border-2 border-emerald-600/30 p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute -top-12 -left-12 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner">
                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {customerVault.code}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                        مرتبطة بالخطوط
                      </span>
                    </div>
                    <h2 className="text-lg font-black text-white mt-1">
                      {customerVault.name}
                    </h2>
                  </div>
                </div>
              </div>

              {/* Strict Non-negative Rule Badge */}
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-600/40 text-amber-300 text-xs flex items-center gap-2.5 mb-4">
                <svg className="w-5 h-5 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <div>
                  <strong className="font-bold block text-amber-200">حماية السيولة - منع الرصيد السالب</strong>
                  <span className="text-[11px] text-amber-400/90 leading-tight">تخصم أي عملية تحويل من هذا الرصيد وتضاف أي عملية إيداع وارد له تلقائياً</span>
                </div>
              </div>

              {/* Customer Balance Metric */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-center mb-4">
                <span className="text-xs text-slate-400 block mb-1">الرصيد الفعلي لسيولة خطوط ومحافظ العملاء</span>
                <div className="text-xl sm:text-2xl font-black text-emerald-400 tracking-tight font-mono">
                  {formatAmount(customerVault.balance, 2)}
                  <span className="text-xs font-bold text-slate-400 mr-1.5">{settings.currency}</span>
                </div>
                <span className="text-[11px] text-emerald-500 block mt-1 font-medium">مطابق 100% لإجمالي أرصدة محافظ الكاش</span>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="flex items-center gap-2 pt-4 border-t border-slate-800 flex-wrap">
              <button
                onClick={() => handleOpenDetails(customerVault)}
                className="flex-1 min-w-[120px] px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                سجل الحركات
              </button>

              <button
                onClick={handleSyncLines}
                disabled={isSyncingLines}
                className="flex-1 min-w-[130px] px-3 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-900/30 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="مزامنة فورية للرصيد مع مجموع خطوط ومحافظ الكاش"
              >
                <svg className={`w-3.5 h-3.5 ${isSyncingLines ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>{isSyncingLines ? 'جاري المزامنة...' : 'مزامنة السيولة'}</span>
              </button>

              {isAdmin && (
                <button
                  onClick={() => setSelectedVaultForCapital(customerVault)}
                  className="px-2.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                  title="تعديل رأس مال خزينة العملاء"
                >
                  <svg className="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  تعديل الرصيد
                </button>
              )}

              {isAdmin && (
                <button
                  onClick={() => setSelectedVaultForEdit(customerVault)}
                  className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                  title="تعديل بيانات الخزنة"
                >
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  تعديل
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. SUB-VAULTS (خزن الفروع والكاشيرات) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-800/80">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <span>الخزن الفرعية وخزن الفروع</span>
              <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-bold border border-slate-700">
                {subVaults.length} خزنة
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              خزن التشغيل الميداني، استلام التحويلات، تسليم النوبات والكاشيرات
            </p>
          </div>

          {/* Filters & Search Bar */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث باسم الخزنة، الكود، الموظف..."
                className="w-56 sm:w-64 pl-3 pr-8 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all"
              />
              <svg className="w-4 h-4 text-slate-500 absolute right-2.5 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Branch Filter */}
            {uniqueBranches.length > 0 && (
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="py-2 px-3 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-300 focus:outline-none focus:border-blue-500 transition-all"
              >
                <option value="all">كل الفروع</option>
                {uniqueBranches.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            )}

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-2 px-3 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-300 focus:outline-none focus:border-blue-500 transition-all"
            >
              <option value="all">كل الحالات</option>
              <option value="active">نشطة</option>
              <option value="suspended">موقوفة</option>
            </select>
          </div>
        </div>

        {/* Sub-Vaults Grid */}
        {subVaults.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80">
            <svg className="w-12 h-12 text-slate-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-sm font-bold text-slate-400">لا توجد خزن فرعية تطابق البحث</p>
            {isAdmin && (
              <button
                onClick={() => setIsNewSubVaultOpen(true)}
                className="mt-3 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
              >
                إضافة خزنة فرعية جديدة
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {subVaults.map((vault) => {
              const isBelowMin = vault.minBalance && vault.balance < vault.minBalance;
              return (
                <div
                  key={vault.id}
                  className="rounded-2xl bg-slate-900/90 border border-slate-800/90 hover:border-slate-700 transition-all p-5 shadow-lg flex flex-col justify-between group"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {vault.code}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                            vault.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          }`}>
                            {vault.status === 'active' ? 'نشطة' : 'موقوفة'}
                          </span>
                        </div>
                        <h4 className="text-base font-black text-white group-hover:text-blue-400 transition-colors">
                          {vault.name}
                        </h4>
                        <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {vault.branch || 'الفرع الرئيسي'}
                        </span>
                      </div>

                      {/* Icon */}
                      <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0">
                        <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                        </svg>
                      </div>
                    </div>

                    {/* Balance */}
                    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 my-3">
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                        <span>الرصيد التشغيلي الحالي</span>
                        {isBelowMin && (
                          <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 font-bold">
                            أقل من الحد الأدنى
                          </span>
                        )}
                      </div>
                      <div className="text-xl font-black text-white font-mono">
                        {formatAmount(vault.balance, 2)}
                        <span className="text-xs font-bold text-slate-400 mr-1.5">{settings.currency}</span>
                      </div>
                    </div>

                    {/* Assigned Employee & Shift */}
                    <div className="space-y-1.5 text-xs text-slate-300 py-2 border-y border-slate-800/60">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          الموظف المسؤول:
                        </span>
                        <strong className="text-white font-bold">
                          {vault.assignedEmployeeName || 'غير معين'}
                        </strong>
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">إجمالي الوارد / الصادر:</span>
                        <span className="font-mono text-slate-300">
                          +{formatAmount(vault.totalIn || 0)} / -{formatAmount(vault.totalOut || 0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-4 mt-2 border-t border-slate-800/80">
                    <button
                      onClick={() => handleOpenDetails(vault)}
                      className="flex-1 min-w-[70px] py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold transition-all border border-slate-700/80 text-center cursor-pointer"
                      title="عرض سجل العمليات والتفاصيل"
                    >
                      التفاصيل
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => setSelectedVaultForCapital(vault)}
                        className="py-1.5 px-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                        title="تعديل رأس مال الخزنة مباشرة"
                      >
                        <svg className="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        رأس المال
                      </button>
                    )}

                    {isAdmin && (
                      <button
                        onClick={() => setSelectedVaultForEdit(vault)}
                        className="py-1.5 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                        title="تعديل بيانات الخزنة"
                      >
                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        تعديل
                      </button>
                    )}

                    {canManage && (
                      <button
                        onClick={() => handleOpenTransfer(vault.id)}
                        className="py-1.5 px-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                        title="تحويل نقدية من/إلى هذه الخزنة"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                        تحويل
                      </button>
                    )}

                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteVault(vault)}
                        className="py-1.5 px-2 rounded-xl bg-rose-600/15 hover:bg-rose-600/25 text-rose-400 border border-rose-500/30 text-[11px] font-bold transition-all cursor-pointer"
                        title="حذف الخزنة الفرعية"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL 1: Vault Details & Ledger */}
      {selectedVaultForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn" dir="rtl">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    {selectedVaultForDetails.name}
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                      {selectedVaultForDetails.code}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    كشف حساب وسجل حركات الخزنة النقدية
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedVaultForDetails(null)}
                className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Quick Balance Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-5 bg-slate-950/40 border-b border-slate-800">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[11px] text-slate-400 block">الرصيد الفعلي الحالي</span>
                <span className="text-xl font-black text-emerald-400 font-mono">
                  {formatAmount(selectedVaultForDetails.balance, 2)} {settings.currency}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[11px] text-slate-400 block">إجمالي الوارد</span>
                <span className="text-base font-black text-blue-400 font-mono">
                  +{formatAmount(selectedVaultForDetails.totalIn || 0)} {settings.currency}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[11px] text-slate-400 block">إجمالي المنصرف</span>
                <span className="text-base font-black text-rose-400 font-mono">
                  -{formatAmount(selectedVaultForDetails.totalOut || 0)} {settings.currency}
                </span>
              </div>
            </div>

            {/* Transactions List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                آخر الحركات المسجلة ({formatCount(vaultTransactions.length)})
              </h4>

              {txLoading ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  جاري تحميل العمليات...
                </div>
              ) : vaultTransactions.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  لا توجد حركات مسجلة على هذه الخزنة بعد
                </div>
              ) : (
                <div className="divide-y divide-slate-800/80 border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60">
                  {vaultTransactions.map((tx) => {
                    const isCredit = tx.targetVaultId === selectedVaultForDetails.id;
                    return (
                      <div key={tx.id} className="p-3.5 flex items-center justify-between gap-4 text-xs hover:bg-slate-900/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isCredit ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                          }`}>
                            {isCredit ? '+' : '-'}
                          </div>
                          <div>
                            <div className="font-bold text-white flex items-center gap-2">
                              <span>{tx.notes || (isCredit ? 'إيداع / استلام وارد' : 'صرف / تحويل صادر')}</span>
                              <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded">
                                {tx.referenceNumber}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                              <span>بواسطة: {tx.operatorName}</span>
                              <span>•</span>
                              <span className="font-mono">{formatDateTime(tx.timestamp)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-left">
                          <div className={`text-sm font-black font-mono ${isCredit ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isCredit ? '+' : '-'}{formatAmount(tx.amount)} {settings.currency}
                          </div>
                          <span className="text-[10px] text-slate-500 block">
                            {tx.type}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
              <button
                onClick={() => setSelectedVaultForDetails(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Transfer Between Vaults */}
      {isTransferModalOpen && (
        <TransferBetweenVaultsModal
          vaults={vaults.filter(v => v.status === 'active')}
          defaultSourceId={transferDefaultSource}
          currency={settings.currency}
          onClose={() => setIsTransferModalOpen(false)}
          onSuccess={(msg) => {
            setIsTransferModalOpen(false);
            showToast(msg);
            loadData();
          }}
        />
      )}

      {/* MODAL 3: Deposit to Main Vault (Admin) */}
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

      {/* MODAL 4: Create Sub-Vault (Admin) */}
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

      {/* MODAL 5: Adjust Vault Capital / Balance (Admin) */}
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

      {/* MODAL 6: Edit Vault Details (Admin) */}
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
    </div>
  );
};

// ==========================================
// SUB-COMPONENTS / MODALS
// ==========================================

// Modal: Transfer Between Vaults
interface TransferModalProps {
  vaults: Vault[];
  defaultSourceId?: string;
  currency: string;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

const TransferBetweenVaultsModal: React.FC<TransferModalProps> = ({
  vaults,
  defaultSourceId,
  currency,
  onClose,
  onSuccess,
}) => {
  const [sourceId, setSourceId] = useState(defaultSourceId || vaults[0]?.id || '');
  const [targetId, setTargetId] = useState(vaults.find(v => v.id !== sourceId)?.id || '');
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
    { label: '+1,000', add: 1000 },
    { label: '+5,000', add: 5000 },
    { label: '+10,000', add: 10000 },
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn" dir="rtl">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-800 dark:text-white">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600/15 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/30">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-black">تحويل نقدية بين الخزن</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">قيد مزدوج فوري مع التحقق من كفاية الرصيد</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center cursor-pointer transition"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-600/40 text-rose-700 dark:text-rose-300 text-xs font-bold">
              {error}
            </div>
          )}

          {/* Source Vault */}
          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
              الخزنة المصدر (المرسلة) *
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
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-sans focus:outline-none focus:border-blue-500 transition leading-relaxed"
            >
              {vaults.map((v) => (
                <option key={v.id} value={v.id} className="py-1">
                  {v.name} ({v.code}) - الرصيد: {formatAmount(v.balance)} {currency}
                </option>
              ))}
            </select>
            {sourceVault && (
              <div className="flex items-center justify-between text-xs mt-1.5">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  الرصيد المتاح: <strong className="font-mono">{formatAmount(sourceVault.balance)} {currency}</strong>
                </span>
                {sourceVault.balance > 0 && (
                  <button
                    type="button"
                    onClick={handleMaxAmount}
                    className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    تحويل كامل الرصيد المتاح
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Target Vault */}
          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
              الخزنة الوجهة (المستلمة) *
            </label>
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-sans focus:outline-none focus:border-blue-500 transition leading-relaxed"
            >
              {vaults.filter(v => v.id !== sourceId).map((v) => (
                <option key={v.id} value={v.id} className="py-1">
                  {v.name} ({v.code}) - الرصيد الحالي: {formatAmount(v.balance)} {currency}
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
              مبلغ التحويل ({currency}) *
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className={`w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border text-slate-900 dark:text-white font-mono text-base font-bold focus:outline-none transition ${
                  isInsufficient
                    ? 'border-rose-500 text-rose-500 dark:text-rose-400'
                    : 'border-slate-300 dark:border-slate-800 focus:border-blue-500'
                }`}
                required
              />
              <span className="absolute left-3 top-3 text-xs text-slate-400 font-bold">{currency}</span>
            </div>

            {/* Quick Amount Presets */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[10.5px] text-slate-400 font-bold ml-1">إضافة سريعة:</span>
              {quickPresets.map((p) => (
                <button
                  type="button"
                  key={p.label}
                  onClick={() => handleAddPreset(p.add)}
                  className="px-2 py-0.5 rounded-lg text-[10.5px] font-mono font-bold bg-slate-100 hover:bg-blue-100 dark:bg-slate-800 dark:hover:bg-blue-950 border border-slate-200 dark:border-slate-700 hover:border-blue-400 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-300 transition cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>

            {isInsufficient && (
              <span className="text-[11px] text-rose-600 dark:text-rose-400 block mt-1.5 font-bold">
                تنبيه: المبلغ المطلوب أكبر من الرصيد المتوفر في الخزنة المصدر!
              </span>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
              البيان / ملاحظات التحويل
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: تغذية نوبة مسائية، إعادة توازن سيولة..."
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-sans focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={submitting || isInsufficient || isInvalidAmount}
              className={`px-6 py-2 rounded-xl text-white text-xs font-bold shadow-lg transition-all cursor-pointer ${
                submitting || isInsufficient || isInvalidAmount
                  ? 'bg-slate-400 dark:bg-slate-800 text-slate-200 dark:text-slate-500 cursor-not-allowed shadow-none'
                  : 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/30'
              }`}
            >
              {submitting ? 'جاري التحويل...' : 'تأكيد التحويل الآن'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal: Adjust Vault Capital / Balance
interface AdjustCapitalModalProps {
  vault: Vault;
  currency: string;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

const AdjustCapitalModal: React.FC<AdjustCapitalModalProps> = ({
  vault,
  currency,
  onClose,
  onSuccess,
}) => {
  const [newBalance, setNewBalance] = useState(String(vault.balance || 0));
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsed = Number(newBalance);
  const isInvalid = isNaN(parsed) || parsed < 0;

  const quickPresets = [
    { label: '0.00 (تصفير)', val: 0 },
    { label: '50,000', val: 50000 },
    { label: '100,000', val: 100000 },
    { label: '250,000', val: 250000 },
    { label: '500,000', val: 500000 },
    { label: '1,000,000', val: 1000000 },
    { label: '2,500,000', val: 2500000 },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isInvalid) {
      setError('الرجاء إدخال مبلغ صحيح (صفر أو أكبر)');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await api.adjustVaultCapital(vault.id, parsed, notes.trim() || undefined);
      onSuccess(`تم تعديل رأس مال (${vault.name}) بنجاح إلى ${formatAmount(parsed)} ${currency}`);
    } catch (err: any) {
      setError(err?.message || 'فشل تعديل رأس المال');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn" dir="rtl">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-slate-800 dark:text-white">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/30">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-black">تعديل رأس المال المباشر</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {vault.name} ({vault.code})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center cursor-pointer transition"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-600/40 text-rose-700 dark:text-rose-300 text-xs font-bold">
              {error}
            </div>
          )}

          {/* Current balance indicator */}
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">الرصيد / رأس المال الحالي:</span>
            <span className="font-mono font-black text-slate-800 dark:text-white text-sm">
              {formatAmount(vault.balance)} {currency}
            </span>
          </div>

          {/* New Balance input */}
          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
              رأس المال / الرصيد الجديد المطلوب ({currency}) *
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                min="0"
                value={newBalance}
                onChange={(e) => setNewBalance(e.target.value)}
                placeholder="0.00"
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-base font-bold focus:outline-none focus:border-amber-500 transition"
                required
              />
              <span className="absolute left-3 top-3 text-xs text-slate-400 font-bold">{currency}</span>
            </div>
          </div>

          {/* Presets */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1.5">
              مبالغ سريعة جاهزة:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {quickPresets.map((p) => (
                <button
                  type="button"
                  key={p.label}
                  onClick={() => setNewBalance(String(p.val))}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-slate-100 hover:bg-amber-100 dark:bg-slate-800 dark:hover:bg-amber-950/60 border border-slate-200 dark:border-slate-700 hover:border-amber-400 text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-300 transition cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
              البيان / سبب التعديل
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: تعيين رأس مال تشغيلي أولي، تسوية جرد..."
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-sans focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={submitting || isInvalid}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white text-xs font-bold shadow-lg shadow-amber-900/30 transition cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'جاري الحفظ...' : 'تأكيد تعديل رأس المال'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal: Edit Vault Information
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
  const [branch, setBranch] = useState(vault.branch || '');
  const [assignedEmployeeId, setAssignedEmployeeId] = useState(vault.assignedEmployeeId || '');
  const [status, setStatus] = useState<'active' | 'suspended'>(vault.status);
  const [minBalance, setMinBalance] = useState(String(vault.minBalance || 0));
  const [maxBalance, setMaxBalance] = useState(String(vault.maxBalance || 1000000));
  const [notes, setNotes] = useState(vault.notes || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('الرجاء إدخال اسم الخزنة');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await api.updateVault(vault.id, {
        name: name.trim(),
        branch: branch.trim() || undefined,
        assignedEmployeeId: assignedEmployeeId || undefined,
        status,
        minBalance: Number(minBalance) || 0,
        maxBalance: Number(maxBalance) || 1000000,
        notes: notes.trim() || undefined,
      });
      onSuccess(`تم تحديث بيانات الخزنة "${name}" بنجاح`);
    } catch (err: any) {
      setError(err?.message || 'فشل تحديث بيانات الخزنة');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn" dir="rtl">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-800 dark:text-white">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600/15 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/30">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-black">تعديل بيانات الخزنة</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{vault.name} ({vault.code})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center cursor-pointer transition"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-600/40 text-rose-700 dark:text-rose-300 text-xs font-bold">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">اسم الخزنة *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-sans focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">الفرع / الموقع</label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-sans focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">حالة الخزنة</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-sans focus:outline-none focus:border-blue-500"
              >
                <option value="active">نشطة (متاحة للعمليات)</option>
                <option value="suspended">موقوفة مؤقتاً</option>
              </select>
            </div>
          </div>

          {vault.type === 'sub' && (
            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">الموظف المسؤول الأول</label>
              <select
                value={assignedEmployeeId}
                onChange={(e) => setAssignedEmployeeId(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-sans focus:outline-none focus:border-blue-500"
              >
                <option value="">-- بدون تعيين موظف محدد --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} ({u.username}) - {u.role}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">الحد الأدنى للرصيد ({currency})</label>
              <input
                type="number"
                value={minBalance}
                onChange={(e) => setMinBalance(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">الحد الأقصى للرصيد ({currency})</label>
              <input
                type="number"
                value={maxBalance}
                onChange={(e) => setMaxBalance(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">ملاحظات وتعليمات</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ملاحظات تشغيلية..."
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-sans focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-900/30 transition cursor-pointer"
            >
              {submitting ? 'جاري الحفظ...' : 'حفظ التعديلات'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal: Deposit Capital to Main Vault
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(amount);
    if (isNaN(num) || num <= 0) {
      setError('الرجاء إدخال مبلغ إيداع صحيح');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await api.depositToMainVault(mainVault.id, num, notes.trim() || undefined);
      onSuccess(`تم توريد مبلغ ${formatAmount(num)} ${currency} إلى الخزنة المركزية الرئيسية بنجاح`);
    } catch (err: any) {
      setError(err?.message || 'فشل إتمام التوريد');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn" dir="rtl">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-slate-800 dark:text-white">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-black">إيداع سيولة بالخزنة الرئيسية</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">توريد رأسمالي مركزي</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center cursor-pointer transition"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-600/40 text-rose-700 dark:text-rose-300 text-xs font-bold">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
              المبلغ المودع ({currency}) *
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-base font-bold focus:outline-none focus:border-emerald-500 transition"
                required
              />
              <span className="absolute left-3 top-3 text-xs text-slate-400 font-bold">{currency}</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
              البيان / مصدر السيولة
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: توريد نقدية من الحساب البنكي، رأس مال تشغيلي..."
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-sans focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={submitting || !amount}
              className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/30 transition cursor-pointer"
            >
              {submitting ? 'جاري التوريد...' : 'تأكيد التوريد'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal: Create New Sub-Vault
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
  const [code, setCode] = useState('');
  const [branch, setBranch] = useState('فرع المهندسين');
  const [assignedEmployeeId, setAssignedEmployeeId] = useState('');
  const [minBalance, setMinBalance] = useState('20000');
  const [maxBalance, setMaxBalance] = useState('1000000');
  const [notes, setNotes] = useState('');
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
      setError(null);
      await api.createSubVault({
        name: name.trim(),
        code: code.trim() || undefined,
        branch: branch.trim() || undefined,
        assignedEmployeeId: assignedEmployeeId || undefined,
        minBalance: Number(minBalance) || 20000,
        maxBalance: Number(maxBalance) || 1000000,
        notes: notes.trim() || undefined,
      });
      onSuccess(`تم إنشاء الخزنة الفرعية "${name}" بنجاح`);
    } catch (err: any) {
      setError(err?.message || 'فشل إنشاء الخزنة الفرعية');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn" dir="rtl">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-800 dark:text-white">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-600/15 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/30">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-black">إضافة خزنة فرعية جديدة</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">تخصيص خزنة تشغيل لكاشير أو فرع</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center cursor-pointer transition"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-600/40 text-rose-700 dark:text-rose-300 text-xs font-bold">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">اسم الخزنة الفرعية *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: خزنة كاشير 2 - فرع المعادي"
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-sans focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">كود الخزنة (اختياري)</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="تلقائي: SUB-03"
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-sans focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">الفرع / الموقع</label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="مثال: فرع مدينة نصر"
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-sans focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">الموظف المسؤول الأول (اختياري)</label>
            <select
              value={assignedEmployeeId}
              onChange={(e) => setAssignedEmployeeId(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-sans focus:outline-none focus:border-blue-500"
            >
              <option value="">-- بدون تعيين مبدئي (يتم التعيين عند استلام النوبة) --</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName} ({u.username}) - {u.role}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">الحد الأدنى للرصيد ({currency})</label>
              <input
                type="number"
                value={minBalance}
                onChange={(e) => setMinBalance(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">الحد الأقصى للرصيد ({currency})</label>
              <input
                type="number"
                value={maxBalance}
                onChange={(e) => setMaxBalance(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">ملاحظات إضافية</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="وصف الخزنة أو تعليمات الصرف..."
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-sans focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={submitting || !name}
              className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-900/30 transition cursor-pointer"
            >
              {submitting ? 'جاري الإنشاء...' : 'إنشاء الخزنة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
