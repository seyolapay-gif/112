import React, { useState, useEffect, useRef } from 'react';
import { CashLine, Transfer, TransferType, OperationSession, TelecomRulesSettings } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ProviderBadge, PROVIDER_CONFIG } from './ProviderBadge';
import { ReceiptModal } from './ReceiptModal';
import { formatAmount, toEnglishDigits } from '../utils/formatters';
import { calculateAutoFee } from '../utils/feeCalculator';
import { 
  Wallet, 
  Building2, 
  CheckCircle2, 
  AlertTriangle, 
  Printer, 
  RotateCcw, 
  Send, 
  Loader2, 
  Info, 
  ShieldCheck,
  ArrowUpRight,
  ArrowDownLeft,
  Coins,
  ChevronDown,
  X,
  Sparkles,
  Phone,
  User,
  ArrowLeftRight,
  Minimize2,
  Plus,
  Layers,
  Pin
} from 'lucide-react';

interface NewTransferViewProps {
  initialLineId?: string;
  initialMode?: 'transfer' | 'receive';
  activeSession?: OperationSession | null;
  onUpdateSession?: (data: Partial<OperationSession>) => void;
  onMinimize?: (currentData: Partial<OperationSession>) => void;
  onNewOperation?: (mode: 'transfer' | 'receive') => void;
  minimizedCount?: number;
  onSuccess: (transfer: Transfer) => void;
  onPrintReceipt: (transfer: Transfer) => void;
  onShowSuccess?: () => void;
}

/**
 * Calculates provider transfer commission (عمولة التحويل)
 * based on Egyptian telecom provider rules:
 * - Vodafone: 1 EGP to Vodafone Cash; 0.5% (min 1 EGP, max 15 EGP) to other wallets.
 *   First transfer in month is free (0 EGP) if amount <= 2000 EGP. Min 5, Max 60,000.
 * - Etisalat: 1.00 EGP to Etisalat Cash; 0.5% (min 1, max 15) to others. First transfer in month free if <= 2000.
 * - Orange: 1 EGP to Orange Cash; 0.5% (min 1, max 15) to others. First transfer in month free if <= 2000.
 * - WE Pay: 1 EGP max to WE Pay; 0.5% (min 1, max 15) to others. First transfer in month free if <= 2000.
 */
export const calculateProviderCommission = (
  amount: number,
  sourceLine?: CashLine,
  destinationBankOrWallet?: string,
  recipientNumber?: string,
  customRules?: TelecomRulesSettings
): number => {
  if (!amount || amount <= 0) return 0;

  const provider = sourceLine?.provider || 'vodafone';

  // Determine recipient network
  let targetNetwork = 'other';
  const cleanPhone = (recipientNumber || '').replace(/[^\d]/g, '');
  const cleanDest = destinationBankOrWallet || '';

  if (cleanPhone.startsWith('010') || cleanDest.includes('فودافون')) {
    targetNetwork = 'vodafone';
  } else if (cleanPhone.startsWith('011') || cleanDest.includes('اتصالات')) {
    targetNetwork = 'etisalat';
  } else if (cleanPhone.startsWith('012') || cleanDest.includes('أورنج') || cleanDest.includes('اورنج')) {
    targetNetwork = 'orange';
  } else if (cleanPhone.startsWith('015') || cleanDest.includes('وي') || cleanDest.toLowerCase().includes('we')) {
    targetNetwork = 'we';
  } else if (cleanDest.includes('انستاباي') || cleanDest.toLowerCase().includes('instapay')) {
    targetNetwork = 'instapay';
  }

  // Check if first transfer in month (and amount <= threshold)
  const isFirstTransferOfMonth = (sourceLine?.monthCount === 0 || !sourceLine?.monthCount);

  // 1. Vodafone
  if (provider === 'vodafone' || provider === 'vodafone_vip') {
    const rule = customRules?.vodafone || {
      sameNetworkFee: 1,
      crossNetworkPercent: 0.5,
      crossNetworkMinFee: 1,
      crossNetworkMaxFee: 15,
      freeFirstTransferLimit: 2000,
      enableFreeFirstTransfer: true,
    };

    if (isFirstTransferOfMonth && rule.enableFreeFirstTransfer && amount <= rule.freeFirstTransferLimit) {
      return 0;
    }

    if (targetNetwork === 'vodafone') {
      return rule.sameNetworkFee;
    } else {
      const raw = amount * (rule.crossNetworkPercent / 100);
      const fee = Math.min(rule.crossNetworkMaxFee, Math.max(rule.crossNetworkMinFee, raw));
      return Number(fee.toFixed(2));
    }
  }

  // 2. Etisalat
  if (provider === 'etisalat') {
    const rule = customRules?.etisalat || {
      sameNetworkFee: 1,
      crossNetworkPercent: 0.5,
      crossNetworkMinFee: 1,
      crossNetworkMaxFee: 15,
      freeFirstTransferLimit: 2000,
      enableFreeFirstTransfer: true,
    };

    if (isFirstTransferOfMonth && rule.enableFreeFirstTransfer && amount <= rule.freeFirstTransferLimit) {
      return 0;
    }

    if (targetNetwork === 'etisalat') {
      return rule.sameNetworkFee;
    } else {
      const raw = amount * (rule.crossNetworkPercent / 100);
      const fee = Math.min(rule.crossNetworkMaxFee, Math.max(rule.crossNetworkMinFee, raw));
      return Number(fee.toFixed(2));
    }
  }

  // 3. Orange
  if (provider === 'orange') {
    const rule = customRules?.orange || {
      sameNetworkFee: 1,
      crossNetworkPercent: 0.5,
      crossNetworkMinFee: 1,
      crossNetworkMaxFee: 15,
      freeFirstTransferLimit: 2000,
      enableFreeFirstTransfer: true,
    };

    if (isFirstTransferOfMonth && rule.enableFreeFirstTransfer && amount <= rule.freeFirstTransferLimit) {
      return 0;
    }

    if (targetNetwork === 'orange') {
      return rule.sameNetworkFee;
    } else {
      const raw = amount * (rule.crossNetworkPercent / 100);
      const fee = Math.min(rule.crossNetworkMaxFee, Math.max(rule.crossNetworkMinFee, raw));
      return Number(fee.toFixed(2));
    }
  }

  // 4. WE Pay
  if (provider === 'we') {
    const rule = customRules?.we || {
      sameNetworkFee: 1,
      crossNetworkPercent: 0.5,
      crossNetworkMinFee: 1,
      crossNetworkMaxFee: 15,
      freeFirstTransferLimit: 2000,
      enableFreeFirstTransfer: true,
    };

    if (isFirstTransferOfMonth && rule.enableFreeFirstTransfer && amount <= rule.freeFirstTransferLimit) {
      return 0;
    }

    if (targetNetwork === 'we') {
      return rule.sameNetworkFee;
    } else {
      const raw = amount * (rule.crossNetworkPercent / 100);
      const fee = Math.min(rule.crossNetworkMaxFee, Math.max(rule.crossNetworkMinFee, raw));
      return Number(fee.toFixed(2));
    }
  }

  if (targetNetwork === 'instapay' || provider === 'instapay') {
    return customRules?.instapayFee || 0;
  }

  return 0;
};

