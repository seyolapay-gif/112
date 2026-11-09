import React, { useState } from 'react';
import { DashboardStats, Transfer, CashLine, ProviderType } from '../types';
import { ProviderBadge } from './ProviderBadge';
import { formatAmount, formatCount, formatDateTime } from '../utils/formatters';
import { 
  X, 
  ArrowLeftRight, 
  CheckCircle2, 
  XCircle, 
  Coins, 
  Layers, 
  Wallet, 
  Calendar, 
  Banknote, 
  Eye, 
  Printer, 
  ExternalLink,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  Search,
  Filter,
  Edit3
} from 'lucide-react';
import { EditTransferModal } from './EditTransferModal';

export type CardDetailType = 
  | 'transfers_count' 
  | 'transfers_value' 
  | 'month_count' 
  | 'month_value' 
  | 'successful' 
  | 'failed' 
  | 'commissions' 
  | 'liquidity';

interface CardDetailsModalProps {
  isOpen: boolean;
  type: CardDetailType | null;
  stats: DashboardStats;
  lines: CashLine[];
  onClose: () => void;
  onViewTransferDetails: (transfer: Transfer) => void;
  onPrintReceipt: (transfer: Transfer) => void;
  onNavigateToTransfers: (status?: string, type?: string) => void;
  onInitiateTransfer?: (lineId?: string) => void;
}

