// Typography & Custom Font Management Service for Cash Management App
// Supports Presets, Google Fonts, and Custom Uploaded Font Files (.ttf, .otf, .woff, .woff2) stored via IndexedDB

export interface TypographySettings {
  fontType: 'preset' | 'custom' | 'system';
  presetFontId: string;
  customFontName: string;
  customFontFileName?: string;
  customFontFileSize?: number;
  fontSizeScale: number; // 80 to 140
  fontWeightBase: string; // '300' | '400' | '500' | '600' | '700'
  fontWeightBold: string; // '600' | '700' | '800' | '900'
  lineHeight: number; // 1.3 to 2.0
  letterSpacing: number; // -1 to 2
  wordSpacing: number; // -1 to 4
}

export interface FontPreset {
  id: string;
  nameAr: string;
  nameEn: string;
  fontFamily: string;
  category: string;
  description: string;
  sampleText: string;
}

export const ARABIC_FONT_PRESETS: FontPreset[] = [
  {
    id: 'cairo',
    nameAr: 'كايرو (Cairo)',
    nameEn: 'Cairo',
    fontFamily: "'Cairo', sans-serif",
    category: 'الافتراضي المالي',
    description: 'الخط الرسمي الافتراضي للأنظمة المصرفية والمالية، دقة عالية وتوافق تام',
    sampleText: 'تحويل مالي بقيمة 15,000 ج.م'
  },
  {
    id: 'tajawal',
    nameAr: 'تجوّل (Tajawal)',
    nameEn: 'Tajawal',
    fontFamily: "'Tajawal', sans-serif",
    category: 'هندسي عصري',
    description: 'خط هندسي نقي وواضح ومريح جداً للعين في الجداول وسجلات الحسابات',
    sampleText: 'رصيد المحفظة الحالي: 240,000 ج.م'
  },
  {
    id: 'almarai',
    nameAr: 'المراعي (Almarai)',
    nameEn: 'Almarai',
    fontFamily: "'Almarai', sans-serif",
    category: 'واجهات الشركات',
    description: 'خط عربي مخصص لواجهات وتطبيقات الويب والشركات المالية الحديثة',
    sampleText: 'الحد اليومي المستهلك: 75%'
  },
  {
    id: 'ibm-plex',
    nameAr: 'آي بي إم بلكس (IBM Plex Sans)',
    nameEn: 'IBM Plex Sans Arabic',
    fontFamily: "'IBM Plex Sans Arabic', sans-serif",
    category: 'أنظمة المؤسسات',
    description: 'خط احترافي ذو مقاييس هندسية متقدمة من IBM، رائع للأرقام واللوحات البيانية',
    sampleText: 'تقرير العمليات الصادرة والواردة'
  },
  {
    id: 'alexandria',
    nameAr: 'الإسكندرية (Alexandria)',
    nameEn: 'Alexandria',
    fontFamily: "'Alexandria', sans-serif",
    category: 'أنيق ومعاصر',
    description: 'تصميم عربي رشيق وعصري يمنح شاشات البرنامج مظهراً فائق الحداثة',
    sampleText: 'إدارة خطوط الكاش والمحافظ الذكية'
  },
  {
    id: 'readex',
    nameAr: 'ريدكس برو (Readex Pro)',
    nameEn: 'Readex Pro',
    fontFamily: "'Readex Pro', sans-serif",
    category: 'قراءة فائقة السهولة',
    description: 'مصمم خصيصاً لتحقيق أعلى درجات الوضوح والسرعة في القراءة والمسح البصري',
    sampleText: 'إشعار تحويل فوري مكتمل بنجاح'
  },
  {
    id: 'noto',
    nameAr: 'نوتو سانس (Noto Sans Arabic)',
    nameEn: 'Noto Sans Arabic',
    fontFamily: "'Noto Sans Arabic', sans-serif",
    category: 'معياري عالمي',
    description: 'خط شركة Google العالمي عالي الثبات والمصمم لعدم تشويه أي حرف عربي',
    sampleText: 'محفظة فودافون كاش - خط المعادي'
  },
  {
    id: 'changa',
    nameAr: 'تشانغا (Changa)',
    nameEn: 'Changa',
    fontFamily: "'Changa', sans-serif",
    category: 'بارز وجريء',
    description: 'خط عريض وجذاب يعطي حضوراً قوياً للعناوين والأرقام الإجمالية',
    sampleText: 'إجمالي الحركات اليومية: 48 عملية'
  },
  {
    id: 'amiri',
    nameAr: 'أميري (Amiri)',
    nameEn: 'Amiri',
    fontFamily: "'Amiri', serif",
    category: 'نسخ تقليدي عريق',
    description: 'خط النسخ الكلاسيكي الفاخر، مناسب للفواتير والإيصالات والتقارير المطبوعة',
    sampleText: 'إيصال استلام رسمي معتمد'
  },
  {
    id: 'system',
    nameAr: 'خط النظام (System UI)',
    nameEn: 'System Default',
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    category: 'افتراضي المنصة',
    description: 'الخط الافتراضي لجهازك ونظام التشغيل الخاص بك',
    sampleText: 'الخط الأصلي للنظام والواجهة'
  }
];

export const DEFAULT_TYPOGRAPHY_SETTINGS: TypographySettings = {
  fontType: 'preset',
  presetFontId: 'cairo',
  customFontName: 'الخط المخصص',
  fontSizeScale: 100, // 100%
  fontWeightBase: '400',
  fontWeightBold: '700',
  lineHeight: 1.6,
  letterSpacing: 0,
  wordSpacing: 0
};

