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
      <div className="p-3.5 sm:p-4 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-lg transition-all duration-200 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Right: Presets Filter Buttons in a clean, non-wrapping row */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-slate-300 shrink-0">
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Filter className="w-4 h-4" />
              </span>
              <span className="text-slate-300 dark:text-slate-300">النطاق:</span>
            </div>

            {/* Seamless Segmented Control with equal visual weight */}
            <div className="flex items-center gap-1 p-1 bg-slate-950/90 rounded-2xl border border-slate-800/90 overflow-x-auto max-w-full flex-nowrap scrollbar-none">
              <button
                type="button"
                onClick={() => {
                  setPeriod('today');
                  loadData('today');
                }}
                className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer whitespace-nowrap shrink-0 ${
                  period === 'today'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
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
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
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
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
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
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
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
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>فترة مخصصة</span>
              </button>
            </div>
          </div>

          {/* Left: Active Period Summary Badge */}
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-950 border border-slate-800 text-xs shrink-0 self-end md:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="text-slate-400 font-medium">الفترة المعروضة:</span>
            <span className="font-bold text-emerald-400">{stats.periodLabel || 'اليوم'}</span>
            {isFilterLoading && <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin mr-1" />}
          </div>

        </div>

        {/* Custom Date Range Pickers (Smooth and stable) */}
        {period === 'custom' && (
          <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-150">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 font-medium">من تاريخ:</span>
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="bg-transparent text-slate-100 text-xs font-mono focus:outline-none cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 font-medium">إلى تاريخ:</span>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="bg-transparent text-slate-100 text-xs font-mono focus:outline-none cursor-pointer"
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

      {/* ======================================================== */}
      {/* 2.2. إدارة الخزن المالية (Treasury & Vaults Management) */}
      {/* ======================================================== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-blue-900/30">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>إدارة الخزن المالية</span>
                <span className="text-[11px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full font-bold">
                  نظام الخزن الثلاثي
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                متابعة حركة السيولة النقدية المركزية، الفروع والكاشيرات، وخزنة عمليات خطوط العملاء
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('handovers')}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-indigo-400 border border-indigo-500/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>التسليم والتسلّم</span>
            </button>
            <button
              onClick={() => onNavigate('vaults')}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-900/30"
            >
              <span>عرض إدارة الخزن بالكامل</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 3 Vault Category Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Card 1: الخزنة المركزية الرئيسية (Main Central Vault - 5 Cols, Distinctive Blue Theme) */}
          {(() => {
            const mainV = vaults.find(v => v.type === 'main');
            if (!mainV) return null;
            return (
              <div 
                onClick={() => setSelectedVaultForModal(mainV)}
                className="lg:col-span-5 rounded-[28px] sm:rounded-[32px] bg-white dark:bg-slate-900 border-2 border-blue-400/90 dark:border-blue-500/80 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10 p-5 sm:p-6 shadow-sm relative overflow-hidden flex flex-col justify-between transition-all cursor-pointer group select-none"
                title="انقر لفتح تفاصيل وحركات الخزنة المركزية الرئيسية"
              >
                <div className="space-y-4">
                  {/* Header Row: Badges on left, Icon on right */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-black font-mono px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800 whitespace-nowrap">
                        {mainV.code}
                      </span>
                      <span className="text-xs px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold flex items-center gap-1.5 whitespace-nowrap">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                        {mainV.status === 'active' ? 'نشطة (المصدر المركزي)' : 'موقوفة'}
                      </span>
                    </div>

                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm shrink-0 group-hover:scale-105 transition-transform">
                      <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                  </div>

                  {/* Prominent Title: الخزنة المركزية الرئيسية */}
                  <div className="text-center">
                    <h3 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 dark:text-white leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      الخزنة المركزية الرئيسية
                    </h3>
                  </div>

                  {/* Central Available Balance Box */}
                  <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-center transition-colors">
                    <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium mb-1">
                      الرصيد المركزي المتاح
                    </span>
                    <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight font-mono flex items-baseline justify-center gap-1.5">
                      <span>{formatAmount(mainV.balance, 2)}</span>
                      <span className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 font-sans">ج.م</span>
                    </div>
                  </div>

                  {/* Sub Metrics (Allocated & Last Tx) */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-center">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">
                        المخصص للخزن الفرعية
                      </span>
                      <div className="text-sm sm:text-base md:text-lg font-black text-amber-500 dark:text-amber-400 font-mono">
                        {formatAmount(mainV.allocatedBalance || 750000)} <span className="text-xs font-sans">ج.م</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        وفقاً لسجلات الفروع
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-center">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">
                        آخر عملية مالية
                      </span>
                      <div className="text-xs sm:text-sm md:text-base font-bold text-slate-800 dark:text-slate-200 truncate font-mono">
                        {mainV.lastTransactionAmount ? `${formatAmount(mainV.lastTransactionAmount)} ج.م` : '1,000,000 ج.م'}
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                        {mainV.updatedAt ? formatTime(mainV.updatedAt) : '02:59 م'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center gap-2 pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate('vaults');
                    }}
                    className="flex-1 py-3 px-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-md shadow-blue-600/20 text-center cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>تحويل إلى خزنة فرعية</span>
                    <ArrowLeftRight className="w-3.5 h-3.5 shrink-0" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedVaultForModal(mainV);
                    }}
                    className="flex-1 py-3 px-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition border border-slate-200 dark:border-slate-700 text-center cursor-pointer"
                  >
                    <span>عرض التفاصيل</span>
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Card 2: الخزن الفرعية (Sub-Vaults - 4 Cols, Dedicated Indigo Theme) */}
          {(() => {
            const subs = vaults.filter(v => v.type === 'sub');
            const totalSubBal = subs.reduce((s, v) => s + v.balance, 0);
            return (
              <div 
                onClick={() => setSelectedVaultForModal(subs[0] || null)}
                className="lg:col-span-4 rounded-[28px] sm:rounded-[32px] bg-white dark:bg-slate-900 border-2 border-indigo-300 dark:border-indigo-500/80 hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/10 p-5 sm:p-6 shadow-sm flex flex-col justify-between transition-all cursor-pointer group select-none"
                title="انقر لفتح تفاصيل الخزن الفرعية"
              >
                <div className="space-y-4">
                  {/* Header Row: Badge on left, Icon and title on right */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-800 whitespace-nowrap">
                      {formatCount(subs.length)} خزن
                    </span>

                    <div className="flex items-center gap-2.5">
                      <div className="text-left">
                        <span className="text-[10px] font-mono font-bold text-slate-400 block tracking-wider">SUB-VAULTS</span>
                        <h3 className="text-base sm:text-lg md:text-xl font-black text-slate-900 dark:text-white leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          الخزن الفرعية
                        </h3>
                      </div>
                      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 group-hover:scale-105 transition-transform">
                        <Layers className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                    </div>
                  </div>

                  {/* Sub-vaults total box */}
                  <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-center transition-colors">
                    <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
                      إجمالي رصيد الخزن التشغيلية
                    </span>
                    <div className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-mono flex items-baseline justify-center gap-1.5 flex-wrap">
                      <span className="tracking-tight">{formatAmount(totalSubBal, 2)}</span>
                      <span className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 font-sans">ج.م</span>
                    </div>
                  </div>

                  {/* Quick Sub Vaults List Preview with Full Names - Each row is clickable! */}
                  <div className="space-y-2.5">
                    {subs.slice(0, 2).map((sub) => (
                      <div 
                        key={sub.id} 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedVaultForModal(sub);
                        }}
                        className="p-3 rounded-2xl bg-slate-50/80 hover:bg-slate-100 dark:bg-slate-950/50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs gap-3 cursor-pointer transition-all shadow-sm group/sub"
                        title={`انقر لفتح تفاصيل وحركات ${sub.name}`}
                      >
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold text-xs sm:text-sm">
                            {formatAmount(sub.balance)} ج.م
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 text-right">
                          <strong className="text-slate-900 dark:text-slate-100 block truncate font-bold text-xs sm:text-sm group-hover/sub:text-indigo-600 dark:group-hover/sub:text-indigo-400 transition-colors">
                            {sub.name}
                          </strong>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate mt-0.5">
                            {sub.assignedEmployeeName || 'عادل فتحي'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate('vaults');
                    }}
                    className="py-3 px-4 rounded-2xl bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold transition cursor-pointer"
                    title="إضافة خزنة فرعية"
                  >
                    + جديدة
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedVaultForModal(subs[0] || null);
                    }}
                    className="flex-1 py-3 px-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition text-center cursor-pointer border border-slate-200 dark:border-slate-700"
                  >
                    <span>عرض التفاصيل</span>
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Card 3: خزنة العملاء (Customer Operations Vault - 3 Cols, Dedicated Emerald Theme) */}
          {(() => {
            const custV = vaults.find(v => v.type === 'customer');
            if (!custV) return null;
            return (
              <div 
                onClick={() => setSelectedVaultForModal(custV)}
                className="lg:col-span-3 rounded-[28px] sm:rounded-[32px] bg-white dark:bg-slate-900 border-2 border-emerald-400 dark:border-emerald-500 hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/10 p-5 sm:p-6 shadow-sm flex flex-col justify-between transition-all cursor-pointer group select-none"
                title="انقر لفتح تفاصيل وحركات خزنة العملاء"
              >
                <div className="space-y-4">
                  {/* Header Row: Badge on left, Icon and title on right */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 whitespace-nowrap">
                      نشطة
                    </span>

                    <div className="flex items-center gap-2.5">
                      <div className="text-right">
                        <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 block whitespace-nowrap">
                          {custV.code}
                        </span>
                        <h3 className="text-base sm:text-lg md:text-xl font-black text-slate-900 dark:text-white leading-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          خزنة العملاء
                        </h3>
                      </div>
                      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 group-hover:scale-105 transition-transform">
                        <Shield className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                    </div>
                  </div>

                  {/* Customer Liquidity Box */}
                  <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-center transition-colors">
                    <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
                      سيولة خطوط ومحافظ العملاء
                    </span>
                    <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono flex items-baseline justify-center gap-1.5 flex-nowrap px-1">
                      <span className="tracking-tight">{formatAmount(custV.balance, 2)}</span>
                      <span className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 font-sans shrink-0">ج.م</span>
                    </div>
                  </div>

                  {/* Strict Non-Negative Notice */}
                  <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs font-semibold flex items-center justify-between gap-2">
                    <span className="font-medium leading-tight text-right flex-1">حماية ضد العجز: لا يمكن أن يكون الرصيد سالباً</span>
                    <ShieldAlert className="w-4 h-4 shrink-0 text-amber-500" />
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedVaultForModal(custV);
                    }}
                    className="w-full py-3 px-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition text-center cursor-pointer border border-slate-200 dark:border-slate-700"
                  >
                    <span>عرض التفاصيل والحركات</span>
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* 8 Primary Financial KPI Cards with Fixed Rock-Solid Heights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Transfers Count in Selected Period */}
        <div 
          onClick={() => setSelectedCardType('transfers_count')}
          className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900/95 hover:-translate-y-1 transition-all duration-200 relative overflow-hidden group cursor-pointer shadow-lg select-none min-h-[160px] flex flex-col justify-between"
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-slate-400 group-hover:text-cyan-300 transition h-9 flex items-center line-clamp-2 leading-snug">
              إجمالي التحويلات ({stats.periodLabel || 'اليوم'})
            </span>
            <div className="w-10 h-10 shrink-0 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20 group-hover:scale-110 transition">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-white font-mono tracking-tight my-1">
            {formatCount(stats.periodTransfersCount ?? stats.todayTransfersCount)}
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 group-hover:text-cyan-400 transition font-medium">
            <span>انقر لعرض التفاصيل الكاملة</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/15 transition" />
        </div>

        {/* Card 2: Transfers Value in Selected Period */}
        <div 
          onClick={() => setSelectedCardType('transfers_value')}
          className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900/95 hover:-translate-y-1 transition-all duration-200 relative overflow-hidden group cursor-pointer shadow-lg select-none min-h-[160px] flex flex-col justify-between"
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-slate-400 group-hover:text-emerald-300 transition h-9 flex items-center line-clamp-2 leading-snug">
              إجمالي قيمة التحويلات ({stats.periodLabel || 'اليوم'})
            </span>
            <div className="w-10 h-10 shrink-0 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono tracking-tight my-1">
            {formatAmount(stats.periodTransfersValue ?? stats.todayTransfersValue)} <span className="text-xs text-slate-400 font-sans">ج.م</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 group-hover:text-emerald-400 transition font-medium">
            <span>انقر لعرض التفاصيل الكاملة</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/15 transition" />
        </div>

        {/* Card 3: Month Transfers Count */}
        <div 
          onClick={() => setSelectedCardType('month_count')}
          className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900/95 hover:-translate-y-1 transition-all duration-200 relative overflow-hidden group cursor-pointer shadow-lg select-none min-h-[160px] flex flex-col justify-between"
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-slate-400 group-hover:text-indigo-300 transition h-9 flex items-center line-clamp-2 leading-snug">
              إجمالي التحويلات هذا الشهر
            </span>
            <div className="w-10 h-10 shrink-0 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 group-hover:scale-110 transition">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-white font-mono tracking-tight my-1">
            {formatCount(stats.monthTransfersCount)}
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 group-hover:text-indigo-400 transition font-medium">
            <span>انقر لعرض التفاصيل الكاملة</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/15 transition" />
        </div>

        {/* Card 4: Month Transfers Value */}
        <div 
          onClick={() => setSelectedCardType('month_value')}
          className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-teal-500/50 hover:bg-slate-900/95 hover:-translate-y-1 transition-all duration-200 relative overflow-hidden group cursor-pointer shadow-lg select-none min-h-[160px] flex flex-col justify-between"
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-slate-400 group-hover:text-teal-300 transition h-9 flex items-center line-clamp-2 leading-snug">
              إجمالي قيمة التحويلات الشهرية
            </span>
            <div className="w-10 h-10 shrink-0 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20 group-hover:scale-110 transition">
              <Banknote className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight my-1">
            {formatAmount(stats.monthTransfersValue)} <span className="text-xs text-slate-400 font-sans">ج.م</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 group-hover:text-teal-400 transition font-medium">
            <span>انقر لعرض التفاصيل الكاملة</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full blur-2xl group-hover:bg-teal-500/15 transition" />
        </div>

        {/* Card 5: Successful Operations in Selected Period */}
        <div 
          onClick={() => setSelectedCardType('successful')}
          className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900/95 hover:-translate-y-1 transition-all duration-200 relative overflow-hidden group cursor-pointer shadow-lg select-none min-h-[160px] flex flex-col justify-between"
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-slate-400 group-hover:text-emerald-300 transition h-9 flex items-center line-clamp-2 leading-snug">
              العمليات الناجحة ({stats.periodLabel || 'اليوم'})
            </span>
            <div className="w-10 h-10 shrink-0 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-white font-mono tracking-tight my-1">
            {formatCount(stats.successfulOperationsCount)}
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] text-emerald-400 font-medium">
            <span>نسبة النجاح: {stats.successRatePercent}%</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
          </div>
        </div>

        {/* Card 6: Cancelled / Rejected Operations */}
        <div 
          onClick={() => setSelectedCardType('failed')}
          className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-rose-500/50 hover:bg-slate-900/95 hover:-translate-y-1 transition-all duration-200 relative overflow-hidden group cursor-pointer shadow-lg select-none min-h-[160px] flex flex-col justify-between"
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-slate-400 group-hover:text-rose-300 transition h-9 flex items-center line-clamp-2 leading-snug">
              العمليات الملغاة / المرفوضة ({stats.periodLabel || 'اليوم'})
            </span>
            <div className="w-10 h-10 shrink-0 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20 group-hover:scale-110 transition">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-rose-400 font-mono tracking-tight my-1">
            {formatCount(stats.failedOrCancelledCount)}
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] text-rose-400/80 group-hover:text-rose-300 transition font-medium">
            <span>انقر لمتابعة أسباب الرفض</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
          </div>
        </div>

        {/* Card 7: Commissions & Profits */}
        <div 
          onClick={() => setSelectedCardType('commissions')}
          className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-900/95 hover:-translate-y-1 transition-all duration-200 relative overflow-hidden group cursor-pointer shadow-lg select-none min-h-[160px] flex flex-col justify-between"
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-slate-400 group-hover:text-amber-300 transition h-9 flex items-center line-clamp-2 leading-snug">
              إجمالي العمولات والأرباح ({stats.periodLabel || 'اليوم'})
            </span>
            <div className="w-10 h-10 shrink-0 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 group-hover:scale-110 transition">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono tracking-tight my-1">
            {formatAmount(stats.totalCommissionsAndProfits)} <span className="text-xs text-slate-400 font-sans">ج.م</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 group-hover:text-amber-400 transition font-medium">
            <span>انقر لعرض تفاصيل العمولات</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
          </div>
        </div>

        {/* Card 8: Available Liquidity Across Lines */}
        <div 
          onClick={() => setSelectedCardType('liquidity')}
          className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-sky-500/50 hover:bg-slate-900/95 hover:-translate-y-1 transition-all duration-200 relative overflow-hidden group cursor-pointer shadow-lg select-none min-h-[160px] flex flex-col justify-between"
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-slate-400 group-hover:text-sky-300 transition h-9 flex items-center line-clamp-2 leading-snug">
              السيولة المتاحة في الخطوط
            </span>
            <div className="w-10 h-10 shrink-0 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20 group-hover:scale-110 transition">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-sky-400 font-mono tracking-tight my-1">
            {formatAmount(stats.totalLiquidity)} <span className="text-xs text-slate-400 font-sans">ج.م</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 group-hover:text-sky-400 transition font-medium">
            <span>موزعة على {formatCount(lines.length)} خطوط ومحافظ</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
          </div>
        </div>

      </div>

      {/* Middle Analytics Section (Recharts Weekly Transfers Chart + Limits Dials & Warnings) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Recharts Interactive Weekly Transfers Chart (lg:col-span-8) */}
        <div className="lg:col-span-8">
          <WeeklyTransfersChart data={stats.last7Days} />
        </div>

        {/* Side Column: Limits Gauges & Warning Cards (lg:col-span-4) */}
        <div className="lg:col-span-4 flex flex-col justify-between gap-6">
          {/* Circular Gauges for Limits */}
          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between shadow-lg">
            <div>
              <h2 className="text-base font-bold text-white mb-1">استهلاك الحدود المالية</h2>
              <p className="text-xs text-slate-400">النسبة الإجمالية المستهلكة عبر كافة الخطوط</p>
            </div>

            <div className="grid grid-cols-2 gap-4 my-4">
              {/* Daily Dial */}
              <div className="flex flex-col items-center">
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-800"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-emerald-500 transition-all duration-1000 ease-out"
                      strokeDasharray={`${stats.dailyLimitPercent}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <span className="text-base sm:text-lg font-black text-white font-mono">{formatCount(stats.dailyLimitPercent)}%</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-200 mt-2">الحد اليومي</span>
                <span className="text-[11px] text-emerald-400 font-semibold">متبقي: {formatCount(stats.remainingDailyPercent)}%</span>
              </div>

              {/* Monthly Dial */}
              <div className="flex flex-col items-center">
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-800"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-cyan-500 transition-all duration-1000 ease-out"
                      strokeDasharray={`${stats.monthlyLimitPercent}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <span className="text-base sm:text-lg font-black text-white font-mono">{formatCount(stats.monthlyLimitPercent)}%</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-200 mt-2">الحد الشهري</span>
                <span className="text-[11px] text-cyan-400 font-semibold">متبقي: {formatCount(stats.remainingMonthlyPercent)}%</span>
              </div>
            </div>

            <button
              onClick={() => onNavigate('limits')}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-300 flex items-center justify-center gap-1.5 transition"
            >
              <span>مركز إدارة الحدود التفصيلي</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Lines Closest to Limits Warning */}
          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between shadow-lg">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base font-bold text-white flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  أقرب للحدود
                </h2>
                <button
                  onClick={() => onNavigate('limits')}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold transition"
                >
                  عرض الكل ←
                </button>
              </div>
              <p className="text-xs text-slate-400 mb-3">الخطوط التي قاربت على استهلاك الحد اليومي أو الشهري</p>
            </div>

            <div className="space-y-2.5">
              {stats.linesClosestToLimits.slice(0, 3).map((line) => {
                const isHigh = line.maxUtilization >= 80;
                return (
                  <div key={line.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <ProviderBadge provider={line.provider} size="sm" showLabel={false} />
                        <span className="font-semibold text-slate-200 truncate max-w-[130px]">{line.name}</span>
                      </div>
                      <span className={`font-mono font-bold ${isHigh ? 'text-amber-400' : 'text-slate-300'}`}>
                        {formatCount(line.maxUtilization)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
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

            <div className="mt-3 pt-2.5 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
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
