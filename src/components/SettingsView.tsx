import React, { useState, useEffect, useRef } from 'react';
import { SystemSettings } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Save, 
  CheckCircle2, 
  AlertTriangle, 
  Building2, 
  ShieldCheck,
  Monitor,
  Download,
  FolderCheck,
  Terminal,
  HardDrive,
  Type,
  Sparkles,
  RotateCcw,
  Trash2,
  AlertOctagon,
  Database,
  UploadCloud,
  FileJson,
  ShieldAlert,
  Info,
  RefreshCw,
  X,
  Check,
  GitCompareArrows,
  Wallet,
  History
} from 'lucide-react';
import { TypographySettingsSection } from './TypographySettingsSection';
import { ReconciliationView } from './ReconciliationView';

export interface SettingsViewProps {
  initialTab?: 'typography' | 'financial' | 'reconciliation' | 'backup' | 'reset' | 'desktop';
}

export const SettingsView: React.FC<SettingsViewProps> = ({ initialTab = 'typography' }) => {
  const { canManageSettings, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'typography' | 'financial' | 'reconciliation' | 'backup' | 'reset' | 'desktop'>(initialTab);

  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [companyName, setCompanyName] = useState('');
  const [currency, setCurrency] = useState('ج.م');
  const [warningThreshold, setWarningThreshold] = useState('80');
  const [defaultDaily, setDefaultDaily] = useState('60000');
  const [defaultMonthly, setDefaultMonthly] = useState('200000');
  const [allowOverdraft, setAllowOverdraft] = useState(false);

  // Factory Reset states
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirmWord, setResetConfirmWord] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  // Backup & Restore states
  const [isExporting, setIsExporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const data = await api.getSettings();
      setSettings(data);
      setCompanyName(data.companyName);
      setCurrency(data.currency);
      setWarningThreshold(data.warningThresholdPercent.toString());
      setDefaultDaily(data.defaultDailyLimit.toString());
      setDefaultMonthly(data.defaultMonthlyLimit.toString());
      setAllowOverdraft(data.allowOverdraft);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);
    setErrorMsg(null);
    try {
      const updated = await api.updateSettings({
        companyName,
        currency,
        warningThresholdPercent: Number(warningThreshold),
        defaultDailyLimit: Number(defaultDaily),
        defaultMonthlyLimit: Number(defaultMonthly),
        allowOverdraft,
      });
      setSettings(updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل حفظ الإعدادات');
    } finally {
      setIsSaving(false);
    }
  };

  // Export Backup
  const handleExportBackup = async () => {
    setIsExporting(true);
    try {
      const backupData = await api.exportBackup();
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `cash_system_backup_${dateStr}_${Date.now().toString().slice(-4)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Backup export failed:', err);
      alert('حدث خطأ أثناء تصدير النسخة الاحتياطية');
    } finally {
      setIsExporting(false);
    }
  };

  // Restore Backup
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsRestoring(true);
    setRestoreMessage(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed || !parsed.data) {
        throw new Error('ملف النسخة الاحتياطية غير صالح أو تالف');
      }

      const res = await api.restoreBackup(parsed);
      setRestoreMessage({ text: res.message || 'تمت استعادة البيانات بنجاح', isError: false });
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setRestoreMessage({ text: err.message || 'فشل استيراد النسخة الاحتياطية', isError: true });
    } finally {
      setIsRestoring(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Trigger Factory Reset (Immediate confirmation without typing required)
  const handleExecuteFactoryReset = async () => {
    setIsResetting(true);
    setErrorMsg(null);
    try {
      const res = await api.factoryReset();
      setResetSuccessMessage(res.message || 'تمت إعادة ضبط المصنع وتصفير الأرصدة بنجاح!');
      setTimeout(() => {
        window.location.reload();
      }, 1600);
    } catch (err: any) {
      setIsResetting(false);
      setErrorMsg(err.message || 'حدث خطأ أثناء محاولة إعادة ضبط المصنع');
    }
  };

  if (isLoading || !settings) {
    return (
      <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
        <span className="text-sm font-semibold">جاري تحميل إعدادات ولوحة تحكم النظام...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 font-sans selection:bg-emerald-500 selection:text-white" dir="rtl">
      
      {/* Top Enterprise Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-850 p-6 sm:p-7 border border-slate-800 shadow-xl shadow-slate-950/40">
        <div className="absolute top-0 right-0 w-80 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-32 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
                <span>إعدادات النظام والواجهة</span>
              </h1>
              <span className="text-[11px] px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold flex items-center gap-1.5 shadow-sm">
                <Sparkles className="w-3.5 h-3.5" />
                تحكم مخصص وشامل
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              إدارة شاملة لهوية المنشأة، المعايير والحدود التشغيلية، تخصيص الخطوط والمظهر، إدارة النسخ الاحتياطي، وضبط المصنع.
            </p>
          </div>

          {/* Quick Header Actions */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {canManageSettings && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('reset');
                  setShowResetModal(true);
                }}
                className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 border border-rose-500/30 hover:border-rose-500/50 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm hover:shadow-rose-950/50"
                title="إعادة ضبط المصنع ومسح كافة البيانات"
              >
                <RotateCcw className="w-4 h-4 text-rose-400" />
                <span>ضبط المصنع</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleExportBackup}
              disabled={isExporting}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/80 rounded-2xl text-xs font-bold flex items-center gap-2 transition cursor-pointer"
              title="تصدير نسخة احتياطية سريعة"
            >
              <Database className="w-4 h-4 text-cyan-400" />
              <span>{isExporting ? 'جاري النسخ...' : 'نسخة احتياطية'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modern High-End Tab Navigation */}
      <div className="bg-slate-900/60 p-2 rounded-2xl border border-slate-800/80 backdrop-blur-sm">
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Tab 1: Typography */}
          <button
            type="button"
            onClick={() => setActiveTab('typography')}
            className={`flex items-center gap-2.5 px-4 sm:px-5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              activeTab === 'typography'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-500/60 shadow-lg shadow-emerald-950/60'
                : 'bg-slate-900/60 text-slate-400 hover:text-white border-transparent hover:bg-slate-800/60'
            }`}
          >
            <Type className="w-4 h-4" />
            <span>التحكم في الخط والمظهر (Typography)</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${
              activeTab === 'typography' 
                ? 'bg-emerald-400/25 text-emerald-100 border border-emerald-400/30 font-bold' 
                : 'bg-slate-800 text-slate-400'
            }`}>
              رفع وحفظ
            </span>
          </button>

          {/* Tab 2: Financial & Identity */}
          <button
            type="button"
            onClick={() => setActiveTab('financial')}
            className={`flex items-center gap-2.5 px-4 sm:px-5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              activeTab === 'financial'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-500/60 shadow-lg shadow-emerald-950/60'
                : 'bg-slate-900/60 text-slate-400 hover:text-white border-transparent hover:bg-slate-800/60'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>بيانات المنشأة والحدود المالية</span>
          </button>

          {/* Tab 3: Reconciliation (مقارنة العمليات) */}
          <button
            type="button"
            onClick={() => setActiveTab('reconciliation')}
            className={`flex items-center gap-2.5 px-4 sm:px-5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              activeTab === 'reconciliation'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-500/60 shadow-lg shadow-emerald-950/60'
                : 'bg-slate-900/60 text-slate-400 hover:text-white border-transparent hover:bg-slate-800/60'
            }`}
          >
            <GitCompareArrows className="w-4 h-4 text-emerald-400" />
            <span>مقارنة العمليات والمطابقة</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${
              activeTab === 'reconciliation' 
                ? 'bg-emerald-400/25 text-emerald-100 border border-emerald-400/30 font-bold' 
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            }`}>
              OCR ذكي
            </span>
          </button>

          {/* Tab 3: Backup & Restore */}
          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`flex items-center gap-2.5 px-4 sm:px-5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              activeTab === 'backup'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-500/60 shadow-lg shadow-emerald-950/60'
                : 'bg-slate-900/60 text-slate-400 hover:text-white border-transparent hover:bg-slate-800/60'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>النسخ الاحتياطي والاستعادة</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${
              activeTab === 'backup' 
                ? 'bg-emerald-400/25 text-emerald-100 border border-emerald-400/30' 
                : 'bg-slate-800 text-slate-400'
            }`}>
              JSON
            </span>
          </button>

          {/* Tab 4: Factory Reset (Prominent) */}
          <button
            type="button"
            onClick={() => setActiveTab('reset')}
            className={`flex items-center gap-2.5 px-4 sm:px-5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              activeTab === 'reset'
                ? 'bg-gradient-to-r from-rose-700 to-red-600 text-white border-rose-500/60 shadow-lg shadow-rose-950/60'
                : 'bg-slate-900/60 text-rose-300 hover:text-white border-rose-900/20 hover:bg-rose-950/30'
            }`}
          >
            <RotateCcw className={`w-4 h-4 ${activeTab === 'reset' ? 'text-white' : 'text-rose-400'}`} />
            <span>إعادة ضبط المصنع</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === 'reset' 
                ? 'bg-rose-400/30 text-rose-100 border border-rose-400/40' 
                : 'bg-rose-500/15 text-rose-300 border border-rose-500/25'
            }`}>
              مسح شامل
            </span>
          </button>

          {/* Tab 5: Desktop App */}
          <button
            type="button"
            onClick={() => setActiveTab('desktop')}
            className={`flex items-center gap-2.5 px-4 sm:px-5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              activeTab === 'desktop'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-500/60 shadow-lg shadow-emerald-950/60'
                : 'bg-slate-900/60 text-slate-400 hover:text-white border-transparent hover:bg-slate-800/60'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>تصدير نسخة سطح المكتب (.exe)</span>
          </button>
        </div>
      </div>

      {/* Global Alerts / Feedback */}
      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 flex items-center gap-3 text-emerald-200 text-xs shadow-lg shadow-emerald-950/30 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="font-bold">تم حفظ وتحديث إعدادات النظام بنجاح!</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-950/80 border border-red-500/50 flex items-center gap-3 text-red-200 text-xs shadow-lg shadow-red-950/30 animate-in fade-in">
          <AlertOctagon className="w-5 h-5 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* TAB 1: Typography & Custom Fonts */}
      {activeTab === 'typography' && (
        <TypographySettingsSection />
      )}

      {/* TAB 2: Company & Financial Limits */}
      {activeTab === 'financial' && (
        <form onSubmit={handleSave} className="space-y-6">
          
          {/* Card 1: Company Profile */}
          <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-5 shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <h2 className="text-base font-bold text-white flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                  <Building2 className="w-4 h-4" />
                </div>
                <span>هوية وبيانات المنشأة</span>
              </h2>
              <span className="text-[11px] text-slate-500">تظهر في الترويسات والتقارير وإيصالات العمليات</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">اسم المؤسسة أو الشركة</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  disabled={!canManageSettings}
                  placeholder="مثال: مؤسسة التيسير للخدمات المالية"
                  className="w-full p-3 bg-slate-950 border border-slate-750 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-xs text-white placeholder-slate-600 transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">رمز أو اسم العملة الأساسية</label>
                <input
                  type="text"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  disabled={!canManageSettings}
                  placeholder="مثال: ج.م أو EGP"
                  className="w-full p-3 bg-slate-950 border border-slate-750 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-xs text-white placeholder-slate-600 transition"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Financial Caps & Thresholds */}
          <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-5 shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <h2 className="text-base font-bold text-white flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span>الحدود المالية التشغيلية ونسب التحذير</span>
              </h2>
              <span className="text-[11px] text-slate-500">حماية السيولة وتجنب تجاوز سقوف شبكات الدفع</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  الحد اليومي التلقائي للخطوط الجديدة (ج.م)
                </label>
                <input
                  type="number"
                  value={defaultDaily}
                  onChange={(e) => setDefaultDaily(e.target.value)}
                  disabled={!canManageSettings}
                  className="w-full p-3 bg-slate-950 border border-slate-750 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-xs text-white font-mono transition"
                />
                <span className="text-[10px] text-slate-500 block">سقف التحويلات المسموحة للخط في اليوم الواحد</span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  الحد الشهري التلقائي للخطوط الجديدة (ج.م)
                </label>
                <input
                  type="number"
                  value={defaultMonthly}
                  onChange={(e) => setDefaultMonthly(e.target.value)}
                  disabled={!canManageSettings}
                  className="w-full p-3 bg-slate-950 border border-slate-750 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-xs text-white font-mono transition"
                />
                <span className="text-[10px] text-slate-500 block">سقف الاستهلاك الإجمالي خلال الشهر الميلادي</span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  نسبة التحذير الاستباقي (% للاستهلاك)
                </label>
                <input
                  type="number"
                  min="50"
                  max="99"
                  value={warningThreshold}
                  onChange={(e) => setWarningThreshold(e.target.value)}
                  disabled={!canManageSettings}
                  className="w-full p-3 bg-slate-950 border border-slate-750 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-xs text-white font-mono transition"
                />
                <span className="text-[10px] text-slate-500 block">يتحول مؤشر الخط للون البرتقالي/التحذيري عند بلوغها</span>
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-start gap-3.5 text-xs text-slate-300 cursor-pointer p-4 bg-slate-950/70 rounded-2xl border border-slate-800 hover:border-slate-700 transition">
                <input
                  type="checkbox"
                  checked={allowOverdraft}
                  onChange={(e) => setAllowOverdraft(e.target.checked)}
                  disabled={!canManageSettings}
                  className="w-4 h-4 mt-0.5 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
                />
                <div className="space-y-0.5">
                  <span className="font-bold text-white block">السماح بتجاوز الرصيد الحالي للخط (سحب على المكشوف)</span>
                  <span className="text-[11px] text-slate-400 leading-relaxed block">
                    عند تفعيل هذا الخيار، لن يتم حظر التحويل في حال كان رصيد الخط أقل من المبلغ، وسيتحول الخط تلقائياً لرصيد سالب مع تسجيل تنبيه بالمراجعة.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {canManageSettings && (
            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isSaving}
                className="px-7 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-2xl text-xs flex items-center gap-2.5 shadow-lg shadow-emerald-600/25 transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'جاري حفظ التغييرات...' : 'حفظ التغييرات'}</span>
              </button>
            </div>
          )}
        </form>
      )}

      {/* TAB 3: Backup & Data Management */}
      {activeTab === 'backup' && (
        <div className="space-y-6">
          <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-6 shadow-lg">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">إدارة النسخ الاحتياطي واستعادة البيانات</h2>
                  <p className="text-xs text-slate-400 mt-0.5">حفظ وتأمين كامل بيانات الخطوط، التحويلات، المستخدمين، والإعدادات في ملف مشفر</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-semibold">
                  صيغة قياسية JSON
                </span>
              </div>
            </div>

            {restoreMessage && (
              <div className={`p-4 rounded-2xl border flex items-center gap-3 text-xs ${
                restoreMessage.isError 
                  ? 'bg-rose-950/80 border-rose-500/50 text-rose-200' 
                  : 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
              }`}>
                {restoreMessage.isError ? <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0" /> : <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
                <span>{restoreMessage.text}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Export Card */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800/90 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                    <FileJson className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-white">تصدير نسخة احتياطية كاملة</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    توليد ملف كامل يحتوي على جميع خطوط الكاش، سجلات العمليات، أرصدة الحسابات، والمستخدمين لحفظه في مكان آمن على جهازك.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleExportBackup}
                  disabled={isExporting}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>{isExporting ? 'جاري تصدير النسخة...' : 'تحميل النسخة الاحتياطية الآن (JSON)'}</span>
                </button>
              </div>

              {/* Import / Restore Card */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800/90 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-white">استعادة نسخة احتياطية سابقة</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    رفع ملف نسخة احتياطية سابقة بتنسيق JSON لاستعادة كافة البيانات كما كانت عند أخذ تلك النسخة.
                  </p>
                </div>

                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".json"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isRestoring || !canManageSettings}
                    className="w-full py-3 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 border border-slate-700 transition cursor-pointer"
                  >
                    <UploadCloud className="w-4 h-4 text-purple-400" />
                    <span>{isRestoring ? 'جاري التحقق والاستعادة...' : 'اختيار ملف النسخة واستعادتها'}</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Safety Guidance */}
            <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800/80 flex items-start gap-3 text-xs text-slate-400 leading-relaxed">
              <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                <strong>توصية أمنية:</strong> يوصى بتنزيل نسخة احتياطية بصفة دورية في نهاية كل يوم عمل لحفظ أرشيف مالي آمن خارج البرنامج.
              </span>
            </div>

          </div>
        </div>
      )}

      {/* TAB 4: Factory Reset (إعادة ضبط المصنع وتصفير الحسابات الشاملة - مدمجة لعرض كامل الشاشة بدون تمرير) */}
      {activeTab === 'reset' && (
        <div className="space-y-3 animate-in fade-in duration-200">
          <div className="factory-reset-hero relative overflow-hidden p-4 sm:p-5 space-y-3.5">
            {/* Ambient Lighting Accents */}
            <div className="absolute -top-24 -right-24 w-60 h-60 bg-rose-500/10 dark:bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-red-500/10 dark:bg-red-600/15 rounded-full blur-3xl pointer-events-none" />

            {/* Reset Banner Header */}
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-3 border-b border-rose-200 dark:border-rose-500/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-rose-500/20 to-red-600/15 dark:from-rose-500/30 dark:to-red-600/20 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-300 dark:border-rose-500/40 shadow-md shrink-0">
                  <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse text-rose-600 dark:text-rose-400" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="factory-reset-title text-base sm:text-lg font-black tracking-tight">
                      إعادة ضبط المصنع وتصفير الحسابات الشاملة
                    </h2>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 font-bold border border-rose-300 dark:border-rose-500/40 flex items-center gap-1 shadow-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping inline-block" />
                      إجراء حاسم نهائي · تصفير الأرصدة
                    </span>
                  </div>
                  <p className="factory-reset-desc text-xs leading-normal max-w-2xl">
                    مسح كافة البيانات والعمليات وتصفير رصيد البرنامج وجميع خطوط الكاش والمحافظ والخزن ليصبح كل رصيد <span className="font-black text-rose-600 dark:text-rose-400">0.00 ج.م</span> كأول تشغيل.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleExportBackup}
                disabled={isExporting}
                className="px-3.5 py-2 bg-white hover:bg-slate-50 dark:bg-slate-800/90 dark:hover:bg-slate-750 text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700/80 hover:border-emerald-500/50 flex items-center gap-2 transition-all shadow-xs cursor-pointer shrink-0 self-stretch sm:self-auto justify-center"
              >
                <Download className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                <span>حفظ نسخة احتياطية أولاً</span>
              </button>
            </div>

            {/* What Happens 4 Pillars Grid - Compact */}
            <div className="relative z-10 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="factory-reset-section-heading text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
                  <span>ما الذي سيحدث بدقة عند تنفيذ إعادة ضبط المصنع؟</span>
                </h3>
                <span className="text-[10.5px] text-slate-500 dark:text-slate-400 hidden sm:inline-block">تصفير شامل ونهائي</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                
                {/* Pillar 1: Full Zero Balances */}
                <div className="factory-reset-pillar p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xs">
                      <div className="w-6 h-6 rounded-lg bg-rose-100 dark:bg-rose-500/15 flex items-center justify-center border border-rose-300 dark:border-rose-500/30">
                        <Wallet className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                      </div>
                      <span className="factory-reset-pillar-title font-bold text-xs">تصفير شامل للأرصدة والحسابات</span>
                    </div>
                    <span className="text-[9.5px] font-black px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30 font-mono">
                      0.00 ج.م
                    </span>
                  </div>
                  <p className="factory-reset-pillar-desc text-[11px] leading-relaxed">
                    تصفير كامل لكافة أرصدة خطوط الكاش والمحافظ، والخزينة المركزية، والخزن الفرعية، وخزينة العمليات، ليكون رصيد البرنامج صفر ج.م تماماً.
                  </p>
                </div>

                {/* Pillar 2: 0 Operations */}
                <div className="factory-reset-pillar p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xs">
                      <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center border border-amber-300 dark:border-amber-500/30">
                        <History className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <span className="factory-reset-pillar-title font-bold text-xs">مسح شامل لسجلات العمليات</span>
                    </div>
                    <span className="text-[9.5px] font-black px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 font-mono">
                      0 عملية
                    </span>
                  </div>
                  <p className="factory-reset-pillar-desc text-[11px] leading-relaxed">
                    حذف كافة سجلات التحويلات البنكية ومحافظ الكاش وحركات اليوم والشهر ومحاضر النوبات لتصبح 0 عملية كأول تشغيل للنظام.
                  </p>
                </div>

                {/* Pillar 3: Clean Treasury & Handover Structure */}
                <div className="factory-reset-pillar p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xs">
                      <div className="w-6 h-6 rounded-lg bg-cyan-100 dark:bg-cyan-500/15 flex items-center justify-center border border-cyan-300 dark:border-cyan-500/30">
                        <Building2 className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                      </div>
                      <span className="factory-reset-pillar-title font-bold text-xs">إعادة تهيئة الخزائن والتسليم</span>
                    </div>
                    <span className="text-[9.5px] font-black px-2 py-0.5 rounded bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/30 font-mono">
                      تصفير الخزن
                    </span>
                  </div>
                  <p className="factory-reset-pillar-desc text-[11px] leading-relaxed">
                    إعادة ضبط هيكل الخزن والخطوط بدون مبالغ مسجلة، وتصفير استهلاك الحدود اليومية والشهرية، ومسح مطابقات العمليات القديمة.
                  </p>
                </div>

                {/* Pillar 4: Fresh Audit & Pristine Theme */}
                <div className="factory-reset-pillar p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xs">
                      <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center border border-emerald-300 dark:border-emerald-500/30">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <span className="factory-reset-pillar-title font-bold text-xs">سجل تدقيق نظيف وإعدادات قياسية</span>
                    </div>
                    <span className="text-[9.5px] font-black px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 font-mono">
                      بداية نظيفة
                    </span>
                  </div>
                  <p className="factory-reset-pillar-desc text-[11px] leading-relaxed">
                    بدء أرشيف رقابة جديد يوثق إجراء ضبط المصنع، مع إرجاع إعدادات المظهر للوضع القياسي مع الاحتفاظ بحساب المسؤول.
                  </p>
                </div>

              </div>
            </div>

            {/* Primary Action Button Bar - Compact & Directly Visible */}
            <div className="factory-reset-action-box relative z-10 p-3 sm:p-3.5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
              <div className="space-y-0.5">
                <span className="factory-reset-action-title text-xs sm:text-sm font-black block">
                  هل أنت جاهز لتصفير البرنامج وإعادة ضبط المصنع الآن؟
                </span>
                <p className="factory-reset-action-sub text-[10.5px] sm:text-[11px] leading-normal">
                  تأكيد فوري مباشر: عند الضغط أدناه ستظهر نافذة التأكيد للموافقة بنقرة واحدة مباشرة، دون الحاجة لكتابة أي كلمات.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowResetModal(true);
                }}
                disabled={!canManageSettings}
                className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white font-black rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-600/25 hover:shadow-rose-600/40 transition-all cursor-pointer shrink-0 active:scale-98 border border-rose-400/30"
              >
                <Trash2 className="w-4 h-4 text-white" />
                <span>إعادة ضبط المصنع وتصفير الحسابات الآن</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* TAB 5: Windows Desktop EXE Export */}
      {activeTab === 'desktop' && (
        <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-6 shadow-lg">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20 shrink-0">
                <Monitor className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2 flex-wrap">
                  <span>تصدير واستخراج نسخة سطح المكتب (.exe) لنظام ويندوز</span>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30 font-mono">
                    الإصدار V 2.44
                  </span>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                    مع ميزة اختيار مسار التثبيت
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  تثبيت مستقل يتيح للمستخدم تحديد مجلد التثبيت بحرية وحفظ كافة البيانات وقاعدة البيانات بالكامل بداخله
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <a
                href="/api/download/desktop-app"
                download="CashManagementSystem-Windows-x64.zip"
                className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/25 transition cursor-pointer shrink-0"
                title="تحميل الحزمة التنفيذية الجاهزة لويندوز 64-bit"
              >
                <Download className="w-4 h-4" />
                <span>تحميل الحزمة التنفيذية لويندوز (ZIP / EXE)</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  const scriptContent = `@echo off\r\nchcp 65001 > nul\r\necho ========================================================\r\necho   تصدير وبناء ملف التثبيت التنفيذي (Windows .exe)\r\necho   نظام إدارة التحويلات المالية وخطوط الكاش الذكي\r\necho ========================================================\r\necho.\r\necho 1. التحقق من تثبيت Node.js...\r\nwhere node >nul 2>nul\r\nif %errorlevel% neq 0 (\r\n    echo [خطأ] Node.js غير مثبت على جهازك. يرجى تثبيته من https://nodejs.org\r\n    pause\r\n    exit /b 1\r\n)\r\necho 2. تثبيت الحزم والمكتبات اللازمة...\r\ncall npm install --legacy-peer-deps\r\necho 3. بناء ملفات الواجهة للإنتاج...\r\ncall npm run build\r\necho 4. حزم التطبيق في مثبت ويندوز تنفيذي مع شاشة اختيار مسار التثبيت...\r\ncall npx electron-builder --win --x64\r\necho.\r\necho تم بنجاح إنشاء ملف التثبيت (.exe) داخل مجلد dist-electron/\r\npause\r\n`;
                  const blob = new Blob([scriptContent], { type: 'text/plain;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'build-windows-exe.bat';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold rounded-xl text-xs flex items-center gap-2 border border-slate-700/80 transition cursor-pointer shrink-0"
              >
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span>سكريبت البناء الآلي (build-exe.bat)</span>
              </button>
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <FolderCheck className="w-4 h-4" />
                <span>اختيار مسار التثبيت يدويًا</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                عند تشغيل برنامج التثبيت، يظهر زر استعراض (Browse) لاختيار أي مسار تفضله (مثل D:\CashSystem أو فلاشة).
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
                <HardDrive className="w-4 h-4" />
                <span>تثبيت كل شيء داخل المجلد</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                يتم وضع الملفات، قاعدة البيانات، وسجلات النظام ومجلد app_data بالكامل داخل ذلك المسار المحدد فقط.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                <Terminal className="w-4 h-4" />
                <span>نسخة محمولة (Portable .exe)</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                تم تجهيز إعدادات البناء لتوليد نسختين: مثبت نظام رسمي (Setup.exe) ونسخة تشغيل فوري بدون تثبيت.
              </p>
            </div>
          </div>

          {/* Command instructions */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-mono text-xs">
            <div>
              <span className="text-[11px] text-slate-400 font-sans block mb-1">أمر البناء السريع من مجلد المشروع في سطر الأوامر:</span>
              <code className="text-emerald-400 font-bold bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 select-all inline-block">
                npm install --legacy-peer-deps &amp;&amp; npm run build:exe
              </code>
            </div>
            <span className="text-[11px] text-slate-500 font-sans">
              الملف التنفيذي الناتج: <code className="text-slate-300">dist-electron/CashManagementSystem_Setup.exe</code>
            </span>
          </div>

        </div>
      )}

      {/* TAB: Reconciliation System (مقارنة العمليات) */}
      {activeTab === 'reconciliation' && (
        <div className="pt-1 animate-in fade-in">
          <ReconciliationView onBackToDashboard={() => setActiveTab('financial')} />
        </div>
      )}

      {/* Confirmation Modal for Factory Reset (One-Click Approval - Compact Version) */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 dark:bg-slate-950/85 backdrop-blur-md animate-in fade-in">
          <div 
            className="factory-reset-modal w-full max-w-sm sm:max-w-md rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-2xl"
            dir="rtl"
          >
            {/* Modal Header - Compact */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-300 dark:border-rose-500/40 shrink-0 shadow-sm">
                  <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                </div>
                <div>
                  <h3 className="factory-reset-title text-base sm:text-lg font-black leading-tight">
                    تأكيد تصفير الحسابات وضبط المصنع
                  </h3>
                  <p className="text-[11px] text-rose-600 dark:text-rose-300 font-medium mt-0.5">
                    موافقة فورية بنقرة واحدة لتصفير كافة الأرصدة ومسح السجلات
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!isResetting) {
                    setShowResetModal(false);
                  }
                }}
                disabled={isResetting}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center justify-center transition cursor-pointer"
                title="إغلاق النافذة"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Live Zero Preview Box - Compact */}
            <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50 dark:bg-slate-950/90 border border-slate-200 dark:border-rose-500/30 space-y-2">
              <div className="flex items-center justify-between text-[11px] pb-1.5 border-b border-slate-200 dark:border-slate-800/80">
                <span className="font-bold text-rose-600 dark:text-rose-300">الحالة بعد الموافقة والتنفيذ:</span>
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 font-bold">تصفير بنسبة 100%</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800/80 flex flex-col shadow-xs">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">رصيد البرنامج الإجمالي:</span>
                  <span className="text-xs sm:text-sm font-black text-rose-600 dark:text-rose-400 font-mono mt-0.5">0.00 ج.م</span>
                </div>
                <div className="p-2 rounded-lg bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800/80 flex flex-col shadow-xs">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">أرصدة خطوط الكاش:</span>
                  <span className="text-xs sm:text-sm font-black text-rose-600 dark:text-rose-400 font-mono mt-0.5">0.00 ج.م</span>
                </div>
                <div className="p-2 rounded-lg bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800/80 flex flex-col shadow-xs">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">أرصدة الخزن المركزية والفرعية:</span>
                  <span className="text-xs sm:text-sm font-black text-rose-600 dark:text-rose-400 font-mono mt-0.5">0.00 ج.م</span>
                </div>
                <div className="p-2 rounded-lg bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800/80 flex flex-col shadow-xs">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">سجل العمليات والتحويلات:</span>
                  <span className="text-xs sm:text-sm font-black text-rose-600 dark:text-rose-400 font-mono mt-0.5">0 عملية</span>
                </div>
              </div>
            </div>

            {/* Warning Message Box - Compact */}
            <div className="p-2.5 sm:p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/30 text-[11px] text-rose-900 dark:text-rose-200 leading-normal space-y-1">
              <p className="font-bold text-rose-950 dark:text-rose-100 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                <span>تنبيه نهائي: هل توافق على مسح كافة السجلات وتصفير الحسابات؟</span>
              </p>
              <p className="text-[10.5px] text-rose-800 dark:text-rose-300/80 leading-relaxed pr-5">
                بمجرد الضغط على زر الموافقة أدناه سيتم تصفير كافة الأرصدة ومسح جميع حركات التحويل فوراً والبدء من الصفر. لا يمكن التراجع إلا باستيراد نسخة احتياطية.
              </p>
            </div>

            {/* Quick Safety Step: Backup Download - Compact */}
            <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px]">
              <span className="text-slate-500 dark:text-slate-400 text-[10.5px]">لحمايتك، هل ترغب بحفظ نسخة احتياطية أولاً؟</span>
              <button
                type="button"
                onClick={handleExportBackup}
                disabled={isExporting || isResetting}
                className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 font-bold flex items-center gap-1 transition cursor-pointer text-[10.5px]"
              >
                <Download className="w-3 h-3" />
                <span>حفظ نسخة احتياطية (اختياري)</span>
              </button>
            </div>

            {/* Success message inside modal if done */}
            {resetSuccessMessage && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/90 border border-emerald-500 flex items-center gap-2.5 text-emerald-800 dark:text-emerald-200 text-xs shadow-md animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="font-bold text-xs">{resetSuccessMessage} جاري تحديث البرنامج...</span>
              </div>
            )}

            {/* Modal Actions - Compact One-Click Approval */}
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowResetModal(false);
                }}
                disabled={isResetting}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white font-bold rounded-xl text-xs transition cursor-pointer text-center"
              >
                إلغاء وتراجع
              </button>

              <button
                type="button"
                onClick={handleExecuteFactoryReset}
                disabled={isResetting}
                className="px-5 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition cursor-pointer bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white shadow-md shadow-rose-600/30 hover:shadow-rose-600/50 border border-rose-400/40 active:scale-98 disabled:opacity-50"
              >
                {isResetting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                    <span className="text-white text-xs">جاري تصفير الحسابات ومسح السجلات...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 text-white" />
                    <span className="text-white">نعم، أوافق على التصفير وإعادة ضبط المصنع الآن</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
