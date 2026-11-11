import React, { useEffect, useState } from 'react';
import { DashboardStats, Transfer, CashLine, Vault } from '../types';
import { api } from '../services/api';
import { ProviderBadge } from './ProviderBadge';
import { 
  formatAmount, 
  formatCount, 
  formatDateTime,
  formatTime
} from '../utils/formatters';
import { 
  ArrowLeftRight, 
  Wallet, 
  Calendar, 
  Banknote, 
  CheckCircle2, 
  XCircle, 
  Coins, 
  TrendingUp, 
  ShieldAlert, 
  Plus, 
  ExternalLink, 
  RefreshCw, 
  Clock, 
  Layers, 
  Sparkles, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Filter, 
  Search,
  Building2,
  Shield
} from 'lucide-react';

import { WeeklyTransfersChart } from './WeeklyTransfersChart';
import { CardDetailsModal, CardDetailType } from './CardDetailsModal';
import { VaultDetailsModal } from './VaultDetailsModal';

interface DashboardViewProps {
  onNavigate: (tab: string) => void;
  onOpenTransferModal: (initialLineId?: string) => void;
  onOpenReceiveModal?: (initialLineId?: string) => void;
  onViewTransferDetails: (transfer: Transfer) => void;
  onPrintReceipt: (transfer: Transfer) => void;
}

