import React, { useState, useEffect } from 'react';
import { SystemSettings, TelecomRulesSettings, ReceiptBrandingSettings, User } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatAmount, toEnglishDigits } from '../utils/formatters';
import { 
  SlidersHorizontal,
  ShieldCheck, 
  Coins, 
  Building2, 
  Gauge, 
  Receipt, 
  UserCheck, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  Percent, 
  Wallet, 
  Phone, 
  Lock, 
  Download, 
  UploadCloud, 
  Check, 
  Calculator, 
  Sparkles,
  ArrowRightLeft,
  Info,
  Clock,
  Printer
} from 'lucide-react';

export const DEFAULT_TELECOM_RULES: TelecomRulesSettings = {
  vodafone: {
    sameNetworkFee: 1,
    crossNetworkPercent: 0.5,
    crossNetworkMinFee: 1,
    crossNetworkMaxFee: 15,
    freeFirstTransferLimit: 2000,
    enableFreeFirstTransfer: true,
    minTransferAmount: 5,
    maxTransferAmount: 60000,
  },
  etisalat: {
    sameNetworkFee: 1,
    crossNetworkPercent: 0.5,
    crossNetworkMinFee: 1,
    crossNetworkMaxFee: 15,
    freeFirstTransferLimit: 2000,
    enableFreeFirstTransfer: true,
    minTransferAmount: 5,
    maxTransferAmount: 60000,
  },
  orange: {
    sameNetworkFee: 1,
    crossNetworkPercent: 0.5,
    crossNetworkMinFee: 1,
    crossNetworkMaxFee: 15,
    freeFirstTransferLimit: 2000,
    enableFreeFirstTransfer: true,
    minTransferAmount: 5,
    maxTransferAmount: 60000,
  },
  we: {
    sameNetworkFee: 1,
    crossNetworkPercent: 0.5,
    crossNetworkMinFee: 1,
    crossNetworkMaxFee: 15,
    freeFirstTransferLimit: 2000,
    enableFreeFirstTransfer: true,
    minTransferAmount: 5,
    maxTransferAmount: 60000,
  },
  instapayFee: 0,
  defaultReceiveFee: 5,
  defaultTransferFee: 0,
  autoCalculateCommission: true,
  receiveCommissionType: 'percentage',
  receiveCommissionRate: 1,
};

export const DEFAULT_RECEIPT_SETTINGS: ReceiptBrandingSettings = {
  headerTitle: 'منظومة إدارة الكاش والتحويلات المالية',
  subTitle: 'إشعار تسجيل وقيد مالي إلكتروني رسمي معتمد',
  receiptNotice: 'شامل كافة الرسوم والضرائب المعتمدة',
  phoneContact: '01000000000',
  popupDurationSeconds: 5,
  defaultReceiptFormat: 'thermal',
  showQrCode: true,
  showOperatorName: true,
};