export const CardDetailsModal: React.FC<CardDetailsModalProps> = ({
  isOpen,
  type,
  stats,
  lines,
  onClose,
  onViewTransferDetails,
  onPrintReceipt,
  onNavigateToTransfers,
  onInitiateTransfer,
}) => {
  if (!isOpen || !type) return null;

  const [editingTransfer, setEditingTransfer] = useState<Transfer | null>(null);

  const transfersList = stats.periodTransfersList || stats.recentTransfers || [];
  const periodLabel = stats.periodLabel || 'اليوم';

  // Get matching transfers based on card type
  let filteredTransfers: Transfer[] = [];
  if (type === 'transfers_count' || type === 'transfers_value') {
    filteredTransfers = transfersList;
  } else if (type === 'month_count' || type === 'month_value') {
    filteredTransfers = transfersList;
  } else if (type === 'successful') {
    filteredTransfers = transfersList.filter((t) => t.status === 'completed');
  } else if (type === 'failed') {
    filteredTransfers = transfersList.filter((t) => t.status === 'cancelled' || t.status === 'failed');
  } else if (type === 'commissions') {
    filteredTransfers = transfersList.filter((t) => t.status === 'completed' && (t.fee || 0) > 0);
  }

  // Configuration for each card type
  const getCardMeta = () => {
    switch (type) {
      case 'transfers_count':
        return {
          title: `تفاصيل إجمالي التحويلات (${periodLabel})`,
          subtitle: 'عرض تحليلي لكافة العمليات المنفذة في الفترة المحددة',
          icon: ArrowLeftRight,
          badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
          mainValue: `${formatCount(stats.periodTransfersCount ?? stats.todayTransfersCount)} عملية`,
          secondaryLabel: 'إجمالي القيمة المنفذة',
          secondaryValue: `${formatAmount(stats.periodTransfersValue ?? stats.todayTransfersValue)} ج.م`,
        };
      case 'transfers_value':
        return {
          title: `تفاصيل إجمالي قيمة التحويلات (${periodLabel})`,
          subtitle: 'الحجم المالي الكلي للتدفقات النقدية والتحويلات الصادرة والواردة',
          icon: Wallet,
          badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          mainValue: `${formatAmount(stats.periodTransfersValue ?? stats.todayTransfersValue)} ج.م`,
          secondaryLabel: 'عدد العمليات المنفذة',
          secondaryValue: `${formatCount(stats.periodTransfersCount ?? stats.todayTransfersCount)} عملية`,
        };
      case 'month_count':
        return {
          title: 'تفاصيل إجمالي التحويلات الشهرية',
          subtitle: 'متابعة عدد العمليات المحققة خلال الشهر المالي الحالي',
          icon: Calendar,
          badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
          mainValue: `${formatCount(stats.monthTransfersCount)} عملية`,
          secondaryLabel: 'إجمالي قيمة الشهر',
          secondaryValue: `${formatAmount(stats.monthTransfersValue)} ج.م`,
        };
      case 'month_value':
        return {
          title: 'تفاصيل إجمالي قيمة التحويلات الشهرية',
          subtitle: 'إجمالي التدفق النقدي والسيولة المتداولة على مدار الشهر',
          icon: Banknote,
          badgeColor: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
          mainValue: `${formatAmount(stats.monthTransfersValue)} ج.م`,
          secondaryLabel: 'عدد عمليات الشهر',
          secondaryValue: `${formatCount(stats.monthTransfersCount)} عملية`,
        };
      case 'successful':
        return {
          title: `تفاصيل العمليات الناجحة (${periodLabel})`,
          subtitle: 'سجل التحويلات التي تمت بنجاح ووصلت للمستلمين دون أي مشاكل',
          icon: CheckCircle2,
          badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          mainValue: `${formatCount(stats.successfulOperationsCount)} عملية ناجحة`,
          secondaryLabel: 'نسبة النجاح الكلية',
          secondaryValue: `${stats.successRatePercent}%`,
        };
      case 'failed':
        return {
          title: `تفاصيل العمليات الملغاة والمرفوضة (${periodLabel})`,
          subtitle: 'قائمة العمليات التي تم إلغاؤها أو رفضها مع متابعة الأسباب',
          icon: XCircle,
          badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
          mainValue: `${formatCount(stats.failedOrCancelledCount)} عملية ملغاة/مرفوضة`,
          secondaryLabel: 'حالة المعالجة',
          secondaryValue: 'تم إعادة الرصيد للمحافظ',
        };
      case 'commissions':
        return {
          title: `تفاصيل العمولات والأرباح (${periodLabel})`,
          subtitle: 'إجمالي رسوم الخدمة والعمولات المحصلة وصافي العائد المالي',
          icon: Coins,
          badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          mainValue: `${formatAmount(stats.totalCommissionsAndProfits)} ج.م`,
          secondaryLabel: 'عدد العمليات المربحة',
          secondaryValue: `${formatCount(filteredTransfers.length)} عملية محصلة`,
        };
      case 'liquidity':
        return {
          title: 'تفاصيل السيولة المتاحة في الخطوط والمحافظ',
          subtitle: 'الرصيد الفعلي المتوفر حالياً عبر كافة مزودي الخدمة والبنوك',
          icon: Layers,
          badgeColor: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
          mainValue: `${formatAmount(stats.totalLiquidity)} ج.م`,
          secondaryLabel: 'عدد الخطوط والمحافظ المسجلة',
          secondaryValue: `${formatCount(lines.length)} خط كاش`,
        };
    }
  };

  const meta = getCardMeta();
  const Icon = meta.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200" dir="rtl">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl my-6 flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-lg ${meta.badgeColor}`}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">{meta.title}</h3>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold border border-slate-700">
                  {periodLabel}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{meta.subtitle}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
            title="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Summary KPI Strip */}
        <div className="p-5 bg-slate-950/60 border-b border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
            <span className="text-[11px] text-slate-400 block font-medium">القيمة الرئيسية</span>
            <span className="text-lg sm:text-xl font-mono font-black text-white mt-1 block">
              {meta.mainValue}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
            <span className="text-[11px] text-slate-400 block font-medium">{meta.secondaryLabel}</span>
            <span className="text-lg sm:text-xl font-mono font-black text-emerald-400 mt-1 block">
              {meta.secondaryValue}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
            <span className="text-[11px] text-slate-400 block font-medium">التحويلات الصادرة</span>
            <span className="text-base sm:text-lg font-mono font-bold text-slate-200 mt-1 block">
              {formatAmount(stats.periodOutgoingValue || 0)} ج.م
              <span className="text-[10px] text-slate-400 mr-1.5 font-sans">
                ({formatCount(stats.periodOutgoingCount || 0)})
              </span>
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
            <span className="text-[11px] text-slate-400 block font-medium">الاستلام الوارد</span>
            <span className="text-base sm:text-lg font-mono font-bold text-blue-400 mt-1 block">
              {formatAmount(stats.periodIncomingValue || 0)} ج.م
              <span className="text-[10px] text-slate-400 mr-1.5 font-sans">
                ({formatCount(stats.periodIncomingCount || 0)})
              </span>
            </span>
          </div>
        </div>

        {/* Modal Body Content (Scrollable) */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* If Liquidity Card is clicked: Show all Cash Lines breakdown */}
          {type === 'liquidity' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-white text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-sky-400" />
                  <span>توزيع السيولة والحدود عبر خطوط الكاش ({lines.length} خط)</span>
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {lines.map((line) => {
                  const todayUsed = line.todayUsed || 0;
                  const dailyPct = line.dailyUtilizationPercent || 0;
                  return (
                    <div
                      key={line.id}
                      className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <ProviderBadge provider={line.provider} size="md" showLabel={false} />
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-white block truncate">
                            {line.name}
                          </span>
                          <span className="text-[11px] font-mono text-emerald-400 block">
                            {line.phoneNumber}
                          </span>
                        </div>
                      </div>

                      <div className="text-left shrink-0">
                        <span className="text-base font-mono font-black text-white block">
                          {formatAmount(line.balance)} <span className="text-[10px] font-sans text-slate-400">ج.م</span>
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          استهلاك اليوم: <strong className="font-mono text-slate-200">{dailyPct}%</strong>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* For All Other Cards: Show detailed matching transactions table */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-white text-sm flex items-center gap-2">
                  <ArrowLeftRight className="w-4 h-4 text-emerald-400" />
                  <span>العمليات والتحويلات المرتبطة بهذه البطاقة في ({periodLabel})</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                    {filteredTransfers.length} عملية مسجلة
                  </span>
                </h4>
              </div>

              {filteredTransfers.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-slate-950/60 border border-slate-800 text-slate-400">
                  <Icon className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                  <p className="font-bold text-white">لا توجد عمليات مسجلة تطابق هذه البطاقة في الفترة المحددة</p>
                  <p className="text-xs text-slate-500 mt-1">يمكنك اختيار نطاق زمني آخر من شريط الفلترة</p>
                </div>
              ) : (
                <div className="rounded-2xl bg-slate-950/80 border border-slate-800 overflow-hidden">
                  <div className="overflow-x-auto max-h-80">
                    <table className="w-full text-right text-xs">
                      <thead className="sticky top-0 bg-slate-950 z-10">
                        <tr className="text-slate-400 border-b border-slate-800">
                          <th className="py-3 px-3.5 font-semibold">الرقم المرجعي</th>
                          <th className="py-3 px-3.5 font-semibold">التاريخ والوقت</th>
                          <th className="py-3 px-3.5 font-semibold">نوع العملية</th>
                          <th className="py-3 px-3.5 font-semibold">المرسل / الخط</th>
                          <th className="py-3 px-3.5 font-semibold">المستلم</th>
                          <th className="py-3 px-3.5 font-semibold">المبلغ</th>
                          <th className="py-3 px-3.5 font-semibold text-emerald-400">
                            <div className="flex flex-col">
                              <span>المتاح</span>
                              <span className="text-[9px] text-emerald-500/80 font-normal">بعد التحويل</span>
                            </div>
                          </th>
                          <th className="py-3 px-3.5 font-semibold">العمولة</th>
                          <th className="py-3 px-3.5 font-semibold">الحالة</th>
                          <th className="py-3 px-3.5 font-semibold text-center">إجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {filteredTransfers.map((tx) => (
                          <tr key={tx.id} className="hover:bg-slate-800/40 transition group">
                            <td className="py-3 px-3.5 font-mono font-bold text-slate-200 whitespace-nowrap">
                              {tx.referenceNumber}
                            </td>
                            <td className="py-3 px-3.5 text-slate-400 text-[11px] whitespace-nowrap">
                              {formatDateTime(tx.timestamp)}
                            </td>
                            <td className="py-3 px-3.5 text-slate-300 whitespace-nowrap">
                              {tx.transferType === 'receive_money' ? (
                                <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/30 font-bold inline-block text-[10px]">
                                  استلام وارد
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold inline-block text-[10px]">
                                  تحويل صادر
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3.5 text-slate-300 font-medium truncate max-w-[120px]">
                              {tx.sourceLineName}
                            </td>
                            <td className="py-3 px-3.5 text-slate-300 font-mono text-[11px] whitespace-nowrap">
                              {tx.recipientNumber}
                            </td>
                            <td className={`py-3 px-3.5 font-mono font-bold whitespace-nowrap ${
                              tx.transferType === 'receive_money' ? 'text-blue-400' : 'text-white'
                            }`}>
                              {formatAmount(tx.amount)} ج.م
                            </td>
                            <td className="py-3 px-3.5 font-mono font-bold text-emerald-400 whitespace-nowrap">
                              {tx.balanceAfter !== undefined && tx.balanceAfter !== null
                                ? `${formatAmount(tx.balanceAfter)} ج.م`
                                : '—'}
                            </td>
                            <td className="py-3 px-3.5 font-mono text-amber-400 whitespace-nowrap">
                              {tx.fee ? `${formatAmount(tx.fee)} ج.م` : '—'}
                            </td>
                            <td className="py-3 px-3.5 whitespace-nowrap">
                              {tx.status === 'completed' && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                  ناجحة
                                </span>
                              )}
                              {tx.status === 'cancelled' && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                                  ملغاة
                                </span>
                              )}
                              {tx.status === 'failed' && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/30">
                                  فاشلة
                                </span>
                              )}
                              {tx.status === 'pending_verification' && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                                  قيد المراجعة
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3.5 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => setEditingTransfer(tx)}
                                  className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition cursor-pointer"
                                  title="تعديل المبلغ أو التاريخ أو الوقت"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => onViewTransferDetails(tx)}
                                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
                                  title="عرض تفاصيل السند"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => onPrintReceipt(tx)}
                                  className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition cursor-pointer"
                                  title="طباعة إيصال التحويل"
                                >
                                  <Printer className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            onClick={() => {
              onClose();
              if (type === 'successful') onNavigateToTransfers('completed');
              else if (type === 'failed') onNavigateToTransfers('cancelled');
              else onNavigateToTransfers();
            }}
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer border border-slate-700/60"
          >
            <ExternalLink className="w-4 h-4 text-emerald-400" />
            <span>عرض السجل المفصل في شاشة العمليات الكاملة</span>
          </button>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-lg shadow-emerald-600/20"
          >
            إغلاق
          </button>
        </div>

      </div>

      {/* Edit Transfer Modal from Dashboard Details */}
      <EditTransferModal
        isOpen={!!editingTransfer}
        transfer={editingTransfer}
        onClose={() => setEditingTransfer(null)}
        onSaved={(updated) => {
          if (stats.periodTransfersList) {
            stats.periodTransfersList = stats.periodTransfersList.map((t) => (t.id === updated.id ? updated : t));
          }
          if (stats.recentTransfers) {
            stats.recentTransfers = stats.recentTransfers.map((t) => (t.id === updated.id ? updated : t));
          }
        }}
      />
    </div>
  );
};