export type DashboardPeriod = 'today' | 'yesterday' | 'this_week' | 'this_month' | 'custom';

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenTransferModal,
  onOpenReceiveModal,
  onViewTransferDetails,
  onPrintReceipt,
}) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [lines, setLines] = useState<CashLine[]>([]);
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFilterLoading, setIsFilterLoading] = useState(false);

  // Time Period Filter State
  const [period, setPeriod] = useState<DashboardPeriod>('today');
  const [customFrom, setCustomFrom] = useState(() => new Date().toISOString().slice(0, 10));
  const [customTo, setCustomTo] = useState(() => new Date().toISOString().slice(0, 10));

  // Card Details Modal State
  const [selectedCardType, setSelectedCardType] = useState<CardDetailType | null>(null);

  // Vault Details Modal State
  const [selectedVaultForModal, setSelectedVaultForModal] = useState<Vault | null>(null);

  const loadData = async (
    targetPeriod = period,
    from = customFrom,
    to = customTo
  ) => {
    setIsFilterLoading(true);
    try {
      const [statsData, linesData, vaultsRes] = await Promise.all([
        api.getDashboardStats({
          period: targetPeriod,
          from: targetPeriod === 'custom' ? from : undefined,
          to: targetPeriod === 'custom' ? to : undefined,
        }),
        api.getLines(),
        api.getVaults().catch(() => ({ vaults: [] })),
      ]);
      setStats(statsData);
      setLines(linesData);
      setVaults(vaultsRes.vaults || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
      setIsFilterLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleGlobalRefresh = () => loadData();
    window.addEventListener('app:global-refresh', handleGlobalRefresh);
    return () => window.removeEventListener('app:global-refresh', handleGlobalRefresh);
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-slate-400 gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
        <span className="text-sm font-medium">جاري تحميل المؤشرات والبيانات المالية الحية...</span>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-slate-400 gap-4">
        <span className="text-sm font-medium">تعذّر تحميل المؤشرات المالية حالياً</span>
        <button
          onClick={() => loadData()}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20"
        >
          <RefreshCw className="w-4 h-4" />
          <span>إعادة المحاولة</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 font-sans selection:bg-emerald-500 selection:text-white" dir="rtl">
      
      {/* Top Welcome & Quick Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-3xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            لوحة التحكم المالية
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
              مباشر ومحدث
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            مرحباً بك في نظام إدارة التحويلات الذكي ومتابعة سيولة خطوط الكاش والمحافظ
          </p>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto flex-wrap sm:flex-nowrap">
          <button
            onClick={() => onOpenTransferModal()}
            className="flex-1 sm:flex-none px-3.5 sm:px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition duration-200 cursor-pointer text-xs leading-normal"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>إجراء تحويل صادر</span>
          </button>

          <button
            onClick={() => (onOpenReceiveModal ? onOpenReceiveModal() : onOpenTransferModal())}
            className="flex-1 sm:flex-none px-3.5 sm:px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold rounded-xl shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition duration-200 cursor-pointer text-xs leading-normal"
          >
            <ArrowDownLeft className="w-4 h-4 shrink-0" />
            <span>استلام أموال (إيداع وارد)</span>
          </button>
        </div>
      </div>

      {/* Interactive Time Search & Filter Bar (اليوم، الأمس، الأسبوع، الشهر، فترة مخصصة) */}
      <div className="p-3.5 sm:p-4 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-lg transition-all duration-200 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Right: Presets Filter Buttons in a clean, non-wrapping row */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Filter className="w-4 h-4" />
              </span>
              <span>النطاق:</span>
            </div>

            {/* Seamless Segmented Control with equal visual weight */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-950/90 rounded-2xl border border-slate-200 dark:border-slate-800/90 overflow-x-auto max-w-full flex-nowrap scrollbar-none">
              <button
                type="button"
                onClick={() => {
                  setPeriod('today');
                  loadData('today');
                }}
                className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer whitespace-nowrap shrink-0 ${
                  period === 'today'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800/50'
                }`}
              >
                اليوم
              </button>

              <button
                type="button"
                onClick={() => {
                  setPeriod('yesterday');
                  loadData('yesterday');
                }}
                className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer whitespace-nowrap shrink-0 ${
                  period === 'yesterday'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800/50'
                }`}
              >
                الأمس
              </button>

              <button
                type="button"
                onClick={() => {
                  setPeriod('this_week');
                  loadData('this_week');
                }}
                className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer whitespace-nowrap shrink-0 ${
                  period === 'this_week'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800/50'
                }`}
              >
                الأسبوع
              </button>

              <button
                type="button"
                onClick={() => {
                  setPeriod('this_month');
                  loadData('this_month');
                }}
                className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer whitespace-nowrap shrink-0 ${
                  period === 'this_month'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800/50'
                }`}
              >
                الشهر
              </button>

              <button
                type="button"
                onClick={() => setPeriod('custom')}
                className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150 flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                  period === 'custom'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800/50'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>فترة مخصصة</span>
              </button>
            </div>
          </div>

          {/* Left: Active Period Summary Badge */}
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs shrink-0 self-end md:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse shrink-0" />
            <span className="text-slate-600 dark:text-slate-400 font-medium">الفترة المعروضة:</span>
            <span className="font-bold text-emerald-700 dark:text-emerald-400">{stats.periodLabel || 'اليوم'}</span>
            {isFilterLoading && <RefreshCw className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-spin mr-1" />}
          </div>

        </div>

        {/* Custom Date Range Pickers (Smooth and stable) */}
        {period === 'custom' && (
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-150">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">من تاريخ:</span>
                <input
                  type="date"
                  lang="en"
                  dir="ltr"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="bg-transparent text-slate-900 dark:text-slate-100 text-xs font-mono focus:outline-none cursor-pointer tracking-wider"
                />
              </div>

              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">إلى تاريخ:</span>
                <input
                  type="date"
                  lang="en"
                  dir="ltr"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="bg-transparent text-slate-900 dark:text-slate-100 text-xs font-mono focus:outline-none cursor-pointer tracking-wider"
                />
              </div>

              <button
                type="button"
                onClick={() => loadData('custom', customFrom, customTo)}
                disabled={isFilterLoading}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
              >
                {isFilterLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                <span>تطبيق الفلترة والبحث</span>
              </button>
            </div>

            <span className="text-[11px] text-slate-500 hidden sm:inline">
              اختر أي نطاق تاريخي لعرض كافة التحويلات والمؤشرات بدقة
            </span>
          </div>
        )}
      </div>

      {/* 8 Primary Financial KPI Cards with Fixed Rock-Solid Heights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Transfers Count in Selected Period */}
        <div 
          onClick={() => setSelectedCardType('transfers_count')}
          className="p-5 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-cyan-400 dark:hover:border-cyan-500/50 hover:bg-slate-50 dark:hover:bg-slate-900/95 hover:-translate-y-1 transition-all duration-200 relative overflow-hidden group cursor-pointer shadow-sm dark:shadow-lg select-none min-h-[160px] flex flex-col justify-between"
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition h-9 flex items-center line-clamp-2 leading-snug">
              إجمالي التحويلات ({stats.periodLabel || 'اليوم'})
            </span>
            <div className="w-10 h-10 shrink-0 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center border border-cyan-500/20 group-hover:scale-110 transition">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight my-1">
            {formatCount(stats.periodTransfersCount ?? stats.todayTransfersCount)}
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition font-medium">
            <span>انقر لعرض التفاصيل الكاملة</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/15 transition" />
        </div>

        {/* Card 2: Transfers Value in Selected Period */}
        <div 
          onClick={() => setSelectedCardType('transfers_value')}
          className="p-5 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-500/50 hover:bg-slate-50 dark:hover:bg-slate-900/95 hover:-translate-y-1 transition-all duration-200 relative overflow-hidden group cursor-pointer shadow-sm dark:shadow-lg select-none min-h-[160px] flex flex-col justify-between"
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition h-9 flex items-center line-clamp-2 leading-snug">
              إجمالي قيمة التحويلات ({stats.periodLabel || 'اليوم'})
            </span>
            <div className="w-10 h-10 shrink-0 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight my-1">
            {formatAmount(stats.periodTransfersValue ?? stats.todayTransfersValue)} <span className="text-xs text-slate-500 dark:text-slate-400 font-sans">ج.م</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition font-medium">
            <span>انقر لعرض التفاصيل الكاملة</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/15 transition" />
        </div>

        {/* Card 3: Month Transfers Count */}
        <div 
          onClick={() => setSelectedCardType('month_count')}
          className="p-5 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500/50 hover:bg-slate-50 dark:hover:bg-slate-900/95 hover:-translate-y-1 transition-all duration-200 relative overflow-hidden group cursor-pointer shadow-sm dark:shadow-lg select-none min-h-[160px] flex flex-col justify-between"
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition h-9 flex items-center line-clamp-2 leading-snug">
              إجمالي التحويلات هذا الشهر
            </span>
            <div className="w-10 h-10 shrink-0 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20 group-hover:scale-110 transition">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight my-1">
            {formatCount(stats.monthTransfersCount)}
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition font-medium">
            <span>انقر لعرض التفاصيل الكاملة</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/15 transition" />
        </div>

        {/* Card 4: Month Transfers Value */}
        <div 
          onClick={() => setSelectedCardType('month_value')}
          className="p-5 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-teal-400 dark:hover:border-teal-500/50 hover:bg-slate-50 dark:hover:bg-slate-900/95 hover:-translate-y-1 transition-all duration-200 relative overflow-hidden group cursor-pointer shadow-sm dark:shadow-lg select-none min-h-[160px] flex flex-col justify-between"
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-300 transition h-9 flex items-center line-clamp-2 leading-snug">
              إجمالي قيمة التحويلات الشهرية
            </span>
            <div className="w-10 h-10 shrink-0 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-500/20 group-hover:scale-110 transition">
              <Banknote className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-teal-600 dark:text-teal-400 font-mono tracking-tight my-1">
            {formatAmount(stats.monthTransfersValue)} <span className="text-xs text-slate-500 dark:text-slate-400 font-sans">ج.م</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition font-medium">
            <span>انقر لعرض التفاصيل الكاملة</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full blur-2xl group-hover:bg-teal-500/15 transition" />
        </div>

        {/* Card 5: Successful Operations in Selected Period */}
        <div 
          onClick={() => setSelectedCardType('successful')}
          className="p-5 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-500/50 hover:bg-slate-50 dark:hover:bg-slate-900/95 hover:-translate-y-1 transition-all duration-200 relative overflow-hidden group cursor-pointer shadow-sm dark:shadow-lg select-none min-h-[160px] flex flex-col justify-between"
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition h-9 flex items-center line-clamp-2 leading-snug">
              العمليات الناجحة ({stats.periodLabel || 'اليوم'})
            </span>
            <div className="w-10 h-10 shrink-0 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight my-1">
            {formatCount(stats.successfulOperationsCount)}
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            <span>نسبة النجاح: {stats.successRatePercent}%</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
          </div>
        </div>

        {/* Card 6: Cancelled / Rejected Operations */}
        <div 
          onClick={() => setSelectedCardType('failed')}
          className="p-5 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-rose-400 dark:hover:border-rose-500/50 hover:bg-slate-50 dark:hover:bg-slate-900/95 hover:-translate-y-1 transition-all duration-200 relative overflow-hidden group cursor-pointer shadow-sm dark:shadow-lg select-none min-h-[160px] flex flex-col justify-between"
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-rose-600 dark:group-hover:text-rose-300 transition h-9 flex items-center line-clamp-2 leading-snug">
              العمليات الملغاة / المرفوضة ({stats.periodLabel || 'اليوم'})
            </span>
            <div className="w-10 h-10 shrink-0 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/20 group-hover:scale-110 transition">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-rose-600 dark:text-rose-400 font-mono tracking-tight my-1">
            {formatCount(stats.failedOrCancelledCount)}
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-rose-600 dark:text-rose-400/80 group-hover:text-rose-600 dark:group-hover:text-rose-300 transition font-medium">
            <span>انقر لمتابعة أسباب الرفض</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
          </div>
        </div>

        {/* Card 7: Commissions & Profits */}
        <div 
          onClick={() => setSelectedCardType('commissions')}
          className="p-5 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500/50 hover:bg-slate-50 dark:hover:bg-slate-900/95 hover:-translate-y-1 transition-all duration-200 relative overflow-hidden group cursor-pointer shadow-sm dark:shadow-lg select-none min-h-[160px] flex flex-col justify-between"
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-300 transition h-9 flex items-center line-clamp-2 leading-snug">
              إجمالي العمولات والأرباح ({stats.periodLabel || 'اليوم'})
            </span>
            <div className="w-10 h-10 shrink-0 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 group-hover:scale-110 transition">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 font-mono tracking-tight my-1">
            {formatAmount(stats.totalCommissionsAndProfits)} <span className="text-xs text-slate-500 dark:text-slate-400 font-sans">ج.م</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition font-medium">
            <span>انقر لعرض تفاصيل العمولات</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
          </div>
        </div>

        {/* Card 8: Available Liquidity Across Lines */}
        <div 
          onClick={() => setSelectedCardType('liquidity')}
          className="p-5 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-sky-400 dark:hover:border-sky-500/50 hover:bg-slate-50 dark:hover:bg-slate-900/95 hover:-translate-y-1 transition-all duration-200 relative overflow-hidden group cursor-pointer shadow-sm dark:shadow-lg select-none min-h-[160px] flex flex-col justify-between"
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-sky-600 dark:group-hover:text-sky-300 transition h-9 flex items-center line-clamp-2 leading-snug">
              السيولة المتاحة في الخطوط
            </span>
            <div className="w-10 h-10 shrink-0 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-500/20 group-hover:scale-110 transition">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-sky-600 dark:text-sky-400 font-mono tracking-tight my-1">
            {formatAmount(stats.totalLiquidity)} <span className="text-xs text-slate-500 dark:text-slate-400 font-sans">ج.م</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition font-medium">
            <span>موزعة على {formatCount(lines.length)} خطوط ومحافظ</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
          </div>
        </div>

      </div>

      {/* Middle Analytics Section (Recharts Weekly Transfers Chart + Limits Dials & Warnings) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Recharts Interactive Weekly Transfers Chart (lg:col-span-8) */}
        <div className="lg:col-span-8">
          <WeeklyTransfersChart data={stats.last7Days || []} />
        </div>

        {/* Side Column: Limits Gauges & Warning Cards (lg:col-span-4) */}
        <div className="lg:col-span-4 flex flex-col justify-between gap-6">
          {/* Circular Gauges for Limits */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-sm dark:shadow-lg">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">استهلاك الحدود المالية</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">النسبة الإجمالية المستهلكة عبر كافة الخطوط</p>
            </div>

            <div className="grid grid-cols-2 gap-4 my-4">
              {/* Daily Dial */}
              <div className="flex flex-col items-center">
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-200 dark:text-slate-800"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-emerald-500 transition-all duration-1000 ease-out"
                      strokeDasharray={`${stats.dailyLimitPercent ?? 0}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-mono">{formatCount(stats.dailyLimitPercent ?? 0)}%</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-2">الحد اليومي</span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">متبقي: {formatCount(stats.remainingDailyPercent ?? (100 - (stats.dailyLimitPercent ?? 0)))}%</span>
              </div>

              {/* Monthly Dial */}
              <div className="flex flex-col items-center">
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-200 dark:text-slate-800"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-cyan-500 transition-all duration-1000 ease-out"
                      strokeDasharray={`${stats.monthlyLimitPercent ?? 0}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-mono">{formatCount(stats.monthlyLimitPercent ?? 0)}%</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-2">الحد الشهري</span>
                <span className="text-[11px] text-cyan-600 dark:text-cyan-400 font-semibold">متبقي: {formatCount(stats.remainingMonthlyPercent ?? (100 - (stats.monthlyLimitPercent ?? 0)))}%</span>
              </div>
            </div>

            <button
              onClick={() => onNavigate('limits')}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <span>مركز إدارة الحدود التفصيلي</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Lines Closest to Limits Warning */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-sm dark:shadow-lg">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                  أقرب للحدود
                </h2>
                <button
                  onClick={() => onNavigate('limits')}
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 font-semibold transition cursor-pointer"
                >
                  عرض الكل ←
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">الخطوط التي قاربت على استهلاك الحد اليومي أو الشهري</p>
            </div>

            <div className="space-y-2.5">
              {(stats.linesClosestToLimits || []).slice(0, 3).map((line) => {
                const isHigh = line.maxUtilization >= 80;
                return (
                  <div key={line.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <ProviderBadge provider={line.provider} size="sm" showLabel={false} />
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[130px]">{line.name}</span>
                      </div>
                      <span className={`font-mono font-bold ${isHigh ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-300'}`}>
                        {formatCount(line.maxUtilization)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          line.maxUtilization >= 90 
                            ? 'bg-rose-500' 
                            : line.maxUtilization >= 75 
                            ? 'bg-amber-500' 
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${line.maxUtilization}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400 inline-block" />
              تنبيه استباقي لمنع تعليق أو رفض التحويلات
            </div>
          </div>
        </div>

      </div>



      {/* Interactive Drill-Down Card Details Modal */}
      <CardDetailsModal
        isOpen={!!selectedCardType}
        type={selectedCardType}
        stats={stats}
        lines={lines}
        onClose={() => setSelectedCardType(null)}
        onViewTransferDetails={onViewTransferDetails}
        onPrintReceipt={onPrintReceipt}
        onNavigateToTransfers={() => {
          setSelectedCardType(null);
          onNavigate('transfers');
        }}
        onInitiateTransfer={(lineId) => {
          setSelectedCardType(null);
          onOpenTransferModal(lineId);
        }}
      />

      {/* Interactive Vault Details & Ledger Modal */}
      <VaultDetailsModal
        vault={selectedVaultForModal}
        onClose={() => setSelectedVaultForModal(null)}
        onNavigateToVaults={() => {
          setSelectedVaultForModal(null);
          onNavigate('vaults');
        }}
        currency="ج.م"
      />

    </div>
  );
};
