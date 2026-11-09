import React, { useState } from 'react';
import { Transfer, TransferStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { formatAmount, formatDateTime } from '../utils/formatters';
import { 
  X, 
  Printer, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Ban, 
  RotateCcw, 
  User, 
  Building2, 
  Calendar,
  Layers,
  ArrowRightLeft,
  FileCheck,
  ShieldAlert,
  Edit3
} from 'lucide-react';
import { EditTransferModal } from './EditTransferModal';

interface TransferDetailsModalProps {
  transfer: Transfer | null;
  isOpen: boolean;
  onClose: () => void;
  onPrint: (transfer: Transfer) => void;
  onStatusChanged?: (updated: Transfer) => void;
}

export const TransferDetailsModal: React.FC<TransferDetailsModalProps> = ({
  transfer,
  isOpen,
  onClose,
  onPrint,
  onStatusChanged,
}) => {
  const { canCancelTransfer } = useAuth();
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusReason, setStatusReason] = useState('');
  const [showStatusAction, setShowStatusAction] = useState<TransferStatus | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !transfer) return null;

  const handleUpdateStatus = async (newStatus: TransferStatus) => {
    setIsUpdatingStatus(true);
    setErrorMsg(null);
    try {
      const updated = await api.updateTransferStatus(transfer.id, newStatus, statusReason);
      if (onStatusChanged) onStatusChanged(updated);
      setShowStatusAction(null);
      setStatusReason('');
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل تحديث حالة العملية');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getStatusBadge = (status: TransferStatus) => {
    switch (status) {
      case 'completed':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            ناجحة ومسجلة
          </span>
        );
      case 'pending_verification':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            قيد المراجعة والتأكيد
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center gap-1.5">
            <Ban className="w-3.5 h-3.5" />
            ملغاة
          </span>
        );
      case 'refunded':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30 flex items-center gap-1.5">
            <RotateCcw className="w-3.5 h-3.5" />
            مستردة بالكامل
          </span>
        );
      case 'failed':
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/30 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            فاشلة / مرفوضة
          </span>
        );
    }
  };

  const formattedDate = formatDateTime(transfer.timestamp);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto" dir="rtl">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl my-8">
        
        {/* Header */}
        <div className="px-6 py-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="font-extrabold text-white text-lg">تفاصيل المعاملة المالية</h3>
                {getStatusBadge(transfer.status)}
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{transfer.referenceNumber}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Amount Showcase Banner */}
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">مبلغ التحويل الأصلي</span>
              <span className="text-lg font-black text-white font-mono">{formatAmount(transfer.amount)} ج.م</span>
            </div>
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">العمولة / الرسوم</span>
              <span className="text-lg font-black text-amber-400 font-mono">{formatAmount(transfer.fee)} ج.م</span>
            </div>
            <div className="p-3 bg-cyan-950/30 rounded-xl border border-cyan-500/30">
              <span className="text-xs text-cyan-300 block mb-1 font-semibold">إجمالي المبلغ المحصّل</span>
              <span className="text-lg font-black text-cyan-400 font-mono">{formatAmount(transfer.totalAmount)} ج.م</span>
            </div>
            <div className="p-3 bg-emerald-950/40 rounded-xl border border-emerald-500/40">
              <span className="text-xs text-emerald-300 block mb-1 font-bold">المتاح بعد التحويل</span>
              <span className="text-lg font-black text-emerald-400 font-mono">
                {transfer.balanceAfter !== undefined && transfer.balanceAfter !== null
                  ? `${formatAmount(transfer.balanceAfter)} ج.م`
                  : '—'}
              </span>
            </div>
          </div>

          {/* Source and Recipient Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Sender */}
            <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-slate-400 block pb-1 border-b border-slate-800">
                بيانات الطرف المرسل (المصدر)
              </span>
              <div>
                <span className="text-xs text-slate-400 block">الخط أو المحفظة:</span>
                <span className="text-sm font-bold text-slate-100">{transfer.sourceLineName}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">رقم الخط المرسل:</span>
                <span className="text-sm font-mono text-emerald-400">{transfer.sourceNumber}</span>
              </div>
            </div>

            {/* Recipient */}
            <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-slate-400 block pb-1 border-b border-slate-800">
                بيانات الطرف المستلم (الوجهة)
              </span>
              <div>
                <span className="text-xs text-slate-400 block">اسم المستلم:</span>
                <span className="text-sm font-bold text-slate-100">{transfer.recipientName}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">رقم المستلم / الحساب:</span>
                <span className="text-sm font-mono text-cyan-400 font-bold">{transfer.recipientNumber}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">الوجهة أو البنك:</span>
                <span className="text-xs font-semibold text-slate-300">{transfer.destinationBankOrWallet}</span>
              </div>
            </div>

          </div>

          {/* Operational Details */}
          <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800 space-y-3 text-xs">
            <span className="text-xs font-bold text-slate-400 block pb-1 border-b border-slate-800">
              التفاصيل الفنية والإدارية
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400">تاريخ ووقت المعاملة:</span>
                <p className="font-semibold text-slate-200 mt-0.5">{formattedDate}</p>
              </div>
              <div>
                <span className="text-slate-400">نوع التحويل:</span>
                <p className="font-semibold text-slate-200 mt-0.5">
                  {transfer.transferType === 'cash_wallet' && 'محفظة إلكترونية كاش'}
                  {transfer.transferType === 'bank_transfer' && 'تحويل بنكي مصرفي'}
                  {transfer.transferType === 'inter_line' && 'تغذية وموازنة بين الخطوط'}
                  {transfer.transferType === 'receive_money' && 'استلام أموال وإيداع وارد'}
                </p>
              </div>
              <div>
                <span className="text-slate-400">الموظف منفذ العملية:</span>
                <p className="font-semibold text-slate-200 mt-0.5">{transfer.operatorName}</p>
              </div>
              <div>
                <span className="text-slate-400">رقم مرجع مزود الخدمة:</span>
                <p className="font-mono text-slate-200 mt-0.5">{transfer.serviceProviderRef || 'غير متوفر'}</p>
              </div>
            </div>

            {transfer.notes && (
              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-slate-400 block mb-1">الملاحظات وسجل التعديل:</span>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
                  {transfer.notes}
                </div>
              </div>
            )}
          </div>

          {/* Administrative Actions for Manager / Admin */}
          {canCancelTransfer && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-slate-300 block">
                الإجراءات الإدارية وتعديل الحالة (للمدير المخول فقط)
              </span>

              {showStatusAction ? (
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 space-y-3">
                  <p className="text-xs text-amber-300 font-semibold">
                    هل أنت متأكد من تغيير حالة العملية إلى «{showStatusAction === 'cancelled' ? 'ملغاة' : showStatusAction === 'refunded' ? 'مستردة' : 'ناجحة'}»؟ سيتم تعديل رصيد الخط والحدود تلقائياً.
                  </p>
                  <input
                    type="text"
                    value={statusReason}
                    onChange={(e) => setStatusReason(e.target.value)}
                    placeholder="سبب الإجراء (مطلوب للتوثيق)..."
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={isUpdatingStatus}
                      onClick={() => handleUpdateStatus(showStatusAction)}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition disabled:opacity-50"
                    >
                      {isUpdatingStatus ? 'جاري المعالجة...' : 'تأكيد التغيير'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowStatusAction(null)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {transfer.status !== 'cancelled' && (
                    <button
                      type="button"
                      onClick={() => setShowStatusAction('cancelled')}
                      className="px-3 py-2 bg-rose-950/60 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      إلغاء العملية وإرجاع الرصيد
                    </button>
                  )}
                  {transfer.status !== 'refunded' && transfer.status === 'completed' && (
                    <button
                      type="button"
                      onClick={() => setShowStatusAction('refunded')}
                      className="px-3 py-2 bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/30 text-purple-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      استرداد كامل المبلغ
                    </button>
                  )}
                  {transfer.status === 'pending_verification' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus('completed')}
                      className="px-3 py-2 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      تأكيد نجاح التحويل
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-400 hover:text-white transition font-medium"
          >
            إغلاق النافذة
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowEditModal(true)}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-slate-700 rounded-xl font-bold flex items-center gap-2 transition cursor-pointer text-sm"
              title="تعديل المبلغ أو التاريخ أو الوقت"
            >
              <Edit3 className="w-4 h-4 text-amber-400" />
              <span>تعديل العملية</span>
            </button>

            <button
              type="button"
              onClick={() => onPrint(transfer)}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition cursor-pointer text-sm"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة الإيصال المالي</span>
            </button>
          </div>
        </div>

      </div>

      {/* Edit Transfer Modal from Details View */}
      <EditTransferModal
        isOpen={showEditModal}
        transfer={transfer}
        onClose={() => setShowEditModal(false)}
        onSaved={(updated) => {
          if (onStatusChanged) onStatusChanged(updated);
        }}
      />
    </div>
  );
};
