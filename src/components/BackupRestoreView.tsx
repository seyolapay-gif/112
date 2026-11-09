import React, { useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Database, 
  Download, 
  Upload, 
  AlertTriangle, 
  CheckCircle2, 
  HardDriveDownload, 
  HardDriveUpload,
  RefreshCw
} from 'lucide-react';

export const BackupRestoreView: React.FC = () => {
  const { canManageSettings } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState<string | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  const handleDownloadBackup = async () => {
    setIsExporting(true);
    try {
      const data = await api.downloadBackup();
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(data, null, 2)
      )}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute(
        'download',
        `cash_transfers_backup_${new Date().toISOString().slice(0, 10)}.json`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err: any) {
      alert(err.message || 'فشل تنزيل النسخة الاحتياطية');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('تحذير: استعادة النسخة الاحتياطية ستقوم باستبدال البيانات الحالية بالكامل. هل تريد المتابعة؟')) {
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setIsRestoring(true);
        setRestoreError(null);
        setRestoreSuccess(null);
        const parsed = JSON.parse(event.target?.result as string);
        await api.restoreBackup(parsed);
        setRestoreSuccess('تمت استعادة البيانات وقاعدة البيانات بنجاح!');
      } catch (err: any) {
        setRestoreError(err.message || 'ملف النسخة الاحتياطية غير صالح أو تالف');
      } finally {
        setIsRestoring(false);
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 pb-12 font-sans selection:bg-emerald-500 selection:text-white" dir="rtl">
      
      {/* Header */}
      <div className="flex items-center justify-between bg-slate-900/60 p-5 rounded-3xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            النسخ الاحتياطي واستعادة البيانات
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            تأمين بيانات النظام وحفظ سجلات التحويلات والخطوط والمستخدمين بأمان في ملفات مشفرة
          </p>
        </div>
      </div>

      {restoreSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-950/70 border border-emerald-500/50 flex items-center gap-2 text-emerald-200 text-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{restoreSuccess}</span>
        </div>
      )}

      {restoreError && (
        <div className="p-4 rounded-2xl bg-rose-950/70 border border-rose-500/50 flex items-center gap-2 text-rose-200 text-xs">
          <AlertTriangle className="w-5 h-5 text-rose-400" />
          <span>{restoreError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Export Backup Card */}
        <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <HardDriveDownload className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white">تصدير وحفظ نسخة احتياطية كاملة</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              إنشاء نسخة كاملة من قاعدة البيانات تشمل: خطوط الكاش، رصيد كل محفظة، سجل كافة التحويلات السابقة، إعدادات الحدود المالية، والمستخدمين وسجل التدقيق.
            </p>
          </div>

          <button
            onClick={handleDownloadBackup}
            disabled={isExporting}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'جاري التصدير والتجهيز...' : 'تنزيل ملف النسخة الاحتياطية (JSON)'}</span>
          </button>
        </div>

        {/* Restore Backup Card */}
        <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <HardDriveUpload className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white">استعادة نسخة احتياطية سابقة</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              استيراد ملف نسخة احتياطية بتنسيق JSON للرجوع إلى حالة سابقة من البيانات. يرجى توخي الحذر حيث سيتم تحديث كافة السجلات.
            </p>
          </div>

          <div>
            <label className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 border border-slate-700 transition cursor-pointer">
              <Upload className="w-4 h-4 text-cyan-400" />
              <span>{isRestoring ? 'جاري الاستعادة...' : 'اختيار ملف الاستعادة من جهازك'}</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileChange}
                disabled={isRestoring || !canManageSettings}
                className="hidden"
              />
            </label>
          </div>
        </div>

      </div>

    </div>
  );
};
