import React, { useState, useEffect } from 'react';
import { Transfer } from '../types';
import { api } from '../services/api';
import { formatAmount, formatDateTime } from '../utils/formatters';
import { 
   X, 
   Edit3, 
   Calendar, 
   Clock, 
   Banknote, 
   CheckCircle2, 
   AlertCircle, 
   Loader2, 
   ArrowRightLeft,
   ShieldCheck,
   FileText,
   History
 } from 'lucide-react';

interface EditTransferModalProps {
  isOpen: boolean;
  transfer: Transfer | null;
  onClose: () => void;
  onSaved: (updatedTransfer: Transfer) => void;
}

export const EditTransferModal: React.FC<EditTransferModalProps> = ({
  isOpen,
  transfer,
  onClose,
  onSaved,
}) => {
  const [amount, setAmount] = useState<string>('');
  const [dateVal, setDateVal] = useState<string>('');
  const [timeVal, setTimeVal] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize form when a transfer is opened
  useEffect(() => {
    if (transfer) {
      setAmount(String(transfer.amount));
      setNotes(transfer.notes || '');

      const d = new Date(transfer.timestamp);
      if (!isNaN(d.getTime())) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        setDateVal(`${y}-${m}-${day}`);

        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        setTimeVal(`${hh}:${mm}`);
      } else {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        setDateVal(`${y}-${m}-${day}`);
        const hh = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        setTimeVal(`${hh}:${mm}`);
      }
      setErrorMsg(null);
    }
  }, [transfer, isOpen]);

  if (!isOpen || !transfer) return null;

  // Build target date preview
  const getComputedIsoDate = (): string | null => {
    if (!dateVal || !timeVal) return null;
    try {
      const [y, m, d] = dateVal.split('-').map(Number);
      const [hh, mm] = timeVal.split(':').map(Number);
      const dateObj = new Date(y, m - 1, d, hh || 0, mm || 0, 0);
      if (isNaN(dateObj.getTime())) return null;
      return dateObj.toISOString();
    } catch {
      return null;
    }
  };

  const previewIso = getComputedIsoDate();
  const numAmount = parseFloat(amount.replace(/,/g, '')) || 0;
  const originalAmount = transfer.amount;
  const amountDiff = numAmount - originalAmount;

  const handleSetToday = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    setDateVal(`${y}-${m}-${day}`);
  };

  const handleSetCurrentTime = () => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    setTimeVal(`${hh}:${mm}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0) {
      setErrorMsg('المبلغ يجب أن يكون أكبر من صفر');
      return;
    }
    if (!previewIso) {
      setErrorMsg('الرجاء التأكد من صحة التاريخ والوقت المدخلين');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);

    try {
      const updated = await api.updateTransfer(transfer.id, {
        amount: numAmount,
        timestamp: previewIso,
        notes: notes.trim(),
      });
      onSaved(updated);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء حفظ التعديلات');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      dir="rtl"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden font-sans text-slate-100 animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">تعديل بيانات العملية</h2>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300">
                  {transfer.referenceNumber}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                تعديل قيمة المبلغ أو تاريخ وساعة تسجيل العملية في النظام
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
            title="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Operation Summary Badge */}
          <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">الخط المستخدم:</span>
              <span className="font-bold text-white">{transfer.sourceLineName || 'خط كاش'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">المستلم:</span>
              <span className="font-bold text-teal-400">{transfer.recipientName || transfer.recipientNumber || 'عميل'}</span>
            </div>
          </div>

          {/* 1. AMOUNT FIELD */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Banknote className="w-4 h-4 text-emerald-400" />
                <span>المبلغ (ج.م) *</span>
              </span>
              {numAmount > 0 && (
                <span className="font-mono text-xs font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  {formatAmount(numAmount)} ج.م
                </span>
              )}
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                min="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="أدخل المبلغ الجديد"
                className="w-full px-4 py-3 rounded-2xl bg-slate-950/70 border border-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-white font-mono text-lg font-black outline-none transition"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                ج.م
              </span>
            </div>

            {/* Difference Note if Amount Changed */}
            {amountDiff !== 0 && !isNaN(amountDiff) && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 flex items-center justify-between">
                <span>المبلغ السابق: <strong className="font-mono">{formatAmount(originalAmount)}</strong> ج.م</span>
                <span className="font-bold">
                  الفارق: <strong className="font-mono">{amountDiff > 0 ? `+${formatAmount(amountDiff)}` : formatAmount(amountDiff)}</strong> ج.م
                </span>
              </div>
            )}
          </div>

          {/* 2. DATE AND TIME FIELDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Date Picker */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  <span>تاريخ العملية *</span>
                </label>
                <button
                  type="button"
                  onClick={handleSetToday}
                  className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold transition cursor-pointer"
                >
                  اليوم
                </button>
              </div>
              <input
                type="date"
                lang="en"
                dir="ltr"
                required
                value={dateVal}
                onChange={(e) => setDateVal(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-950/70 border border-slate-700 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 text-white font-mono text-sm outline-none transition text-center tracking-wider"
              />
            </div>

            {/* Time Picker */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-purple-400" />
                  <span>ساعة ووقت العملية *</span>
                </label>
                <button
                  type="button"
                  onClick={handleSetCurrentTime}
                  className="text-[10px] text-purple-400 hover:text-purple-300 font-bold transition cursor-pointer"
                >
                  الآن
                </button>
              </div>
              <input
                type="time"
                step="60"
                required
                value={timeVal}
                onChange={(e) => setTimeVal(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-950/70 border border-slate-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-white font-mono text-sm outline-none transition"
              />
            </div>
          </div>

          {/* Live Formatted Timestamp Preview */}
          {previewIso && (
            <div className="p-3 rounded-2xl bg-slate-950/50 border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-slate-400" />
                <span>المعاينة في الجدول:</span>
              </span>
              <span className="font-mono font-bold text-amber-300">
                {formatDateTime(previewIso)}
              </span>
            </div>
          )}

          {/* 3. OPTIONAL NOTES */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-slate-400" />
              <span>ملاحظات التعديل (اختياري)</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: تصحيح خطأ إدخال المبلغ أو تعديل التاريخ بطلب العميل"
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-950/70 border border-slate-700 focus:border-slate-500 text-white text-xs outline-none transition"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-lg shadow-amber-600/20 flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري الحفظ...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>حفظ التعديلات</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
