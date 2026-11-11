import React, { useRef, useState, useEffect } from 'react';
import { Transfer } from '../types';
import { formatAmount } from '../utils/formatters';
import { 
  Printer, 
  X, 
  CheckCircle2, 
  ShieldCheck, 
  Check, 
  QrCode, 
  Calendar, 
  User, 
  Hash, 
  Receipt, 
  Wallet,
  Copy,
  Phone,
  Loader2
} from 'lucide-react';

interface ReceiptModalProps {
  transfer: Transfer | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmComplete?: () => Promise<void> | void;
  onShowSuccess?: () => void;
  isPending?: boolean;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  transfer,
  isOpen,
  onClose,
  onConfirmComplete,
  onShowSuccess,
  isPending = false,
}) => {
  const [receiptType, setReceiptType] = useState<'thermal' | 'a4'>('thermal');
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const printAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showSuccessOverlay) {
      const timer = setTimeout(() => {
        setShowSuccessOverlay(false);
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessOverlay, onClose]);

  if (!isOpen || !transfer) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyRef = () => {
    if (transfer?.referenceNumber) {
      navigator.clipboard.writeText(transfer.referenceNumber);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    }
  };

  const handleCompleteOperation = async () => {
    setErrorMessage(null);
    if (onConfirmComplete) {
      try {
        setIsSaving(true);
        await onConfirmComplete();
        setIsSaving(false);
        if (onShowSuccess) {
          onClose();
          onShowSuccess();
        } else {
          setShowSuccessOverlay(true);
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'حدث خطأ أثناء حفظ العملية');
        setIsSaving(false);
      }
    } else {
      if (onShowSuccess) {
        onClose();
        onShowSuccess();
      } else {
        setShowSuccessOverlay(true);
      }
    }
  };

  // Clean, robust single-line date formatting
  const getCleanDateTime = (timestamp: string) => {
    try {
      const d = new Date(timestamp);
      if (isNaN(d.getTime())) return timestamp;
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      let h = d.getHours();
      const mins = String(d.getMinutes()).padStart(2, '0');
      const period = h >= 12 ? 'م' : 'ص';
      h = h % 12 || 12;
      return `${y}/${m}/${day} - ${h}:${mins} ${period}`;
    } catch {
      return timestamp;
    }
  };

  const formattedDate = getCleanDateTime(transfer.timestamp);
  const isReceive = transfer.transferType === 'receive_money';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-3 bg-slate-950/80 backdrop-blur-md overflow-y-auto" dir="rtl">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-[420px] overflow-hidden shadow-2xl my-auto flex flex-col max-h-[96vh] animate-scale-in">
        
        {/* Top Header Bar */}
        <div className="px-3.5 py-2 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center p-1 shadow-inner">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-black text-white text-xs tracking-tight leading-tight">
                  {isReceive ? 'إيصال استلام نقدية' : 'إيصال تحويل مالي'}
                </h3>
                {isPending && (
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    بانتظار الإتمام
                  </span>
                )}
              </div>
              <p className="text-[9.5px] text-slate-400 font-mono leading-none mt-0.5" dir="ltr">
                {transfer.referenceNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Format Switcher */}
            <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[10px]">
              <button
                type="button"
                onClick={() => setReceiptType('thermal')}
                className={`px-2 py-0.5 rounded transition font-bold cursor-pointer ${
                  receiptType === 'thermal' 
                    ? 'bg-emerald-600 text-white shadow-xs' 
                    : 'text-slate-400 hover:text-white'
                }`}
                style={receiptType === 'thermal' ? { color: '#ffffff' } : undefined}
              >
                حراري
              </button>
              <button
                type="button"
                onClick={() => setReceiptType('a4')}
                className={`px-2 py-0.5 rounded transition font-bold cursor-pointer ${
                  receiptType === 'a4' 
                    ? 'bg-emerald-600 text-white shadow-xs' 
                    : 'text-slate-400 hover:text-white'
                }`}
                style={receiptType === 'a4' ? { color: '#ffffff' } : undefined}
              >
                كامل
              </button>
            </div>

            <button
              onClick={onClose}
              disabled={isSaving}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer disabled:opacity-50"
              title="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Canvas Container */}
        <div className="p-2 sm:p-2.5 bg-slate-950/70 overflow-y-auto flex justify-center items-center flex-1">
          
          <div
            id="printable-receipt"
            ref={printAreaRef}
            className={`bg-white text-slate-900 transition-all font-sans select-text shadow-xl border border-slate-200/90 rounded-2xl relative overflow-hidden ${
              receiptType === 'thermal' 
                ? 'w-full max-w-[350px] p-3 text-xs' 
                : 'w-full max-w-[370px] p-3.5 text-xs'
            }`}
            style={{
              fontFamily: "'Cairo', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            }}
          >
            {/* Soft Mint Arc Glow Background */}
            <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-emerald-100/60 via-emerald-50/25 to-transparent pointer-events-none rounded-t-2xl" />

            {/* Sparkles */}
            <span className="absolute top-4 left-8 text-emerald-400 text-[10px] select-none pointer-events-none">✦</span>
            <span className="absolute top-8 left-12 text-emerald-300 text-[8px] select-none pointer-events-none">✦</span>
            <span className="absolute top-4 right-12 text-emerald-300 text-[8px] select-none pointer-events-none">✦</span>
            <span className="absolute top-7 right-8 text-emerald-400 text-[10px] select-none pointer-events-none">✦</span>

            {/* Top Official Receipt Header with Logo */}
            <div className="relative pt-0.5 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center p-1 shadow-xs">
                  <img src="/logo.png" alt="Seolah" className="w-full h-full object-contain" />
                </div>
                <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                  <Check className="w-4 h-4 stroke-[3.5] text-white" />
                </div>
              </div>

              {/* Title & Subtitle */}
              <h1 className="text-xs sm:text-sm font-black tracking-tight text-slate-900 leading-tight">
                منظومة سيولة لإدارة الكاش والتحويلات المالية
              </h1>
              <p className="text-[9.5px] sm:text-[10px] text-slate-500 font-medium mt-0.5">
                إشعار تسجيل وقيد مالي إلكتروني رسمي معتمد · Seyola
              </p>
            </div>

            {/* 1. Metadata Card (Reference, Date, Operator) */}
            <div className="mt-2 p-2 sm:p-2.5 rounded-xl bg-white border border-slate-200/90 space-y-1.5 text-xs shadow-2xs">
              {/* Reference Number with Copy Icon */}
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-bold flex items-center gap-1 text-[10px] sm:text-[10.5px]">
                  <Hash className="w-3 h-3 text-slate-400" />
                  <span>الرقم المرجعي الموحد:</span>
                </span>
                <button
                  type="button"
                  onClick={handleCopyRef}
                  className="font-mono text-slate-800 text-[10px] sm:text-[10.5px] font-bold bg-slate-50 hover:bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md flex items-center gap-1 cursor-pointer transition shadow-2xs"
                  title="انقر لنسخ الرقم المرجعي"
                >
                  <span dir="ltr">{transfer.referenceNumber}</span>
                  <Copy className={`w-2.5 h-2.5 ${copiedRef ? 'text-emerald-600' : 'text-slate-400'}`} />
                  {copiedRef && <span className="text-[8.5px] text-emerald-600 font-bold">نسخ ✓</span>}
                </button>
              </div>

              <div className="border-t border-slate-100" />

              {/* Date & Time */}
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-bold flex items-center gap-1 text-[10px] sm:text-[10.5px]">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>تاريخ ووقت المعاملة:</span>
                </span>
                <span className="text-slate-800 font-bold font-mono text-[10px] sm:text-[10.5px] whitespace-nowrap" dir="ltr">
                  {formattedDate}
                </span>
              </div>

              <div className="border-t border-slate-100" />

              {/* Operator */}
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-bold flex items-center gap-1 text-[10px] sm:text-[10.5px]">
                  <User className="w-3 h-3 text-slate-400" />
                  <span>الموظف / المسؤول المنفذ:</span>
                </span>
                <span className="text-slate-900 font-bold text-[10px] sm:text-[10.5px]">
                  {transfer.operatorName || 'عادل فتحي'}
                </span>
              </div>
            </div>

            {/* 2. Financial Breakdown Card (With Customer Phone replacing generic header) */}
            <div className="mt-1.5 p-2 sm:p-2.5 rounded-xl bg-emerald-50/40 border border-emerald-100/90 space-y-1 text-xs shadow-2xs">
              
              {/* Header: Replaced with 'رقم العميل' and opposite to it the 11-digit Phone Number */}
              <div className="flex items-center justify-between pb-1 border-b border-emerald-200/60">
                <span className="text-[10px] sm:text-[10.5px] font-bold text-slate-800 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-emerald-600" />
                  <span>{isReceive ? 'رقم العميل:' : 'رقم العميل / المستلم:'}</span>
                </span>
                <span className="font-mono font-black text-slate-900 text-xs sm:text-[12.5px] tracking-wider" dir="ltr">
                  {transfer.recipientNumber || transfer.sourceNumber}
                </span>
              </div>

              {/* Base Amount */}
              <div className="flex items-center justify-between">
                <span className="text-slate-700 font-bold text-[10px] sm:text-[10.5px]">
                  {isReceive ? 'المبلغ المستلم:' : 'مبلغ التحويل:'}
                </span>
                <div className="text-left font-black font-mono text-slate-900 text-xs sm:text-[13px]">
                  <span dir="ltr">{formatAmount(transfer.amount)}</span>
                  <span className="text-[9.5px] text-slate-500 font-sans mr-0.5">ج.م</span>
                </div>
              </div>

              {/* Provider Commission if present */}
              {transfer.commission !== undefined && transfer.commission > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-700 font-bold text-[10px] sm:text-[10.5px]">عمولة التحويل:</span>
                  <div className="text-left font-bold font-mono text-emerald-600 text-xs sm:text-[13px]">
                    <span dir="ltr">+{formatAmount(transfer.commission)}</span>
                    <span className="text-[9.5px] text-slate-500 font-sans mr-0.5">ج.م</span>
                  </div>
                </div>
              )}

              {/* Service Fee */}
              <div className="flex items-center justify-between">
                <span className="text-slate-700 font-bold text-[10px] sm:text-[10.5px]">
                  {isReceive ? 'عمولة الاستلام:' : 'رسوم التحويل:'}
                </span>
                <div className="text-left font-bold font-mono text-emerald-600 text-xs sm:text-[13px]">
                  <span dir="ltr">+{formatAmount(transfer.fee)}</span>
                  <span className="text-[9.5px] text-slate-500 font-sans mr-0.5">ج.م</span>
                </div>
              </div>

              {/* Dashed Separator */}
              <div className="border-t border-dashed border-emerald-200/80 my-0.5" />

              {/* Total Amount */}
              <div className="flex items-center justify-between pt-0.5">
                <div>
                  <span className="font-black text-xs sm:text-[12.5px] text-slate-900 block leading-tight">
                    {isReceive ? 'إجمالي المبلغ:' : 'الإجمالي المطلوب:'}
                  </span>
                  <span className="text-[8.5px] text-slate-400 font-normal block mt-0.5">
                    شامل كافة الرسوم والضرائب المعتمدة
                  </span>
                </div>
                <div className="text-left">
                  <span className="font-black font-mono text-emerald-700 text-sm sm:text-base block tracking-tight leading-tight" dir="ltr">
                    {formatAmount(
                      Number(transfer.amount || 0) + Number(transfer.fee || 0)
                    )}
                    <span className="text-[11px] font-sans mr-0.5">ج.م</span>
                  </span>
                  <span className="text-[8.5px] text-emerald-600 font-bold block text-left mt-0.5">
                    (جنيه مصري EGP)
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Footer: Official Verification & QR Code */}
            <div className="mt-2 pt-1.5 border-t border-dashed border-slate-200 flex items-center justify-between text-xs">
              {/* Left block: Official Authentication */}
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                </div>
                <div>
                  <span className="font-black text-slate-900 block text-[9.5px] sm:text-[10px] leading-tight">
                    توثيق إلكتروني معتمد رسمياً
                  </span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[8px] sm:text-[8.5px] text-emerald-600 font-bold">خزينة معتمدة</span>
                  </div>
                </div>
              </div>

              {/* Vertical divider */}
              <div className="h-5 w-px bg-slate-200 mx-1 shrink-0" />

              {/* Right block: System Code + QR Code */}
              <div className="flex items-center gap-1.5">
                <div className="text-right">
                  <span className="text-[8.5px] font-mono text-slate-500 font-bold block leading-tight" dir="ltr">
                    AUTH-{transfer.referenceNumber.replace(/\D/g, '').slice(-6) || '269210'}
                  </span>
                  <span className="text-[7.5px] font-mono text-slate-400 uppercase tracking-wider block mt-0.5">
                    SYSTEM CODE : APPROVED
                  </span>
                </div>
                <QrCode className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-emerald-600 shrink-0" />
              </div>
            </div>

          </div>

        </div>

        {/* Error message banner if save fails */}
        {errorMessage && (
          <div className="px-4 py-2 bg-rose-500/20 border-t border-rose-500/30 text-rose-300 text-xs font-bold text-center">
            {errorMessage}
          </div>
        )}

        {/* Modal Bottom Actions */}
        <div className="px-3.5 py-2 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-3.5 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition font-bold cursor-pointer rounded-xl border border-slate-700 disabled:opacity-50"
          >
            إغلاق
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              disabled={isSaving}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1 border border-emerald-400/50 shadow-md shadow-emerald-600/30 transition cursor-pointer active:scale-95 text-xs disabled:opacity-50"
              style={{ color: '#ffffff' }}
            >
              <Printer className="w-3.5 h-3.5 text-white" />
              <span className="text-white font-bold">طباعة الإيصال</span>
            </button>

            {/* إتمام العملية button - The ONLY button that commits and saves the operation */}
            <button
              type="button"
              onClick={handleCompleteOperation}
              disabled={isSaving}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5 border border-blue-400/50 shadow-md shadow-blue-600/30 transition cursor-pointer active:scale-95 text-xs disabled:opacity-50"
              style={{ color: '#ffffff' }}
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              )}
              <span className="text-white font-bold">
                {isSaving ? 'جاري الحفظ...' : 'إتمام العملية'}
              </span>
            </button>
          </div>
        </div>

      </div>

      {/* Success Notification Modal Overlay - Exact design as requested */}
      {showSuccessOverlay && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in" 
          dir="rtl"
        >
          <div 
            className="bg-white rounded-[32px] p-7 sm:p-9 max-w-[340px] w-full text-center shadow-2xl shadow-black/40 border border-slate-100 animate-scale-in space-y-4 relative overflow-hidden"
          >
            {/* Clickable Green Checkmark Badge (Image design) - Click to dismiss immediately */}
            <button
              type="button"
              onClick={() => {
                setShowSuccessOverlay(false);
                onClose();
              }}
              className="relative mx-auto w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-emerald-100/60 border border-emerald-200/80 flex items-center justify-center p-1.5 shadow-md shadow-emerald-500/20 cursor-pointer hover:scale-105 active:scale-95 transition-transform duration-200 group"
              title="انقر على علامة الصح للإغلاق الفوري"
            >
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 border-emerald-400 bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                <Check className="w-6 h-6 stroke-[3.5] text-emerald-500 group-hover:text-emerald-600 transition-colors" />
              </div>
            </button>

            {/* Title & Description */}
            <div className="pt-0.5">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                تمت العملية بنجاح!
              </h3>
              <p className="text-xs sm:text-[13px] text-slate-600 font-medium mt-2 leading-relaxed">
                تم تسجيل العملية وتحديث الأرصدة وسجلات الخزينة بنجاح تام.
              </p>
            </div>

            {/* Subtle countdown helper text */}
            <div className="pt-1">
              <span className="text-[10.5px] text-slate-400 font-medium block">
                تغلق تلقائياً خلال 5 ثوانٍ أو بالنقر على علامة الصح ✓
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