const STORAGE_KEY = 'cash_app_typography_settings';
const DB_NAME = 'CashAppTypographyDB';
const DB_VERSION = 1;
const STORE_NAME = 'customFonts';
const FONT_RECORD_ID = 'active_custom_font';

// Open or initialize IndexedDB
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB is not supported'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export interface CustomFontRecord {
  id: string;
  name: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  dataUrl: string; // Base64 data URL
  updatedAt: string;
}

// Save uploaded font file to IndexedDB
export async function saveCustomFontToDB(
  fontName: string,
  fileName: string,
  fileSize: number,
  mimeType: string,
  dataUrl: string
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const record: CustomFontRecord = {
      id: FONT_RECORD_ID,
      name: fontName,
      fileName,
      fileSize,
      mimeType,
      dataUrl,
      updatedAt: new Date().toISOString()
    };
    const req = store.put(record);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// Retrieve custom font record from IndexedDB
export async function getCustomFontFromDB(): Promise<CustomFontRecord | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(FONT_RECORD_ID);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn('Failed to read custom font from IndexedDB:', e);
    return null;
  }
}

// Delete custom font from IndexedDB
export async function deleteCustomFontFromDB(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(FONT_RECORD_ID);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn('Failed to delete custom font from IndexedDB:', e);
  }
}

// Read settings from localStorage
export function loadTypographySettings(): TypographySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_TYPOGRAPHY_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.error('Failed to parse typography settings from localStorage', e);
  }
  return { ...DEFAULT_TYPOGRAPHY_SETTINGS };
}

// Save settings to localStorage
export function saveTypographySettings(settings: TypographySettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save typography settings to localStorage', e);
  }
}

// Inject or remove custom @font-face style tag in document head
function injectCustomFontFace(fontFamilyName: string, dataUrl: string, mimeType: string): void {
  let styleEl = document.getElementById('app-custom-uploaded-font-style') as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'app-custom-uploaded-font-style';
    document.head.appendChild(styleEl);
  }

  // Determine font format
  let format = 'truetype';
  if (mimeType.includes('woff2') || dataUrl.includes('font/woff2')) format = 'woff2';
  else if (mimeType.includes('woff') || dataUrl.includes('font/woff')) format = 'woff';
  else if (mimeType.includes('opentype') || mimeType.includes('otf')) format = 'opentype';

  styleEl.textContent = `
    @font-face {
      font-family: '${fontFamilyName}';
      src: url('${dataUrl}') format('${format}');
      font-weight: 100 900;
      font-style: normal;
      font-display: swap;
    }
  `;
}

function removeCustomFontFace(): void {
  const styleEl = document.getElementById('app-custom-uploaded-font-style');
  if (styleEl) {
    styleEl.remove();
  }
}

// In-memory cache for fast switching
let cachedCustomFontRecord: CustomFontRecord | null = null;

// Apply all typography settings directly to the DOM
export async function applyTypography(settings: TypographySettings): Promise<void> {
  const doc = document.documentElement;

  // 1. Determine font family
  let targetFontFamily = "'Cairo', sans-serif";

  if (settings.fontType === 'custom') {
    if (!cachedCustomFontRecord) {
      cachedCustomFontRecord = await getCustomFontFromDB();
    }
    if (cachedCustomFontRecord && cachedCustomFontRecord.dataUrl) {
      const customFamilyName = 'AppCustomUploadedFont';
      injectCustomFontFace(customFamilyName, cachedCustomFontRecord.dataUrl, cachedCustomFontRecord.mimeType);
      targetFontFamily = `'${customFamilyName}', 'Cairo', -apple-system, sans-serif`;
    } else {
      // Fallback to cairo if custom font record missing
      targetFontFamily = "'Cairo', sans-serif";
    }
  } else if (settings.fontType === 'system') {
    removeCustomFontFace();
    targetFontFamily = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  } else {
    removeCustomFontFace();
    const preset = ARABIC_FONT_PRESETS.find(p => p.id === settings.presetFontId);
    targetFontFamily = preset ? preset.fontFamily : "'Cairo', sans-serif";
  }

  // 2. Set root CSS custom properties
  doc.style.setProperty('--app-font-family', targetFontFamily);
  doc.style.setProperty('--app-font-scale-num', String(settings.fontSizeScale || 100));
  doc.style.setProperty('--app-font-weight-base', settings.fontWeightBase || '400');
  doc.style.setProperty('--app-font-weight-bold', settings.fontWeightBold || '700');
  doc.style.setProperty('--app-line-height', String(settings.lineHeight || 1.6));
  doc.style.setProperty('--app-letter-spacing', `${settings.letterSpacing || 0}px`);
  doc.style.setProperty('--app-word-spacing', `${settings.wordSpacing || 0}px`);

  // Direct element style overrides for immediate zero-delay rendering
  document.body.style.fontFamily = targetFontFamily;
  document.body.style.lineHeight = String(settings.lineHeight || 1.6);
  document.body.style.letterSpacing = `${settings.letterSpacing || 0}px`;
  document.body.style.wordSpacing = `${settings.wordSpacing || 0}px`;
}

// Initialize typography during app boot
export async function initializeTypography(): Promise<TypographySettings> {
  const settings = loadTypographySettings();
  try {
    cachedCustomFontRecord = await getCustomFontFromDB();
  } catch (e) {
    console.warn('Initial custom font load failed:', e);
  }
  await applyTypography(settings);
  return settings;
}

// Convert a File object to base64 data URL
export function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
