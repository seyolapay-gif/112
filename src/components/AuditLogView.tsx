import React, { useState, useEffect } from 'react';
import { AuditLog } from '../types';
import { api } from '../services/api';
import { formatDateTime, formatCount } from '../utils/formatters';
import { 
  FileText, 
  Search, 
  RefreshCw, 
  ShieldCheck, 
  User, 
  Clock, 
  AlertCircle,
  Filter,
  CheckCircle2
} from 'lucide-react';

export const AuditLogView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLogs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getAuditLogs();
      if (Array.isArray(data)) {
        setLogs(data);
      } else {
        setLogs([]);
      }
    } catch (err: any) {
      console.error('Failed to load audit logs:', err);
      setError('تعذر تحميل سجلات التدقيق مؤقتاً، جاري استخدام السجل المحلي');
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
    const handleGlobalRefresh = () => loadLogs();
    window.addEventListener('app:global-refresh', handleGlobalRefresh);
    return () => window.removeEventListener('app:global-refresh', handleGlobalRefresh);
  }, []);

  const safeLogs = Array.isArray(logs) ? logs : [];

  const filteredLogs = safeLogs.filter((log) => {
    if (!log) return false;
    const q = (search || '').toLowerCase().trim();
    
    // Action Category Filter
    if (actionFilter !== 'all') {
      const act = (log.action || '').toLowerCase();
      if (actionFilter === 'transfers' && !act.includes('تحويل') && !act.includes('استلام')) return false;
      if (actionFilter === 'auth' && !act.includes('دخول') && !act.includes('خروج') && !act.includes('تسجيل')) return false;
      if (actionFilter === 'settings' && !act.includes('إعداد') && !act.includes('حدود') && !act.includes('نظام')) return false;
    }

    if (!q) return true;

    const operator = String(log.operatorName || '').toLowerCase();
    const action = String(log.action || '').toLowerCase();
    const details = String(log.details || '').toLowerCase();
    const timestamp = String(log.timestamp || '').toLowerCase();
    const ip = String(log.ipAddress || '').toLowerCase();

    return (
      operator.includes(q) ||
      action.includes(q) ||
      details.includes(q) ||
      timestamp.includes(q) ||
      ip.includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-12 font-sans selection:bg-emerald-500 selection:text-white" dir="rtl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 p-5 sm:p-6 rounded-3xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FileText className="w-5 h-5" />
            </span>
            <span>سجل التدقيق الإداري (Audit Log)</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono font-semibold">
              {formatCount(safeLogs.length)} سجل
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            توثيق رقمي مشفر لكافة الإجراءات الإدارية والعمليات المالية والتحويلات وتعديلات الصلاحيات وفق المعايير المصرفية
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => loadLogs()}
            className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 rounded-lg text-xs font-semibold cursor-pointer"
          >
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* Search and Filters Toolbar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-88">
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث برقم العملية، اسم المسؤول، أو نوع الإجراء..."
            className="w-full pr-10 pl-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Quick Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800 w-full md:w-auto overflow-x-auto text-xs">
          <button
            onClick={() => setActionFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap cursor-pointer ${
              actionFilter === 'all' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            جميع الأحداث ({formatCount(safeLogs.length)})
          </button>
          <button
            onClick={() => setActionFilter('transfers')}
            className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap cursor-pointer ${
              actionFilter === 'transfers' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            العمليات المالية
          </button>
          <button
            onClick={() => setActionFilter('settings')}
            className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap cursor-pointer ${
              actionFilter === 'settings' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            إعدادات وحدود
          </button>
          <button
            onClick={() => setActionFilter('auth')}
            className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap cursor-pointer ${
              actionFilter === 'auth' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            تسجيل الدخول
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-3xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                <th className="py-3.5 px-4 font-semibold">التاريخ والوقت</th>
                <th className="py-3.5 px-4 font-semibold">المسؤول / المشغل</th>
                <th className="py-3.5 px-4 font-semibold">نوع الإجراء</th>
                <th className="py-3.5 px-4 font-semibold">تفاصيل الحدث</th>
                <th className="py-3.5 px-4 font-semibold text-center">عنوان IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin text-emerald-500 mx-auto mb-2" />
                    <span>جاري تحميل سجل التدقيق الإداري...</span>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-400">
                    <ShieldCheck className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                    <p className="font-bold text-white text-sm">لا توجد سجلات تدقيق تطابق البحث</p>
                    <p className="text-xs text-slate-500 mt-1">تأكد من شروط البحث أو اختر تصنيفاً آخر</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const actionStr = log.action || '';
                  const isFinancial = actionStr.includes('تحويل') || actionStr.includes('استلام');
                  const isConfig = actionStr.includes('إعداد') || actionStr.includes('حدود') || actionStr.includes('نظام');
                  const isSecurity = actionStr.includes('دخول') || actionStr.includes('خروج') || actionStr.includes('صلاحية');

                  return (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 text-slate-300 font-mono text-[11px] whitespace-nowrap">
                        {log.timestamp ? formatDateTime(log.timestamp) : '—'}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700/80 flex items-center justify-center text-slate-300 text-xs font-bold">
                            {(log.operatorName || 'م').charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-white block leading-tight">
                              {log.operatorName || 'مشغل غير محدد'}
                            </span>
                            <span className="text-[10px] text-slate-500 block font-mono">
                              {log.operatorId || 'usr'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border inline-block ${
                          isFinancial 
                            ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30' 
                            : isConfig
                            ? 'bg-cyan-950/60 text-cyan-400 border-cyan-500/30'
                            : isSecurity
                            ? 'bg-purple-950/60 text-purple-400 border-purple-500/30'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}>
                          {log.action || 'إجراء'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 leading-relaxed text-xs max-w-md">
                        {log.details || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {log.ipAddress || '127.0.0.1'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
