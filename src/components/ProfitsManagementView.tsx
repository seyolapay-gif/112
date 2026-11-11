import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { Transfer, CashLine, User } from '../types';
import { formatAmount, formatTime, formatShortDate } from '../utils/formatters';
import { calculateOperationProfit } from '../utils/feeCalculator';
import { 
  TrendingUp, 
  Calendar, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Edit3, 
  Save, 
  X, 
  Search, 
  Filter, 
  Printer, 
  Download, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Coins,
  Receipt,
  FileSpreadsheet,
  BadgeCheck,
  RefreshCw,
  Sparkles
} from 'lucide-react';

interface ProfitsManagementViewProps {
  currentUser?: User | null;
  onPrintReceipt?: (tx: Transfer) => void;
  onViewDetails?: (tx: Transfer) => void;
}

export const ProfitsManagementView: React.FC<ProfitsManagementViewProps> = ({
  currentUser,
  onPrintReceipt,
  onViewDetails,
}) => {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [lines, setLines] = useState<CashLine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLineId, setSelectedLineId] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'transfer' | 'receive'>('all');
  
  // Quick date filter presets: 'today' | 'yesterday' | 'week' | 'month' | 'custom'
  const [dateFilterMode, setDateFilterMode] = useState<'today' | 'yesterday' | 'week' | 'month' | 'custom'>('today');
  const [startDate, setStartDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  // Edit profit modal state (Admin only)
  const [editingTransfer, setEditingTransfer] = useState<Transfer | null>(null);
  const [overrideValue, setOverrideValue] = useState<string>('');
  const [overrideNotes, setOverrideNotes] = useState<string>('');
  const [isSavingProfit, setIsSavingProfit] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);

  const isAdmin = currentUser?.role === 'admin';

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [transfersData, linesData] = await Promise.all([
        api.getTransfers(),
        api.getLines(),
      ]);
      setTransfers(transfersData?.transfers || []);
      setLines(linesData || []);
    } catch (err) {
      console.error('Failed to load profits data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Set date ranges when preset changes
  const handleDateModeChange = (mode: 'today' | 'yesterday' | 'week' | 'month' | 'custom') => {
    setDateFilterMode(mode);
    const now = new Date();

    if (mode === 'today') {
      const todayStr = now.toISOString().split('T')[0];
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (mode === 'yesterday') {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yestStr = yesterday.toISOString().split('T')[0];
      setStartDate(yestStr);
      setEndDate(yestStr);
    } else if (mode === 'week') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - 7);
      setStartDate(startOfWeek.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    } else if (mode === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(startOfMonth.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    }
  };

  // Filter transfers
  const filteredTransfers = useMemo(() => {
    return transfers.filter((tx) => {
      // 1. Status: only completed transfers
      if (tx.status && tx.status !== 'completed') {
        return false;
      }

      // 2. Line filter
      if (selectedLineId !== 'all' && tx.sourceLineId !== selectedLineId) {
        return false;
      }

      // 3. Type filter
      const isReceive = tx.transferType === 'receive_money';
      if (typeFilter === 'receive' && !isReceive) return false;
      if (typeFilter === 'transfer' && isReceive) return false;

      // 4. Date filter
      if (startDate || endDate) {
        const txDate = tx.timestamp ? tx.timestamp.split('T')[0] : '';
        if (startDate && txDate < startDate) return false;
        if (endDate && txDate > endDate) return false;
      }

      // 5. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesRef = tx.referenceNumber?.toLowerCase().includes(q);
        const matchesPhone = tx.recipientNumber?.toLowerCase().includes(q) || tx.sourceNumber?.toLowerCase().includes(q);
        const matchesLine = tx.sourceLineName?.toLowerCase().includes(q);
        const matchesName = tx.recipientName?.toLowerCase().includes(q);
        if (!matchesRef && !matchesPhone && !matchesLine && !matchesName) {
          return false;
        }
      }

      return true;
    });
  }, [transfers, selectedLineId, typeFilter, startDate, endDate, searchQuery]);

  // Aggregate KPI metrics
  const metrics = useMemo(() => {
    let totalGrossProfit = 0; // إجمالي الأرباح (عمولة التحويل + رسوم التحويل أو عمولة الاستلام)
    let totalNetProfit = 0;
    let outgoingProfit = 0;
    let incomingProfit = 0;
    let totalCommissionsPaid = 0;
    let totalFeesCollected = 0;
    let totalVolume = 0;
    let outgoingCount = 0;
    let incomingCount = 0;

    filteredTransfers.forEach((tx) => {
      const isReceive = tx.transferType === 'receive_money';
      const profit = calculateOperationProfit(tx);
      const fee = Number(tx.fee) || 0;
      const commission = Number(tx.commission) || 0;
      const amount = Number(tx.amount) || 0;

      // إجمالي عمولة التحويل + رسوم التحويل (أو عمولة الاستلام)
      const opGross = isReceive ? fee : (commission + fee);
      totalGrossProfit += opGross;

      totalNetProfit += profit;
      totalFeesCollected += fee;
      totalCommissionsPaid += commission;
      totalVolume += amount;

      if (isReceive) {
        incomingProfit += profit;
        incomingCount += 1;
      } else {
        outgoingProfit += profit;
        outgoingCount += 1;
      }
    });

    return {
      totalGrossProfit,
      totalNetProfit,
      outgoingProfit,
      incomingProfit,
      totalCommissionsPaid,
      totalFeesCollected,
      totalVolume,
      outgoingCount,
      incomingCount,
      totalCount: filteredTransfers.length,
    };
  }, [filteredTransfers]);

  // Open Edit Profit Modal
  const handleOpenEditProfit = (tx: Transfer) => {
    const currentProfit = calculateOperationProfit(tx);
    setEditingTransfer(tx);
    setOverrideValue(String(currentProfit));
    setOverrideNotes(tx.customProfitNotes || '');
    setSaveSuccessMsg(null);
    setSaveErrorMsg(null);
  };

  // Save Profit Override (Admin)
  const handleSaveProfitOverride = async () => {
    if (!editingTransfer) return;
    const numOverride = parseFloat(overrideValue);
    if (isNaN(numOverride)) {
      setSaveErrorMsg('الرجاء إدخال رقم صحيح للأرباح');
      return;
    }

    setIsSavingProfit(true);
    setSaveErrorMsg(null);
    try {
      const updated = await api.updateTransferProfit(
        editingTransfer.id,
        numOverride,
        overrideNotes.trim()
      );

      // Update state locally
      setTransfers((prev) =>
        prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t))
      );

      setSaveSuccessMsg('تم حفظ وتحديث الربح بنجاح');
      setTimeout(() => {
        setEditingTransfer(null);
        setSaveSuccessMsg(null);
      }, 1000);
    } catch (err: any) {
      setSaveErrorMsg(err.message || 'فشل في حفظ التعديل');
    } finally {
      setIsSavingProfit(false);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredTransfers.length === 0) return;
    const headers = [
      'الرقم المرجعي',
      'التاريخ والوقت',
      'نوع العملية',
      'الخط / المحفظة',
      'المستلم / العميل',
      'المبلغ (ج.م)',
      'عمولة المشغل (ج.م)',
      'رسوم التحويل (ج.م)',
      'صافي الربح (ج.م)',
      'ملاحظات الربح',
    ];

    const rows = filteredTransfers.map((tx) => [
      tx.referenceNumber,
      tx.timestamp,
      tx.transferType === 'receive_money' ? 'استلام وارد' : 'تحويل صادر',
      tx.sourceLineName || tx.sourceNumber || '',
      tx.recipientNumber || '',
      tx.amount,
      tx.commission || 0,
      tx.fee || 0,
      calculateOperationProfit(tx),
      tx.customProfitNotes || (tx.profitOverride !== undefined ? 'معدل يدوياً' : ''),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.map(val => `"${val}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `تقرير_الأرباح_${startDate}_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12 font-sans selection:bg-emerald-500 selection:text-white" dir="rtl">
      
      {/* 1. Header & Title Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  قسم إدارة ومتابعة الأرباح
                </h1>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  حساب فوري وتلقائي
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                تحليل أرباح التحويلات الصادرة (الرسوم - العمولة) والاستلام الوارد والتحكم الكامل في الأرباح
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-2 border border-slate-200 dark:border-slate-700/80 cursor-pointer shadow-sm disabled:opacity-50"
            title="تحديث البيانات"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>تحديث</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-2 border border-slate-200 dark:border-slate-700/80 cursor-pointer shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>تصدير Excel (CSV)</span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>طباعة التقرير</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive Filter Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-md dark:shadow-xl space-y-4">
        
        {/* Period Selector Tabs */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 text-xs">
            <button
              onClick={() => handleDateModeChange('today')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                dateFilterMode === 'today'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              اليوم
            </button>
            <button
              onClick={() => handleDateModeChange('yesterday')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                dateFilterMode === 'yesterday'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              الأمس
            </button>
            <button
              onClick={() => handleDateModeChange('week')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                dateFilterMode === 'week'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              آخر 7 أيام
            </button>
            <button
              onClick={() => handleDateModeChange('month')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                dateFilterMode === 'month'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              هذا الشهر
            </button>
            <button
              onClick={() => setDateFilterMode('custom')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                dateFilterMode === 'custom'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              تحديد فترة مخصصة
            </button>
          </div>

          {/* Quick Date Display */}
          <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>الفترة المحددة:</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white" dir="ltr">{startDate}</span>
            <span>إلى</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white" dir="ltr">{endDate}</span>
          </div>
        </div>

        {/* Granular Filters: Date Pickers + Line Selector + Search */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
          
          {/* Custom Start Date */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-400 mb-1">من تاريخ:</label>
            <input
              type="date"
              lang="en"
              dir="ltr"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setDateFilterMode('custom');
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none font-mono text-center tracking-wider"
            />
          </div>

          {/* Custom End Date */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-400 mb-1">إلى تاريخ:</label>
            <input
              type="date"
              lang="en"
              dir="ltr"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setDateFilterMode('custom');
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none font-mono text-center tracking-wider"
            />
          </div>

          {/* Line Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-400 mb-1">تحديد الخط أو المحفظة:</label>
            <select
              value={selectedLineId}
              onChange={(e) => setSelectedLineId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
            >
              <option value="all">كافة الخطوط والمحافظ المعتمدة</option>
              {lines.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} ({l.phoneNumber})
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-400 mb-1">نوع المعاملة:</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
            >
              <option value="all">الكل (صادر ووارد)</option>
              <option value="transfer">تحويلات صادرة فقط</option>
              <option value="receive">استلام وارد فقط</option>
            </select>
          </div>

        </div>

        {/* Search input */}
        <div className="relative pt-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالرقم المرجعي، رقم العميل، اسم الخط، أو اسم المستلم..."
            className="w-full pr-9 pl-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>

      </div>

      {/* 3. KPI Metrics Dashboard Cards: 3 Cards on top, 2 Cards below matching screenshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
        
        {/* Card 1: Total Gross Profit (إجمالي الأرباح) - Top Row Right */}
        <div className="p-4 sm:p-4.5 rounded-2xl bg-white dark:bg-slate-900/90 border-2 border-emerald-400/90 dark:border-emerald-500/50 shadow-xs dark:shadow-lg hover:shadow-md transition-all flex flex-col justify-between select-none min-h-[105px] sm:min-h-[112px]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs sm:text-[13px] font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5 whitespace-nowrap">
              <span>إجمالي الأرباح</span>
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            </span>
            <span className="text-[9.5px] sm:text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 whitespace-nowrap shrink-0">
              {metrics.totalCount} عملية
            </span>
          </div>
          <div className="my-auto py-1.5 flex items-center justify-center gap-1.5 text-center">
            <span className="text-2xl sm:text-[26px] font-black text-emerald-600 dark:text-emerald-400 tracking-tight leading-none text-center font-sans">
              {formatAmount(metrics.totalGrossProfit)}
            </span>
            <span className="text-xs sm:text-[13px] font-bold text-slate-500 dark:text-slate-400">ج.م</span>
          </div>
        </div>

        {/* Card 2: Total Net Profit (إجمالي صافي الأرباح) - Top Row Center */}
        <div className="p-4 sm:p-4.5 rounded-2xl bg-white dark:bg-slate-900/90 border-2 border-teal-400/90 dark:border-teal-500/50 shadow-xs dark:shadow-lg hover:shadow-md transition-all flex flex-col justify-between select-none min-h-[105px] sm:min-h-[112px]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs sm:text-[13px] font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5 whitespace-nowrap">
              <span>إجمالي صافي الأرباح</span>
              <Coins className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
            </span>
            <span className="text-[9.5px] sm:text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-500/30 whitespace-nowrap shrink-0">
              صافي فعلي
            </span>
          </div>
          <div className="my-auto py-1.5 flex items-center justify-center gap-1.5 text-center">
            <span className="text-2xl sm:text-[26px] font-black text-teal-600 dark:text-teal-400 tracking-tight leading-none text-center font-sans">
              {formatAmount(metrics.totalNetProfit)}
            </span>
            <span className="text-xs sm:text-[13px] font-bold text-slate-500 dark:text-slate-400">ج.م</span>
          </div>
        </div>

        {/* Card 3: Outgoing Transfer Profits (أرباح التحويل الصادر) - Top Row Left */}
        <div className="p-4 sm:p-4.5 rounded-2xl bg-white dark:bg-slate-900/90 border-2 border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-500/40 shadow-xs dark:shadow-lg hover:shadow-md transition-all flex flex-col justify-between select-none min-h-[105px] sm:min-h-[112px]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs sm:text-[13px] font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5 whitespace-nowrap">
              <span>أرباح التحويل الصادر</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            </span>
            <span className="text-[9.5px] sm:text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 whitespace-nowrap shrink-0">
              {metrics.outgoingCount} عملية
            </span>
          </div>
          <div className="my-auto py-1.5 flex items-center justify-center gap-1.5 text-center">
            <span className="text-2xl sm:text-[26px] font-black text-emerald-600 dark:text-emerald-400 tracking-tight leading-none text-center font-sans">
              {formatAmount(metrics.outgoingProfit)}
            </span>
            <span className="text-xs sm:text-[13px] font-bold text-slate-500 dark:text-slate-400">ج.م</span>
          </div>
        </div>

        {/* Card 4: Incoming Receive Profits (أرباح الاستلام الوارد) - Bottom Row Right (under Card 1) */}
        <div className="p-4 sm:p-4.5 rounded-2xl bg-white dark:bg-slate-900/90 border-2 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-500/40 shadow-xs dark:shadow-lg hover:shadow-md transition-all flex flex-col justify-between select-none min-h-[105px] sm:min-h-[112px]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs sm:text-[13px] font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5 whitespace-nowrap">
              <span>أرباح الاستلام الوارد</span>
              <ArrowDownLeft className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            </span>
            <span className="text-[9.5px] sm:text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 whitespace-nowrap shrink-0">
              {metrics.incomingCount} عملية
            </span>
          </div>
          <div className="my-auto py-1.5 flex items-center justify-center gap-1.5 text-center">
            <span className="text-2xl sm:text-[26px] font-black text-blue-600 dark:text-blue-400 tracking-tight leading-none text-center font-sans">
              {formatAmount(metrics.incomingProfit)}
            </span>
            <span className="text-xs sm:text-[13px] font-bold text-slate-500 dark:text-slate-400">ج.م</span>
          </div>
        </div>

        {/* Card 5: Network Commissions Deducted (عمولات المشغلين المخصومة) - Bottom Row Center (under Card 2) */}
        <div className="p-4 sm:p-4.5 rounded-2xl bg-white dark:bg-slate-900/90 border-2 border-rose-200 dark:border-rose-500/30 hover:border-rose-300 dark:hover:border-rose-500/50 shadow-xs dark:shadow-lg hover:shadow-md transition-all flex flex-col justify-between select-none min-h-[105px] sm:min-h-[112px]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs sm:text-[13px] font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5 whitespace-nowrap">
              <span>عمولات المشغلين المخصومة</span>
              <BadgeCheck className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
            </span>
            <span className="text-[9.5px] sm:text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/40 whitespace-nowrap shrink-0">
              تكلفة شبكات
            </span>
          </div>
          <div className="my-auto py-1.5 flex items-center justify-center gap-1.5 text-center">
            <span className="text-2xl sm:text-[26px] font-black text-rose-600 dark:text-rose-400 tracking-tight leading-none text-center font-sans">
              {formatAmount(metrics.totalCommissionsPaid)}
            </span>
            <span className="text-xs sm:text-[13px] font-bold text-slate-500 dark:text-slate-400">ج.م</span>
          </div>
        </div>

      </div>

      {/* 4. Detailed Profits Table */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-md dark:shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              سجل تفاصيل العمليات والأرباح ({filteredTransfers.length})
            </h3>
          </div>
          {isAdmin && (
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-500/30 flex items-center gap-1">
              <BadgeCheck className="w-3.5 h-3.5" />
              صلاحية التعديل اليدوي للأدمن مفعلة
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold bg-slate-50 dark:bg-slate-950/50">
                <th className="p-2.5 whitespace-nowrap">الرقم المرجعي</th>
                <th className="p-2.5 whitespace-nowrap">التاريخ والوقت</th>
                <th className="p-2.5 whitespace-nowrap">النوع</th>
                <th className="p-2.5 whitespace-nowrap">الخط / المحفظة</th>
                <th className="p-2.5 whitespace-nowrap">رقم العميل</th>
                <th className="p-2.5 whitespace-nowrap">مبلغ المعاملة</th>
                <th className="p-2.5 whitespace-nowrap">عمولة المشغل</th>
                <th className="p-2.5 whitespace-nowrap">رسوم الخدمة</th>
                <th className="p-2.5 whitespace-nowrap text-center">حساب الربح</th>
                <th className="p-2.5 whitespace-nowrap text-center">صافي الربح</th>
                <th className="p-2.5 whitespace-nowrap text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredTransfers.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-slate-400">
                    لا توجد عمليات تطابق معايير البحث أو الفترة المحددة
                  </td>
                </tr>
              ) : (
                filteredTransfers.map((tx) => {
                  const isReceive = tx.transferType === 'receive_money';
                  const fee = Number(tx.fee) || 0;
                  const comm = Number(tx.commission) || 0;
                  const netProfit = calculateOperationProfit(tx);
                  const isOverridden = tx.profitOverride !== undefined && tx.profitOverride !== null;

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      
                      {/* Ref Number */}
                      <td className="p-2.5 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap" dir="ltr">
                        {tx.referenceNumber}
                      </td>

                      {/* Date & Time */}
                      <td className="p-2.5 whitespace-nowrap text-slate-700 dark:text-slate-300">
                        <div className="font-mono text-[11px]">{formatShortDate(tx.timestamp)}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{formatTime(tx.timestamp)}</div>
                      </td>

                      {/* Type */}
                      <td className="p-2.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          isReceive 
                            ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30' 
                            : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                        }`}>
                          {isReceive ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                          {isReceive ? 'استلام وارد' : 'تحويل صادر'}
                        </span>
                      </td>

                      {/* Line */}
                      <td className="p-2.5 whitespace-nowrap">
                        <div className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate max-w-[140px]">{tx.sourceLineName || 'خط الكاش'}</div>
                        <div className="font-mono text-[10.5px] text-emerald-600 dark:text-emerald-400" dir="ltr">{tx.sourceNumber}</div>
                      </td>

                      {/* Customer Phone */}
                      <td className="p-2.5 font-mono font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap" dir="ltr">
                        {tx.recipientNumber || '—'}
                      </td>

                      {/* Amount */}
                      <td className="p-2.5 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {formatAmount(tx.amount)} ج.م
                      </td>

                      {/* Operator Commission */}
                      <td className="p-2.5 font-mono text-amber-600 dark:text-amber-400 whitespace-nowrap">
                        {comm > 0 ? `-${formatAmount(comm)} ج.م` : '0 ج.م'}
                      </td>

                      {/* Service Fee */}
                      <td className="p-2.5 font-mono text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        +{formatAmount(fee)} ج.م
                      </td>

                      {/* Formula Column */}
                      <td className="p-2.5 text-center font-mono text-[11px] text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {isReceive ? (
                          <span className="text-blue-600 dark:text-blue-300 font-bold">{formatAmount(fee)} ج.م (عمولة كاملة)</span>
                        ) : (
                          <span>
                            {formatAmount(fee)} - {formatAmount(comm)} = <strong className="text-emerald-600 dark:text-emerald-400">{formatAmount(fee - comm)}</strong>
                          </span>
                        )}
                      </td>

                      {/* Net Profit Column */}
                      <td className="p-2.5 text-center whitespace-nowrap">
                        <div className="inline-flex flex-col items-center">
                          <span className="font-black font-mono text-emerald-600 dark:text-emerald-400 text-sm">
                            {formatAmount(netProfit)} ج.م
                          </span>
                          {isOverridden && (
                            <span className="text-[9px] text-amber-700 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-500/10 px-1 rounded border border-amber-200 dark:border-amber-500/20" title={tx.customProfitNotes || 'تم تعديله يدوياً بواسطة الإدارة'}>
                              معدل يدوي
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-2.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {isAdmin && (
                            <button
                              onClick={() => handleOpenEditProfit(tx)}
                              className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer border border-slate-200 dark:border-slate-700/60"
                              title="تعديل الربح وحفظه (للأدمن)"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            </button>
                          )}
                          {onPrintReceipt && (
                            <button
                              onClick={() => onPrintReceipt(tx)}
                              className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer border border-slate-200 dark:border-slate-700/60"
                              title="طباعة إيصال"
                            >
                              <Printer className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* 5. Modal: Admin Edit Profit Override */}
      {editingTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" dir="rtl">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden space-y-4 p-5 animate-scale-in">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">تعديل ربح المعاملة (إدارة الأدمن)</h3>
                  <p className="text-[10px] text-slate-400 font-mono" dir="ltr">
                    {editingTransfer.referenceNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingTransfer(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Transaction Brief */}
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-400">
                <span>الخط المصدر / المحفظة:</span>
                <span className="font-bold text-white">{editingTransfer.sourceLineName || '—'}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>مبلغ العملية:</span>
                <span className="font-mono font-bold text-white">{formatAmount(editingTransfer.amount)} ج.م</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>رسوم التحويل المحصلة:</span>
                <span className="font-mono font-bold text-emerald-400">+{formatAmount(editingTransfer.fee)} ج.م</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>عمولة المشغل المخصومة:</span>
                <span className="font-mono font-bold text-amber-400">-{formatAmount(editingTransfer.commission || 0)} ج.م</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-300 font-bold">الربح المحسوب تلقائياً:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {editingTransfer.transferType === 'receive_money'
                    ? `${formatAmount(editingTransfer.fee)} ج.م`
                    : `${formatAmount((editingTransfer.fee || 0) - (editingTransfer.commission || 0))} ج.م`}
                </span>
              </div>
            </div>

            {/* Inputs: Profit Override & Notes */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  الربح الصافي المعتمد (ج.م) *
                </label>
                <input
                  type="number"
                  step="any"
                  value={overrideValue}
                  onChange={(e) => setOverrideValue(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-bold font-mono text-white focus:border-amber-500 focus:outline-none"
                  placeholder="أدخل مبلغ الربح الصافي..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  سبب أو ملاحظات التعديل (اختياري)
                </label>
                <textarea
                  rows={2}
                  value={overrideNotes}
                  onChange={(e) => setOverrideNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-amber-500 focus:outline-none resize-none placeholder:text-slate-500"
                  placeholder="مثال: خصم إضافي من العميل، تسوية خاصة..."
                />
              </div>
            </div>

            {/* Status Messages */}
            {saveSuccessMsg && (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{saveSuccessMsg}</span>
              </div>
            )}
            {saveErrorMsg && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{saveErrorMsg}</span>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingTransfer(null)}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveProfitOverride}
                disabled={isSavingProfit}
                className="px-5 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-lg shadow-amber-600/20 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingProfit ? 'جاري الحفظ...' : 'حفظ التعديل والاعتماد'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
