import React, { useState, useEffect } from 'react';
import { Vault, VaultTransaction } from '../types';
import { api } from '../services/api';
import { formatAmount, formatDateTime, formatTime, formatCount } from '../utils/formatters';
import { 
  Building2, 
  Layers, 
  ShieldCheck, 
  ShieldAlert, 
  X, 
  ArrowLeftRight, 
  Printer, 
  RefreshCw, 
  ArrowDownLeft, 
  ArrowUpRight, 
  User, 
  Calendar, 
  Search,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface VaultDetailsModalProps {
  vault: Vault | null;
  onClose: () => void;
  onNavigateToVaults?: () => void;
  currency?: string;
}

export const VaultDetailsModal: React.FC<VaultDetailsModalProps> = ({
  vault,
  onClose,
  onNavigateToVaults,
  currency = 'ج.م',
}) => {
  const [transactions, setTransactions] = useState<VaultTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'in' | 'out'>('all');
  const [activeVault, setActiveVault] = useState<Vault | null>(vault);

  useEffect(() => {
    setActiveVault(vault);
    if (vault) {
      loadVaultDetails(vault.id);
    }
  }, [vault]);

  const loadVaultDetails = async (vaultId: string) => {
    setLoading(true);
    try {
      const res = await api.getVaultById(vaultId);
      if (res?.vault) {
        setActiveVault(res.vault);
      }
      setTransactions(res?.transactions || []);
    } catch (err) {
      console.error('Failed to load vault details:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!activeVault) return null;

  const isMain = activeVault.type === 'main';
  const isCustomer = activeVault.type === 'customer';
  const isSub = activeVault.type === 'sub';

  const themeColors = isMain
    ? {
        border: 'border-blue-500/40',
        borderTop: 'border-t-blue-600',
        badge: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
        iconBg: 'bg-blue-600/20 text-blue-400 border-blue-500/30',
      }
    : isCustomer
    ? {
        border: 'border-emerald-500/40',
        borderTop: 'border-t-emerald-600',
        badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        iconBg: 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30',
      }
    : {
        border: 'border-indigo-500/40',
        borderTop: 'border-t-indigo-600',
        badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
        iconBg: 'bg-indigo-600/20 text-indigo-400 border-indigo-500/30',
      };

  const filteredTransactions = transactions.filter((tx) => {
    const isCredit = tx.targetVaultId === activeVault.id;
    if (filterType === 'in' && !isCredit) return false;
    if (filterType === 'out' && isCredit) return false;

    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      tx.referenceNumber?.toLowerCase().includes(q) ||
      tx.notes?.toLowerCase().includes(q) ||
      tx.operatorName?.toLowerCase().includes(q) ||
      tx.sourceVaultName?.toLowerCase().includes(q) ||
      tx.targetVaultName?.toLowerCase().includes(q)
    );
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fadeIn"
      dir="rtl"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`bg-slate-900 border-2 ${themeColors.border} ${themeColors.borderTop} rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-scaleIn relative`}>
        
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-11 h-11 rounded-2xl ${themeColors.iconBg} flex items-center justify-center border shrink-0 shadow-inner`}>
              {isMain && <Building2 className="w-6 h-6" />}
              {isSub && <Layers className="w-6 h-6" />}
              {isCustomer && <ShieldCheck className="w-6 h-6" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-white truncate">
                  {activeVault.name}
                </h3>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                  {activeVault.code}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${themeColors.badge}`}>
                  {isMain ? 'الخزنة المركزية الرئيسية' : isCustomer ? 'خزنة عمليات العملاء' : 'خزنة فرعية تشغيلية'}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{activeVault.status === 'active' ? 'نشطة ومعتمدة' : 'موقوفة'}</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 truncate">
                {isMain 
                  ? 'المركز الرئيسي لإيداع السيولة وتوزيع العهد على الخزن الفرعية' 
                  : isCustomer 
                  ? 'رصيد سيولة خطوط الكاش وحماية ضد العجز المالي للعملاء' 
                  : `خزنة تشغيلية تابعة لـ ${activeVault.branch || 'الفرع'} تحت عهدة الموظف المسؤول`}
              </p>
            </div>
          </div>

          {/* Action buttons: Refresh, Print, Close */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => loadVaultDetails(activeVault.id)}
              disabled={loading}
              className="p-2 sm:p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer disabled:opacity-50"
              title="تحديث بيانات الخزنة وحركاتها"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="p-2 sm:p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer hidden sm:flex"
              title="طباعة كشف حساب الخزنة"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-500/50 flex items-center justify-center transition cursor-pointer"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Financial Highlights Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 sm:p-5 bg-slate-950/60 border-b border-slate-800 shrink-0">
          
          {/* Card 1: Current Balance */}
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
            <span className="text-[11px] text-slate-400 block mb-1">الرصيد الفعلي الحالي</span>
            <div className="text-lg sm:text-xl font-black text-emerald-400 font-mono tracking-tight flex items-baseline gap-1">
              <span>{formatAmount(activeVault.balance, 2)}</span>
              <span className="text-xs font-bold text-slate-500 font-sans">{currency}</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">محدث لحظياً</span>
          </div>

          {/* Card 2: Total Inflow */}
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
            <span className="text-[11px] text-slate-400 block mb-1">إجمالي الوارد للخزنة</span>
            <div className="text-base sm:text-lg font-black text-blue-400 font-mono tracking-tight flex items-baseline gap-1">
              <span>+{formatAmount(activeVault.totalIn || 0, 2)}</span>
              <span className="text-xs font-bold text-slate-500 font-sans">{currency}</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">تغذيات وإيداعات نقدية</span>
          </div>

          {/* Card 3: Total Outflow */}
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
            <span className="text-[11px] text-slate-400 block mb-1">إجمالي المنصرف من الخزنة</span>
            <div className="text-base sm:text-lg font-black text-rose-400 font-mono tracking-tight flex items-baseline gap-1">
              <span>-{formatAmount(activeVault.totalOut || 0, 2)}</span>
              <span className="text-xs font-bold text-slate-500 font-sans">{currency}</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">تحويلات وصرفيات معتمدة</span>
          </div>

          {/* Card 4: Allocated or Branch */}
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
            <span className="text-[11px] text-slate-400 block mb-1">
              {isMain ? 'المخصص للخزن الفرعية' : isSub ? 'الموظف المسؤول' : 'حالة العجز'}
            </span>
            <div className="text-sm sm:text-base font-black text-amber-400 font-mono tracking-tight truncate">
              {isMain ? (
                `${formatAmount(activeVault.allocatedBalance || 0)} ${currency}`
              ) : isSub ? (
                activeVault.assignedEmployeeName || 'غير محدد'
              ) : (
                'محمية ضد العجز'
              )}
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block truncate">
              {isMain ? 'وفق سجلات الفروع' : isSub ? (activeVault.branch || 'فرع رئيسي') : 'لا يسمح برصيد سالب'}
            </span>
          </div>

        </div>

        {/* Metadata Details Strip */}
        <div className="px-4 sm:px-5 py-2.5 bg-slate-950/40 border-b border-slate-800/80 flex items-center justify-between flex-wrap gap-2 text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-4 flex-wrap">
            {activeVault.branch && (
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                <span>الفرع: <strong className="text-slate-200 font-semibold">{activeVault.branch}</strong></span>
              </span>
            )}
            {activeVault.assignedEmployeeName && (
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>أمين العهدة: <strong className="text-slate-200 font-semibold">{activeVault.assignedEmployeeName}</strong></span>
              </span>
            )}
            {activeVault.minBalance !== undefined && activeVault.maxBalance !== undefined && (
              <span className="flex items-center gap-1.5 font-mono">
                <span>حدود السيولة:</span>
                <strong className="text-slate-200">{formatAmount(activeVault.minBalance)} - {formatAmount(activeVault.maxBalance)} {currency}</strong>
              </span>
            )}
          </div>
          {activeVault.updatedAt && (
            <span className="flex items-center gap-1 text-[11px] text-slate-500">
              <Calendar className="w-3 h-3" />
              <span>آخر تحديث: {formatDateTime(activeVault.updatedAt)}</span>
            </span>
          )}
        </div>

        {/* Ledger & Transactions Section */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          
          {/* Controls: Search & In/Out Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pb-2">
            <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-black text-white flex items-center gap-2">
                <span>سجل كشف الحساب والعمليات</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono font-bold">
                  {formatCount(filteredTransactions.length)} حركة
                </span>
              </h4>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Type filter */}
              <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setFilterType('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                    filterType === 'all' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  الكل
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('in')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                    filterType === 'in' ? 'bg-blue-600 text-white shadow-xs' : 'text-blue-400 hover:text-blue-300'
                  }`}
                >
                  <span>وارد (+)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('out')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                    filterType === 'out' ? 'bg-rose-600 text-white shadow-xs' : 'text-rose-400 hover:text-rose-300'
                  }`}
                >
                  <span>صادر (-)</span>
                </button>
              </div>

              {/* Search input */}
              <div className="relative min-w-[160px] sm:min-w-[200px]">
                <Search className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="بحث في الحركات..."
                  className="w-full pr-8 pl-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Transactions List */}
          {loading ? (
            <div className="text-center py-12 text-slate-500 text-xs flex flex-col items-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
              <span>جاري تحميل كشف الحساب والحركات النقدية...</span>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-12 rounded-2xl bg-slate-950/40 border border-slate-800/80 text-slate-400 text-xs space-y-1">
              <p className="font-bold text-slate-300">لا توجد حركات مطابقة في سجل هذه الخزنة</p>
              <p className="text-[11px] text-slate-500">كافة العمليات والتحويلات المسجلة ستظهر هنا فور إتمامها مباشرة</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80 border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/70">
              {filteredTransactions.map((tx) => {
                const isCredit = tx.targetVaultId === activeVault.id;
                return (
                  <div 
                    key={tx.id} 
                    className="p-3.5 flex items-center justify-between gap-3 text-xs hover:bg-slate-900/60 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border shadow-xs ${
                        isCredit 
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' 
                          : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                      }`}>
                        {isCredit ? '+' : '-'}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-white flex items-center gap-2 flex-wrap">
                          <span className="truncate max-w-[200px] sm:max-w-md">
                            {tx.notes || (isCredit ? 'إيداع نقدي وارد للخزنة' : 'صرف / تحويل نقدي صادر')}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 shrink-0">
                            {tx.referenceNumber}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                          <span>بواسطة: <strong className="text-slate-300 font-semibold">{tx.operatorName}</strong></span>
                          <span>•</span>
                          <span className="font-mono text-slate-500">{formatDateTime(tx.timestamp)}</span>
                          {tx.sourceVaultName && tx.targetVaultName && (
                            <>
                              <span>•</span>
                              <span className="text-[10px] text-slate-400">
                                من: {tx.sourceVaultName} ⬅ إلى: {tx.targetVaultName}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-left shrink-0">
                      <div className={`text-sm sm:text-base font-black font-mono tracking-tight ${isCredit ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isCredit ? '+' : '-'}{formatAmount(tx.amount, 2)} <span className="text-xs font-sans font-bold">{currency}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 block text-left">
                        {tx.type === 'deposit_main' 
                          ? 'إيداع مركزي' 
                          : tx.type === 'transfer_main_to_sub' 
                          ? 'تحويل لفرعية' 
                          : tx.type === 'transfer_sub_to_main' 
                          ? 'توريد للمركزية' 
                          : tx.type === 'allocate_customer_vault' 
                          ? 'تغذية خزنة العملاء' 
                          : 'تسوية نقدية'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/90 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>بيانات الخزنة مؤمنة ومشفرة ضمن نظام المحاسبة المزدوجة المتطابق</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onNavigateToVaults && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToVaults();
                }}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-blue-900/30 cursor-pointer"
              >
                <span>الانتقال لإدارة الخزن والتحويل</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition border border-slate-700 text-center cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
