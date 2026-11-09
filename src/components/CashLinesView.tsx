import React, { useState, useEffect } from 'react';
import { CashLine, ProviderType, Transfer } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ProviderBadge, PROVIDER_CONFIG } from './ProviderBadge';
import { 
  toEnglishDigits, 
  formatAmount, 
  formatCount 
} from '../utils/formatters';
import { 
  Plus, 
  Search, 
  Edit3, 
  ArrowLeftRight, 
  History, 
  TrendingUp, 
  ShieldCheck, 
  AlertCircle, 
  Trash2, 
  CheckCircle2, 
  X, 
  Phone, 
  Wallet,
  Settings2,
  RefreshCw,
  ArrowDownLeft,
  Coins,
  Printer,
  Loader2,
  Send,
  RotateCcw,
  Sparkles,
  Building2,
  Globe
} from 'lucide-react';

interface CashLinesViewProps {
  onInitiateTransfer: (lineId: string) => void;
  onInitiateReceive?: (lineId: string) => void;
  onViewLineHistory: (lineId: string) => void;
  onPrintReceipt?: (transfer: Transfer) => void;
}

export const CashLinesView: React.FC<CashLinesViewProps> = ({
  onInitiateTransfer,
  onInitiateReceive,
  onViewLineHistory,
  onPrintReceipt,
}) => {
  const { canManageLines, user } = useAuth();
  const [lines, setLines] = useState<CashLine[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'vodafone' | 'orange' | 'etisalat' | 'we' | 'banks'>('all');

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLine, setEditingLine] = useState<CashLine | null>(null);
  const [formName, setFormName] = useState('');
  const [formProvider, setFormProvider] = useState<ProviderType>('vodafone');
  const [formPhone, setFormPhone] = useState('');
  const [formHolder, setFormHolder] = useState('');
  const [formBalance, setFormBalance] = useState('0');
  const [formDailyLimit, setFormDailyLimit] = useState('60000');
  const [formMonthlyLimit, setFormMonthlyLimit] = useState('200000');
  const [formWarningThreshold, setFormWarningThreshold] = useState('80');
  const [formStatus, setFormStatus] = useState<'active' | 'paused' | 'suspended'>('active');
  const [formNotes, setFormNotes] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Inter-line Transfer Section State (خانة التحويل بين الخطوط)
  const [interFromLineId, setInterFromLineId] = useState<string>('');
  const [interToLineId, setInterToLineId] = useState<string>(''); // 'registered_<id>' or 'other'
  const [interCustomNumber, setInterCustomNumber] = useState<string>('');
  const [interCustomName, setInterCustomName] = useState<string>('');
  const [interCustomProvider, setInterCustomProvider] = useState<string>('فودافون كاش');
  const [interAmount, setInterAmount] = useState<string>('');
  const [interFee, setInterFee] = useState<string>('0');
  const [interNotes, setInterNotes] = useState<string>('تحويل موازنة بين الخطوط');
  const [isInterSubmitting, setIsInterSubmitting] = useState<boolean>(false);
  const [interSuccessTransfer, setInterSuccessTransfer] = useState<Transfer | null>(null);
  const [interError, setInterError] = useState<string | null>(null);
  const [isInterTransferModalOpen, setIsInterTransferModalOpen] = useState<boolean>(false);

  const isSourceCashWallet = (provider?: string) => {
    return provider === 'vodafone' || provider === 'orange' || provider === 'etisalat' || provider === 'we';
  };
  const isSourceInstaPay = (provider?: string) => {
    return provider === 'instapay';
  };
  const isSourceBank = (provider?: string) => {
    return provider === 'banque_misr' || provider === 'cib' || provider === 'nbe' || provider === 'banque_du_caire' || provider === 'alexbank' || provider === 'qnb';
  };

  const loadLines = async () => {
    setIsLoading(true);
    try {
      const data = await api.getLines();
      setLines(data);
      if (data.length > 0) {
        const active = data.find((l) => l.status === 'active') || data[0];
        setInterFromLineId((prev) => {
          if (prev && data.some((l) => l.id === prev)) return prev;
          return active.id;
        });
        
        // Find a valid destination line (respecting cash wallet rule if from is cash wallet)
        const validTo = data.find((l) => {
          if (l.id === active.id) return false;
          if (isSourceCashWallet(active.provider)) return isSourceCashWallet(l.provider);
          return true;
        });
        if (validTo) {
          setInterToLineId(`registered_${validTo.id}`);
        } else {
          setInterToLineId('other');
        }
      }
    } catch (err) {
      console.error('Failed to load lines:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLines();
    const handleGlobalRefresh = () => loadLines();
    window.addEventListener('app:global-refresh', handleGlobalRefresh);
    return () => window.removeEventListener('app:global-refresh', handleGlobalRefresh);
  }, []);

  const openAddModal = () => {
    setEditingLine(null);
    setFormName('');
    setFormProvider('vodafone');
    setFormPhone('');
    setFormHolder('مؤسسة التيسير للخدمات');
    setFormBalance('50000');
    setFormDailyLimit('60000');
    setFormMonthlyLimit('200000');
    setFormWarningThreshold('80');
    setFormStatus('active');
    setFormNotes('');
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (line: CashLine) => {
    setEditingLine(line);
    setFormName(line.name);
    setFormProvider(line.provider);
    setFormPhone(line.phoneNumber);
    setFormHolder(line.accountHolder);
    setFormBalance(line.balance.toString());
    setFormDailyLimit(line.dailyLimit.toString());
    setFormMonthlyLimit(line.monthlyLimit.toString());
    setFormWarningThreshold(line.warningThresholdPercent.toString());
    setFormStatus(line.status);
    setFormNotes(line.notes || '');
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSaveLine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim()) {
      setModalError('الرجاء إدخال اسم الخط ورقم الهاتف');
      return;
    }

    setIsSaving(true);
    setModalError(null);

    try {
      const isVip = formProvider === 'vodafone_vip';
      const payload: Partial<CashLine> = {
        name: formName.trim(),
        provider: formProvider,
        phoneNumber: formPhone.trim(),
        accountHolder: formHolder.trim(),
        balance: isVip && !editingLine?.isSynced ? 0 : (Number(formBalance) || 0),
        dailyLimit: isVip && !editingLine?.isSynced ? 0 : (Number(formDailyLimit) || 60000),
        monthlyLimit: isVip && !editingLine?.isSynced ? 0 : (Number(formMonthlyLimit) || 200000),
        warningThresholdPercent: Number(formWarningThreshold) || 80,
        status: formStatus,
        notes: formNotes,
        iconColor: PROVIDER_CONFIG[formProvider]?.accentColor || '#E60000',
        isVip,
        isSynced: editingLine ? editingLine.isSynced : false,
        syncStatus: editingLine ? editingLine.syncStatus : (isVip ? 'unlinked' : undefined),
      };

      if (editingLine) {
        await api.updateLine(editingLine.id, payload);
      } else {
        await api.createLine(payload);
      }

      setIsModalOpen(false);
      loadLines();
    } catch (err: any) {
      setModalError(err.message || 'فشل حفظ بيانات الخط');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteLine = async (line: CashLine) => {
    if (!confirm(`هل أنت متأكد من حذف الخط ${line.name} (${line.phoneNumber}) نهائياً؟`)) {
      return;
    }
    try {
      await api.deleteLine(line.id);
      loadLines();
    } catch (err: any) {
      alert(err.message || 'فشل حذف الخط');
    }
  };

  const filteredLines = lines.filter((l) => {
    const matchesSearch =
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.phoneNumber.includes(searchQuery) ||
      l.accountHolder.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedCategory === 'vodafone') {
      return l.provider === 'vodafone';
    }
    if (selectedCategory === 'orange') {
      return l.provider === 'orange';
    }
    if (selectedCategory === 'etisalat') {
      return l.provider === 'etisalat';
    }
    if (selectedCategory === 'we') {
      return l.provider === 'we';
    }
    if (selectedCategory === 'banks') {
      return l.provider !== 'vodafone' && l.provider !== 'orange' && l.provider !== 'etisalat' && l.provider !== 'we';
    }

    return true;
  });

  // Inter-line transfer computed variables and actions
  const selectedFromLine = lines.find((l) => l.id === interFromLineId);
  const isOtherTo = interToLineId === 'other';
  const targetRegisteredId = interToLineId.startsWith('registered_')
    ? interToLineId.replace('registered_', '')
    : '';
  const selectedToLine = lines.find((l) => l.id === targetRegisteredId);

  // Filter destination lines: When source is electronic cash wallet (Vodafone, Orange, Etisalat, WE),
  // ONLY show other electronic cash wallets and HIDE InstaPay and all Banks!
  const allowedDestinationLines = lines.filter((l) => {
    if (l.id === interFromLineId) return false;
    if (isSourceCashWallet(selectedFromLine?.provider)) {
      return isSourceCashWallet(l.provider);
    }
    if (isSourceInstaPay(selectedFromLine?.provider)) {
      return isSourceCashWallet(l.provider) || isSourceInstaPay(l.provider);
    }
    return true;
  });

  const handleFromLineChange = (id: string) => {
    setInterFromLineId(id);
    const fromLine = lines.find((l) => l.id === id);
    if (!fromLine) return;

    const curTargetRegId = interToLineId.startsWith('registered_') ? interToLineId.replace('registered_', '') : '';
    const curToLine = lines.find((l) => l.id === curTargetRegId);

    if (isSourceCashWallet(fromLine.provider)) {
      // Ensure destination is a cash wallet and not the same line
      if (!curToLine || !isSourceCashWallet(curToLine.provider) || curToLine.id === id) {
        const firstCashWallet = lines.find((l) => l.id !== id && isSourceCashWallet(l.provider));
        if (firstCashWallet) {
          setInterToLineId(`registered_${firstCashWallet.id}`);
        } else {
          setInterToLineId('other');
          setInterCustomProvider('فودافون كاش');
        }
      }
    }
  };

  const handleAddInterQuickAmount = (val: number) => {
    const cur = Number(interAmount) || 0;
    setInterAmount((cur + val).toString());
  };

  const handleSetMaxInterAmount = () => {
    if (selectedFromLine) {
      const curFee = Number(interFee) || 0;
      setInterAmount(Math.max(0, selectedFromLine.balance - curFee).toString());
    }
  };

  const handleExecuteInterLineTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setInterError(null);
    setInterSuccessTransfer(null);

    if (!selectedFromLine) {
      setInterError('الرجاء اختيار الخط أو المحفظة المحول منها (المصدر)');
      return;
    }

    const numAmount = Number(interAmount);
    const numFee = Number(interFee) || 0;
    const totalRequired = numAmount + numFee;

    if (isNaN(numAmount) || numAmount <= 0) {
      setInterError('الرجاء إدخال مبلغ تحويل صحيح أكبر من 0');
      return;
    }

    if (totalRequired > selectedFromLine.balance) {
      setInterError(`الرصيد المتاح في المحفظة (${formatAmount(selectedFromLine.balance)} ج.م) غير كافٍ لتحويل ${formatAmount(numAmount)} ج.م ورسوم ${formatAmount(numFee)} ج.م (الإجمالي المطلوب خصمه من المصدر: ${formatAmount(totalRequired)} ج.م)`);
      return;
    }

    let recipientNum = '';
    let recipientNm = '';
    let destBankOrWallet = '';

    if (isOtherTo) {
      if (!interCustomNumber.trim()) {
        setInterError('الرجاء إدخال رقم المحفظة أو الحساب المستلم');
        return;
      }
      recipientNum = interCustomNumber.trim();
      recipientNm = interCustomName.trim() || 'محفظة أخرى';
      destBankOrWallet = interCustomProvider;
    } else {
      if (!selectedToLine) {
        setInterError('الرجاء اختيار المحفظة المستلمة');
        return;
      }
      if (selectedToLine.id === selectedFromLine.id) {
        setInterError('لا يمكن التحويل لنفس المحفظة المصدر، يرجى اختيار محفظة أخرى');
        return;
      }
      recipientNum = selectedToLine.phoneNumber;
      recipientNm = selectedToLine.name;
      destBankOrWallet = selectedToLine.name;
    }

    setIsInterSubmitting(true);
    try {
      const payload = {
        transferType: 'inter_line',
        sourceLineId: selectedFromLine.id,
        recipientType: 'wallet',
        recipientNumber: recipientNum,
        recipientName: recipientNm,
        destinationBankOrWallet: destBankOrWallet,
        amount: numAmount,
        fee: numFee,
        notes: interNotes.trim() || 'تحويل وموازنة سيولة بين الخطوط',
      };

      const result = await api.createTransfer(payload);
      setInterSuccessTransfer(result);
      setInterAmount('');
      // Reload lines so all cards on the page update immediately
      await loadLines();
    } catch (err: any) {
      setInterError(err.message || 'فشل تنفيذ عملية التحويل بين الخطوط');
    } finally {
      setIsInterSubmitting(false);
    }
  };

  const totalLiquidity = lines.reduce((sum, l) => sum + (l.balance || 0), 0);

  return (
    <div className="space-y-3 pb-8 font-sans selection:bg-emerald-500 selection:text-white" dir="rtl">
      
      {/* Top Header - Compact & Balanced */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/60 p-3.5 sm:p-4 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
            إدارة خطوط الكاش والمحافظ
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono font-semibold">
              {lines.length} خط مسجل
            </span>
          </h1>
          <p className="text-[11px] text-slate-400 mt-0.5">
            متابعة السيولة النقدية، الحدود اليومية والشهرية، وتنفيذ التحويلات السريعة لكل محفظة
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {canManageLines && (
            <button
              onClick={openAddModal}
              className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition duration-200 cursor-pointer text-xs sm:text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة خط أو محفظة جديدة</span>
            </button>
          )}
        </div>
      </div>

      {/* Category Tabs - Compact & Tight */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
        <button
          type="button"
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <span>الكل</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 font-mono font-normal">
            {lines.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedCategory('vodafone')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
            selectedCategory === 'vodafone'
              ? 'bg-red-600 text-white shadow-sm shadow-red-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span>فودافون كاش</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 font-mono font-normal">
            {lines.filter((l) => l.provider === 'vodafone').length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedCategory('orange')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
            selectedCategory === 'orange'
              ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-orange-500" />
          <span>أورنج كاش</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 font-mono font-normal">
            {lines.filter((l) => l.provider === 'orange').length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedCategory('etisalat')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
            selectedCategory === 'etisalat'
              ? 'bg-lime-600 text-white shadow-sm shadow-lime-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-lime-500" />
          <span>اتصالات كاش</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 font-mono font-normal">
            {lines.filter((l) => l.provider === 'etisalat').length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedCategory('we')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
            selectedCategory === 'we'
              ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-purple-500" />
          <span>وي باي</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 font-mono font-normal">
            {lines.filter((l) => l.provider === 'we').length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedCategory('banks')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
            selectedCategory === 'banks'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          <span>إنستاباي والبنوك</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 font-mono font-normal">
            {lines.filter((l) => l.provider !== 'vodafone' && l.provider !== 'orange' && l.provider !== 'etisalat' && l.provider !== 'we').length}
          </span>
        </button>
      </div>

      {/* Search Bar - Sleek, Flush & Compact (Zero wasted space) */}
      <div className="relative w-full">
        <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="بحث برقم الهاتف، اسم الخط، أو المالك..."
          className="w-full pr-10 pl-3 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 leading-normal shadow-xs"
        />
      </div>

      {/* Cash Line Cards Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20 text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin text-emerald-500 ml-2" />
          <span>جاري تحميل بيانات الخطوط...</span>
        </div>
      ) : filteredLines.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800 text-slate-400">
          <AlertCircle className="w-10 h-10 mx-auto mb-2 text-slate-500" />
          <p className="font-bold text-white">لم يتم العثور على أي خطوط تطابق البحث</p>
          <p className="text-xs text-slate-500 mt-1">تأكد من رقم الهاتف أو اختر تصفية أخرى</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLines.map((line) => {
            const todayUsed = line.todayUsed || 0;
            const remainingDaily = line.remainingDaily !== undefined ? line.remainingDaily : Math.max(0, line.dailyLimit - todayUsed);
            const dailyPercent = line.dailyLimit > 0 ? Math.min(100, Math.round((todayUsed / line.dailyLimit) * 100)) : 0;

            const monthUsed = line.monthUsed || 0;
            const remainingMonthly = line.remainingMonthly !== undefined ? line.remainingMonthly : Math.max(0, line.monthlyLimit - monthUsed);
            const monthlyPercent = line.monthlyLimit > 0 ? Math.min(100, Math.round((monthUsed / line.monthlyLimit) * 100)) : 0;

            const isHighDaily = dailyPercent >= line.warningThresholdPercent;
            const isHighMonthly = monthlyPercent >= line.warningThresholdPercent;

            return (
              <div
                key={line.id}
                onClick={() => onViewLineHistory(line.id)}
                className="rounded-3xl transition-all duration-200 shadow-lg flex flex-col justify-between overflow-hidden group cursor-pointer bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900/95 hover:shadow-emerald-500/10"
                title="انقر لعرض تفاصيل وسجل هذا الخط"
              >
                {/* Card Top: Provider Icon & Provider Name + Account Holder on Right, Status Badge & Phone Number on Left */}
                <div className="p-4 sm:p-5 border-b bg-slate-950/60 border-slate-800/80">
                  <div className="flex items-start justify-between gap-3">
                    {/* Right: Icon + Provider Name & Account Holder Name */}
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                      <div className="shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-2xl overflow-hidden shadow-md flex items-center justify-center bg-slate-900 border border-slate-800">
                        <ProviderBadge provider={line.provider} size="md" showLabel={false} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] sm:text-[11px] text-slate-400 block font-medium truncate">
                          {PROVIDER_CONFIG[line.provider]?.name || 'مزود الخدمة'}
                        </span>
                        <h3 
                          className="font-bold text-white text-xs sm:text-sm leading-normal group-hover:text-emerald-400 transition truncate"
                          title={line.accountHolder || line.name}
                        >
                          {line.accountHolder || line.name}
                        </h3>
                      </div>
                    </div>

                    {/* Left: Status Badge on Top, Phone/Account Number below it */}
                    <div className="shrink-0 flex flex-col items-end gap-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        {line.status === 'active' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 whitespace-nowrap shrink-0 shadow-sm shadow-emerald-950/40">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                            <span className="whitespace-nowrap">نشط</span>
                          </span>
                        )}
                        {line.status === 'paused' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                            <span>متوقف</span>
                          </span>
                        )}
                        {line.status === 'suspended' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                            <span>موقوف</span>
                          </span>
                        )}
                      </div>

                      {/* Phone / Account Number below status badge */}
                      <span className="text-sm sm:text-base font-mono font-black text-emerald-400 tracking-wider mt-0.5" dir="ltr">
                        {line.phoneNumber}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Middle: Liquidity Balance & Limit Progress */}
                <div className="p-4 sm:p-5 space-y-3.5">
                  {/* Liquidity / Balance Box */}
                  <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <span className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
                        <Coins className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        السيولة المتاحة حالياً
                      </span>
                      <span className="text-lg sm:text-xl font-mono font-black text-white mt-0.5 block truncate">
                        {formatAmount(line.balance)} <span className="text-xs font-sans text-slate-400">ج.م</span>
                      </span>
                    </div>
                    <div className="text-left text-xs text-slate-400 font-sans shrink-0 space-y-0.5">
                      <div className="text-[11px]"><strong className="text-slate-200 font-mono font-bold">{formatCount(line.todayCount || 0)}</strong> عملية اليوم</div>
                      <div className="text-[10px] text-slate-500"><strong className="text-slate-300 font-mono font-bold">{formatCount(line.monthCount || 0)}</strong> هذا الشهر</div>
                    </div>
                  </div>

                  {/* Daily Limit Progress */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-sans">
                      <span className="text-slate-400 font-medium">الحد اليومي:</span>
                      <span className="text-slate-300 text-[11px] sm:text-xs">
                        مستهلك: <strong className="text-white font-mono">{formatAmount(todayUsed)}</strong> / <span className="font-mono">{formatAmount(line.dailyLimit)}</span> ج.م
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          dailyPercent >= 90 ? 'bg-rose-500' : dailyPercent >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, dailyPercent)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-sans">
                      <span className={isHighDaily ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                        نسبة الاستهلاك: <strong className="font-mono">{dailyPercent}%</strong>
                      </span>
                      <span className="text-emerald-400 font-semibold">
                        المتبقي اليوم: <span className="font-mono">{formatAmount(remainingDaily)}</span> ج.م
                      </span>
                    </div>
                  </div>

                  {/* Monthly Limit Progress */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                    <div className="flex items-center justify-between text-xs font-sans">
                      <span className="text-slate-400 font-medium">الحد الشهري:</span>
                      <span className="text-slate-300 text-[11px] sm:text-xs">
                        مستهلك: <strong className="text-white font-mono">{formatAmount(monthUsed)}</strong> / <span className="font-mono">{formatAmount(line.monthlyLimit)}</span> ج.م
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          monthlyPercent >= 90 ? 'bg-rose-500' : monthlyPercent >= 80 ? 'bg-amber-500' : 'bg-cyan-500'
                        }`}
                        style={{ width: `${Math.min(100, monthlyPercent)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-sans">
                      <span className={isHighMonthly ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                        نسبة الاستهلاك: <strong className="font-mono">{monthlyPercent}%</strong>
                      </span>
                      <span className="text-cyan-400 font-semibold">
                        المتبقي هذا الشهر: <span className="font-mono">{formatAmount(remainingMonthly)}</span> ج.م
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions Bottom: Perfectly organized without any overlapping */}
                <div className="p-3.5 sm:p-4 bg-slate-950/95 border-t border-slate-800/80 space-y-2.5">

                  {/* Tier 1: Primary Money Operation Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onInitiateTransfer(line.id);
                      }}
                      disabled={line.status !== 'active'}
                      className="w-full h-10 px-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer whitespace-nowrap active:scale-[0.98]"
                      title="تحويل صادر"
                    >
                      <ArrowLeftRight className="w-4 h-4 shrink-0" />
                      <span>تحويل</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onInitiateReceive) {
                          onInitiateReceive(line.id);
                        } else {
                          onInitiateTransfer(line.id);
                        }
                      }}
                      disabled={line.status !== 'active'}
                      className="w-full h-10 px-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20 cursor-pointer whitespace-nowrap active:scale-[0.98]"
                      title="استلام أموال وارد"
                    >
                      <ArrowDownLeft className="w-4 h-4 shrink-0" />
                      <span>استلام</span>
                    </button>
                  </div>

                  {/* Tier 2: Secondary Line Tools (History, Edit, Delete) with ample breathing room */}
                  <div className="flex items-center gap-2 pt-1.5 border-t border-slate-800/60">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewLineHistory(line.id);
                      }}
                      className="flex-1 h-8 px-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition text-[11px] font-semibold cursor-pointer border border-slate-800 flex items-center justify-center gap-1.5 active:scale-[0.98]"
                      title="سجل تحويلات هذا الخط"
                    >
                      <History className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>سجل العمليات</span>
                    </button>

                    {canManageLines && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(line);
                        }}
                        className="w-8 h-8 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition text-xs font-semibold cursor-pointer border border-slate-800 flex items-center justify-center shrink-0 active:scale-[0.98]"
                        title="تعديل بيانات الخط"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {user?.role === 'admin' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteLine(line);
                        }}
                        className="w-8 h-8 bg-rose-950/30 hover:bg-rose-900/50 text-rose-400 hover:text-rose-200 border border-rose-500/20 rounded-xl transition text-xs cursor-pointer flex items-center justify-center shrink-0 active:scale-[0.98]"
                        title="حذف الخط"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })}

          {/* بطاقة التحويل بين الخطوط والمحافظ (تظهر كبطاقة مثل باقي البطاقات وعند النقر عليها تفتح التفاصيل) */}
          <div
            onClick={() => setIsInterTransferModalOpen(true)}
            className="rounded-3xl bg-slate-900/80 border border-emerald-500/40 hover:border-emerald-400/80 transition-all duration-200 shadow-xl hover:shadow-emerald-500/10 flex flex-col justify-between overflow-hidden group cursor-pointer"
          >
            {/* Card Top: Provider Icon & Title */}
            <div className="p-6 bg-slate-950/70 border-b border-slate-800/80">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-slate-950 font-bold shadow-md group-hover:scale-105 transition">
                    <ArrowLeftRight className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <div>
                    <span className="text-xs text-emerald-400 block font-bold">
                      موازنة ونقل السيولة
                    </span>
                    <h3 className="font-extrabold text-white text-base leading-normal group-hover:text-emerald-300 transition">
                      التحويل بين الخطوط والمحافظ
                    </h3>
                  </div>
                </div>

                {/* Status Badge */}
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  متاح فوري
                </span>
              </div>

              {/* Service Details */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 block">نوع العملية:</span>
                  <span className="text-lg font-mono font-black text-emerald-400 tracking-wider">
                    تحويل وموازنة
                  </span>
                </div>
                <div className="text-left">
                  <span className="text-[10px] text-slate-500 block">إجمالي المحافظ:</span>
                  <span className="text-xs text-slate-300 font-medium block">
                    {lines.length} خط ومحفظة نشطة
                  </span>
                </div>
              </div>
            </div>

            {/* Card Middle: Overview & Liquidity Info */}
            <div className="p-6 space-y-4">
              <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
                    <Coins className="w-3.5 h-3.5 text-emerald-400" />
                    إجمالي السيولة المتاحة
                  </span>
                  <span className="text-xl font-mono font-black text-white mt-1 block">
                    {formatAmount(totalLiquidity)} <span className="text-xs font-sans text-slate-400">ج.م</span>
                  </span>
                </div>
                <div className="text-left text-xs text-slate-400 font-sans">
                  <div className="text-emerald-400 font-bold font-mono">تغذية وموازنة</div>
                  <div className="text-[11px] text-slate-500">لحظية ومباشرة</div>
                </div>
              </div>

              <div className="space-y-2 p-3 bg-slate-950/50 rounded-2xl border border-slate-800/60 text-[11px] text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>عزل المحافظ وإخفاء البنوك وإنستاباي لمحفظة الكاش</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>تحديد وخصم رسوم التحويل من المحفظة المصدر</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>تحديث فوري لأرصدة الطرفين مع تسجيل التدقيق</span>
                </div>
              </div>
            </div>

            {/* Card Bottom: Open Details Button */}
            <div className="p-3.5 sm:p-4 bg-slate-950/95 border-t border-slate-800/80">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsInterTransferModalOpen(true);
                }}
                className="w-full h-11 px-4 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs sm:text-sm font-bold rounded-2xl transition flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer whitespace-nowrap active:scale-[0.98]"
              >
                <ArrowLeftRight className="w-4 h-4 shrink-0" />
                <span>الدخول لتفاصيل التحويل بين الخطوط</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* نافذة تفاصيل التحويل بين الخطوط والمحافظ (Modal) */}
      {/* ========================================================================= */}
      {isInterTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in" dir="rtl">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl my-6">
            
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/10">
                  <ArrowLeftRight className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-black text-white">التحويل بين الخطوط والمحافظ</h2>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      موازنة فورية
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    نقل وتغذية السيولة مباشرة بين محافظ الكاش المسجلة مع تحديد وخصم رسوم التحويل من المصدر
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsInterTransferModalOpen(false);
                  setInterError(null);
                }}
                className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/60 hover:bg-slate-800 transition cursor-pointer"
                title="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Success Banner */}
            {interSuccessTransfer && (
              <div className="m-5 sm:m-6 p-5 rounded-2xl bg-emerald-950/70 border border-emerald-500/50 shadow-xl space-y-3 animate-fade-in">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold shrink-0">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white">
                        تم تنفيذ التحويل بين الخطين بنجاح وتحديث الأرصدة فورياً!
                      </h3>
                      <p className="text-xs text-emerald-300 font-mono mt-0.5">
                        الرقم المرجعي: <strong className="text-white">{interSuccessTransfer.referenceNumber}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {onPrintReceipt && (
                      <button
                        type="button"
                        onClick={() => onPrintReceipt(interSuccessTransfer)}
                        className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 border border-emerald-400/40 transition cursor-pointer active:scale-95"
                      >
                        <Printer className="w-4 h-4 text-white" />
                        <span className="text-white font-bold">طباعة إيصال التحويل</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setInterSuccessTransfer(null)}
                      className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/30 border border-blue-400/40 transition cursor-pointer active:scale-95"
                    >
                      <RotateCcw className="w-4 h-4 text-white" />
                      <span className="text-white font-bold">تحويل جديد</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-emerald-500/30 text-xs text-emerald-100">
                  <div>
                    <span className="block opacity-75">المحفظة المصدر:</span>
                    <strong className="text-white">{interSuccessTransfer.sourceLineName}</strong>
                  </div>
                  <div>
                    <span className="block opacity-75">المحفظة المستلمة:</span>
                    <strong className="text-white">{interSuccessTransfer.recipientName} ({interSuccessTransfer.recipientNumber})</strong>
                  </div>
                  <div>
                    <span className="block opacity-75">المبلغ المحول:</span>
                    <strong className="text-white font-mono">{formatAmount(interSuccessTransfer.amount)} ج.م</strong>
                  </div>
                  <div>
                    <span className="block opacity-75">رسوم التحويل المخصومة:</span>
                    <strong className="text-white font-mono">{formatAmount(interSuccessTransfer.fee)} ج.م</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Error Alert */}
            {interError && (
              <div className="mx-5 sm:mx-6 mt-5 p-3.5 rounded-2xl bg-rose-950/70 border border-rose-500/50 flex items-start gap-2.5 text-rose-200 text-xs">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{interError}</span>
              </div>
            )}

            {/* Form Body */}
            <form onSubmit={handleExecuteInterLineTransfer} className="p-5 sm:p-7 space-y-6 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
                
                {/* 1. Source Line: اختيار رقم المحفظة التي يتم التحويل منها */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <label className="block text-xs font-bold text-slate-200">
                    1. اختيار رقم المحفظة التي يتم التحويل منها (المصدر):
                  </label>
                  
                  <select
                    value={interFromLineId}
                    onChange={(e) => handleFromLineChange(e.target.value)}
                    className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  >
                    {lines.map((l) => (
                      <option key={l.id} value={l.id} disabled={l.status !== 'active'}>
                        {l.name} ({l.phoneNumber}) - الرصيد: {formatAmount(l.balance)} ج.م {l.status !== 'active' ? `(${l.status})` : ''}
                      </option>
                    ))}
                  </select>

                  {selectedFromLine && (
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
                      <span className="text-slate-400">
                        الرصيد المتاح: <strong className="text-emerald-400 font-mono text-sm">{formatAmount(selectedFromLine.balance)} ج.م</strong>
                      </span>
                      <span className="text-slate-400">
                        المتبقي اليومي: <strong className="text-slate-200 font-mono">{formatAmount(selectedFromLine.remainingDaily ?? selectedFromLine.dailyLimit)} ج.م</strong>
                      </span>
                    </div>
                  )}
                </div>

                {/* 2. Destination Line: اختيار رقم المحفظة التي يتم التحويل اليها أو كلمة أخرى */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-200">
                      2. اختيار رقم المحفظة التي يتم التحويل إليها (المستلم):
                    </label>
                    {isSourceCashWallet(selectedFromLine?.provider) && (
                      <span className="text-[10px] text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                        محافظ فقط (تم إخفاء إنستاباي والبنوك)
                      </span>
                    )}
                  </div>

                  <select
                    value={interToLineId}
                    onChange={(e) => setInterToLineId(e.target.value)}
                    className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  >
                    <optgroup label={isSourceCashWallet(selectedFromLine?.provider) ? "محافظ الكاش الإلكترونية المسجلة" : "المحافظ والحسابات المسجلة"}>
                      {allowedDestinationLines.map((l) => (
                        <option key={l.id} value={`registered_${l.id}`}>
                          {l.name} ({l.phoneNumber}) - الرصيد الحالي: {formatAmount(l.balance)} ج.م
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="محفظة خارجية أو رقم آخر">
                      <option value="other">✏️ أخرى (إدخال رقم محفظة يدوي)</option>
                    </optgroup>
                  </select>

                  {/* In case "other" is selected */}
                  {isOtherTo ? (
                    <div className="p-3.5 rounded-xl bg-slate-900/90 border border-emerald-500/30 space-y-3 animate-fade-in">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                            رقم المحفظة المستلمة *
                          </label>
                          <input
                            type="text"
                            value={interCustomNumber}
                            onChange={(e) => {
                              const eng = e.target.value.replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString()).replace(/[^\d]/g, '');
                              setInterCustomNumber(eng);
                            }}
                            placeholder="مثال: 01012345678 (أرقام فقط)"
                            required={isOtherTo}
                            className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-mono placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                            شبكة المحفظة المستلمة *
                          </label>
                          <select
                            value={interCustomProvider}
                            onChange={(e) => setInterCustomProvider(e.target.value)}
                            className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          >
                            <option value="فودافون كاش">فودافون كاش (Vodafone Cash)</option>
                            <option value="أورنج كاش">أورنج كاش (Orange Cash)</option>
                            <option value="اتصالات كاش">اتصالات كاش (Etisalat Cash)</option>
                            <option value="وي باي (WE Pay)">وي باي (WE Pay)</option>
                            <option value="محفظة إلكترونية كاش أخرى">محفظة إلكترونية كاش أخرى</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          اسم صاحب المحفظة المستلمة (اختياري)
                        </label>
                        <input
                          type="text"
                          value={interCustomName}
                          onChange={(e) => {
                            const withoutDigits = e.target.value.replace(/[\d٠-٩]/g, '');
                            setInterCustomName(withoutDigits);
                          }}
                          placeholder="مثال: محفظة فرع رقم (حروف فقط)"
                          className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  ) : selectedToLine ? (
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
                      <span className="text-slate-400">
                        رصيد المستلم الحالي: <strong className="text-white font-mono text-sm">{formatAmount(selectedToLine.balance)} ج.م</strong>
                      </span>
                      <span className="text-emerald-400 text-[11px] bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/30">
                        محفظة كاش معتمدة ✓
                      </span>
                    </div>
                  ) : null}
                </div>

              </div>

              {/* Row 2: Transfer Fee (Editable) & Transfer Amount */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
                
                {/* Fee Input: خانة رسوم التحويل ويتم خصمها من المحفظة المصدر */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-200">
                      3. رسوم التحويل المراد خصمها (ج.م) *:
                    </label>
                    <span className="text-[10px] text-amber-400 bg-amber-950/80 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                      تُخصم من المحفظة المصدر
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={interFee}
                      onChange={(e) => setInterFee(e.target.value)}
                      placeholder="0"
                      required
                      className="w-full p-3.5 bg-slate-900 border border-slate-700 rounded-xl text-xl font-bold font-mono text-amber-400 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                      ج.م
                    </span>
                  </div>

                  {/* Quick Fee Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] text-slate-500 ml-1">تحديد سريع:</span>
                    {[0, 5, 10, 15, 20].map((fVal) => (
                      <button
                        key={fVal}
                        type="button"
                        onClick={() => setInterFee(fVal.toString())}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition cursor-pointer ${
                          interFee === fVal.toString()
                            ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {fVal === 0 ? '0 ج.م (مجاناً)' : `${fVal} ج.م`}
                      </button>
                    ))}
                  </div>

                  <p className="text-[11px] text-slate-400">
                    سيتم خصم هذه الرسوم مباشرة بالإضافة للمبلغ من رصيد المحفظة المصدر ({selectedFromLine?.name || 'المصدر'}).
                  </p>
                </div>

                {/* Amount & Chips */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <label className="block text-xs font-bold text-slate-200">
                    4. مبلغ التحويل المراد نقله (ج.م) *:
                  </label>

                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={interAmount}
                      onChange={(e) => setInterAmount(e.target.value)}
                      placeholder="0"
                      required
                      className="w-full p-3.5 bg-slate-900 border border-slate-700 rounded-xl text-2xl font-black font-mono text-emerald-400 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                      ج.م
                    </span>
                  </div>

                  {/* Quick Amount Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] text-slate-500 ml-1">إضافة سريعة:</span>
                    {[500, 1000, 5000, 10000, 20000].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handleAddInterQuickAmount(val)}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-mono font-bold border border-slate-800 hover:border-slate-700 transition cursor-pointer"
                      >
                        +{formatAmount(val)}
                      </button>
                    ))}
                    {selectedFromLine && selectedFromLine.balance > 0 && (
                      <button
                        type="button"
                        onClick={handleSetMaxInterAmount}
                        className="px-3 py-1 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 rounded-lg text-xs font-bold border border-emerald-500/30 transition cursor-pointer"
                      >
                        كامل المتاح
                      </button>
                    )}
                  </div>
                </div>

              </div>

              {/* Row 3: Financial Summary & Notes */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
                
                {/* Financial Summary Card (8 cols) */}
                <div className="lg:col-span-8 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 border border-slate-800 space-y-3">
                  <span className="text-xs font-bold text-slate-300 block">
                    الملخص المالي لعملية التحويل:
                  </span>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                      <span className="text-slate-400 block mb-0.5">المبلغ المحول:</span>
                      <strong className="text-white font-mono text-base">{formatAmount(Number(interAmount) || 0)} ج.م</strong>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                      <span className="text-slate-400 block mb-0.5">رسوم التحويل:</span>
                      <strong className="text-amber-400 font-mono text-base">{formatAmount(Number(interFee) || 0)} ج.م</strong>
                    </div>

                    <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30">
                      <span className="text-rose-300 block mb-0.5">إجمالي المخصوم من المصدر:</span>
                      <strong className="text-rose-400 font-mono text-base">{formatAmount((Number(interAmount) || 0) + (Number(interFee) || 0))} ج.م</strong>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
                      <span className="text-emerald-300 block mb-0.5">رصيد المصدر المتبقي:</span>
                      <strong className="text-emerald-400 font-mono text-base">
                        {formatAmount(Math.max(0, (selectedFromLine?.balance || 0) - ((Number(interAmount) || 0) + (Number(interFee) || 0))))} ج.م
                      </strong>
                    </div>
                  </div>

                  {/* Warning if total > balance */}
                  {selectedFromLine && ((Number(interAmount) || 0) + (Number(interFee) || 0)) > selectedFromLine.balance && (
                    <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2 animate-shake">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>
                        المبلغ الإجمالي مع الرسوم ({formatAmount((Number(interAmount) || 0) + (Number(interFee) || 0))} ج.م) يتجاوز الرصيد المتاح في المحفظة المصدر ({formatAmount(selectedFromLine.balance)} ج.م)!
                      </span>
                    </div>
                  )}
                </div>

                {/* Notes & Submit (4 cols) */}
                <div className="lg:col-span-4 p-4 sm:p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4 flex flex-col justify-between">
                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1">
                      ملاحظات العملية (اختياري):
                    </label>
                    <input
                      type="text"
                      value={interNotes}
                      onChange={(e) => setInterNotes(e.target.value)}
                      placeholder="موازنة سيولة بين الخطوط"
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isInterSubmitting || !selectedFromLine || (selectedFromLine && ((Number(interAmount) || 0) + (Number(interFee) || 0)) > selectedFromLine.balance)}
                    className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 cursor-pointer active:scale-[0.98]"
                  >
                    {isInterSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>جاري تنفيذ التحويل والخصم...</span>
                      </>
                    ) : (
                      <>
                        <ArrowLeftRight className="w-4 h-4" />
                        <span>تنفيذ التحويل وخصم المبلغ والرسوم</span>
                      </>
                    )}
                  </button>
                </div>

              </div>
            </form>

          </div>
        </div>
      )}

      {/* Add / Edit Line Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto" dir="rtl">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl my-8">
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-extrabold text-white text-base">
                {editingLine ? 'تعديل بيانات خط الكاش' : 'إضافة خط أو محفظة كاش جديدة'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLine} className="p-6 space-y-4">
              {modalError && (
                <div className="py-2 px-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs flex items-center justify-between gap-2 shadow-sm">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>
                      {modalError.toLowerCase().includes('failed to fetch') || modalError.includes('Network') || modalError.includes('الخادم')
                        ? 'تعذّر الاتصال بالخادم، تحقق من الاتصال وحاول مجددًا'
                        : modalError}
                    </span>
                  </div>
                  <button
                    type="submit"
                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[11px] font-bold shrink-0 transition cursor-pointer"
                  >
                    إعادة المحاولة
                  </button>
                </div>
              )}

              {/* Line Name & Provider */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">اسم الخط / المحفظة *</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="مثال: فودافون كاش 2"
                    required
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">الشركة / نوع المزود *</label>
                  <select
                    value={formProvider}
                    onChange={(e) => setFormProvider(e.target.value as ProviderType)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="vodafone">فودافون كاش</option>
                    <option value="orange">أورنج موني</option>
                    <option value="etisalat">اتصالات كاش</option>
                    <option value="we">وي باي (WE Pay)</option>
                    <option value="banque_misr">محفظة بنك مصر</option>
                    <option value="instapay">إنستاباي IPN</option>
                    <option value="cib">البنك التجاري الدولي CIB</option>
                    <option value="nbe">البنك الأهلي المصري</option>
                    <option value="fawry">فوري (Fawry)</option>
                    <option value="banque_du_caire">بنك القاهرة</option>
                    <option value="alexbank">بنك الإسكندرية</option>
                    <option value="qnb">QNB الأهلي</option>
                    <option value="other">أخرى</option>
                  </select>
                </div>
              </div>

              {/* Phone & Holder */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">رقم الهاتف / رقم الحساب *</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(toEnglishDigits(e.target.value))}
                    placeholder="010XXXXXXXX"
                    required
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono placeholder:text-slate-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">اسم صاحب الخط أو التوثيق</label>
                  <input
                    type="text"
                    value={formHolder}
                    onChange={(e) => setFormHolder(e.target.value)}
                    placeholder="اسم المالك أو المؤسسة"
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Balance & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">الرصيد الافتتاحي (ج.م)</label>
                  <input
                    type="text"
                    value={formBalance}
                    onChange={(e) => setFormBalance(toEnglishDigits(e.target.value))}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">حالة الخط</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="active">نشط (جاهز للتحويلات)</option>
                    <option value="paused">متوقف مؤقتاً</option>
                    <option value="suspended">موقوف نهائياً</option>
                  </select>
                </div>
              </div>

              {/* Limits Configuration */}
              <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-emerald-400 block">
                  إعدادات الحدود المالية للخط (بالجنيه المصري):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">الحد اليومي</label>
                    <input
                      type="text"
                      value={formDailyLimit}
                      onChange={(e) => setFormDailyLimit(toEnglishDigits(e.target.value))}
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">الحد الشهري</label>
                    <input
                      type="text"
                      value={formMonthlyLimit}
                      onChange={(e) => setFormMonthlyLimit(toEnglishDigits(e.target.value))}
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">نسبة التحذير (%)</label>
                    <input
                      type="text"
                      value={formWarningThreshold}
                      onChange={(e) => setFormWarningThreshold(toEnglishDigits(e.target.value))}
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">ملاحظات إضافية</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="أي تفاصيل خاصة بشركة الاتصالات أو الاستخدام..."
                  rows={2}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? 'جاري الحفظ...' : editingLine ? 'حفظ التعديلات' : 'إضافة الخط الآن'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
