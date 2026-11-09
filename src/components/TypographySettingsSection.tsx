import React, { useState, useRef } from 'react';
import { useTypography } from '../context/TypographyContext';
import { 
  Type, 
  Upload, 
  Trash2, 
  RotateCcw, 
  Check, 
  CheckCircle2, 
  Sliders, 
  Eye, 
  Sparkles, 
  AlertCircle,
  FileCheck,
  Save,
  HelpCircle
} from 'lucide-react';

export const TypographySettingsSection: React.FC = () => {
  const {
    settings,
    customFont,
    presets,
    updateSettings,
    saveSettings,
    uploadCustomFont,
    removeCustomFont,
    resetToDefaults,
    isSaving,
    hasUnsavedChanges
  } = useTypography();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [customNameInput, setCustomNameInput] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);
  const [previewTestText, setPreviewTestText] = useState('نظام إدارة التحويلات المالية الذكي · رصيد 125,000 ج.م');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);
    try {
      const res = await uploadCustomFont(file, customNameInput.trim() || undefined);
      if (!res.success) {
        setUploadError(res.error || 'فشل رفع وتثبيت ملف الخط');
      } else {
        setCustomNameInput('');
        setSaveSuccessMsg(true);
        setTimeout(() => setSaveSuccessMsg(false), 3500);
      }
    } catch (err: any) {
      setUploadError(err.message || 'خطأ أثناء رفع ملف الخط');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleManualSave = async () => {
    await saveSettings();
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 3500);
  };

  const handleReset = async () => {
    if (window.confirm('هل تريد بالتأكيد إعادة ضبط إعدادات الخط وحجمه إلى الوضع الافتراضي للبرنامج؟')) {
      await resetToDefaults();
      setSaveSuccessMsg(true);
      setTimeout(() => setSaveSuccessMsg(false), 3500);
    }
  };

  // Get human-friendly font name
  const currentFontDisplayName = settings.fontType === 'custom' 
    ? (customFont?.name || 'خط مخصص تم رفعه')
    : settings.fontType === 'system'
    ? 'خط النظام الافتراضي'
    : (presets.find(p => p.id === settings.presetFontId)?.nameAr || 'كايرو (Cairo)');

  return (
    <div className="space-y-6">
      
      {/* Notifications */}
      {saveSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-950/70 border border-emerald-500/50 flex items-center gap-3 text-emerald-200 text-xs shadow-lg animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="font-semibold">تم حفظ وتثبيت إعدادات الخط وتطبيقها بنجاح على كافة شاشات البرنامج!</span>
        </div>
      )}

      {uploadError && (
        <div className="p-4 rounded-2xl bg-red-950/70 border border-red-500/50 flex items-center gap-3 text-red-200 text-xs shadow-lg">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Active Font Summary Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <Type className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-400 font-semibold">الخط النشط حالياً:</span>
              <span className="text-sm font-extrabold text-white px-3 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {currentFontDisplayName}
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                الحجم: {settings.fontSizeScale}%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              يتم تطبيق هذا الخط مباشرة وبشكل متناسق على كافة نوافذ البرنامج، الجداول، الإيصالات والحسابات.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-center shrink-0">
          <button
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
            title="استعادة الخط الافتراضي"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>الوضع الافتراضي</span>
          </button>

          <button
            type="button"
            onClick={handleManualSave}
            disabled={isSaving}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition cursor-pointer ${
              hasUnsavedChanges
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 animate-pulse'
                : 'bg-emerald-700 hover:bg-emerald-600 text-white shadow-emerald-700/20'
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'جاري الحفظ...' : hasUnsavedChanges ? 'تثبيت وحفظ التغييرات' : 'تم الحفظ'}</span>
          </button>
        </div>
      </div>

      {/* Section 1: Arabic Font Presets Selection */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Type className="w-4 h-4 text-emerald-400" />
              اختيار نوع واسم الخط من القائمة المعتمدة
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              مجموعة مختارة من أشهر وأفضل الخطوط العربية المصرفية والهندسية للواجهات
            </p>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            {presets.length} خطوط جاهزة
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
          {presets.map((preset) => {
            const isSelected = settings.fontType === 'preset' && settings.presetFontId === preset.id;
            return (
              <div
                key={preset.id}
                onClick={() => {
                  updateSettings({
                    fontType: 'preset',
                    presetFontId: preset.id
                  });
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between select-none ${
                  isSelected
                    ? 'bg-emerald-950/40 border-emerald-500 shadow-md shadow-emerald-950/50 ring-1 ring-emerald-500/50'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                }`}
              >
                {/* Header row */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-bold text-sm text-white" style={{ fontFamily: preset.fontFamily }}>
                      {preset.nameAr}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                      {preset.category}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2 mb-3">
                    {preset.description}
                  </p>
                </div>

                {/* Live Sample Box in that exact font */}
                <div 
                  className={`p-2.5 rounded-xl border text-xs text-right mt-auto transition ${
                    isSelected ? 'bg-slate-900 border-emerald-500/40 text-emerald-200' : 'bg-slate-900/60 border-slate-800/80 text-slate-300'
                  }`}
                  style={{ fontFamily: preset.fontFamily }}
                >
                  <span className="block truncate">{preset.sampleText}</span>
                  <span className="block text-[10px] opacity-75 font-mono mt-0.5">123,456.78 ج.م · 01012345678</span>
                </div>

                {/* Selection checkmark icon */}
                {isSelected && (
                  <div className="absolute top-3 left-3 w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: Upload Custom Font File */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Upload className="w-4 h-4 text-cyan-400" />
              رفع خط مخصص من جهازك وحفظه
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              يمكنك رفع أي ملف خط خاص بك (.ttf, .otf, .woff, .woff2) وسيتم حفظه وتطبيقه على كافة أجزاء البرنامج
            </p>
          </div>

          {settings.fontType === 'custom' && customFont && (
            <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center gap-1.5 self-start">
              <Sparkles className="w-3.5 h-3.5" />
              الخط المخصص مفعل حالياً
            </span>
          )}
        </div>

        {/* Upload Input Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-1">
          <div className="lg:col-span-2">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-cyan-500/80 bg-slate-950/60 hover:bg-slate-950 p-6 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".ttf,.otf,.woff,.woff2"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 group-hover:scale-110 flex items-center justify-center mb-3 transition">
                <Upload className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">
                اضغط هنا لاختيار ملف الخط من جهازك
              </h3>
              <p className="text-xs text-slate-400 mb-2">
                الصيغ المدعومة: TTF, OTF, WOFF, WOFF2 (حتى 10 ميجابايت)
              </p>
              <span className="text-[10px] px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                يتم حفظ ملف الخط محلياً في قاعدة بيانات المتصفح ولا يحتاج لإنترنت
              </span>
            </div>
          </div>

          {/* Active / Uploaded Font Info Card */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-slate-300 block mb-2">
                بيانات الخط المرفوع:
              </span>
              {customFont ? (
                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs mb-1">
                      <FileCheck className="w-4 h-4" />
                      <span>{customFont.name}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono space-y-0.5">
                      <div>الملف: {customFont.fileName}</div>
                      <div>الحجم: {(customFont.fileSize / 1024).toFixed(1)} كيلوبايت</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        updateSettings({ fontType: 'custom' });
                      }}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        settings.fontType === 'custom'
                          ? 'bg-cyan-600 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-cyan-300'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>تفعيل هذا الخط</span>
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        if (window.confirm('هل تريد حذف ملف الخط المخصص وإزالته نهائياً؟')) {
                          await removeCustomFont();
                        }
                      }}
                      className="p-2 rounded-xl bg-red-950/50 hover:bg-red-900/60 text-red-400 border border-red-800/50 transition cursor-pointer"
                      title="حذف الخط المخصص"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/60 text-center text-slate-500 text-xs">
                  لا يوجد خط مخصص مرفوع حالياً. يمكنك رفع ملف خط في أي وقت.
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 text-[10px] text-slate-500 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>يتم الحفظ الدائم في المتصفح وتلقائي مع النسخ الاحتياطي.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Font Size & Scale Control */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              التحكم في حجم ونسبة تكبير الخط
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              تكبير أو تصغير حجم نصوص وأرقام كافة أجزاء البرنامج بنسب متناسقة مع الحفاظ على وضوح الشاشة
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold">النسبة الحالية:</span>
            <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 font-mono font-bold text-sm border border-emerald-500/30">
              {settings.fontSizeScale}%
            </span>
          </div>
        </div>

        {/* Slider */}
        <div className="space-y-3 pt-2">
          <input
            type="range"
            min="80"
            max="140"
            step="5"
            value={settings.fontSizeScale}
            onChange={(e) => updateSettings({ fontSizeScale: Number(e.target.value) })}
            className="w-full h-2.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />

          <div className="flex justify-between text-[11px] text-slate-500 font-mono px-1">
            <span>80% (مضغوط)</span>
            <span>100% (القياسي)</span>
            <span>120% (كبير مريح)</span>
            <span>140% (أقصى تكبير)</span>
          </div>
        </div>

        {/* Quick Size Preset Buttons */}
        <div className="pt-2">
          <label className="block text-xs font-semibold text-slate-300 mb-2">
            أحجام سريعة ومقترحة:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {[
              { label: 'صغير جداً', scale: 85 },
              { label: 'صغير', scale: 90 },
              { label: 'قياسي (افتراضي)', scale: 100 },
              { label: 'متوسط مريح', scale: 110 },
              { label: 'كبير وواضح', scale: 120 },
              { label: 'كبير جداً', scale: 130 },
            ].map((btn) => (
              <button
                key={btn.scale}
                type="button"
                onClick={() => updateSettings({ fontSizeScale: btn.scale })}
                className={`py-2 px-3 rounded-xl text-xs font-semibold transition cursor-pointer border text-center ${
                  settings.fontSizeScale === btn.scale
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-950 font-bold'
                    : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
                }`}
              >
                <div>{btn.label}</div>
                <div className="text-[10px] font-mono opacity-80 mt-0.5">{btn.scale}%</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Section 4: Advanced Typography Properties (Weight, Line-height, Spacing) */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-5">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-purple-400" />
            خصائص الخط المتقدمة (السُمك، ارتفاع الأسطر، التباعد)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            ضبط دقيق لوزن الخط وسُمك العناوين والمسافات الرأسية
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-1">
          {/* Base Font Weight */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300">
              سُمك الخط للنصوص العادية (Base Weight)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'خفيف (300)', weight: '300' },
                { label: 'عادي قياسي (400)', weight: '400' },
                { label: 'متوسط (500)', weight: '500' },
                { label: 'شبه عريض (600)', weight: '600' },
              ].map(item => (
                <button
                  key={item.weight}
                  type="button"
                  onClick={() => updateSettings({ fontWeightBase: item.weight })}
                  className={`p-2.5 rounded-xl text-xs transition cursor-pointer border text-center ${
                    settings.fontWeightBase === item.weight
                      ? 'bg-purple-950/80 text-purple-200 border-purple-500 font-bold'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-900'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bold Weight for Headings */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300">
              سُمك العناوين والأرقام البارزة (Bold Weight)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'شبه عريض (600)', weight: '600' },
                { label: 'عريض قياسي (700)', weight: '700' },
                { label: 'سميك جداً (800)', weight: '800' },
                { label: 'أسود ضخم (900)', weight: '900' },
              ].map(item => (
                <button
                  key={item.weight}
                  type="button"
                  onClick={() => updateSettings({ fontWeightBold: item.weight })}
                  className={`p-2.5 rounded-xl text-xs transition cursor-pointer border text-center ${
                    settings.fontWeightBold === item.weight
                      ? 'bg-purple-950/80 text-purple-200 border-purple-500 font-bold'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-900'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Line Height */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300">
              ارتفاع السطر والتباعد الرأسي (Line Height)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'مضغوط (1.35)', value: 1.35 },
                { label: 'متوازن (1.5)', value: 1.5 },
                { label: 'قياسي (1.6)', value: 1.6 },
                { label: 'مريح فسيح (1.8)', value: 1.8 },
              ].map(item => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => updateSettings({ lineHeight: item.value })}
                  className={`p-2.5 rounded-xl text-xs transition cursor-pointer border text-center ${
                    settings.lineHeight === item.value
                      ? 'bg-purple-950/80 text-purple-200 border-purple-500 font-bold'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-900'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Word Spacing / Letter Spacing */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300">تباعد الكلمات (Word Spacing)</span>
              <span className="text-[11px] font-mono text-emerald-400">{settings.wordSpacing} بكسل</span>
            </div>
            <div className="flex gap-2">
              {[0, 1, 2, 3].map(px => (
                <button
                  key={px}
                  type="button"
                  onClick={() => updateSettings({ wordSpacing: px })}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-mono transition cursor-pointer border ${
                    settings.wordSpacing === px
                      ? 'bg-emerald-600 text-white border-emerald-500 font-bold'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  {px === 0 ? 'عادي (0)' : `+${px}px`}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300">تباعد الحروف (Letter Spacing)</span>
              <span className="text-[11px] font-mono text-cyan-400">{settings.letterSpacing} بكسل</span>
            </div>
            <div className="flex gap-2">
              {[0, 0.5, 1].map(px => (
                <button
                  key={px}
                  type="button"
                  onClick={() => updateSettings({ letterSpacing: px })}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-mono transition cursor-pointer border ${
                    settings.letterSpacing === px
                      ? 'bg-cyan-600 text-white border-cyan-500 font-bold'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  {px === 0 ? 'افتراضي (0)' : `+${px}px`}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 mt-1.5">
              * يُنصح بترك تباعد الحروف عند (0) في اللغة العربية للحفاظ على اتصال الحروف السليم.
            </p>
          </div>
        </div>
      </div>

      {/* Section 5: Live Interactive Typography Preview */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Eye className="w-4 h-4 text-amber-400" />
            شاشة المعاينة الحية والتجربة المباشرة
          </h2>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
            تحديث فوري
          </span>
        </div>

        <p className="text-xs text-slate-400">
          هذه الشاشة تعكس تماماً كيف تظهر العناوين، الأرقام المالية، الإشعارات، والبيانات بالخط والحجم المختارين:
        </p>

        {/* Live Mock UI components */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Balance Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800">
            <div className="text-[11px] text-slate-400 mb-1">إجمالي الرصيد المتاح</div>
            <div className="text-xl font-extrabold text-emerald-400 font-mono">
              145,280.00 <span className="text-xs font-sans font-bold text-emerald-300">ج.م</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>12 خط كاش نشط ومتصل</span>
            </div>
          </div>

          {/* Transaction Mock */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-white">تحويل فوري صادر</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                مكتمل
              </span>
            </div>
            <div className="text-xs text-slate-300 mb-1">
              إلى محفظة: <span className="font-mono text-white">01098765432</span> (فودافون كاش)
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              المبلغ: 3,500.00 ج.م · رسوم: 10.00 ج.م
            </div>
          </div>

          {/* Limit Alert Mock */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="text-xs font-bold text-white mb-1">استهلاك الحد اليومي</div>
            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden my-2 border border-slate-800">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: '65%' }}></div>
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>المتبقي: 21,000 ج.م</span>
              <span>65%</span>
            </div>
          </div>
        </div>

        {/* Interactive Custom Text Field */}
        <div className="pt-2">
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            اكتب أي نص أو أرقام هنا لتجربة مظهر الخط مباشرة:
          </label>
          <input
            type="text"
            value={previewTestText}
            onChange={(e) => setPreviewTestText(e.target.value)}
            className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:border-emerald-500 focus:outline-none transition"
            placeholder="اكتب هنا لتجربة الخط..."
          />
        </div>
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>يتم حفظ وتطبيق التغييرات تلقائياً وفورياً على جهازك.</span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleReset}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700 transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>إعادة تعيين الخط</span>
          </button>

          <button
            type="button"
            onClick={handleManualSave}
            disabled={isSaving}
            className="flex-1 sm:flex-none px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'جاري الحفظ...' : 'حفظ وتثبيت إعدادات الخط'}</span>
          </button>
        </div>
      </div>

    </div>
  );
};