export const AdminControlPanelView: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'commissions' | 'vaults' | 'limits' | 'receipts' | 'admin_account'>('commissions');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Telecom Rules State
  const [telecomRules, setTelecomRules] = useState<TelecomRulesSettings>(DEFAULT_TELECOM_RULES);

  // Receipt Settings State
  const [receiptSettings, setReceiptSettings] = useState<ReceiptBrandingSettings>(DEFAULT_RECEIPT_SETTINGS);

  // General & Financial Settings State
  const [companyName, setCompanyName] = useState('إدارة التحويلات المالية الذكية');
  const [currency, setCurrency] = useState('ج.م');
  const [warningThresholdPercent, setWarningThresholdPercent] = useState('80');
  const [defaultDailyLimit, setDefaultDailyLimit] = useState('60000');
  const [defaultMonthlyLimit, setDefaultMonthlyLimit] = useState('200000');
  const [allowOverdraft, setAllowOverdraft] = useState(false);
  const [requireAdminPinForOverride, setRequireAdminPinForOverride] = useState(true);
  const [enforceLineInventoryOnHandover, setEnforceLineInventoryOnHandover] = useState(true);
  const [minVaultLiquidityAlertPercent, setMinVaultLiquidityAlertPercent] = useState('15');

  // Admin Account Settings State
  const [adminFullName, setAdminFullName] = useState(user?.fullName || 'عادل فتحي');
  const [adminUsername, setAdminUsername] = useState(user?.username || 'Adel');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [confirmAdminPassword, setConfirmAdminPassword] = useState('');

  // Interactive Live Calculator
  const [calcAmount, setCalcAmount] = useState('1000');
  const [calcSource, setCalcSource] = useState<'vodafone' | 'etisalat' | 'orange' | 'we'>('vodafone');
  const [calcTarget, setCalcTarget] = useState<'same' | 'other'>('same');
  const [calcIsFirstMonth, setCalcIsFirstMonth] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const data = await api.getSettings();
      if (data) {
        if (data.companyName) setCompanyName(data.companyName);
        if (data.currency) setCurrency(data.currency);
        if (data.warningThresholdPercent !== undefined) setWarningThresholdPercent(String(data.warningThresholdPercent));
        if (data.defaultDailyLimit !== undefined) setDefaultDailyLimit(String(data.defaultDailyLimit));
        if (data.defaultMonthlyLimit !== undefined) setDefaultMonthlyLimit(String(data.defaultMonthlyLimit));
        if (data.allowOverdraft !== undefined) setAllowOverdraft(Boolean(data.allowOverdraft));
        if (data.requireAdminPinForOverride !== undefined) setRequireAdminPinForOverride(Boolean(data.requireAdminPinForOverride));
        if (data.enforceLineInventoryOnHandover !== undefined) setEnforceLineInventoryOnHandover(Boolean(data.enforceLineInventoryOnHandover));
        if (data.minVaultLiquidityAlertPercent !== undefined) setMinVaultLiquidityAlertPercent(String(data.minVaultLiquidityAlertPercent));

        if (data.telecomRules) {
          setTelecomRules({
            ...DEFAULT_TELECOM_RULES,
            ...data.telecomRules,
            vodafone: { ...DEFAULT_TELECOM_RULES.vodafone, ...data.telecomRules.vodafone },
            etisalat: { ...DEFAULT_TELECOM_RULES.etisalat, ...data.telecomRules.etisalat },
            orange: { ...DEFAULT_TELECOM_RULES.orange, ...data.telecomRules.orange },
            we: { ...DEFAULT_TELECOM_RULES.we, ...data.telecomRules.we },
          });
        }

        if (data.receiptSettings) {
          setReceiptSettings({
            ...DEFAULT_RECEIPT_SETTINGS,
            ...data.receiptSettings,
          });
        }
      }
    } catch (err) {
      console.error('Failed to load settings in Admin Control Panel:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    setSaveSuccess(false);

    try {
      // Validate password if provided
      if (newAdminPassword) {
        if (newAdminPassword !== confirmAdminPassword) {
          throw new Error('كلمتا المرور غير متطابقتين، يرجى التأكد وإعادة المحاولة');
        }
        if (newAdminPassword.length < 6) {
          throw new Error('كلمة المرور يجب أن تكون 6 أحرف أو أرقام على الأقل');
        }
        if (user?.id) {
          await api.resetUserPassword(user.id, newAdminPassword);
        }
      }

      const payload: Partial<SystemSettings> = {
        companyName,
        currency,
        warningThresholdPercent: Number(toEnglishDigits(warningThresholdPercent)) || 80,
        defaultDailyLimit: Number(toEnglishDigits(defaultDailyLimit)) || 60000,
        defaultMonthlyLimit: Number(toEnglishDigits(defaultMonthlyLimit)) || 200000,
        allowOverdraft,
        requireAdminPinForOverride,
        enforceLineInventoryOnHandover,
        minVaultLiquidityAlertPercent: Number(toEnglishDigits(minVaultLiquidityAlertPercent)) || 15,
        telecomRules,
        receiptSettings,
      };

      await api.updateSettings(payload);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
      setNewAdminPassword('');
      setConfirmAdminPassword('');
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ أثناء حفظ الإعدادات');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefaults = () => {
    if (window.confirm('هل أنت متأكد من استعادة القيم الافتراضية للعمولات والرسوم؟')) {
      setTelecomRules(DEFAULT_TELECOM_RULES);
      setReceiptSettings(DEFAULT_RECEIPT_SETTINGS);
      setDefaultDailyLimit('60000');
      setDefaultMonthlyLimit('200000');
      setWarningThresholdPercent('80');
      setAllowOverdraft(false);
    }
  };

  // Live Commission Calculator Logic based on current form inputs
  const calculateTestCommission = () => {
    const amt = Number(toEnglishDigits(calcAmount)) || 0;
    if (amt <= 0) return 0;

    const rule = telecomRules[calcSource];
    if (!rule) return 0;

    if (calcIsFirstMonth && rule.enableFreeFirstTransfer && amt <= rule.freeFirstTransferLimit) {
      return 0;
    }

    if (calcTarget === 'same') {
      return rule.sameNetworkFee;
    } else {
      const raw = amt * (rule.crossNetworkPercent / 100);
      const fee = Math.min(rule.crossNetworkMaxFee, Math.max(rule.crossNetworkMinFee, raw));
      return Number(fee.toFixed(2));
    }
  };

  return (
    <div className="space-y-6 pb-16 font-sans text-slate-100 selection:bg-emerald-500 selection:text-white" dir="rtl">
      
      {/* 1. Executive Top Header */}
      <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-emerald-600/25 shrink-0 border border-emerald-400/30">
            <SlidersHorizontal className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
                لوحة التحكم الإدارية الشاملة
              </h1>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                صلاحية المالك فقط (Admin)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              التحكم الكامل في كافة قواعد النظام، العمولات والرسوم، حماية الخزن، والسياسات المالية
            </p>
          </div>
        </div>

        {/* Global Save Button & Quick Reset */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <button
            type="button"
            onClick={handleResetToDefaults}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 cursor-pointer"
            title="استعادة القيم الافتراضية"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>القيم الافتراضية</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving}
            className="flex-1 md:flex-none px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <RotateCcw className="w-4 h-4 animate-spin" />
                <span>جاري الحفظ...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>حفظ جميع التغييرات</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notifications: Success / Error Alert */}
      {saveSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs font-bold flex items-center gap-2.5 shadow-lg animate-scale-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>تم حفظ وتطبيق كافة إعدادات لوحة التحكم بنجاح، ويسري تطبيقها فوراً على جميع العمليات والإيصالات.</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs font-bold flex items-center gap-2.5 shadow-lg animate-scale-in">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 2. Navigation Tabs (Clean Pill Segmented Bar) */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('commissions')}
          className={`flex-1 min-w-[140px] py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'commissions'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Percent className="w-3.5 h-3.5" />
          <span>العمولات والرسوم</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('vaults')}
          className={`flex-1 min-w-[140px] py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'vaults'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>سياسات الخزن والسيولة</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('limits')}
          className={`flex-1 min-w-[140px] py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'limits'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Gauge className="w-3.5 h-3.5" />
          <span>الحدود والضوابط</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('receipts')}
          className={`flex-1 min-w-[140px] py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'receipts'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>الإيصالات والطباعة</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('admin_account')}
          className={`flex-1 min-w-[140px] py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'admin_account'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>حساب المالك والأمان</span>
        </button>
      </div>

      {/* 3. Tab Contents */}

      {/* TAB 1: COMMISSIONS & FEES */}
      {activeTab === 'commissions' && (
        <div className="space-y-6">
          
          {/* Top General Rules & Office Default Fees */}
          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-black text-white">الرسوم والعمولات الافتراضية للمكتب</h2>
              </div>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                ✓ تُحتسب وتُدرج تلقائياً في شاشات العمليات فور كتابة المبلغ
              </span>
            </div>

            {/* Dedicated Box: Receive Commission Settings (خاصة بعمولة الاستلام / الخدمة) */}
            <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-500/30 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-black text-blue-200">إعدادات عمولة الاستلام / الخدمة (الوارد)</span>
                </div>
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setTelecomRules(prev => ({ ...prev, receiveCommissionType: 'percentage' }))}
                    className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                      (telecomRules.receiveCommissionType ?? 'percentage') === 'percentage'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>نسبة مئوية (%)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTelecomRules(prev => ({ ...prev, receiveCommissionType: 'fixed' }))}
                    className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                      telecomRules.receiveCommissionType === 'fixed'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>مبلغ ثابت (ج.م)</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    {(telecomRules.receiveCommissionType ?? 'percentage') === 'percentage'
                      ? 'نسبة عمولة الاستلام (% من المبلغ المودع)'
                      : 'قيمة عمولة الاستلام الثابتة (ج.م لكل عملية)'}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="decimal"
                      dir="ltr"
                      value={(telecomRules.receiveCommissionType ?? 'percentage') === 'percentage'
                        ? (telecomRules.receiveCommissionRate ?? 1)
                        : (telecomRules.defaultReceiveFee ?? 5)}
                      onChange={(e) => {
                        const val = Number(toEnglishDigits(e.target.value).replace(/[^\d.]/g, '')) || 0;
                        if ((telecomRules.receiveCommissionType ?? 'percentage') === 'percentage') {
                          setTelecomRules(prev => ({ ...prev, receiveCommissionRate: val }));
                        } else {
                          setTelecomRules(prev => ({ ...prev, defaultReceiveFee: val }));
                        }
                      }}
                      className="w-full py-2 px-3 pl-8 bg-slate-950 border border-blue-500/50 rounded-xl text-sm font-mono font-bold text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-right shadow-inner"
                    />
                    <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-[11px] text-blue-400 font-bold font-mono">
                      {(telecomRules.receiveCommissionType ?? 'percentage') === 'percentage' ? '%' : 'ج.م'}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 leading-relaxed">
                  <span className="text-blue-400 font-bold block mb-1">ملاحظة تشغيلية:</span>
                  بمجرد أن يكتب الموظف المبلغ في خانة <strong className="text-white font-mono">"المبلغ المستلم المراد إيداعه"</strong>، ستُكتب العمولة تلقائياً في خانة <strong className="text-white font-mono">"عمولة الاستلام / الخدمة"</strong> وتكون قابلة للتعديل يدوياً مع إخفاء خانة عمولة الشبكة نهائياً.
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  رسوم التحويل الصادر الافتراضية للمكتب (ج.م)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    dir="ltr"
                    value={telecomRules.defaultTransferFee}
                    onChange={(e) => {
                      const val = Number(toEnglishDigits(e.target.value).replace(/[^\d.]/g, '')) || 0;
                      setTelecomRules(prev => ({ ...prev, defaultTransferFee: val }));
                    }}
                    className="w-full py-2 px-3 pl-8 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono font-bold text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 text-right"
                  />
                  <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-[11px] text-slate-500 font-bold">ج.م</span>
                </div>
                <span className="text-[10px] text-slate-500 block mt-1">تُعرض في خانة رسوم التحويل الصادر (أتعاب المكتب)</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  عمولة شبكة إنستاباي IPN (ج.م)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    dir="ltr"
                    value={telecomRules.instapayFee}
                    onChange={(e) => {
                      const val = Number(toEnglishDigits(e.target.value).replace(/[^\d.]/g, '')) || 0;
                      setTelecomRules(prev => ({ ...prev, instapayFee: val }));
                    }}
                    className="w-full py-2 px-3 pl-8 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono font-bold text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                  />
                  <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-[11px] text-slate-500 font-bold">ج.م</span>
                </div>
                <span className="text-[10px] text-slate-500 block mt-1">رسم تحويلات الحسابات البنكية وإنستاباي</span>
              </div>
            </div>
          </div>

          {/* 4 Telecom Providers Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            
            {/* 1. Vodafone Cash */}
            <div className="p-5 rounded-3xl bg-slate-900/90 border border-rose-500/30 shadow-xl space-y-4 relative overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center font-bold text-xs">
                    VF
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">ڤودافون كاش (Vodafone Cash)</h3>
                    <span className="text-[10px] text-slate-400">كود المشغل: 010</span>
                  </div>
                </div>
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
                  <input
                    type="checkbox"
                    checked={telecomRules.vodafone.enableFreeFirstTransfer}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setTelecomRules(prev => ({
                        ...prev,
                        vodafone: { ...prev.vodafone, enableFreeFirstTransfer: checked }
                      }));
                    }}
                    className="rounded text-emerald-600 focus:ring-0 cursor-pointer"
                  />
                  <span>أول معاملة بالشهر مجاناً</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    رسم التحويل لمحفظة ڤودافون (ج.م)
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={telecomRules.vodafone.sameNetworkFee}
                    onChange={(e) => {
                      const val = Number(toEnglishDigits(e.target.value).replace(/[^\d.]/g, '')) || 0;
                      setTelecomRules(prev => ({ ...prev, vodafone: { ...prev.vodafone, sameNetworkFee: val } }));
                    }}
                    className="w-full py-1.5 px-2.5 bg-slate-950 border border-slate-700 rounded-xl font-mono text-emerald-400 text-right font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    نسبة التحويل لمحافظ أخرى (%)
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={telecomRules.vodafone.crossNetworkPercent}
                    onChange={(e) => {
                      const val = Number(toEnglishDigits(e.target.value).replace(/[^\d.]/g, '')) || 0;
                      setTelecomRules(prev => ({ ...prev, vodafone: { ...prev.vodafone, crossNetworkPercent: val } }));
                    }}
                    className="w-full py-1.5 px-2.5 bg-slate-950 border border-slate-700 rounded-xl font-mono text-emerald-400 text-right font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    الحد الأدنى للعمولة (ج.م)
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={telecomRules.vodafone.crossNetworkMinFee}
                    onChange={(e) => {
                      const val = Number(toEnglishDigits(e.target.value).replace(/[^\d.]/g, '')) || 0;
                      setTelecomRules(prev => ({ ...prev, vodafone: { ...prev.vodafone, crossNetworkMinFee: val } }));
                    }}
                    className="w-full py-1.5 px-2.5 bg-slate-950 border border-slate-700 rounded-xl font-mono text-slate-200 text-right font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    الحد الأقصى للعمولة (ج.م)
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={telecomRules.vodafone.crossNetworkMaxFee}
                    onChange={(e) => {
                      const val = Number(toEnglishDigits(e.target.value).replace(/[^\d.]/g, '')) || 0;
                      setTelecomRules(prev => ({ ...prev, vodafone: { ...prev.vodafone, crossNetworkMaxFee: val } }));
                    }}
                    className="w-full py-1.5 px-2.5 bg-slate-950 border border-slate-700 rounded-xl font-mono text-slate-200 text-right font-bold"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    سقف أول معاملة مجانية شهرياً (ج.م)
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={telecomRules.vodafone.freeFirstTransferLimit}
                    onChange={(e) => {
                      const val = Number(toEnglishDigits(e.target.value).replace(/[^\d.]/g, '')) || 0;
                      setTelecomRules(prev => ({ ...prev, vodafone: { ...prev.vodafone, freeFirstTransferLimit: val } }));
                    }}
                    className="w-full py-1.5 px-2.5 bg-slate-950 border border-slate-700 rounded-xl font-mono text-blue-400 text-right font-bold"
                  />
                </div>
              </div>
            </div>

            {/* 2. Etisalat Cash */}
            <div className="p-5 rounded-3xl bg-slate-900/90 border border-lime-500/30 shadow-xl space-y-4 relative overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-lime-500/15 border border-lime-500/30 text-lime-400 flex items-center justify-center font-bold text-xs">
                    ET
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">اتصالات كاش (Etisalat Cash)</h3>
                    <span className="text-[10px] text-slate-400">كود المشغل: 011</span>
                  </div>
                </div>
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
                  <input
                    type="checkbox"
                    checked={telecomRules.etisalat.enableFreeFirstTransfer}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setTelecomRules(prev => ({
                        ...prev,
                        etisalat: { ...prev.etisalat, enableFreeFirstTransfer: checked }
                      }));
                    }}
                    className="rounded text-emerald-600 focus:ring-0 cursor-pointer"
                  />
                  <span>أول معاملة بالشهر مجاناً</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    رسم التحويل لمحفظة اتصالات (ج.م)
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={telecomRules.etisalat.sameNetworkFee}
                    onChange={(e) => {
                      const val = Number(toEnglishDigits(e.target.value).replace(/[^\d.]/g, '')) || 0;
                      setTelecomRules(prev => ({ ...prev, etisalat: { ...prev.etisalat, sameNetworkFee: val } }));
                    }}
                    className="w-full py-1.5 px-2.5 bg-slate-950 border border-slate-700 rounded-xl font-mono text-emerald-400 text-right font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    نسبة التحويل لمحافظ أخرى (%)
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={telecomRules.etisalat.crossNetworkPercent}
                    onChange={(e) => {
                      const val = Number(toEnglishDigits(e.target.value).replace(/[^\d.]/g, '')) || 0;
                      setTelecomRules(prev => ({ ...prev, etisalat: { ...prev.etisalat, crossNetworkPercent: val } }));
                    }}
                    className="w-full py-1.5 px-2.5 bg-slate-950 border border-slate-700 rounded-xl font-mono text-emerald-400 text-right font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    الحد الأدنى للعمولة (ج.م)
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={telecomRules.etisalat.crossNetworkMinFee}
                    onChange={(e) => {
                      const val = Number(toEnglishDigits(e.target.value).replace(/[^\d.]/g, '')) || 0;
                      setTelecomRules(prev => ({ ...prev, etisalat: { ...prev.etisalat, crossNetworkMinFee: val } }));
                    }}
                    className="w-full py-1.5 px-2.5 bg-slate-950 border border-slate-700 rounded-xl font-mono text-slate-200 text-right font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    الحد الأقصى للعمولة (ج.م)
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={telecomRules.etisalat.crossNetworkMaxFee}
                    onChange={(e) => {
                      const val = Number(toEnglishDigits(e.target.value).replace(/[^\d.]/g, '')) || 0;
                      setTelecomRules(prev => ({ ...prev, etisalat: { ...prev.etisalat, crossNetworkMaxFee: val } }));
                    }}
                    className="w-full py-1.5 px-2.5 bg-slate-950 border border-slate-700 rounded-xl font-mono text-slate-200 text-right font-bold"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    سقف أول معاملة مجانية شهرياً (ج.م)
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={telecomRules.etisalat.freeFirstTransferLimit}
                    onChange={(e) => {
                      const val = Number(toEnglishDigits(e.target.value).replace(/[^\d.]/g, '')) || 0;
                      setTelecomRules(prev => ({ ...prev, etisalat: { ...prev.etisalat, freeFirstTransferLimit: val } }));
                    }}
                    className="w-full py-1.5 px-2.5 bg-slate-950 border border-slate-700 rounded-xl font-mono text-blue-400 text-right font-bold"
                  />
                </div>
              </div>
            </div>

            {/* 3. Orange Cash */}
            <div className="p-5 rounded-3xl bg-slate-900/90 border border-orange-500/30 shadow-xl space-y-4 relative overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400 flex items-center justify-center font-bold text-xs">
                    OG
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">أورنج كاش (Orange Cash)</h3>
                    <span className="text-[10px] text-slate-400">كود المشغل: 012</span>
                  </div>
                </div>
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
                  <input
                    type="checkbox"
                    checked={telecomRules.orange.enableFreeFirstTransfer}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setTelecomRules(prev => ({
                        ...prev,
                        orange: { ...prev.orange, enableFreeFirstTransfer: checked }
                      }));
                    }}
                    className="rounded text-emerald-600 focus:ring-0 cursor-pointer"
                  />
                  <span>أول معاملة بالشهر مجاناً</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    رسم التحويل لمحفظة أورنج (ج.م)
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={telecomRules.orange.sameNetworkFee}
                    onChange={(e) => {
                      const val = Number(toEnglishDigits(e.target.value).replace(/[^\d.]/g, '')) || 0;
                      setTelecomRules(prev => ({ ...prev, orange: { ...prev.orange, sameNetworkFee: val } }));
                    }}
                    className="w-full py-1.5 px-2.5 bg-slate-950 border border-slate-700 rounded-xl font-mono text-emerald-400 text-right font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    نسبة التحويل لمحافظ أخرى (%)
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={telecomRules.orange.crossNetworkPercent}
                    onChange={(e) => {
                      const val = Number(toEnglishDigits(e.target.value).replace(/[^\d.]/g, '')) || 0;
                      setTelecomRules(prev => ({ ...prev, orange: { ...prev.orange, crossNetworkPercent: val } }));
                    }}
                    className="w-full py-1.5 px-2.5 bg-slate-950 border border-slate-700 rounded-xl font-mono text-emerald-400 text-right font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    الحد الأدنى للعمولة (ج.م)
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={telecomRules.orange.crossNetworkMinFee}
                    onChange={(e) => {
                      const val = Number(toEnglishDigits(e.target.value).replace(/[^\d.]/g, '')) || 0;
                      setTelecomRules(prev => ({ ...prev, orange: { ...prev.orange, crossNetworkMinFee: val } }));
                    }}
                    className="w-full py-1.5 px-2.5 bg-slate-950 border border-slate-700 rounded-xl font-mono text-slate-200 text-right font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    الحد الأقصى للعمولة (ج.م)
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={telecomRules.orange.crossNetworkMaxFee}
                    onChange={(e) => {
                      const val = Number(toEnglishDigits(e.target.value).replace(/[^\d.]/g, '')) || 0;
                      setTelecomRules(prev => ({ ...prev, orange: { ...prev.orange, crossNetworkMaxFee: val } }));
                    }}
                    className="w-full py-1.5 px-2.5 bg-slate-950 border border-slate-700 rounded-xl font-mono text-slate-200 text-right font-bold"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    سقف أول معاملة مجانية شهرياً (ج.م)
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={telecomRules.orange.freeFirstTransferLimit}
                    onChange={(e) => {
                      const val = Number(toEnglishDigits(e.target.value).replace(/[^\d.]/g, '')) || 0;
                      setTelecomRules(prev => ({ ...prev, orange: { ...prev.orange, freeFirstTransferLimit: val } }));
                    }}
                    className="w-full py-1.5 px-2.5 bg-slate-950 border border-slate-700 rounded-xl font-mono text-blue-400 text-right font-bold"
                  />
                </div>
              </div>
            </div>

            {/* 4. WE Pay */}
            <div className="p-5 rounded-3xl bg-slate-900/90 border border-purple-500/30 shadow-xl space-y-4 relative overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center font-bold text-xs">
                    WE
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">وي باي (WE Pay)</h3>
                    <span className="text-[10px] text-slate-400">كود المشغل: 015</span>
                  </div>
                </div>
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
                  <input
                    type="checkbox"
                    checked={telecomRules.we.enableFreeFirstTransfer}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setTelecomRules(prev => ({
                        ...prev,
                        we: { ...prev.we, enableFreeFirstTransfer: checked }
                      }));
                    }}
                    className="rounded text-emerald-600 focus:ring-0 cursor-pointer"
                  />
                  <span>أول معاملة بالشهر مجاناً</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    رسم التحويل لمحفظة وي باي (ج.م)
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={telecomRules.we.sameNetworkFee}
                    onChange={(e) => {
                      const val = Number(toEnglishDigits(e.target.value).replace(/[^\d.]/g, '')) || 0;
                      setTelecomRules(prev => ({ ...prev, we: { ...prev.we, sameNetworkFee: val } }));
                    }}
                    className="w-full py-1.5 px-2.5 bg-slate-950 border border-slate-700 rounded-xl font-mono text-emerald-400 text-right font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    نسبة التحويل لمحافظ أخرى (%)
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={telecomRules.we.crossNetworkPercent}
                    onChange={(e) => {
                      const val = Number(toEnglishDigits(e.target.value).replace(/[^\d.]/g, '')) || 0;
                      setTelecomRules(prev => ({ ...prev, we: { ...prev.we, crossNetworkPercent: val } }));
                    }}
                    className="w-full py-1.5 px-2.5 bg-slate-950 border border-slate-700 rounded-xl font-mono text-emerald-400 text-right font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    الحد الأدنى للعمولة (ج.م)
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={telecomRules.we.crossNetworkMinFee}
                    onChange={(e) => {
                      const val = Number(toEnglishDigits(e.target.value).replace(/[^\d.]/g, '')) || 0;
                      setTelecomRules(prev => ({ ...prev, we: { ...prev.we, crossNetworkMinFee: val } }));
                    }}
                    className="w-full py-1.5 px-2.5 bg-slate-950 border border-slate-700 rounded-xl font-mono text-slate-200 text-right font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    الحد الأقصى للعمولة (ج.م)
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={telecomRules.we.crossNetworkMaxFee}
                    onChange={(e) => {
                      const val = Number(toEnglishDigits(e.target.value).replace(/[^\d.]/g, '')) || 0;
                      setTelecomRules(prev => ({ ...prev, we: { ...prev.we, crossNetworkMaxFee: val } }));
                    }}
                    className="w-full py-1.5 px-2.5 bg-slate-950 border border-slate-700 rounded-xl font-mono text-slate-200 text-right font-bold"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    سقف أول معاملة مجانية شهرياً (ج.م)
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={telecomRules.we.freeFirstTransferLimit}
                    onChange={(e) => {
                      const val = Number(toEnglishDigits(e.target.value).replace(/[^\d.]/g, '')) || 0;
                      setTelecomRules(prev => ({ ...prev, we: { ...prev.we, freeFirstTransferLimit: val } }));
                    }}
                    className="w-full py-1.5 px-2.5 bg-slate-950 border border-slate-700 rounded-xl font-mono text-blue-400 text-right font-bold"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Live Commission Test Simulator Box */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 border border-emerald-500/40 shadow-xl space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
              <Calculator className="w-4 h-4" />
              <span>محاكي واختبار حساب العمولات الفوري (Live Simulator):</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">المبلغ المراد اختباره (ج.م)</label>
                <input
                  type="text"
                  dir="ltr"
                  value={calcAmount}
                  onChange={(e) => setCalcAmount(toEnglishDigits(e.target.value).replace(/[^\d]/g, ''))}
                  className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-xl font-mono text-white text-right font-bold"
                  placeholder="1000"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">المحفظة المصدر</label>
                <select
                  value={calcSource}
                  onChange={(e) => setCalcSource(e.target.value as any)}
                  className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold text-xs cursor-pointer"
                >
                  <option value="vodafone">فودافون كاش</option>
                  <option value="etisalat">اتصالات كاش</option>
                  <option value="orange">أورنج كاش</option>
                  <option value="we">وي باي</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">نوع المحفظة المستلمة</label>
                <select
                  value={calcTarget}
                  onChange={(e) => setCalcTarget(e.target.value as any)}
                  className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold text-xs cursor-pointer"
                >
                  <option value="same">نفس الشبكة (محفظة متطابقة)</option>
                  <option value="other">شبكة أخرى (محفظة خارجية)</option>
                </select>
              </div>

              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2 pb-2 text-[11px] font-bold text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={calcIsFirstMonth}
                    onChange={(e) => setCalcIsFirstMonth(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-0 cursor-pointer"
                  />
                  <span>أول معاملة في الشهر؟</span>
                </label>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-300 font-bold">العمولة المحسوبة وفقاً لإعداداتك الحالية:</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black font-mono text-emerald-400">
                  {formatAmount(calculateTestCommission())}
                </span>
                <span className="text-xs font-bold text-slate-400 font-sans">ج.م</span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: VAULTS & LIQUIDITY POLICIES */}
      {activeTab === 'vaults' && (
        <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-400" />
              <h2 className="text-sm font-black text-white">سياسات الخزن والسيولة النقدية</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Zero Deficit Customer Vault Policy */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>حماية خزنة العملاء ومنع العجز (Zero Deficit)</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                  مفعلة دائماً
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                يمنع النظام تماماً حدوث رصيد سالب في خزنة عمليات العملاء (VLT-CUST-001) ويوقف أي معاملة غير مغطاة بسيولة كافية لحماية رأس المال.
              </p>
            </div>

            {/* Mandatory Handover Inventory */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>إلزامية مطابقة أرصدة الخطوط عند تسليم الوردية</span>
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enforceLineInventoryOnHandover}
                    onChange={(e) => setEnforceLineInventoryOnHandover(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                يشترط على الكاشير تأكيد مطابقة جميع أرصدة المحافظ وخطوط الكاش فعلياً قبل إمكانية إغلاق وتسليم عهدة الوردية.
              </p>
            </div>

            {/* Min Liquidity Alert */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <label className="block text-xs font-bold text-white mb-1">
                نسبة التنبيه لانخفاض السيولة في الخزن (%)
              </label>
              <div className="relative">
                <input
                  type="text"
                  dir="ltr"
                  value={minVaultLiquidityAlertPercent}
                  onChange={(e) => setMinVaultLiquidityAlertPercent(toEnglishDigits(e.target.value).replace(/[^\d]/g, ''))}
                  className="w-full py-2 px-3 pl-8 bg-slate-900 border border-slate-700 rounded-xl text-sm font-mono font-bold text-white text-right"
                />
                <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-xs text-slate-400 font-bold">%</span>
              </div>
              <p className="text-[11px] text-slate-400">
                إرسال تنبيه فوري باللون الكهرماني عندما تقل سيولة الخزنة التشغيلية عن هذه النسبة من حد التخصيص.
              </p>
            </div>

            {/* Central Vault Protection Mode */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-blue-400" />
                  <span>حماية الخزنة المركزية الرئيسية</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold">
                  محمية بأوامر صرف
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                يقتصر التحويل من الخزنة الرئيسية على المدير المالي أو الأدمن فقط لتغذية الخزن الفرعية وفق سجلات الفروع.
              </p>
            </div>

          </div>
        </div>
      )}

      {/* TAB 3: LIMITS & CONTROLS */}
      {activeTab === 'limits' && (
        <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Gauge className="w-5 h-5 text-emerald-400" />
              <h2 className="text-sm font-black text-white">إعدادات الحدود المالية والسقوف التلقائية</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                الحد اليومي الافتراضي للخطوط الجديدة (ج.م)
              </label>
              <div className="relative">
                <input
                  type="text"
                  dir="ltr"
                  value={defaultDailyLimit}
                  onChange={(e) => setDefaultDailyLimit(toEnglishDigits(e.target.value).replace(/[^\d]/g, ''))}
                  className="w-full py-2 px-3 pl-8 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono font-bold text-emerald-400 text-right"
                />
                <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-xs text-slate-500 font-bold">ج.م</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                الحد الشهري الافتراضي للخطوط الجديدة (ج.م)
              </label>
              <div className="relative">
                <input
                  type="text"
                  dir="ltr"
                  value={defaultMonthlyLimit}
                  onChange={(e) => setDefaultMonthlyLimit(toEnglishDigits(e.target.value).replace(/[^\d]/g, ''))}
                  className="w-full py-2 px-3 pl-8 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono font-bold text-emerald-400 text-right"
                />
                <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-xs text-slate-500 font-bold">ج.م</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                نسبة التنبيه قبل استنفاد الحد (%)
              </label>
              <div className="relative">
                <input
                  type="text"
                  dir="ltr"
                  value={warningThresholdPercent}
                  onChange={(e) => setWarningThresholdPercent(toEnglishDigits(e.target.value).replace(/[^\d]/g, ''))}
                  className="w-full py-2 px-3 pl-8 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono font-bold text-amber-400 text-right"
                />
                <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-xs text-slate-500 font-bold">%</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">طلب إذن الأدمن لتجاوز الحدود</span>
                <span className="text-[10px] text-slate-400">منع الكاشير من تخطي الحد اليومي دون موافقة</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={requireAdminPinForOverride}
                  onChange={(e) => setRequireAdminPinForOverride(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: RECEIPTS & PRINTING */}
      {activeTab === 'receipts' && (
        <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-400" />
              <h2 className="text-sm font-black text-white">تخصيص الإيصالات وهوية الطباعة والنوافذ المنبثقة</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                عنوان رأس الإيصال المطبوع
              </label>
              <input
                type="text"
                value={receiptSettings.headerTitle}
                onChange={(e) => setReceiptSettings(prev => ({ ...prev, headerTitle: e.target.value }))}
                className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                الوصف الفرعي للإيصال
              </label>
              <input
                type="text"
                value={receiptSettings.subTitle}
                onChange={(e) => setReceiptSettings(prev => ({ ...prev, subTitle: e.target.value }))}
                className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                مدة ظهور نافذة إتمام العملية المنبثقة (ثوانٍ)
              </label>
              <div className="relative">
                <input
                  type="text"
                  dir="ltr"
                  value={receiptSettings.popupDurationSeconds}
                  onChange={(e) => {
                    const val = Number(toEnglishDigits(e.target.value).replace(/[^\d]/g, '')) || 5;
                    setReceiptSettings(prev => ({ ...prev, popupDurationSeconds: Math.max(1, Math.min(30, val)) }));
                  }}
                  className="w-full py-2 px-3 pl-8 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono font-bold text-emerald-400 text-right"
                />
                <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-xs text-slate-500 font-bold">ثانية</span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-1">تختفي النافذة تلقائياً بعد هذه المدة أو بالنقر على علامة الصح</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                التنسيق الافتراضي للطباعة
              </label>
              <select
                value={receiptSettings.defaultReceiptFormat}
                onChange={(e) => setReceiptSettings(prev => ({ ...prev, defaultReceiptFormat: e.target.value as any }))}
                className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white cursor-pointer"
              >
                <option value="thermal">إيصال حراري (Thermal 80mm - موصى به للطابعات الصغيرة)</option>
                <option value="a4">صفحة كاملة (A4 Sheet)</option>
              </select>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">إظهار باركود التوثيق الرسمي (QR Code)</span>
                <span className="text-[10px] text-slate-400">للتأكد من مصادقة العملية إلكترونياً</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={receiptSettings.showQrCode}
                  onChange={(e) => setReceiptSettings(prev => ({ ...prev, showQrCode: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">طباعة اسم الموظف المنفذ</span>
                <span className="text-[10px] text-slate-400">توثيق اسم منفذ المعاملة على الإيصال</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={receiptSettings.showOperatorName}
                  onChange={(e) => setReceiptSettings(prev => ({ ...prev, showOperatorName: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: ADMIN ACCOUNT & SECURITY */}
      {activeTab === 'admin_account' && (
        <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-400" />
              <h2 className="text-sm font-black text-white">بيانات حساب المالك والأمان (عادل فتحي)</h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/30">
              User ID: usr_admin
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                الاسم الكامل للمالك / الأدمن
              </label>
              <input
                type="text"
                value={adminFullName}
                onChange={(e) => setAdminFullName(e.target.value)}
                className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                اسم تسجيل الدخول (Username)
              </label>
              <input
                type="text"
                dir="ltr"
                value={adminUsername}
                disabled
                className="w-full py-2 px-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs font-mono font-bold text-slate-400 cursor-not-allowed"
              />
              <span className="text-[10px] text-slate-500 block mt-1">اسم تسجيل الدخول المعتمد: Adel</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                كلمة المرور الجديدة (اختياري)
              </label>
              <input
                type="password"
                dir="ltr"
                value={newAdminPassword}
                onChange={(e) => setNewAdminPassword(e.target.value)}
                placeholder="اتركها فارغة إذا لم ترغب في التغيير"
                className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                تأكيد كلمة المرور الجديدة
              </label>
              <input
                type="password"
                dir="ltr"
                value={confirmAdminPassword}
                onChange={(e) => setConfirmAdminPassword(e.target.value)}
                placeholder="أعد إدخال كلمة المرور للتأكيد"
                className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Quick Database Backup Export */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between flex-wrap gap-3">
            <div>
              <h4 className="text-xs font-bold text-white">النسخة الاحتياطية الفورية للنظام</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">تنزيل نسخة مشفرة كاملة من الحركات، الإعدادات، والخطوط المالية</p>
            </div>
            <button
              type="button"
              onClick={async () => {
                const data = await api.exportBackup();
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `cash_system_backup_${Date.now()}.json`;
                a.click();
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 border border-slate-700 cursor-pointer transition shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>تحميل نسخة احتياطية (JSON)</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating Save Bar on Scroll */}
      <div className="p-4 rounded-2xl bg-slate-900/95 border border-slate-800 flex items-center justify-between shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <Info className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>أي تعديل تقوم به في لوحة التحكم ينعكس فورياً على منطق حساب العمولات، الخزن، والإيصالات.</span>
        </div>
        <button
          type="button"
          onClick={handleSaveAll}
          disabled={isSaving}
          className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>حفظ التعديلات</span>
        </button>
      </div>

    </div>
  );
};
