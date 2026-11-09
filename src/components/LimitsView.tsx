import React, { useState, useEffect } from 'react';
import { CashLine } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ProviderBadge } from './ProviderBadge';
import { 
  formatAmount, 
  formatCount, 
  toEnglishDigits 
} from '../utils/formatters';
import { 
  ShieldAlert, 
  Gauge, 
  TrendingUp, 
  Sliders, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Edit3,
  Check,
  X
} from 'lucide-react';

export const LimitsView: React.FC = () => {
  const { canManageLines } = useAuth();
  const [lines, setLines] = useState<CashLine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingLimitId, setEditingLimitId] = useState<string | null>(null);
  const [dailyVal, setDailyVal] = useState('');
  const [monthlyVal, setMonthlyVal] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await api.getLines();
      setLines(data);
    } catch (err) {
      console.error('Failed to load lines for limits:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleGlobalRefresh = () => loadData();
    window.addEventListener('app:global-refresh', handleGlobalRefresh);
    return () => window.removeEventListener('app:global-refresh', handleGlobalRefresh);
  }, []);

  const handleStartEdit = (line: CashLine) => {
    setEditingLimitId(line.id);
    setDailyVal(line.dailyLimit.toString());
    setMonthlyVal(line.monthlyLimit.toString());
  };

  const handleSaveEdit = async (lineId: string) => {
    setIsSaving(true);
    try {
      await api.updateLine(lineId, {
        dailyLimit: Number(dailyVal),
        monthlyLimit: Number(monthlyVal),
      });
      setEditingLimitId(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'فشل تحديث الحدود');
    } finally {
      setIsSaving(false);
    }
  };

  const totalDailyCap = lines.reduce((sum, l) => sum + l.dailyLimit, 0);
  const totalDailyUsed = lines.reduce((sum, l) => sum + (l.todayUsed || 0), 0);
  const totalMonthlyCap = lines.reduce((sum, l) => sum + l.monthlyLimit, 0);
  const totalMonthlyUsed = lines.reduce((sum, l) => sum + (l.monthUsed || 0), 0);

  return (
    <div className="space-y-6 pb-12 font-sans selection:bg-emerald-500 selection:text-white" dir="rtl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-3xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            مركز متابعة الحدود اليومية والشهرية
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
              المعادلات المالية المباشرة
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            متابعة فورية لاستهلاك حدود شركات الاتصالات والمحافظ الإلكترونية، ومنع تجاوز السقف المالي المحدد
          </p>
        </div>
      </div>

      {/* Equations & Aggregated Cap Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Daily Aggregated Cap Card */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-emerald-400" />
              إجمالي السقف اليومي لجميع الخطوط
            </span>
            <span className="text-xs font-mono font-bold text-emerald-400">
              {totalDailyCap > 0 ? formatCount(Math.round((totalDailyUsed / totalDailyCap) * 100)) : 0}% مستهلك
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black text-white font-mono">
              {formatAmount(totalDailyUsed)} <span className="text-xs text-slate-400 font-sans">/ {formatAmount(totalDailyCap)} ج.م</span>
            </div>
            <div className="text-xs font-mono font-semibold text-emerald-400">
              متبقي: {formatAmount(totalDailyCap - totalDailyUsed)} ج.م
            </div>
          </div>

          <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-700"
              style={{ width: `${totalDailyCap > 0 ? Math.min(100, (totalDailyUsed / totalDailyCap) * 100) : 0}%` }}
            />
          </div>

          <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-xl">
            <strong className="text-white">المعادلة: </strong>
            المتبقي اليومي = الحد اليومي المسموح ({formatAmount(totalDailyCap)}) - المحسوب اليوم ({formatAmount(totalDailyUsed)})
          </div>
        </div>

        {/* Monthly Aggregated Cap Card */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-cyan-400" />
              إجمالي السقف الشهري لجميع الخطوط
            </span>
            <span className="text-xs font-mono font-bold text-cyan-400">
              {totalMonthlyCap > 0 ? formatCount(Math.round((totalMonthlyUsed / totalMonthlyCap) * 100)) : 0}% مستهلك
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black text-white font-mono">
              {formatAmount(totalMonthlyUsed)} <span className="text-xs text-slate-400 font-sans">/ {formatAmount(totalMonthlyCap)} ج.م</span>
            </div>
            <div className="text-xs font-mono font-semibold text-cyan-400">
              متبقي: {formatAmount(totalMonthlyCap - totalMonthlyUsed)} ج.م
            </div>
          </div>

          <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className="h-full rounded-full bg-cyan-500 transition-all duration-700"
              style={{ width: `${totalMonthlyCap > 0 ? Math.min(100, (totalMonthlyUsed / totalMonthlyCap) * 100) : 0}%` }}
            />
          </div>

          <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-xl">
            <strong className="text-white">المعادلة: </strong>
            المتبقي الشهري = الحد الشهري المسموح ({formatAmount(totalMonthlyCap)}) - المحسوب هذا الشهر ({formatAmount(totalMonthlyUsed)})
          </div>
        </div>

      </div>

      {/* Lines Limits Detailed Table */}
      <div className="rounded-3xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-5 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-emerald-400" />
            جدول متابعة وتعديل حدود كل خط
          </h2>
          <span className="text-xs text-slate-400">
            أخضر: &lt; 80% · أصفر: 80-99% · أحمر: 100%
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-950/90 text-slate-400 border-b border-slate-800">
                <th className="py-3 px-4 font-semibold">الخط / المزود</th>
                <th className="py-3 px-4 font-semibold">رقم الهاتف</th>
                <th className="py-3 px-4 font-semibold">الحد اليومي</th>
                <th className="py-3 px-4 font-semibold">المستهلك اليوم</th>
                <th className="py-3 px-4 font-semibold">المتبقي اليومي</th>
                <th className="py-3 px-4 font-semibold">نسبة اليوم</th>
                <th className="py-3 px-4 font-semibold">الحد الشهري</th>
                <th className="py-3 px-4 font-semibold">المستهلك الشهري</th>
                <th className="py-3 px-4 font-semibold">المتبقي الشهري</th>
                <th className="py-3 px-4 font-semibold">نسبة الشهر</th>
                {canManageLines && <th className="py-3 px-4 font-semibold text-center">تعديل</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {lines.map((line) => {
                const todayUsed = line.todayUsed || 0;
                const remainingDaily = line.remainingDaily !== undefined ? line.remainingDaily : Math.max(0, line.dailyLimit - todayUsed);
                const dailyPercent = line.dailyUtilizationPercent || 0;

                const monthUsed = line.monthUsed || 0;
                const remainingMonthly = line.remainingMonthly !== undefined ? line.remainingMonthly : Math.max(0, line.monthlyLimit - monthUsed);
                const monthlyPercent = line.monthlyUtilizationPercent || 0;

                const isEditing = editingLimitId === line.id;

                return (
                  <tr key={line.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <ProviderBadge provider={line.provider} size="sm" showLabel={false} />
                        <span className="font-bold text-white">{line.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                      {line.phoneNumber}
                    </td>

                    {/* Daily Limit */}
                    <td className="py-3 px-4 font-mono">
                      {isEditing ? (
                        <input
                          type="number"
                          value={dailyVal}
                          onChange={(e) => setDailyVal(e.target.value)}
                          className="w-24 p-1 bg-slate-950 border border-slate-700 rounded text-xs font-mono text-white"
                        />
                      ) : (
                        <span className="font-bold text-slate-200">{formatAmount(line.dailyLimit)}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {formatAmount(todayUsed)}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                      {formatAmount(remainingDaily)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        dailyPercent >= 90 
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                          : dailyPercent >= 80 
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {formatCount(dailyPercent)}%
                      </span>
                    </td>

                    {/* Monthly Limit */}
                    <td className="py-3 px-4 font-mono">
                      {isEditing ? (
                        <input
                          type="number"
                          value={monthlyVal}
                          onChange={(e) => setMonthlyVal(e.target.value)}
                          className="w-24 p-1 bg-slate-950 border border-slate-700 rounded text-xs font-mono text-white"
                        />
                      ) : (
                        <span className="font-bold text-slate-200">{formatAmount(line.monthlyLimit)}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {formatAmount(monthUsed)}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-cyan-400">
                      {formatAmount(remainingMonthly)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        monthlyPercent >= 90 
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                          : monthlyPercent >= 80 
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                          : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                      }`}>
                        {formatCount(monthlyPercent)}%
                      </span>
                    </td>

                    {/* Edit Actions */}
                    {canManageLines && (
                      <td className="py-3 px-4 text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleSaveEdit(line.id)}
                              disabled={isSaving}
                              className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-500 transition"
                              title="حفظ"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingLimitId(null)}
                              className="p-1 bg-slate-800 text-slate-300 rounded hover:bg-slate-700 transition"
                              title="إلغاء"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartEdit(line)}
                            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
                            title="تعديل الحدود"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
