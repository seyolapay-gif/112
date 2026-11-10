import React, { useState, useEffect } from 'react';
import { Transfer, CashLine } from '../types';
import { api } from '../services/api';
import { formatAmount, formatCount, formatPercent } from '../utils/formatters';
import { 
  BarChart3, 
  Download, 
  Calendar, 
  Printer, 
  Coins, 
  ArrowUpRight, 
  CheckCircle2, 
  XCircle, 
  FileSpreadsheet,
  TrendingUp,
  RefreshCw
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [lines, setLines] = useState<CashLine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<'today' | 'yesterday' | 'this_week' | 'this_month' | 'custom'>('today');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [res, linesData] = await Promise.all([
        api.getTransfers({ limit: 500 }),
        api.getLines(),
      ]);
      const list = Array.isArray(res?.transfers) ? res.transfers : (Array.isArray(res) ? res : []);
      setTransfers(list);
      setLines(Array.isArray(linesData) ? linesData : []);
    } catch (err) {
      console.error('Failed to load report data:', err);
      setTransfers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 86400000);
  const weekAgoStr = weekAgo.toISOString().slice(0, 10);
  const currentMonthStr = now.toISOString().slice(0, 7);

  const safeTransfers = Array.isArray(transfers) ? transfers : [];
  const filteredTransfers = safeTransfers.filter((t) => {
    const tDate = t.timestamp.slice(0, 10);
    if (period === 'today') return tDate === todayStr;
    if (period === 'yesterday') return tDate === yesterdayStr;
    if (period === 'this_week') return tDate >= weekAgoStr && tDate <= todayStr;
    if (period === 'this_month') return t.timestamp.slice(0, 7) === currentMonthStr;
    if (period === 'custom') {
      if (startDate && tDate < startDate) return false;
      if (endDate && tDate > endDate) return false;
      return true;
    }
    return true;
  });

  const totalCount = filteredTransfers.length;
  const completed = filteredTransfers.filter((t) => t.status === 'completed');
  const totalAmount = completed.reduce((sum, t) => sum + t.amount, 0);
  const totalFees = completed.reduce((sum, t) => sum + (t.fee || 0), 0);
  const failedCount = filteredTransfers.filter((t) => t.status === 'failed' || t.status === 'cancelled').length;

  // Breakdown by Cash Line
  const lineStats: Record<string, { name: string; count: number; amount: number; fees: number }> = {};
  for (const t of completed) {
    if (!lineStats[t.sourceLineId]) {
      lineStats[t.sourceLineId] = { name: t.sourceLineName, count: 0, amount: 0, fees: 0 };
    }
    lineStats[t.sourceLineId].count++;
    lineStats[t.sourceLineId].amount += t.amount;
    lineStats[t.sourceLineId].fees += t.fee || 0;
  }

  // Breakdown by Operator
  const operatorStats: Record<string, { name: string; count: number; amount: number }> = {};
  for (const t of completed) {
    if (!operatorStats[t.operatorId]) {
      operatorStats[t.operatorId] = { name: t.operatorName, count: 0, amount: 0 };
    }
    operatorStats[t.operatorId].count++;
    operatorStats[t.operatorId].amount += t.amount;
  }

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ['الرقم المرجعي', 'التاريخ والوقت', 'نوع التحويل', 'الخط', 'المستلم', 'المبلغ', 'المتاح', 'العمولة', 'الموظف', 'الحالة'];
    const rows = filteredTransfers.map((t) => [
      t.referenceNumber,
      t.timestamp,
      t.transferType,
      t.sourceLineName,
      t.recipientNumber,
      t.amount,
      t.balanceAfter !== undefined && t.balanceAfter !== null ? t.balanceAfter : '—',
      t.fee,
      t.operatorName,
      t.status,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `financial_report_${period}_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12 font-sans selection:bg-emerald-500 selection:text-white" dir="rtl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-3xl border border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700/80 flex items-center justify-center p-1.5 shadow-md shadow-emerald-500/10 shrink-0">
            <img src="/logo.png" alt="Seolah" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              مركز التقارير المالية والإحصائيات
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              منظومة سيولة (Seyola) · كشوف الحسابات الدورية، تحليل العمولات والأرباح ومطابقة العمليات
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleExportCSV}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition text-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>تصدير Excel/CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition text-xs cursor-pointer shadow-lg shadow-emerald-600/20"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة التقرير</span>
          </button>
        </div>
      </div>

      {/* Period Selector Tabs - Fixed height container to prevent layout shifts */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 min-h-[64px]">
        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs w-full md:w-auto overflow-x-auto flex-nowrap scrollbar-none">
          <button
            type="button"
            onClick={() => setPeriod('today')}
            className={`px-3.5 sm:px-4 py-2 rounded-lg font-bold transition whitespace-nowrap cursor-pointer ${
              period === 'today' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            اليوم
          </button>
          <button
            type="button"
            onClick={() => setPeriod('yesterday')}
            className={`px-3.5 sm:px-4 py-2 rounded-lg font-bold transition whitespace-nowrap cursor-pointer ${
              period === 'yesterday' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            الأمس
          </button>
          <button
            type="button"
            onClick={() => setPeriod('this_week')}
            className={`px-3.5 sm:px-4 py-2 rounded-lg font-bold transition whitespace-nowrap cursor-pointer ${
              period === 'this_week' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            الأسبوع
          </button>
          <button
            type="button"
            onClick={() => setPeriod('this_month')}
            className={`px-3.5 sm:px-4 py-2 rounded-lg font-bold transition whitespace-nowrap cursor-pointer ${
              period === 'this_month' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            الشهر
          </button>
          <button
            type="button"
            onClick={() => setPeriod('custom')}
            className={`px-3.5 sm:px-4 py-2 rounded-lg font-bold transition whitespace-nowrap cursor-pointer ${
              period === 'custom' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            فترة مخصصة
          </button>
        </div>

        {/* Custom date range: Always maintain consistent container height */}
        <div className={`flex items-center gap-2 text-xs w-full md:w-auto transition-all ${
          period === 'custom' ? 'opacity-100 visible' : 'opacity-40 pointer-events-none hidden md:flex'
        }`}>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-semibold text-[11px]">من:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="p-1.5 sm:p-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs font-mono"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-semibold text-[11px]">إلى:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="p-1.5 sm:p-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs font-mono"
            />
          </div>
        </div>
      </div>

      {/* Primary Figures for Selected Period - Fixed height stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 min-h-[125px] flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-400 block mb-1">إجمالي المبالغ المنقولة</span>
          <div className="text-2xl font-black text-white font-mono">{formatAmount(totalAmount)} ج.م</div>
          <span className="text-[11px] text-slate-500 mt-1 block font-mono">لعدد {formatCount(completed.length)} عملية ناجحة</span>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 min-h-[125px] flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-400 block mb-1">صافي أرباح العمولات</span>
          <div className="text-2xl font-black text-amber-400 font-mono">{formatAmount(totalFees)} ج.م</div>
          <span className="text-[11px] text-emerald-400 mt-1 block font-semibold">+100% مسجلة ومحصلة</span>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 min-h-[125px] flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-400 block mb-1">معدل نجاح العمليات</span>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {totalCount > 0 ? formatPercent((completed.length / totalCount) * 100, 1) : '0%'}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block font-mono">{formatCount(completed.length)} من أصل {formatCount(totalCount)} عملية</span>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 min-h-[125px] flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-400 block mb-1">عمليات مرفوضة / ملغاة</span>
          <div className="text-2xl font-black text-rose-400 font-mono">{formatCount(failedCount)}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">مستردة أو ملغاة بناءً على طلب العميل</span>
        </div>
      </div>

      {/* Detailed Breakdown Tables - Stabilized min-height to eliminate jarring size jumps */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Performance by Cash Line */}
        <div className="lg:col-span-7 rounded-3xl bg-slate-900/80 border border-slate-800 p-5 sm:p-6 flex flex-col min-h-[460px]">
          <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4 shrink-0">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>تحليل أداء خطوط الكاش والمحافظ في الفترة المحددة</span>
          </h2>

          <div className="overflow-x-auto flex-1 flex flex-col">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800 pb-2">
                  <th className="py-2.5 font-semibold">اسم الخط</th>
                  <th className="py-2.5 font-semibold">عدد العمليات</th>
                  <th className="py-2.5 font-semibold">إجمالي القيمة</th>
                  <th className="py-2.5 font-semibold">العمولات المحصلة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {Object.values(lineStats).map((stat, i) => (
                  <tr key={i} className="hover:bg-slate-800/30">
                    <td className="py-3 font-sans font-bold text-slate-200">{stat.name}</td>
                    <td className="py-3 text-slate-300">{formatCount(stat.count)}</td>
                    <td className="py-3 font-bold text-white">{formatAmount(stat.amount)} ج.م</td>
                    <td className="py-3 text-amber-400">{formatAmount(stat.fees)} ج.م</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {Object.values(lineStats).length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center py-16 text-center text-slate-500 text-xs gap-2">
                <Calendar className="w-8 h-8 opacity-40 text-slate-500" />
                <span>لا توجد تحويلات مسجلة على الخطوط خلال هذه الفترة</span>
                <span className="text-[11px] text-slate-600">اختر فترة زمنية أخرى أو قم بتسجيل عمليات جديدة</span>
              </div>
            )}
          </div>
        </div>

        {/* Performance by Operator */}
        <div className="lg:col-span-5 rounded-3xl bg-slate-900/80 border border-slate-800 p-5 sm:p-6 flex flex-col min-h-[460px]">
          <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4 shrink-0">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            <span>كفاءة ونشاط الموظفين والكاشير</span>
          </h2>

          <div className="flex-1 flex flex-col">
            <div className="space-y-3 overflow-y-auto max-h-[360px] flex-1">
              {Object.values(operatorStats).map((op, i) => (
                <div key={i} className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">{op.name}</span>
                    <span className="text-[11px] text-slate-400 font-mono">{formatCount(op.count)} عملية منفذة</span>
                  </div>
                  <div className="text-left font-mono">
                    <span className="text-sm font-black text-emerald-400 block">{formatAmount(op.amount)}</span>
                    <span className="text-[10px] text-slate-500 font-sans block">ج.م إجمالي التحويلات</span>
                  </div>
                </div>
              ))}

              {Object.values(operatorStats).length === 0 && (
                <div className="h-full flex flex-col items-center justify-center py-16 text-center text-slate-500 text-xs gap-2">
                  <BarChart3 className="w-8 h-8 opacity-40 text-slate-500" />
                  <span>لا توجد بيانات موظفين لهذه الفترة</span>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
