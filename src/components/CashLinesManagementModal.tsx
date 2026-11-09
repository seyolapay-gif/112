import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Edit3, 
  Trash2, 
  ShieldCheck, 
  Wallet, 
  Building2, 
  Phone, 
  Coins, 
  CheckCircle2, 
  AlertCircle,
  Settings2 
} from 'lucide-react';
import { CashLine } from '../types';
import { api } from '../services/api';
import { ProviderBadge, PROVIDER_CONFIG } from './ProviderBadge';
import { formatAmount } from '../utils/formatters';

interface CashLinesManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  lines: CashLine[];
  onRefresh: () => void;
  onOpenAddModal: () => void;
  onOpenEditModal: (line: CashLine) => void;
}

export const CashLinesManagementModal: React.FC<CashLinesManagementModalProps> = ({
  isOpen,
  onClose,
  lines,
  onRefresh,
  onOpenAddModal,
  onOpenEditModal,
}) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filtered = lines.filter(l => 
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.phoneNumber.includes(search) ||
    l.accountHolder.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (line: CashLine) => {
    if (!confirm(`هل أنت متأكد من حذف الخط "${line.name}" (${line.phoneNumber}) نهائياً؟`)) return;
    try {
      await api.deleteLine(line.id);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'فشل حذف الخط');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto" dir="rtl">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl overflow-hidden shadow-2xl my-6 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-950">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-white text-base sm:text-lg">لوحة التحكم المركزية لإدارة وتعديل خطوط الكاش والمحافظ</h2>
              <p className="text-xs text-slate-400">إدارة شاملة لكافة الحسابات، الأرصدة، الحدود، وحالات التشغيل في أي وقت</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAddModal();
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة خط جديد</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body Table */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-950/60 space-y-4">
          
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث سريع في جدول الخطوط والمحافظ..."
                className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <span className="text-xs text-slate-400 font-mono">
              إجمالي الخطوط: {filtered.length}
            </span>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-bold">
                  <tr>
                    <th className="p-3.5">الخط / المحفظة</th>
                    <th className="p-3.5">مزود الخدمة</th>
                    <th className="p-3.5">رقم الهاتف</th>
                    <th className="p-3.5">الرصيد المتاح</th>
                    <th className="p-3.5">الحد اليومي / الشهري</th>
                    <th className="p-3.5">الحالة</th>
                    <th className="p-3.5 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-300">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        لا توجد خطوط مسجلة تطابق البحث
                      </td>
                    </tr>
                  ) : (
                    filtered.map((line) => (
                      <tr key={line.id} className="hover:bg-slate-850/50 transition">
                        <td className="p-3.5 font-bold text-white">
                          <div className="flex items-center gap-2.5">
                            <ProviderBadge provider={line.provider} size="sm" showLabel={false} />
                            <span>{line.name}</span>
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 font-semibold text-[11px]">
                            {PROVIDER_CONFIG[line.provider]?.name || line.provider}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono text-cyan-400 font-bold" dir="ltr">
                          {line.phoneNumber}
                        </td>
                        <td className="p-3.5 font-mono font-black text-emerald-400">
                          {formatAmount(line.balance)} ج.م
                        </td>
                        <td className="p-3.5 font-mono text-slate-400 text-[11px]">
                          <div>{formatAmount(line.dailyLimit)} يومي</div>
                          <div>{formatAmount(line.monthlyLimit)} شهري</div>
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            line.status === 'active' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          }`}>
                            {line.status === 'active' ? 'نشط' : 'متوقف'}
                          </span>
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onOpenEditModal(line);
                              }}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
                              title="تعديل"
                            >
                              <Edit3 className="w-4 h-4 text-cyan-400" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(line)}
                              className="p-1.5 bg-slate-800 hover:bg-rose-950 text-slate-200 hover:text-rose-400 rounded-lg transition"
                              title="حذف"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-400">
            يمكنك إضافة أو تعديل أو حذف أي خط كاش أو محفظة أو حساب بنكي في أي وقت دون فقدان البيانات.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            إغلاق لوحة التحكم
          </button>
        </div>

      </div>
    </div>
  );
};
