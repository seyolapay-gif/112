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
  GitCompareArrows
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

  // Trigger Factory Reset
  const handleExecuteFactoryReset = async () => {
    if (resetConfirmWord.trim() !== 'تأكيد' && resetConfirmWord.trim().toLowerCase() !== 'reset') {
      return;
    }

    setIsResetting(true);
    setErrorMsg(null);
    try {
      const res = await api.factoryReset();
      setResetSuccessMessage(res.message || 'تمت إعادة ضبط المصنع بنجاح!');
      setTimeout(() => {
        window.location.reload();
      }, 1800);
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

  const isResetAllowed = resetConfirmWord.trim() === 'تأكيد' || resetConfirmWord.trim().toLowerCase() === 'reset';

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

      {/* TAB 4: Factory Reset (إعادة ضبط المصنع والصيانة) */}
      {activeTab === 'reset' && (
        <div className="space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-slate-900 to-rose-950/20 border border-rose-900/40 space-y-6 shadow-xl shadow-rose-950/30">
            
            {/* Reset Banner Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 pb-5 border-b border-rose-900/30">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-400 flex items-center justify-center border border-rose-500/30 shadow-lg shadow-rose-950/50 shrink-0">
                  <RotateCcw className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2.5">
                    <span>إعادة ضبط المصنع الشاملة (Factory Reset)</span>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40">
                      إجراء حاسم
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    مسح كافة البيانات والسجلات والعمليات وإعادة تشغيل النظام بحالة المصنع الأولى كأن البرنامج يعمل لأول مرة.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleExportBackup}
                disabled={isExporting}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-xl text-xs font-bold border border-slate-750 flex items-center gap-2 transition cursor-pointer shrink-0"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>حفظ نسخة احتياطية وقائية أولاً</span>
              </button>
            </div>

            {/* What Happens Checklist */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>ما الذي سيحدث بدقة عند تنفيذ إعادة ضبط المصنع؟</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-1.5">
                  <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                    <Trash2 className="w-4 h-4" />
                    <span>مسح كامل لسجلات العمليات والتحويلات</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    سيتم مسح وتصفير كافة سجلات التحويلات البنكية ومحافظ الكاش وحركات اليوم والشهر لتصبح 0 عملية كأول تشغيل.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-1.5">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                    <RotateCcw className="w-4 h-4" />
                    <span>استعادة الخطوط الافتراضية وتصفير الاستهلاك</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    إعادة ضبط خطوط الكاش إلى تشكيلة الخطوط الافتراضية الأصلية مع تصفير الاستهلاك اليومي والشهري بالكامل.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-1.5">
                  <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
                    <Database className="w-4 h-4" />
                    <span>إعادة تهيئة سجلات الرقابة وتتبع النشاط</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    مسح أرشيف الرقابة Audit Logs القديم وبدء سجل تتبع جديد يبدأ بتوثيق إجراء ضبط المصنع للمؤسسة.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-1.5">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <Type className="w-4 h-4" />
                    <span>استعادة المظهر والخطوط الأصلية للنظام</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    إلغاء التعديلات المؤقتة على الخطوط ودرجات التكبير وإعادتها للإعدادات القياسية المعتمدة (100% والخط القياسي).
                  </p>
                </div>

              </div>
            </div>

            {/* Primary Action Button */}
            <div className="p-5 rounded-2xl bg-rose-950/30 border border-rose-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-sm font-black text-rose-200 block">هل تريد بدء تنفيذ ضبط المصنع الآن؟</span>
                <span className="text-xs text-rose-300/80 block">
                  سيتم فتح نافذة تأكيد أمنية لحمايتك قبل التنفيذ النهائي للمسح.
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setResetConfirmWord('');
                  setShowResetModal(true);
                }}
                disabled={!canManageSettings}
                className="px-6 py-3.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black rounded-xl text-xs flex items-center gap-2.5 shadow-lg shadow-rose-900/50 transition cursor-pointer shrink-0"
              >
                <Trash2 className="w-4 h-4" />
                <span>إعادة ضبط المصنع الآن (مسح شامل)</span>
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

      {/* Confirmation Modal for Factory Reset */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div 
            className="w-full max-w-lg bg-slate-900 border border-rose-500/40 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-rose-950/80 space-y-5"
            dir="rtl"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/40 shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    تأكيد إعادة ضبط المصنع (Factory Reset)
                  </h3>
                  <p className="text-xs text-rose-300/80 mt-0.5">
                    تحذير أمني: هذا الإجراء سيمسح جميع البيانات كأول تشغيل
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!isResetting) {
                    setShowResetModal(false);
                    setResetConfirmWord('');
                  }
                }}
                disabled={isResetting}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Warning Message Box */}
            <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-xs text-rose-200/90 leading-relaxed space-y-2">
              <p className="font-bold text-rose-100">
                أنت على وشك تنفيذ إعادة تهيئة شاملة لكامل قاعدة البيانات والسجلات:
              </p>
              <ul className="list-disc list-inside space-y-1 text-rose-200/80 text-[11px]">
                <li>سيتم حذف جميع سجلات التحويلات والعمليات نهائياً (0 عملية).</li>
                <li>ستتم استعادة خطوط الكاش وحسابات الأرصدة إلى حالتها الأصلية.</li>
                <li>سيتم تصفير استهلاك الحدود اليومية والشهرية.</li>
                <li>ستتم استعادة ضبط الخطوط وخصائص الواجهة إلى الوضع الافتراضي.</li>
              </ul>
            </div>

            {/* Safety Step: Backup Download */}
            <div className="flex items-center justify-between p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-400 text-[11px]">هل قمت بحفظ نسخة احتياطية؟</span>
              <button
                type="button"
                onClick={handleExportBackup}
                disabled={isExporting || isResetting}
                className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>تنزيل نسخة احتياطية الآن</span>
              </button>
            </div>

            {/* Confirmation Typing Input */}
            <div className="space-y-2 pt-1">
              <label className="block text-xs font-semibold text-slate-300">
                للتأكيد، يرجى كتابة كلمة <span className="text-rose-400 font-black px-1.5 py-0.5 bg-rose-950/60 rounded border border-rose-500/30">تأكيد</span> أو <span className="text-rose-400 font-black px-1.5 py-0.5 bg-rose-950/60 rounded border border-rose-500/30">reset</span> في المربع أدناه:
              </label>
              <input
                type="text"
                value={resetConfirmWord}
                onChange={(e) => setResetConfirmWord(e.target.value)}
                disabled={isResetting}
                placeholder="اكتب تأكيد هنا..."
                className="w-full p-3 bg-slate-950 border border-slate-750 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 rounded-xl text-xs text-white placeholder-slate-600 font-bold transition text-center tracking-wider"
              />
            </div>

            {/* Success message inside modal if done */}
            {resetSuccessMessage && (
              <div className="p-4 rounded-2xl bg-emerald-950/90 border border-emerald-500 flex items-center gap-3 text-emerald-200 text-xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="font-bold">{resetSuccessMessage} جاري إعادة تحميل التطبيق بحالته الجديدة...</span>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowResetModal(false);
                  setResetConfirmWord('');
                }}
                disabled={isResetting}
                className="px-5 py-3 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white font-bold rounded-xl text-xs transition cursor-pointer"
              >
                إلغاء وتراجع
              </button>

              <button
                type="button"
                onClick={handleExecuteFactoryReset}
                disabled={!isResetAllowed || isResetting}
                className={`px-6 py-3 rounded-xl text-xs font-black flex items-center gap-2 transition cursor-pointer ${
                  isResetAllowed && !isResetting
                    ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-rose-950/80'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-750'
                }`}
              >
                {isResetting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>جاري المسح وإعادة الضبط...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>مسح كل البيانات وتأكيد ضبط المصنع</span>
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
