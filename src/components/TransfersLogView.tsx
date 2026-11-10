import React, { useState, useEffect } from 'react';
import { Transfer, CashLine } from '../types';
import { api } from '../services/api';
import { formatAmount, formatCount, formatDateTime } from '../utils/formatters';
import { 
  Search, 
  Filter, 
  Download, 
  Printer, 
  Eye, 
  Calendar, 
  RefreshCw, 
  ChevronRight, 
  ChevronLeft, 
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Ban,
  AlertCircle,
  RotateCcw,
  SlidersHorizontal,
  Edit3,
  Sparkles,
  X
} from 'lucide-react';
import { EditTransferModal } from './EditTransferModal';
import { AddOperationsScannerModal } from './AddOperationsScannerModal';

interface TransfersLogViewProps {
  onViewDetails: (transfer: Transfer) => void;
  onPrintReceipt: (transfer: Transfer) => void;
  initialFilterLineId?: string;
}

export const TransfersLogView: React.FC<TransfersLogViewProps> = ({
  onViewDetails,
  onPrintReceipt,
  initialFilterLineId,
}) => {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [lines, setLines] = useState<CashLine[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters State
  const [search, setSearch] = useState('');
  const [transferType, setTransferType] = useState('all');
  const [status, setStatus] = useState('all');
  const [sourceLineId, setSourceLineId] = useState(initialFilterLineId || 'all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Edit Modal State
  const [editingTransfer, setEditingTransfer] = useState<Transfer | null>(null);

  // Add Operations Scanner Modal State
  const [isAddOperationsModalOpen, setIsAddOperationsModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const selectedLine = lines.find((l) => l.id === sourceLineId);

  const loadData = async (targetPage = page) => {
    setIsLoading(true);
    try {
      const [res, linesData] = await Promise.all([
        api.getTransfers({
          search: search.trim() || undefined,
          transferType,
          status,
          sourceLineId,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          page: targetPage,
          limit: pageSize,
        }),
        api.getLines(),
      ]);

      const transferList = Array.isArray(res?.transfers) 
        ? res.transfers 
        : (Array.isArray(res) ? res : []);
      setTransfers(transferList);
      setTotalCount(typeof res?.totalCount === 'number' ? res.totalCount : transferList.length);
      setTotalPages(typeof res?.totalPages === 'number' ? res.totalPages : (Math.ceil(transferList.length / pageSize) || 1));
      setPage(typeof res?.page === 'number' ? res.page : targetPage);
      setLines(Array.isArray(linesData) ? linesData : []);
    } catch (err) {
      console.error('Failed to load transfers log:', err);
      setTransfers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(1);
    const handleGlobalRefresh = () => loadData(1);
    window.addEventListener('app:global-refresh', handleGlobalRefresh);
    return () => window.removeEventListener('app:global-refresh', handleGlobalRefresh);
  }, [transferType, status, sourceLineId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData(1);
  };

  const handleExportCSV = () => {
    if (transfers.length === 0) return;
    const headers = ['الرقم المرجعي', 'التاريخ والوقت', 'نوع التحويل', 'الخط المرسل', 'رقم المرسل', 'المستلم', 'رقم المستلم', 'المبلغ', 'المتاح', 'الرسوم', 'الإجمالي', 'الموظف', 'الحالة', 'مرجع المزود'];
    const rows = transfers.map((t) => [
      t.referenceNumber,
      t.timestamp,
      t.transferType,
      t.sourceLineName,
      t.sourceNumber,
      t.recipientName,
      t.recipientNumber,
      t.amount,
      t.balanceAfter !== undefined && t.balanceAfter !== null ? t.balanceAfter : '—',
      t.fee,
      t.totalAmount,
      t.operatorName,
      t.status,
      t.serviceProviderRef || '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `transfers_report_${new Date().toISOString().slice(0, 10)}.csv`);
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
              سجل التحويلات والعمليات
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono font-semibold">
                {totalCount} عملية مسجلة
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              منظومة سيولة (Seyola) · البحث المتقدم، استعراض تفاصيل العمليات، وتصدير التقارير وطباعة الإيصالات المالية
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleExportCSV}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition text-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>تصدير تقرير CSV</span>
          </button>
        </div>
      </div>

      {/* Advanced Filter Toolbar (matching mockup) */}
      <form onSubmit={handleSearchSubmit} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          
          {/* Search Box */}
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              بحث برقم العملية أو رقم الهاتف
            </label>
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث بالرقم المرجعي أو الهاتف..."
                className="w-full pr-3 pl-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Transfer Type */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">نوع التحويل</label>
            <select
              value={transferType}
              onChange={(e) => setTransferType(e.target.value)}
              className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">الكل</option>
              <option value="cash_wallet">محفظة كاش</option>
              <option value="bank_transfer">تحويل بنكي</option>
              <option value="inter_line">بين الخطوط</option>
              <option value="receive_money">استلام أموال (وارد)</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">حالة العملية</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">كل الحالات</option>
              <option value="completed">ناجحة</option>
              <option value="pending_verification">قيد المراجعة</option>
              <option value="cancelled">ملغاة</option>
              <option value="failed">فاشلة</option>
              <option value="refunded">مستردة</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">من تاريخ</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">إلى تاريخ</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

        </div>

        {/* Submit Filter Button & Conditional Add Operations Log Button */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold">تصفية حسب الخط:</span>
            <select
              value={sourceLineId}
              onChange={(e) => setSourceLineId(e.target.value)}
              className="p-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">جميع الخطوط والمحافظ</option>
              {lines.map((l) => (
                <option key={l.id} value={l.id}>{l.name} ({l.phoneNumber})</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="submit"
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition cursor-pointer shadow-md shadow-emerald-600/20 active:scale-95"
            >
              <Search className="w-3.5 h-3.5" />
              <span>تطبيق البحث</span>
            </button>

            {/* Add Operations Log Button: Hidden until user selects a specific line! */}
            {sourceLineId && sourceLineId !== 'all' && (
              <button
                type="button"
                onClick={() => setIsAddOperationsModalOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition cursor-pointer shadow-lg shadow-indigo-900/30 border border-indigo-400/30 animate-in fade-in zoom-in-95 duration-200 active:scale-95"
                title={`إضافة وقراءة سجل عمليات بالماسح الضوئي لـ: ${selectedLine?.name || ''}`}
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>إضافة سجل عمليات</span>
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Success Notification Banner */}
      {successToast && (
        <div className="p-4 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button
            onClick={() => setSuccessToast(null)}
            className="p-1 hover:bg-emerald-900/50 rounded-lg text-emerald-400 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Transfers Data Table */}
      <div className="rounded-3xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                <th className="py-3.5 px-4 font-semibold">الرقم المرجعي</th>
                <th className="py-3.5 px-4 font-semibold">التاريخ والوقت</th>
                <th className="py-3.5 px-4 font-semibold text-center whitespace-nowrap">نوع التحويل</th>
                <th className="py-3.5 px-4 font-semibold">الخط المرسل</th>
                <th className="py-3.5 px-4 font-semibold">المستلم</th>
                <th className="py-3.5 px-4 font-semibold text-center whitespace-nowrap">المبلغ (ج.م)</th>
                <th className="py-3.5 px-4 font-semibold text-emerald-500 dark:text-emerald-400 text-center whitespace-nowrap">
                  <div className="flex flex-col items-center justify-center">
                    <span>المتاح</span>
                    <span className="text-[9px] text-emerald-600 dark:text-emerald-500/80 font-normal">بعد التحويل</span>
                  </div>
                </th>
                <th className="py-3.5 px-4 font-semibold text-center whitespace-nowrap">الرسوم</th>
                <th className="py-3.5 px-4 font-semibold">الموظف</th>
                <th className="py-3.5 px-4 font-semibold text-center">الحالة</th>
                <th className="py-3.5 px-4 font-semibold text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin text-emerald-500 mx-auto mb-2" />
                    <span>جاري تحميل بيانات السجل...</span>
                  </td>
                </tr>
              ) : transfers.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    لم يتم العثور على أي عمليات مسجلة بالمعايير المحددة
                  </td>
                </tr>
              ) : (
                transfers.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-200">
                      {tx.referenceNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {formatDateTime(tx.timestamp)}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {tx.transferType === 'cash_wallet' && (
                        <span className="text-slate-300 font-medium text-[11px] whitespace-nowrap">محفظة كاش</span>
                      )}
                      {tx.transferType === 'bank_transfer' && (
                        <span className="text-slate-300 font-medium text-[11px] whitespace-nowrap">تحويل بنكي</span>
                      )}
                      {tx.transferType === 'inter_line' && (
                        <span className="text-slate-300 font-medium text-[11px] whitespace-nowrap">بين الخطوط</span>
                      )}
                      {tx.transferType === 'receive_money' && (
                        <span className="px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-500 dark:text-blue-400 border border-blue-500/30 font-bold inline-block text-[10px] whitespace-nowrap tracking-tight">
                          استلام وارد
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-200">{tx.sourceLineName}</div>
                      <div className="text-[10px] font-mono text-slate-400">{tx.sourceNumber}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-200">{tx.recipientName}</div>
                      <div className="text-[10px] font-mono text-cyan-400 font-bold">{tx.recipientNumber}</div>
                    </td>
                    <td className={`py-3 px-4 font-mono font-bold text-sm text-center whitespace-nowrap ${
                      tx.transferType === 'receive_money' ? 'text-blue-500 dark:text-blue-400' : 'text-slate-900 dark:text-white'
                    }`}>
                      {tx.transferType === 'receive_money' ? `+ ${formatAmount(tx.amount)}` : formatAmount(tx.amount)}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400 text-center whitespace-nowrap">
                      {tx.balanceAfter !== undefined && tx.balanceAfter !== null
                        ? formatAmount(tx.balanceAfter)
                        : '—'}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-sm text-red-600 dark:text-red-400 text-center whitespace-nowrap">
                      {formatAmount(tx.fee)}
                    </td>
                    <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                      {tx.operatorName}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {tx.status === 'completed' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          ناجحة
                        </span>
                      )}
                      {tx.status === 'pending_verification' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          قيد المراجعة
                        </span>
                      )}
                      {tx.status === 'cancelled' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                          ملغاة
                        </span>
                      )}
                      {tx.status === 'failed' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/30">
                          فاشلة
                        </span>
                      )}
                      {tx.status === 'refunded' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">
                          مستردة
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setEditingTransfer(tx)}
                          className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-700/80 rounded-lg transition cursor-pointer"
                          title="تعديل المبلغ أو التاريخ أو الوقت"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onViewDetails(tx)}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition cursor-pointer"
                          title="عرض تفاصيل العملية"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onPrintReceipt(tx)}
                          className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-700 rounded-lg transition cursor-pointer"
                          title="طباعة إيصال مالي"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="font-mono">
            عرض {transfers.length > 0 ? formatCount((page - 1) * pageSize + 1) : 0} إلى {formatCount(Math.min(page * pageSize, totalCount))} من إجمالي {formatCount(totalCount)} عملية
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => loadData(page - 1)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 disabled:opacity-40 transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              const pageNumber = i + 1;
              return (
                <button
                  key={pageNumber}
                  onClick={() => loadData(pageNumber)}
                  className={`w-8 h-8 rounded-xl font-bold transition text-xs cursor-pointer ${
                    page === pageNumber ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}

            <button
              disabled={page >= totalPages}
              onClick={() => loadData(page + 1)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 disabled:opacity-40 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* Edit Transfer Modal (Amount, Date, Time) */}
      <EditTransferModal
        isOpen={!!editingTransfer}
        transfer={editingTransfer}
        onClose={() => setEditingTransfer(null)}
        onSaved={(updated) => {
          setTransfers(prev => prev.map(t => t.id === updated.id ? updated : t));
          loadData();
        }}
      />

      {/* Add Operations Scanner Modal */}
      <AddOperationsScannerModal
        isOpen={isAddOperationsModalOpen}
        onClose={() => setIsAddOperationsModalOpen(false)}
        cashLine={selectedLine || null}
        onSuccess={(count) => {
          setSuccessToast(`تم بنجاح حفظ واستيراد ${count} عملية في سجل خط "${selectedLine?.name || ''}"`);
          loadData(1);
          window.dispatchEvent(new CustomEvent('app:global-refresh'));
          setTimeout(() => setSuccessToast(null), 7000);
        }}
      />

    </div>
  );
};