export const NewTransferView: React.FC<NewTransferViewProps> = ({
  initialLineId,
  initialMode = 'transfer',
  activeSession,
  onUpdateSession,
  onMinimize,
  onNewOperation,
  minimizedCount = 0,
  onSuccess,
  onPrintReceipt,
  onShowSuccess,
}) => {
  const { user } = useAuth();
  const [lines, setLines] = useState<CashLine[]>([]);
  const [isLoadingLines, setIsLoadingLines] = useState(true);

  // Operation Mode: Transfer Out vs Receive In
  const [operationMode, setOperationMode] = useState<'transfer' | 'receive'>(
    activeSession?.mode || initialMode
  );
  const isReceiving = operationMode === 'receive';

  // Modal to switch source line cleanly without ugly select tag
  const [isLineSwitcherOpen, setIsLineSwitcherOpen] = useState(false);

  // Pinned Default Line state & long-press timer
  const [pinnedLineId, setPinnedLineId] = useState<string | null>(() => {
    return localStorage.getItem('seyola_pinned_default_line_id') || null;
  });
  const [pinToastMsg, setPinToastMsg] = useState<string | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressTriggeredRef = useRef<boolean>(false);

  // Form Fields
  const [transferType, setTransferType] = useState<TransferType>(
    activeSession?.transferType || 'cash_wallet'
  );
  const [sourceLineId, setSourceLineId] = useState<string>(
    activeSession?.sourceLineId || initialLineId || localStorage.getItem('seyola_pinned_default_line_id') || ''
  );
  const [recipientType, setRecipientType] = useState<'wallet' | 'bank_account'>(
    activeSession?.recipientType || 'wallet'
  );
  const [recipientNumber, setRecipientNumber] = useState(
    activeSession?.recipientNumber || ''
  );
  const [recipientName, setRecipientName] = useState(
    activeSession?.recipientName || ''
  );
  const [destinationBankOrWallet, setDestinationBankOrWallet] = useState(
    activeSession?.destinationBankOrWallet || 'فودافون كاش'
  );
  const [amount, setAmount] = useState(
    activeSession?.amount || ''
  );
  const [commission, setCommission] = useState(
    activeSession?.commission || '0'
  );
  const [fee, setFee] = useState(
    activeSession?.fee || '0'
  );
  const [overrideLimit, setOverrideLimit] = useState(
    activeSession?.overrideLimit || false
  );

  // Settings & Telecom Rules State
  const [telecomRules, setTelecomRules] = useState<TelecomRulesSettings | undefined>(undefined);

  // State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdTransfer, setCreatedTransfer] = useState<Transfer | null>(null);
  const [pendingPreviewTransfer, setPendingPreviewTransfer] = useState<Transfer | null>(null);
  const [pendingPayload, setPendingPayload] = useState<any | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const handleTogglePinLine = (line: CashLine, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const isCurrentlyPinned = pinnedLineId === line.id;
    const newPinned = isCurrentlyPinned ? null : line.id;
    setPinnedLineId(newPinned);
    if (newPinned) {
      localStorage.setItem('seyola_pinned_default_line_id', newPinned);
      setPinToastMsg(`تم تثبيت خط "${line.name}" كخط افتراضي دائماً عند التحويل أو الاستلام 📌`);
    } else {
      localStorage.removeItem('seyola_pinned_default_line_id');
      setPinToastMsg(`تم إلغاء تثبيت الخط الافتراضي`);
    }
    setTimeout(() => setPinToastMsg(null), 3000);
  };

  const handleLinePointerDown = (line: CashLine) => {
    isLongPressTriggeredRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      isLongPressTriggeredRef.current = true;
      handleTogglePinLine(line);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(60);
      }
    }, 500);
  };

  const handleLinePointerUpOrLeave = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  useEffect(() => {
    const pinned = localStorage.getItem('seyola_pinned_default_line_id');
    if (activeSession?.mode) {
      setOperationMode(activeSession.mode);
      if (activeSession.mode === 'receive') {
        setCommission('0');
      }
    } else {
      setOperationMode(initialMode);
      if (initialMode === 'receive') {
        setFee('0');
        setCommission('0');
        setDestinationBankOrWallet('فودافون كاش');
      }
    }
    if (pinned && (!activeSession?.sourceLineId || activeSession.sourceLineId === '')) {
      setSourceLineId(pinned);
    }
  }, [initialMode, activeSession?.mode]);

  useEffect(() => {
    loadLines();
    api.getSettings().then((s) => {
      if (s?.telecomRules) {
        setTelecomRules(s.telecomRules);
      }
    }).catch(() => {});
  }, []);

  const isSourceCashWallet = (provider?: string) => {
    return provider === 'vodafone' || provider === 'orange' || provider === 'etisalat' || provider === 'we';
  };
  const isSourceInstaPay = (provider?: string) => {
    return provider === 'instapay';
  };

  const loadLines = async () => {
    setIsLoadingLines(true);
    try {
      const data = await api.getLines();
      setLines(data);
      let targetId = '';
      const pinned = localStorage.getItem('seyola_pinned_default_line_id');
      if (pinned && data.some((l) => l.id === pinned && l.status === 'active')) {
        targetId = pinned;
      } else if (initialLineId && data.some((l) => l.id === initialLineId)) {
        targetId = initialLineId;
      } else if (data.length > 0 && !sourceLineId) {
        const active = data.find((l) => l.status === 'active') || data[0];
        targetId = active.id;
      }
      if (targetId) {
        setSourceLineId(targetId);
      }
    } catch (err) {
      console.error('Failed to load lines for transfer:', err);
    } finally {
      setIsLoadingLines(false);
    }
  };

  // Helper to compute receive commission based on settings (Percentage vs Fixed)
  const computeReceiveFee = (amountNum: number, rules?: TelecomRulesSettings): number => {
    if (isNaN(amountNum) || amountNum <= 0) return 0;
    const type = rules?.receiveCommissionType ?? 'percentage';
    if (type === 'percentage') {
      const rate = rules?.receiveCommissionRate ?? 1; // Default 1%
      return Math.max(0, Math.round(amountNum * (rate / 100)));
    } else {
      return rules?.defaultReceiveFee ?? 5;
    }
  };

  const handleSourceLineChange = (newLineId: string) => {
    setSourceLineId(newLineId);
    setIsLineSwitcherOpen(false);
    const line = lines.find((l) => l.id === newLineId);
    const num = Number(amount);
    if (!isNaN(num) && num > 0) {
      if (operationMode === 'transfer') {
        const autoComm = calculateProviderCommission(num, line, destinationBankOrWallet, recipientNumber, telecomRules);
        setCommission(toEnglishDigits(autoComm.toString()));
      } else {
        const autoFee = computeReceiveFee(num, telecomRules);
        setFee(toEnglishDigits(autoFee.toString()));
        setCommission('0');
      }
    }
  };

  const selectedLine = lines.find((l) => l.id === sourceLineId);

  // Auto commission and tiered fee calculation based on user tier rules, editable manually, strictly English digits
  const handleAmountChange = (val: string) => {
    const englishVal = toEnglishDigits(val).replace(/[^\d]/g, '');
    setAmount(englishVal);
    const num = Number(englishVal);
    if (!isNaN(num) && num > 0) {
      if (operationMode === 'receive') {
        const autoFee = calculateAutoFee(num);
        setFee(toEnglishDigits(autoFee.toString()));
        setCommission('0');
      } else {
        const autoComm = calculateProviderCommission(num, selectedLine, destinationBankOrWallet, recipientNumber, telecomRules);
        setCommission(toEnglishDigits(autoComm.toString()));
        // Auto tier fee: <=500 -> 5, 500-1000 -> 10, >1000 -> 10 per 1000 (e.g. 3610 -> 40, 6000 -> 60, 9000 -> 90)
        const autoFee = calculateAutoFee(num);
        setFee(toEnglishDigits(autoFee.toString()));
      }
    } else {
      setFee('0');
      setCommission('0');
    }
  };

  // Handler for phone number: strictly allow English digits only, enforce starting with 01, auto-select provider at 3 digits
  const handleRecipientNumberChange = (raw: string) => {
    let englishDigits = toEnglishDigits(raw).replace(/[^\d]/g, '');
    
    // Enforce that phone numbers start with 01
    if (englishDigits.length > 0) {
      if (!englishDigits.startsWith('0')) {
        englishDigits = '01' + englishDigits;
      } else if (englishDigits.length > 1 && !englishDigits.startsWith('01')) {
        englishDigits = '01' + englishDigits.slice(1);
      }
    }

    if (englishDigits.length > 11) {
      englishDigits = englishDigits.slice(0, 11);
    }
    
    setRecipientNumber(englishDigits);

    // Auto-select telecom provider as soon as 3 digits are entered!
    let targetDest = destinationBankOrWallet;
    if (englishDigits.length >= 3) {
      const prefix = englishDigits.slice(0, 3);
      if (prefix === '010') {
        targetDest = 'فودافون كاش';
        setDestinationBankOrWallet('فودافون كاش');
      } else if (prefix === '011') {
        targetDest = 'اتصالات كاش';
        setDestinationBankOrWallet('اتصالات كاش');
      } else if (prefix === '012') {
        targetDest = 'أورنج كاش';
        setDestinationBankOrWallet('أورنج كاش');
      } else if (prefix === '015') {
        targetDest = 'وي باي';
        setDestinationBankOrWallet('وي باي');
      }
    }

    const num = Number(amount);
    if (!isNaN(num) && num > 0 && operationMode === 'transfer') {
      const autoComm = calculateProviderCommission(num, selectedLine, targetDest, englishDigits);
      setCommission(toEnglishDigits(autoComm.toString()));
    }
  };

  const handleRecipientNameChange = (raw: string) => {
    const withoutNumbers = raw.replace(/[\d٠-٩]/g, '');
    const lettersOnly = withoutNumbers.replace(/[^\u0600-\u06FF\u0750-\u077Fa-zA-Z\s]/g, '');
    setRecipientName(lettersOnly);
  };

  const numAmount = Number(amount) || 0;
  const numCommission = Math.max(0, Number(commission) || 0);
  const numFee = Math.max(0, Number(fee) || 0);

  // Line balance deduction is: amount + commission (user specification)
  const totalAmount = isReceiving ? numAmount : (numAmount + numCommission);

  // Strict Zero-Balance and Independent Limit Calculations (Daily: 60,000 send / 60,000 receive | Monthly: 200,000 send / 200,000 receive | Single: 60,000)
  const isZeroBalance = Boolean(selectedLine && selectedLine.balance <= 0);
  const dailyCap = selectedLine ? (selectedLine.dailyLimit || 60000) : 60000;
  const monthlyCap = selectedLine ? (selectedLine.monthlyLimit || 200000) : 200000;

  // Separate Independent Quotas: Send (60k/200k) vs Receive (60k/200k)
  const remainingDaily = selectedLine
    ? (isReceiving
        ? (selectedLine.remainingDailyReceive ?? Math.max(0, dailyCap - (selectedLine.todayReceiveUsed || 0)))
        : (selectedLine.remainingDailyTransfer ?? Math.max(0, dailyCap - (selectedLine.todayTransferUsed || 0))))
    : 0;

  const remainingMonthly = selectedLine
    ? (isReceiving
        ? (selectedLine.remainingMonthlyReceive ?? Math.max(0, monthlyCap - (selectedLine.monthReceiveUsed || 0)))
        : (selectedLine.remainingMonthlyTransfer ?? Math.max(0, monthlyCap - (selectedLine.monthTransferUsed || 0))))
    : 0;

  const isMaxSingleExceeded = Boolean(numAmount > 60000);
  const isDailyLimitExceeded = Boolean(!overrideLimit && selectedLine && numAmount > 0 && numAmount > remainingDaily);
  const isMonthlyLimitExceeded = Boolean(!overrideLimit && selectedLine && numAmount > 0 && numAmount > remainingMonthly);
  const isInsufficientBalance = Boolean(selectedLine && operationMode === 'transfer' && totalAmount > selectedLine.balance);

  let limitWarning: string | null = null;
  let balanceWarning: string | null = null;

  if (selectedLine) {
    if (isMaxSingleExceeded) {
      limitWarning = `تنبيه حاسم: الحد الأقصى للمعاملة الواحدة للمحافظ الإلكترونية هو 60,000 ج.م فقط! المبلغ المدخل (${formatAmount(numAmount)} ج.م) يتجاوز الحد المسموح.`;
    } else if (isDailyLimitExceeded) {
      limitWarning = `لا يمكن إتمام ${isReceiving ? 'الاستلام' : 'التحويل'}: تم تجاوز الحد الأقصى اليومي ${isReceiving ? 'لاستقبال' : 'لإرسال'} الأموال لهذا الخط (${formatAmount(dailyCap)} ج.م)! المبلغ المتاح ${isReceiving ? 'لاستقباله' : 'لإرساله'} اليوم هو فقط: ${formatAmount(remainingDaily)} ج.م.`;
    } else if (isMonthlyLimitExceeded) {
      limitWarning = `لا يمكن إتمام ${isReceiving ? 'الاستلام' : 'التحويل'}: تم تجاوز الحد الأقصى الشهري ${isReceiving ? 'لاستقبال' : 'لإرسال'} الأموال لهذا الخط (${formatAmount(monthlyCap)} ج.م)! المبلغ المتاح ${isReceiving ? 'لاستقباله' : 'لإرساله'} لهذا الشهر هو فقط: ${formatAmount(remainingMonthly)} ج.م.`;
    }

    if (operationMode === 'transfer') {
      if (isZeroBalance) {
        balanceWarning = `تنبيه حاسم: رصيد الخط الحالي 0 ج.م، ولا يمكن إتمام أي عملية تحويل من هذا الخط حتى تتم تغذيته بالسيولة أولاً!`;
      } else if (isInsufficientBalance) {
        balanceWarning = `الرصيد المتاح في الخط (${formatAmount(selectedLine.balance)} ج.م) غير كافٍ! إجمالي الخصم المطلوب (${formatAmount(totalAmount)} ج.م شامل عمولة التحويل ${formatAmount(numCommission)} ج.م) يتجاوز الرصيد الحالي.`;
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceLineId) {
      setErrorMessage(operationMode === 'receive' ? 'الرجاء اختيار الخط المستلم للمبلغ' : 'الرجاء اختيار الخط المرسل');
      return;
    }
    
    // Mandatory Phone Number Check: Must be strictly 11 digits starting with 01
    const cleanPhone = recipientNumber.trim();
    if (!cleanPhone || cleanPhone.length !== 11 || !cleanPhone.startsWith('01')) {
      setErrorMessage(
        isReceiving 
          ? 'رقم هاتف الراسل إجباري ويجب أن يتكون من 11 رقماً يبدأ بـ 01 (مثال: 01xxxxxxxxx)' 
          : 'رقم هاتف المحفظة المستلمة إجباري ويجب أن يتكون من 11 رقماً يبدأ بـ 01 (مثال: 01xxxxxxxxx)'
      );
      return;
    }
    const targetRecipientNumber = cleanPhone;

    if (numAmount <= 0) {
      setErrorMessage('الرجاء إدخال مبلغ صحيح أكبر من صفر');
      return;
    }

    // 0. Single Operation Cap: Max 60,000 EGP
    if (numAmount > 60000) {
      setErrorMessage(`عذراً، الحد الأقصى المسموح به في العملية الواحدة للمحافظ الإلكترونية هو 60,000 ج.م فقط! المبلغ المدخل (${formatAmount(numAmount)} ج.م) يتجاوز الحد المسموح.`);
      return;
    }

    // Daily & Monthly Limits Enforcement (Both Send and Receive)
    if (isDailyLimitExceeded) {
      setErrorMessage(`تم تجاوز الحد الأقصى اليومي لهذا الخط (${formatAmount(dailyCap)} ج.م)! المبلغ المتاح ${isReceiving ? 'لاستقباله' : 'لإرساله'} اليوم هو ${formatAmount(remainingDaily)} ج.م فقط.`);
      return;
    }
    if (isMonthlyLimitExceeded) {
      setErrorMessage(`تم تجاوز الحد الأقصى الشهري لهذا الخط (${formatAmount(monthlyCap)} ج.م)! المبلغ المتاح ${isReceiving ? 'لاستقباله' : 'لإرساله'} هذا الشهر هو ${formatAmount(remainingMonthly)} ج.م فقط.`);
      return;
    }

    if (!isReceiving) {
      if (isZeroBalance) {
        setErrorMessage('لا يمكن إتمام التحويل: رصيد الخط الحالي 0 ج.م، ولا توجد سيولة كافية للتحويل.');
        return;
      }
      if (isInsufficientBalance) {
        setErrorMessage(`رصيد الخط غير كافٍ! إجمالي الخصم (${formatAmount(totalAmount)} ج.م) أكبر من الرصيد المتاح (${formatAmount(selectedLine?.balance || 0)} ج.م).`);
        return;
      }
    }

    setErrorMessage(null);

    const idempotencyKey = `idemp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const dateNow = new Date();
    const dateStr = dateNow.toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const generatedRef = operationMode === 'receive' 
      ? `RCV${dateStr}${randomSuffix}` 
      : `TRX${dateStr}${randomSuffix}`;

    const payload = {
      transferType: operationMode === 'receive' ? 'receive_money' : transferType,
      sourceLineId,
      recipientType,
      recipientNumber: targetRecipientNumber,
      recipientName: recipientName.trim() || (operationMode === 'receive' ? 'عميل مودع' : 'عميل نقدي'),
      destinationBankOrWallet,
      amount: numAmount,
      commission: numCommission,
      fee: numFee,
      notes: '',
      idempotencyKey,
      overrideLimit,
    };

    const preview: Transfer = {
      id: `pending_${Date.now()}`,
      referenceNumber: generatedRef,
      timestamp: dateNow.toISOString(),
      transferType: operationMode === 'receive' ? 'receive_money' : transferType,
      sourceLineId,
      sourceLineName: selectedLine?.name || '',
      sourceNumber: selectedLine?.phoneNumber || '',
      recipientType,
      recipientNumber: targetRecipientNumber,
      recipientName: recipientName.trim() || (operationMode === 'receive' ? 'عميل مودع' : 'عميل نقدي'),
      destinationBankOrWallet,
      amount: numAmount,
      commission: numCommission,
      fee: numFee,
      totalAmount,
      balanceAfter: isReceiving 
        ? ((selectedLine?.balance || 0) + numAmount)
        : Math.max(0, (selectedLine?.balance || 0) - (numAmount + numCommission)),
      notes: '',
      operatorId: user?.id || 'usr_admin',
      operatorName: user?.fullName || 'عادل فتحي',
      status: 'completed',
      serviceProviderRef: `${operationMode === 'receive' ? 'RCV' : 'TX'}-${Math.floor(100000 + Math.random() * 900000)}`,
      createdAt: dateNow.toISOString(),
      updatedAt: dateNow.toISOString(),
    };

    // Open receipt modal for preview. The operation IS NOT SAVED until user clicks 'إتمام العملية'!
    setPendingPreviewTransfer(preview);
    setPendingPayload(payload);
    setIsReceiptOpen(true);
    setIsSubmitting(false);
  };

  const handleConfirmAndSaveOperation = async () => {
    if (!pendingPayload) return;
    try {
      const res = await api.createTransfer(pendingPayload);
      setCreatedTransfer(res);
      loadLines();
      setAmount('');
      setCommission('0');
      setRecipientNumber('');
      setRecipientName('');
      setPendingPayload(null);
      setIsReceiptOpen(false);
      onSuccess(res);
      if (onShowSuccess) {
        onShowSuccess();
      }
    } catch (err: any) {
      throw err;
    }
  };

  const handleCloseReceiptModal = () => {
    setIsReceiptOpen(false);
    setPendingPreviewTransfer(null);
    setPendingPayload(null);
  };

  const handleStartNew = () => {
    setCreatedTransfer(null);
    setRecipientNumber('');
    setRecipientName('');
    setAmount('');
    setCommission('0');
    setFee('0');
    setErrorMessage(null);
  };

  const currentSnapshot = (): Partial<OperationSession> => ({
    mode: operationMode,
    sourceLineId,
    transferType,
    recipientType,
    recipientNumber,
    recipientName,
    destinationBankOrWallet,
    amount,
    commission,
    fee,
    overrideLimit,
  });

  const handleMinimize = () => {
    if (onMinimize) {
      onMinimize(currentSnapshot());
    }
  };

  // Detected network helper for smart badge
  const getDetectedNetworkName = () => {
    if (recipientNumber.startsWith('010')) return { name: 'فودافون كاش', color: 'text-red-400 bg-red-950/60 border-red-500/30' };
    if (recipientNumber.startsWith('012')) return { name: 'أورنج كاش', color: 'text-orange-400 bg-orange-950/60 border-orange-500/30' };
    if (recipientNumber.startsWith('011')) return { name: 'اتصالات كاش', color: 'text-lime-400 bg-lime-950/60 border-lime-500/30' };
    if (recipientNumber.startsWith('015')) return { name: 'وي باي', color: 'text-purple-400 bg-purple-950/60 border-purple-500/30' };
    return null;
  };

  const detectedNet = getDetectedNetworkName();

  const WALLET_CHANNELS = [
    'فودافون كاش',
    'إنستاباي (IPN)',
    'أورنج كاش',
    'اتصالات كاش',
    'وي باي',
    'إيداع نقدي مباشر',
  ];

  return (
    <div className="space-y-5 pb-12 font-sans selection:bg-emerald-500 selection:text-white" dir="rtl">

      {/* Page Title & Status Header & Multi-Operation Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 sm:w-9 h-8 sm:h-9 rounded-xl flex items-center justify-center font-bold shadow-sm border shrink-0 ${
            isReceiving 
              ? 'bg-blue-600 text-white border-blue-400/40 shadow-blue-600/30' 
              : 'bg-emerald-600 text-white border-emerald-400/40 shadow-emerald-600/30'
          }`}>
            {isReceiving ? <ArrowDownLeft className="w-4 h-4" /> : <Send className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black text-white">
                {isReceiving ? 'استلام أموال وإيداع رصيد' : 'تحويل أموال (صادر)'}
              </h2>
              {activeSession && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                  عملية #{activeSession.sessionNumber}
                </span>
              )}
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400">
              {isReceiving 
                ? 'تسجيل نقدية واردة وإيداعها في المحفظة مع احتساب العمولة' 
                : 'إرسال وتحويل أموال من محافظ الكاش المعتمدة'}
            </p>
          </div>
        </div>

        {/* Top Controls: Minimize Button (زر تصغير) + New Operation Button + Status Badge */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Minimize Button - زر تصغير اعلي العملية */}
          {onMinimize && (
            <button
              type="button"
              onClick={handleMinimize}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/35 hover:border-amber-400 text-xs font-bold transition shadow-sm cursor-pointer active:scale-95 group"
              title="تصغير العملية الحالية ونزولها لأسفل الشاشة وفتح عملية جديدة فوراً"
            >
              <Minimize2 className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
              <span>تصغير العملية</span>
            </button>
          )}

          {/* New Operation Button - فتح عملية جديدة */}
          {onNewOperation && (
            <button
              type="button"
              onClick={() => {
                if (onMinimize) {
                  onMinimize(currentSnapshot());
                } else {
                  onNewOperation(operationMode);
                }
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold transition shadow-sm cursor-pointer active:scale-95"
              title="فتح عملية جديدة (مع حفظ الحالية بالأسفل)"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ عملية جديدة</span>
            </button>
          )}

          {/* Mode Pill Indicator */}
          {isReceiving ? (
            <span className="text-[11px] sm:text-xs px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <span>استلام (وارد)</span>
            </span>
          ) : (
            <span className="text-[11px] sm:text-xs px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>تحويل (صادر)</span>
            </span>
          )}
        </div>
      </div>



      {/* Main Grid: Form (col-8) & Financial Breakdown (col-4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Form Column */}
        <div className="lg:col-span-8 space-y-4">
          
          {errorMessage && !errorMessage.includes('تعذّر الاتصال') && !errorMessage.includes('Failed to fetch') && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 flex items-start gap-2.5 text-rose-200 text-xs shadow-md animate-shake">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="font-medium leading-relaxed text-[11px]">{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            
            {/* 1. Target Line Card (Receiving Line in Receive Mode, Source Line in Transfer Mode) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                  {isReceiving ? (
                    <>
                      <ArrowDownLeft className="w-3.5 h-3.5 text-blue-400" />
                      <span>الخط أو المحفظة المستلمة (الوجهة - يُضاف إليها الرصيد):</span>
                    </>
                  ) : (
                    <span>الخط أو المحفظة المرسلة (المصدر):</span>
                  )}
                </label>
                {lines.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setIsLineSwitcherOpen(true)}
                    className={`text-[10px] font-bold flex items-center gap-1 transition cursor-pointer py-0.5 px-2 rounded-lg hover:bg-slate-800 ${
                      isReceiving ? 'text-blue-400 hover:text-blue-300' : 'text-emerald-400 hover:text-emerald-300'
                    }`}
                    title={isReceiving ? "تغيير محفظة الاستلام" : "تغيير المحفظة المصدر"}
                  >
                    <span>{isReceiving ? "تغيير محفظة الاستلام" : "تغيير الخط"}</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                )}
              </div>

              {isLoadingLines ? (
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-400 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                  <span>جاري تحميل بيانات الخط والمحفظة...</span>
                </div>
              ) : (
                /* The Two-Column Card: Company Logo on Right beside Number, Balance on Left */
                <div 
                  onClick={() => lines.length > 1 && setIsLineSwitcherOpen(true)}
                  className={`p-3 sm:p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800/90 hover:border-blue-500/40 transition-all duration-200 shadow-md flex items-center justify-between gap-3 group ${
                    lines.length > 1 ? 'cursor-pointer hover:bg-slate-900/90' : ''
                  }`}
                  title={lines.length > 1 ? (isReceiving ? "انقر لاختيار محفظة استلام أخرى" : "انقر لاختيار خط آخر") : undefined}
                >
                  {/* Right Column: Company Official Logo + Phone Number + Label */}
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {/* Official Company Logo */}
                    <div className="shrink-0 w-9 h-9 rounded-xl overflow-hidden shadow-sm flex items-center justify-center bg-slate-900 border border-slate-800 group-hover:scale-105 transition-transform p-0.5">
                      <ProviderBadge provider={selectedLine?.provider || 'vodafone'} size="sm" showLabel={false} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span 
                          className="text-sm sm:text-base font-mono font-bold text-emerald-400 tracking-wide block truncate" 
                          dir="ltr"
                        >
                          {selectedLine?.phoneNumber || '01012345678'}
                        </span>
                        {selectedLine?.status === 'active' && (
                          <span className={`w-1.5 h-1.5 rounded-full animate-pulse shrink-0 hidden sm:inline-block ${isReceiving ? 'bg-blue-400' : 'bg-emerald-400'}`} title="خط نشط" />
                        )}
                        {isReceiving && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold hidden sm:inline-block">
                            محفظة الاستقبال
                          </span>
                        )}
                        {selectedLine?.id === pinnedLineId && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold flex items-center gap-0.5" title="الخط الافتراضي المثبت">
                            <Pin className="w-2.5 h-2.5 fill-amber-300 text-amber-300" />
                            <span>افتراضي</span>
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 block truncate mt-0.5">
                        {isReceiving ? 'رقم محفظة الاستقبال المودع إليها' : 'رقم محفظة الخط'}
                        {selectedLine?.accountHolder ? ` · ${selectedLine.accountHolder}` : ''}
                      </span>
                    </div>
                  </div>

                  {/* Elegant Vertical Divider */}
                  <div className="h-8 w-px bg-slate-800 shrink-0" />

                  {/* Left Column: Current Balance + Balance Icon */}
                  <div className="flex items-center gap-2.5 text-left shrink-0">
                    <div>
                      <span className="text-sm sm:text-base font-mono font-bold text-white block">
                        {formatAmount(selectedLine?.balance || 0)} <span className="text-[10px] text-slate-400 font-sans font-normal">ج.م</span>
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {isReceiving ? 'الرصيد الحالي بالمحفظة' : 'الرصيد الحالي'}
                      </span>
                    </div>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs border ${
                      isReceiving 
                        ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' 
                        : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    }`}>
                      {isReceiving ? <ArrowDownLeft className="w-4 h-4" /> : <Coins className="w-4 h-4" />}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Unified Section: Merged in One Frame (Smartly Tailored for Receive vs Transfer) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg space-y-4">
              
              {/* Part A: Sender Details in Receive Mode OR Recipient Details in Transfer Mode */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
                    {isReceiving ? (
                      <>
                        <ArrowDownLeft className="w-3.5 h-3.5 text-blue-400" />
                        <span>بيانات الراسل / العميل المودع:</span>
                      </>
                    ) : (
                      <>
                        <Phone className="w-3.5 h-3.5 text-emerald-400" />
                        <span>بيانات المحفظة المستلمة:</span>
                      </>
                    )}
                  </span>
                  
                  {isReceiving ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold bg-blue-500/15 text-blue-300 border border-blue-400/30 shadow-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse shrink-0" />
                      <ArrowDownLeft className="w-3 h-3 text-blue-400 shrink-0" />
                      <span>وارد من عميل / محفظة خارجية</span>
                    </div>
                  ) : (
                    detectedNet && (
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold border shadow-xs transition ${detectedNet.color}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                        <span>الشبكة المكتشفة: {detectedNet.name}</span>
                      </div>
                    )
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Phone Number Input */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-semibold text-slate-300">
                        {isReceiving ? (
                          <span>
                            رقم هاتف الراسل <span className="text-rose-400 font-bold">(إجباري / 11 رقماً) *</span>
                          </span>
                        ) : (
                          <span>
                            رقم محفظة المستلم <span className="text-rose-400 font-bold">(إجباري / 11 رقماً) *</span>
                          </span>
                        )}
                      </label>
                      <span className="font-mono text-[9px] text-slate-400">
                        {recipientNumber.length}/11
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={recipientNumber}
                        onChange={(e) => handleRecipientNumberChange(e.target.value)}
                        maxLength={11}
                        inputMode="numeric"
                        placeholder={isReceiving ? "01xxxxxxxxx (إجباري)" : "01xxxxxxxxx (إجباري)"}
                        className="w-full py-2 pr-3 pl-8 bg-slate-950 border border-slate-700/80 rounded-xl text-xs sm:text-sm font-mono font-bold text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-inner tracking-wider"
                        dir="ltr"
                      />
                      <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-500">
                        <Phone className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[10px]">
                      <span className={recipientNumber.length === 11 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-medium'}>
                        {recipientNumber.length === 11 
                          ? '✓ الرقم مكتمل وصحيح (11 رقماً)' 
                          : 'يجب إدخال 11 رقماً يبدأ بـ 01 (إجباري)'}
                      </span>
                    </div>
                  </div>

                  {/* Name Input */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      {isReceiving ? 'اسم الراسل / العميل المودع (اختياري)' : 'اسم المستلم (اختياري)'}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={recipientName}
                        onChange={(e) => handleRecipientNameChange(e.target.value)}
                        placeholder={isReceiving ? "اسم صاحب المحفظة أو العميل..." : "اسم صاحب المحفظة المستلمة..."}
                        className="w-full py-2 pr-3 pl-8 bg-slate-950 border border-slate-700/80 rounded-xl text-xs sm:text-sm font-medium text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-inner"
                      />
                      <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-500">
                        <User className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Channel Selection Pills for Both Transfer & Receive Modes - Compact & Balanced */}
                <div className="pt-2 border-t border-slate-800/60">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] sm:text-[11px] text-slate-300 font-bold flex items-center gap-1.5">
                      <Wallet className="w-3 h-3 text-emerald-400" />
                      <span>
                        {isReceiving 
                          ? 'وسيلة أو شبكة الاستلام الواردة:' 
                          : 'وسيلة أو شبكة الاستلام الصادرة:'}
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center gap-1 sm:gap-1.5 flex-nowrap overflow-x-auto pb-0.5 scrollbar-none">
                    {WALLET_CHANNELS.map((channel) => {
                      const isSelected = destinationBankOrWallet === channel;
                      return (
                        <button
                          key={channel}
                          type="button"
                          onClick={() => {
                            setDestinationBankOrWallet(channel);
                            if (numAmount > 0 && operationMode === 'transfer') {
                              const autoComm = calculateProviderCommission(numAmount, selectedLine, channel, recipientNumber);
                              setCommission(toEnglishDigits(autoComm.toString()));
                            }
                          }}
                          className={`text-[9.5px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg font-bold transition cursor-pointer border flex items-center gap-1 shadow-xs whitespace-nowrap shrink-0 ${
                            isSelected
                              ? isReceiving
                                ? 'bg-blue-600 text-white border-blue-400 shadow-sm shadow-blue-600/30 ring-1 ring-blue-300/30'
                                : 'bg-emerald-600 text-white border-emerald-400 shadow-sm shadow-emerald-600/30 ring-1 ring-emerald-300/30'
                              : 'bg-slate-950/80 text-slate-300 hover:text-white border-slate-700/70 hover:bg-slate-800/80'
                          }`}
                          style={isSelected ? { color: '#ffffff' } : undefined}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-slate-500'}`} />
                          <span>{channel}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Seamless Divider between Sections inside the Single Frame */}
              <div className="border-t border-slate-800/80 pt-0.5" />

              {/* Part B: Financial Amounts, Commission & Fees (Order: Amount -> Commission -> Fee) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-emerald-400" />
                    <span>
                      {isReceiving ? 'المبلغ المالي المستلم وعمولة الخدمة:' : 'المبلغ المالي ورسوم التحويل:'}
                    </span>
                  </span>
                  {!isReceiving && (
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold border text-emerald-400 bg-emerald-500/10 border-emerald-500/30">
                      رسوم التحويل: من 0 ج.م
                    </span>
                  )}
                </div>

                {/* If isReceiving: ONLY 2 Columns (Right: Amount, Left: Fee/Commission).
                    If !isReceiving: 3 Columns (Right: Amount, Center: Commission, Left: Fee) */}
                {isReceiving ? (
                  /* 2 Columns Layout for Receive Mode: Exactly as specified by user */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {/* 1. Right Column: المبلغ المستلم المراد إيداعه (ج.م) * */}
                    <div>
                      <label className="block text-[11px] sm:text-xs font-bold text-slate-300 mb-1 leading-tight">
                        المبلغ المستلم المراد إيداعه (ج.م) *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          inputMode="numeric"
                          dir="ltr"
                          lang="en"
                          value={amount}
                          onChange={(e) => handleAmountChange(e.target.value)}
                          placeholder="0"
                          className="w-full py-2.5 sm:py-3 px-3.5 pl-9 bg-slate-950 border border-slate-700/80 rounded-xl text-lg sm:text-xl font-bold font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner text-right"
                        />
                        <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 font-sans font-bold text-[11px]">
                          ج.م
                        </div>
                      </div>
                    </div>

                    {/* 2. Left Column: عمولة الاستلام / الخدمة (ج.م) */}
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Coins className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <label className="text-[11px] sm:text-xs font-bold text-slate-300 leading-tight">
                          عمولة الاستلام / الخدمة (ج.م)
                        </label>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          inputMode="decimal"
                          dir="ltr"
                          lang="en"
                          value={fee}
                          onChange={(e) => {
                            const englishVal = toEnglishDigits(e.target.value).replace(/[^\d.]/g, '');
                            setFee(englishVal);
                          }}
                          onBlur={() => {
                            const num = Number(fee);
                            if (isNaN(num) || num < 0) {
                              setFee('0');
                            }
                          }}
                          placeholder="0"
                          className="w-full py-2.5 sm:py-3 px-3.5 pl-9 bg-emerald-500/10 border border-emerald-500/40 rounded-xl text-lg sm:text-xl font-bold font-mono text-emerald-400 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner text-right"
                        />
                        <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 font-sans font-bold text-[11px]">
                          ج.م
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* 3 Columns Layout matching user attachment:
                      In RTL: Right is Amount, Center is Commission, Left is Fee */
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-3">
                    
                    {/* 1. Right Column: Transfer Amount (مبلغ التحويل المراد إرساله) */}
                    <div>
                      <label className="block text-[11px] sm:text-xs font-bold text-slate-300 mb-1 leading-tight">
                        مبلغ التحويل المراد إرساله (ج.م) *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          inputMode="numeric"
                          dir="ltr"
                          lang="en"
                          value={amount}
                          onChange={(e) => handleAmountChange(e.target.value)}
                          placeholder="0"
                          className="w-full py-2.5 sm:py-3 px-3.5 pl-9 bg-slate-950 border border-slate-700/80 rounded-xl text-lg sm:text-xl font-bold font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner text-right"
                        />
                        <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 font-sans font-bold text-[11px]">
                          ج.م
                        </div>
                      </div>
                      {(selectedLine?.provider === 'vodafone' || selectedLine?.provider === 'vodafone_vip') && numAmount > 0 && numAmount < 5 && (
                        <span className="text-[9px] text-amber-400 block mt-1">
                          * الحد الأدنى لفودافون كاش: 5 ج.م
                        </span>
                      )}
                    </div>

                    {/* 2. Center Column: Transfer Commission (عمولة التحويل) with % Green Badge */}
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-black shrink-0 shadow-xs">
                          %
                        </span>
                        <label className="text-[11px] sm:text-xs font-bold text-slate-300 leading-tight">
                          عمولة التحويل (ج.م)
                        </label>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          inputMode="decimal"
                          dir="ltr"
                          lang="en"
                          value={commission}
                          onChange={(e) => {
                            const englishVal = toEnglishDigits(e.target.value).replace(/[^\d.]/g, '');
                            setCommission(englishVal);
                          }}
                          onBlur={() => {
                            const num = Number(commission);
                            if (isNaN(num) || num < 0) {
                              setCommission('0');
                            }
                          }}
                          placeholder="0"
                          className="w-full py-2.5 sm:py-3 px-3.5 pl-9 bg-emerald-500/10 border border-emerald-500/40 rounded-xl text-lg sm:text-xl font-bold font-mono text-emerald-400 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner text-right"
                        />
                        <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 font-sans font-bold text-[11px]">
                          ج.م
                        </div>
                      </div>
                    </div>

                    {/* 3. Left Column: Transfer Fee (رسوم التحويل) with Coins Icon */}
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Coins className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <label className="text-[11px] sm:text-xs font-bold text-slate-300 leading-tight">
                          رسوم التحويل (ج.م)
                        </label>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          inputMode="numeric"
                          dir="ltr"
                          lang="en"
                          value={fee}
                          onChange={(e) => {
                            const englishVal = toEnglishDigits(e.target.value).replace(/[^\d]/g, '');
                            setFee(englishVal);
                          }}
                          onBlur={() => {
                            const num = Number(fee);
                            if (isNaN(num) || num < 0) {
                              setFee('0');
                            }
                          }}
                          placeholder="0"
                          className="w-full py-2.5 sm:py-3 px-3.5 pl-9 bg-slate-950 border border-slate-700/80 rounded-xl text-lg sm:text-xl font-bold font-mono text-amber-400 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner text-right"
                        />
                        <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 font-sans font-bold text-[11px]">
                          ج.م
                        </div>
                      </div>
                    </div>

                  </div>
                )}
              </div>

            </div>

            {/* Warnings if limit or balance exceeded (Both Send and Receive) */}
            {(balanceWarning || limitWarning) && (
              <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-500/50 space-y-1.5 text-xs text-amber-200 shadow-md">
                <div className="flex items-center gap-1.5 font-bold text-amber-300">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>تنبيه الحدود المالية والسيولة:</span>
                </div>
                {balanceWarning && <p className="leading-relaxed text-[11px]">{balanceWarning}</p>}
                {limitWarning && <p className="leading-relaxed text-[11px]">{limitWarning}</p>}
              </div>
            )}

            {/* Real-time Inline Error Alert above Action Button */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-950/90 border border-rose-500/60 flex items-start gap-2.5 text-rose-200 text-xs shadow-lg animate-shake">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-bold text-rose-100 block mb-0.5 text-xs">
                    {isReceiving ? 'تنبيه أثناء عملية الاستلام:' : 'تنبيه أثناء التحويل:'}
                  </span>
                  <span className="leading-relaxed text-[11px]">{errorMessage}</span>
                </div>
              </div>
            )}

            {/* 4. Action Button: High-End Tailored Button for Receive vs Transfer */}
            <button
              type="submit"
              disabled={isSubmitting || (!isReceiving && (isZeroBalance || isInsufficientBalance || isDailyLimitExceeded || isMonthlyLimitExceeded))}
              className={`w-full py-2.5 sm:py-3 text-white font-bold rounded-xl text-sm shadow-lg flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed ${
                isReceiving
                  ? 'bg-gradient-to-r from-blue-600 via-teal-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 shadow-teal-600/25'
                  : isZeroBalance
                  ? 'bg-rose-900/60 border border-rose-500/50 text-rose-300'
                  : 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 shadow-emerald-600/25'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isReceiving ? 'جاري تأكيد وقيد الاستلام...' : 'جاري تنفيذ وتسجيل التحويل...'}</span>
                </>
              ) : isReceiving ? (
                <>
                  <ArrowDownLeft className="w-4 h-4" />
                  <span>تأكيد استلام وإيداع المبلغ في المحفظة</span>
                </>
              ) : isZeroBalance ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>الرصيد 0 ج.م - لا يمكن التحويل</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>تنفيذ التحويل</span>
                </>
              )}
            </button>

          </form>
        </div>

        {/* Live Calculation & Security Sidebar (col-4) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Selected Line Snapshot */}
          {selectedLine ? (
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3.5">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                <span className="text-[11px] font-bold text-slate-300">
                  {isReceiving ? 'بيانات محفظة الاستقبال (الوجهة)' : 'بيانات الخط المصدر'}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                  isReceiving 
                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' 
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                }`}>
                  {isReceiving ? 'جاهز للاستقبال' : 'نشط ومعتمد'}
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0 bg-slate-950 border border-slate-800 flex items-center justify-center p-0.5">
                  <ProviderBadge provider={selectedLine.provider} size="sm" showLabel={false} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-white text-xs truncate">{selectedLine.name}</h4>
                  <p className="text-[11px] font-mono font-bold text-emerald-400 mt-0.5" dir="ltr">{selectedLine.phoneNumber}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 truncate">{selectedLine.accountHolder}</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400">الرصيد الحالي بالمحفظة:</span>
                  <span className="font-bold font-mono text-white">{formatAmount(selectedLine.balance)} ج.م</span>
                </div>
                {isReceiving ? (
                  <>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-emerald-400 font-medium">المبلغ المستلم المضاف (+):</span>
                      <span className="font-mono text-emerald-400 font-bold">
                        +{formatAmount(numAmount)} ج.م
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">الحد المتبقي للاستقبال اليوم:</span>
                      <span className="font-mono text-blue-400 font-bold">
                        {formatAmount(remainingDaily)} ج.م
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-xs">
                      <span className="text-white font-bold">الرصيد المتوقع بعد الإيداع:</span>
                      <span className="font-black font-mono text-white text-sm">
                        {formatAmount(selectedLine.balance + numAmount)} ج.م
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">الحد المتبقي للإرسال اليوم:</span>
                      <span className="font-mono text-emerald-400 font-bold">
                        {formatAmount(remainingDaily)} ج.م
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-xs">
                      <span className="text-slate-300 font-bold">الرصيد بعد الخصم:</span>
                      <span className="font-black font-mono text-white text-sm">
                        {formatAmount(Math.max(0, selectedLine.balance - totalAmount))} ج.م
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : null}

          {/* Operation Summary Breakdown */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3.5">
            <h4 className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isReceiving ? 'ملخص حركة الاستلام المالي' : 'ملخص الحساب المالي'}</span>
            </h4>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-400">{isReceiving ? 'المبلغ المودع بالمحفظة:' : 'مبلغ التحويل:'}</span>
                <span className="font-mono font-bold text-white">{formatAmount(numAmount)} ج.م</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-400">{isReceiving ? 'عمولة الخدمة المكتسبة:' : 'عمولة التحويل:'}</span>
                <span className="font-mono font-bold text-amber-400">{formatAmount(isReceiving ? numFee : numCommission)} ج.م</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-800 font-bold text-xs">
                <span className="text-white">{isReceiving ? 'الإجمالي المحصل من العميل:' : 'إجمالي الخصم من المصدر:'}</span>
                <span className="font-mono font-black text-emerald-400 text-sm">
                  {formatAmount(isReceiving ? numAmount + numFee : totalAmount)} ج.م
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[10px] text-slate-400 flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>
                {isReceiving 
                  ? 'يتم قيد الرصيد فوراً في المحفظة وإصدار إيصال استلام رسمي معتمد' 
                  : 'يتم إصدار إيصال تحويل رسمي معتمد فور اكتمال المعاملة'}
              </span>
            </div>
          </div>

        </div>

      </div>

      {/* Sleek Line Switcher Modal (Opens only when user clicks to change line) */}
      {isLineSwitcherOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" dir="rtl">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 space-y-3.5">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-white text-sm">
                  {isReceiving ? 'اختيار محفظة الاستقبال المودع إليها' : 'اختيار الخط أو المحفظة المصدر'}
                </h3>
              </div>
              <button 
                onClick={() => setIsLineSwitcherOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Long-press instruction hint banner */}
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-[11px] text-amber-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-bold">
                <Pin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>اضغط مطولاً على أي خط لتثبيته كافتراضي دائماً عند التحويل أو الاستلام 📌</span>
              </span>
            </div>

            {/* Pin Confirmation Toast Banner */}
            {pinToastMsg && (
              <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-xs font-bold text-emerald-300 text-center animate-fade-in flex items-center justify-center gap-1.5 shadow-md">
                <Pin className="w-3.5 h-3.5 text-emerald-400" />
                <span>{pinToastMsg}</span>
              </div>
            )}

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {lines.map((l) => {
                const isSelected = l.id === sourceLineId;
                const isPinned = l.id === pinnedLineId;
                return (
                  <div
                    key={l.id}
                    onClick={() => {
                      if (isLongPressTriggeredRef.current) return;
                      handleSourceLineChange(l.id);
                    }}
                    onPointerDown={() => handleLinePointerDown(l)}
                    onPointerUp={handleLinePointerUpOrLeave}
                    onPointerLeave={handleLinePointerUpOrLeave}
                    onTouchStart={() => handleLinePointerDown(l)}
                    onTouchEnd={handleLinePointerUpOrLeave}
                    onTouchMove={handleLinePointerUpOrLeave}
                    className={`p-3 rounded-xl border transition flex items-center justify-between gap-2.5 cursor-pointer select-none relative group ${
                      isSelected
                        ? isReceiving
                          ? 'bg-slate-800/90 border-blue-500 shadow-md ring-1 ring-blue-500/30'
                          : 'bg-slate-800/90 border-emerald-500 shadow-md ring-1 ring-emerald-500/30'
                        : isPinned
                        ? 'bg-amber-950/20 border-amber-500/50 hover:bg-slate-800/50'
                        : 'bg-slate-950/70 border-slate-800 hover:bg-slate-800/50 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 p-0.5">
                        <ProviderBadge provider={l.provider} size="sm" showLabel={false} />
                      </div>
                      <div>
                        <div className="font-bold text-white text-xs flex items-center gap-1.5">
                          <span>{l.name}</span>
                          {isPinned && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-bold flex items-center gap-0.5">
                              <Pin className="w-2.5 h-2.5 fill-amber-300 text-amber-300" />
                              <span>مثبت كافتراضي</span>
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-[10px] text-emerald-400" dir="ltr">{l.phoneNumber}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="text-left">
                        <div className="font-mono font-bold text-white text-xs">{formatAmount(l.balance)} ج.م</div>
                        <div className="text-[9px] text-slate-400">رصيد متاح</div>
                      </div>

                      {/* Direct Pin Button (allows quick click or long press) */}
                      <button
                        type="button"
                        onClick={(e) => handleTogglePinLine(l, e)}
                        title={isPinned ? 'إلغاء التثبيت الافتراضي' : 'تثبيت كخط افتراضي (أو اضغط مطولاً)'}
                        className={`p-1.5 rounded-lg border transition cursor-pointer ${
                          isPinned
                            ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                            : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-amber-300 hover:border-amber-500/40 opacity-70 group-hover:opacity-100'
                        }`}
                      >
                        <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-amber-300' : ''}`} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal - Operation is ONLY saved when clicking "إتمام العملية" */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        transfer={pendingPreviewTransfer}
        isPending={true}
        onClose={handleCloseReceiptModal}
        onConfirmComplete={handleConfirmAndSaveOperation}
        onShowSuccess={onShowSuccess}
      />

    </div>
  );
};
