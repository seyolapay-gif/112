import React, { useEffect } from 'react';
import { Check } from 'lucide-react';

interface OperationSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  durationSeconds?: number;
}

export const OperationSuccessModal: React.FC<OperationSuccessModalProps> = ({
  isOpen,
  onClose,
  title = 'تمت العملية بنجاح!',
  message = 'تم تسجيل العملية وتحديث الأرصدة وسجلات الخزينة بنجاح تام.',
  durationSeconds = 5,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      onClose();
    }, durationSeconds * 1000);
    return () => clearTimeout(timer);
  }, [isOpen, onClose, durationSeconds]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in select-none" 
      dir="rtl"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-[32px] p-7 sm:p-9 max-w-[340px] w-full text-center shadow-2xl shadow-black/40 border border-slate-100 animate-scale-in space-y-4 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Clickable Green Checkmark Badge (Image design) - Click to dismiss immediately */}
        <button
          type="button"
          onClick={onClose}
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
            {title}
          </h3>
          <p className="text-xs sm:text-[13px] text-slate-600 font-medium mt-2 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Subtle timer hint */}
        <div className="pt-1">
          <span className="text-[10px] text-slate-400 font-medium block">
            تغلق تلقائياً خلال {durationSeconds} ثوانٍ أو بالنقر على علامة الصح ✓
          </span>
        </div>
      </div>
    </div>
  );
};
