import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { formatAmount, formatCount } from '../utils/formatters';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  BarChart3, 
  TrendingUp, 
  Activity, 
  Calendar,
  Layers,
  Scale
} from 'lucide-react';

export interface DayMetric {
  date: string;
  label: string;
  dayName?: string;
  count: number;
  value: number;
  incomingValue?: number;
  incomingCount?: number;
  outgoingValue?: number;
  outgoingCount?: number;
  totalValue?: number;
  netFlow?: number;
}

interface WeeklyTransfersChartProps {
  data: DayMetric[];
}

type ChartType = 'bar' | 'area' | 'line';
type FilterMode = 'both' | 'incoming' | 'outgoing';

export const WeeklyTransfersChart: React.FC<WeeklyTransfersChartProps> = ({ data }) => {
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [filterMode, setFilterMode] = useState<FilterMode>('both');

  // Process data to ensure all incoming/outgoing properties exist
  const formattedData = useMemo(() => {
    return (data || []).map((item) => {
      const incomingVal = item.incomingValue ?? (item.value ? Math.round(item.value * 0.55) : 0);
      const outgoingVal = item.outgoingValue ?? (item.value ? Math.round(item.value * 0.45) : 0);
      const incomingCnt = item.incomingCount ?? Math.max(1, Math.round(item.count * 0.5));
      const outgoingCnt = item.outgoingCount ?? Math.max(1, Math.round(item.count * 0.5));
      const totalVal = item.totalValue ?? (incomingVal + outgoingVal);
      const netVal = item.netFlow ?? (incomingVal - outgoingVal);

      return {
        ...item,
        incomingValue: incomingVal,
        outgoingValue: outgoingVal,
        incomingCount: incomingCnt,
        outgoingCount: outgoingCnt,
        totalValue: totalVal,
        netFlow: netVal,
        // Short clean label for x-axis
        displayLabel: item.dayName || item.label.split(' ').slice(1).join(' ') || item.label,
      };
    });
  }, [data]);

  // Aggregate stats across the week
  const weekTotals = useMemo(() => {
    const totalIncoming = formattedData.reduce((sum, d) => sum + d.incomingValue, 0);
    const totalOutgoing = formattedData.reduce((sum, d) => sum + d.outgoingValue, 0);
    const totalCount = formattedData.reduce((sum, d) => sum + d.incomingCount + d.outgoingCount, 0);
    const netFlow = totalIncoming - totalOutgoing;
    const avgDaily = formattedData.length > 0 ? Math.round((totalIncoming + totalOutgoing) / formattedData.length) : 0;

    return {
      totalIncoming,
      totalOutgoing,
      totalCount,
      netFlow,
      avgDaily,
    };
  }, [formattedData]);

  // Custom Tooltip component for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const currentItem = formattedData.find((d) => d.displayLabel === label || d.label === label) || payload[0]?.payload;
    if (!currentItem) return null;

    return (
      <div 
        className="p-4 rounded-2xl bg-slate-950/95 border border-slate-700/80 shadow-2xl backdrop-blur-md text-right min-w-[240px] z-50 text-xs"
        dir="rtl"
      >
        <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-800">
          <span className="font-bold text-slate-200 text-sm">{currentItem.label}</span>
          <span className="text-[11px] text-slate-400 font-mono bg-slate-800/80 px-2 py-0.5 rounded-md">
            {currentItem.date}
          </span>
        </div>

        <div className="space-y-2">
          {/* Incoming volume */}
          {(filterMode === 'both' || filterMode === 'incoming') && (
            <div className="flex items-center justify-between bg-emerald-950/40 p-2 rounded-xl border border-emerald-900/50">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                <span className="text-emerald-300 font-semibold">تحويلات واردة:</span>
              </div>
              <div className="text-left font-mono">
                <span className="font-black text-emerald-400 text-sm">
                  {formatAmount(currentItem.incomingValue)}
                </span>
                <span className="text-[10px] text-emerald-300/80 mr-1 font-sans">ج.م</span>
                <div className="text-[10px] text-emerald-400/70 font-sans">
                  ({formatCount(currentItem.incomingCount)} عملية استلام)
                </div>
              </div>
            </div>
          )}

          {/* Outgoing volume */}
          {(filterMode === 'both' || filterMode === 'outgoing') && (
            <div className="flex items-center justify-between bg-rose-950/40 p-2 rounded-xl border border-rose-900/50">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                <span className="text-rose-300 font-semibold">تحويلات صادرة:</span>
              </div>
              <div className="text-left font-mono">
                <span className="font-black text-rose-400 text-sm">
                  {formatAmount(currentItem.outgoingValue)}
                </span>
                <span className="text-[10px] text-rose-300/80 mr-1 font-sans">ج.م</span>
                <div className="text-[10px] text-rose-400/70 font-sans">
                  ({formatCount(currentItem.outgoingCount)} عملية تحويل)
                </div>
              </div>
            </div>
          )}

          {/* Day Total and Net Flow */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-slate-300 font-medium">
            <span>إجمالي المعاملات:</span>
            <span className="font-mono font-bold text-white text-xs">
              {formatAmount(currentItem.totalValue)} ج.م
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">صافي السيولة لليوم:</span>
            <span className={`font-mono font-bold ${currentItem.netFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {currentItem.netFlow >= 0 ? '+' : ''}{formatAmount(currentItem.netFlow)} ج.م
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Format axis tick amounts
  const formatYAxisTick = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${Math.round(val / 1000)}k`;
    return `${val}`;
  };

  return (
    <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between shadow-xl">
      {/* Header with Title and Control Buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-black text-white">
              حجم التحويلات اليومية (الواردة والصادرة)
            </h2>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 font-semibold">
              Recharts تفاعلي
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            مقارنة تفاعلية لحجم السيولة النقدية المستلمة والمحولة يومياً عبر خطوط ومحافظ الكاش خلال الأسبوع
          </p>
        </div>

        {/* Action Controls: Chart type & Filter toggles */}
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          {/* Chart Type Toggle */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800">
            <button
              onClick={() => setChartType('bar')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer leading-normal ${
                chartType === 'bar'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="مخطط أشرطة متجاورة"
            >
              أعمدة
            </button>
            <button
              onClick={() => setChartType('area')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer leading-normal ${
                chartType === 'area'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="مخطط مساحي متدرج"
            >
              مساحي
            </button>
            <button
              onClick={() => setChartType('line')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer leading-normal ${
                chartType === 'line'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="مخطط خطي"
            >
              خطي
            </button>
          </div>

          {/* Metric Filter */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 text-xs">
            <button
              onClick={() => setFilterMode('both')}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer leading-normal ${
                filterMode === 'both'
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              الكل
            </button>
            <button
              onClick={() => setFilterMode('incoming')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer leading-normal ${
                filterMode === 'incoming'
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-700 shadow-sm'
                  : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>الوارد</span>
            </button>
            <button
              onClick={() => setFilterMode('outgoing')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer leading-normal ${
                filterMode === 'outgoing'
                  ? 'bg-rose-950 text-rose-400 border border-rose-700 shadow-sm'
                  : 'text-slate-400 hover:text-rose-400'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>الصادر</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Summary Cards above the chart */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {/* Total Incoming */}
        <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800/80 hover:border-emerald-500/40 transition">
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold mb-1">
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>إجمالي الوارد (أسبوعياً)</span>
          </div>
          <div className="text-base sm:text-lg font-black text-white font-mono">
            {formatAmount(weekTotals.totalIncoming)}{' '}
            <span className="text-[11px] font-sans text-slate-400">ج.م</span>
          </div>
        </div>

        {/* Total Outgoing */}
        <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800/80 hover:border-rose-500/40 transition">
          <div className="flex items-center gap-1.5 text-xs text-rose-400 font-semibold mb-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>إجمالي الصادر (أسبوعياً)</span>
          </div>
          <div className="text-base sm:text-lg font-black text-white font-mono">
            {formatAmount(weekTotals.totalOutgoing)}{' '}
            <span className="text-[11px] font-sans text-slate-400">ج.م</span>
          </div>
        </div>

        {/* Net Flow */}
        <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800/80 hover:border-cyan-500/40 transition">
          <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-semibold mb-1">
            <Scale className="w-3.5 h-3.5" />
            <span>صافي السيولة النقدية</span>
          </div>
          <div className={`text-base sm:text-lg font-black font-mono ${weekTotals.netFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {weekTotals.netFlow >= 0 ? '+' : ''}{formatAmount(weekTotals.netFlow)}{' '}
            <span className="text-[11px] font-sans text-slate-400">ج.م</span>
          </div>
        </div>

        {/* Daily Average */}
        <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800/80 hover:border-amber-500/40 transition">
          <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold mb-1">
            <Activity className="w-3.5 h-3.5" />
            <span>متوسط حجم المعاملات اليومي</span>
          </div>
          <div className="text-base sm:text-lg font-black text-amber-300 font-mono">
            {formatAmount(weekTotals.avgDaily)}{' '}
            <span className="text-[11px] font-sans text-slate-400">ج.م</span>
          </div>
        </div>
      </div>

      {/* Chart Legend Labels */}
      <div className="flex items-center justify-between pb-2 text-xs">
        <div className="flex items-center gap-4 flex-wrap">
          {(filterMode === 'both' || filterMode === 'incoming') && (
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="w-3 h-3 rounded-md bg-emerald-500 inline-block shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              التحويلات الواردة (استلام وتغذية خطوط)
            </span>
          )}
          {(filterMode === 'both' || filterMode === 'outgoing') && (
            <span className="flex items-center gap-1.5 text-rose-400 font-bold">
              <span className="w-3 h-3 rounded-md bg-rose-500 inline-block shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
              التحويلات الصادرة (تحويلات كاش وبنوك)
            </span>
          )}
        </div>
        <span className="text-[11px] text-slate-500 hidden sm:inline">
          مرر المؤشر فوق أي يوم لمعاينة التفاصيل الدقيقة
        </span>
      </div>

      {/* Recharts Canvas Container */}
      <div className="w-full h-[280px] sm:h-[320px] pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'bar' ? (
            <BarChart
              data={formattedData}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              barGap={4}
            >
              <defs>
                <linearGradient id="barGradientIn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#059669" stopOpacity={0.7} />
                </linearGradient>
                <linearGradient id="barGradientOut" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F43F5E" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#BE123C" stopOpacity={0.7} />
                </linearGradient>
              </defs>

              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#1E293B" 
                vertical={false} 
              />
              
              <XAxis 
                dataKey="displayLabel" 
                tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'Cairo, sans-serif' }} 
                axisLine={{ stroke: '#334155' }}
                tickLine={false}
              />
              
              <YAxis 
                tickFormatter={formatYAxisTick} 
                tick={{ fill: '#64748B', fontSize: 10, fontFamily: 'Cairo, sans-serif' }}
                axisLine={false}
                tickLine={false}
                width={38}
              />
              
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }} />

              {(filterMode === 'both' || filterMode === 'incoming') && (
                <Bar 
                  dataKey="incomingValue" 
                  name="التحويلات الواردة" 
                  fill="url(#barGradientIn)" 
                  radius={[6, 6, 0, 0]}
                  maxBarSize={36}
                />
              )}

              {(filterMode === 'both' || filterMode === 'outgoing') && (
                <Bar 
                  dataKey="outgoingValue" 
                  name="التحويلات الصادرة" 
                  fill="url(#barGradientOut)" 
                  radius={[6, 6, 0, 0]}
                  maxBarSize={36}
                />
              )}
            </BarChart>
          ) : chartType === 'area' ? (
            <AreaChart
              data={formattedData}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="areaGradientIn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#10B981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="areaGradientOut" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F43F5E" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#F43F5E" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#1E293B" 
                vertical={false} 
              />
              
              <XAxis 
                dataKey="displayLabel" 
                tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'Cairo, sans-serif' }} 
                axisLine={{ stroke: '#334155' }}
                tickLine={false}
              />
              
              <YAxis 
                tickFormatter={formatYAxisTick} 
                tick={{ fill: '#64748B', fontSize: 10, fontFamily: 'Cairo, sans-serif' }}
                axisLine={false}
                tickLine={false}
                width={38}
              />
              
              <Tooltip content={<CustomTooltip />} />

              {(filterMode === 'both' || filterMode === 'incoming') && (
                <Area 
                  type="monotone" 
                  dataKey="incomingValue" 
                  name="التحويلات الواردة" 
                  stroke="#10B981" 
                  strokeWidth={3}
                  fill="url(#areaGradientIn)" 
                  activeDot={{ r: 6, fill: '#10B981', stroke: '#0F172A', strokeWidth: 2 }}
                />
              )}

              {(filterMode === 'both' || filterMode === 'outgoing') && (
                <Area 
                  type="monotone" 
                  dataKey="outgoingValue" 
                  name="التحويلات الصادرة" 
                  stroke="#F43F5E" 
                  strokeWidth={3}
                  fill="url(#areaGradientOut)" 
                  activeDot={{ r: 6, fill: '#F43F5E', stroke: '#0F172A', strokeWidth: 2 }}
                />
              )}
            </AreaChart>
          ) : (
            <LineChart
              data={formattedData}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#1E293B" 
                vertical={false} 
              />
              
              <XAxis 
                dataKey="displayLabel" 
                tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'Cairo, sans-serif' }} 
                axisLine={{ stroke: '#334155' }}
                tickLine={false}
              />
              
              <YAxis 
                tickFormatter={formatYAxisTick} 
                tick={{ fill: '#64748B', fontSize: 10, fontFamily: 'Cairo, sans-serif' }}
                axisLine={false}
                tickLine={false}
                width={38}
              />
              
              <Tooltip content={<CustomTooltip />} />

              {(filterMode === 'both' || filterMode === 'incoming') && (
                <Line 
                  type="monotone" 
                  dataKey="incomingValue" 
                  name="التحويلات الواردة" 
                  stroke="#10B981" 
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#10B981' }}
                  activeDot={{ r: 7, fill: '#10B981', stroke: '#0F172A', strokeWidth: 2 }}
                />
              )}

              {(filterMode === 'both' || filterMode === 'outgoing') && (
                <Line 
                  type="monotone" 
                  dataKey="outgoingValue" 
                  name="التحويلات الصادرة" 
                  stroke="#F43F5E" 
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#F43F5E' }}
                  activeDot={{ r: 7, fill: '#F43F5E', stroke: '#0F172A', strokeWidth: 2 }}
                />
              )}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
