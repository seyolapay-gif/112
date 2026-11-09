import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  TypographySettings,
  DEFAULT_TYPOGRAPHY_SETTINGS,
  CustomFontRecord,
  loadTypographySettings,
  saveTypographySettings,
  applyTypography,
  initializeTypography,
  saveCustomFontToDB,
  getCustomFontFromDB,
  deleteCustomFontFromDB,
  fileToDataURL,
  ARABIC_FONT_PRESETS,
  FontPreset
} from '../services/typographyService';

interface TypographyContextType {
  settings: TypographySettings;
  customFont: CustomFontRecord | null;
  presets: FontPreset[];
  updateSettings: (newSettings: Partial<TypographySettings>) => void;
  saveSettings: () => Promise<void>;
  uploadCustomFont: (file: File, customName?: string) => Promise<{ success: boolean; error?: string }>;
  removeCustomFont: () => Promise<void>;
  resetToDefaults: () => Promise<void>;
  isInitialized: boolean;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
}

const TypographyContext = createContext<TypographyContextType | undefined>(undefined);

export const TypographyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<TypographySettings>(DEFAULT_TYPOGRAPHY_SETTINGS);
  const [persistedSettings, setPersistedSettings] = useState<TypographySettings>(DEFAULT_TYPOGRAPHY_SETTINGS);
  const [customFont, setCustomFont] = useState<CustomFontRecord | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const loaded = await initializeTypography();
        const storedCustomFont = await getCustomFontFromDB();
        if (mounted) {
          setSettings(loaded);
          setPersistedSettings(loaded);
          setCustomFont(storedCustomFont);
          setIsInitialized(true);
        }
      } catch (err) {
        console.error('Failed to initialize typography context:', err);
        if (mounted) setIsInitialized(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Whenever settings change, apply immediately to DOM for instant live preview
  useEffect(() => {
    if (isInitialized) {
      applyTypography(settings);
    }
  }, [settings, isInitialized]);

  const updateSettings = useCallback((partial: Partial<TypographySettings>) => {
    setSettings(prev => ({ ...prev, ...partial }));
  }, []);

  const saveSettings = useCallback(async () => {
    setIsSaving(true);
    try {
      saveTypographySettings(settings);
      setPersistedSettings(settings);
      await applyTypography(settings);
    } finally {
      setIsSaving(false);
    }
  }, [settings]);

  const uploadCustomFont = useCallback(async (file: File, customName?: string): Promise<{ success: boolean; error?: string }> => {
    const validExtensions = ['.ttf', '.otf', '.woff', '.woff2'];
    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    if (!validExtensions.includes(fileExt)) {
      return {
        success: false,
        error: `نوع الملف غير مدعوم (${fileExt}). يرجى رفع ملف خط بصيغة TTF, OTF, WOFF, أو WOFF2.`
      };
    }

    // Limit font file size to 10MB
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return {
        success: false,
        error: `حجم ملف الخط كبير جداً (${(file.size / (1024 * 1024)).toFixed(1)} ميجابايت). الحد الأقصى المسموح به هو 10 ميجابايت.`
      };
    }

    try {
      const dataUrl = await fileToDataURL(file);
      const fontDisplayName = customName?.trim() || file.name.replace(/\.[^/.]+$/, '');
      
      await saveCustomFontToDB(
        fontDisplayName,
        file.name,
        file.size,
        file.type || `font/${fileExt.replace('.', '')}`,
        dataUrl
      );

      const record: CustomFontRecord = {
        id: 'active_custom_font',
        name: fontDisplayName,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || `font/${fileExt.replace('.', '')}`,
        dataUrl,
        updatedAt: new Date().toISOString()
      };

      setCustomFont(record);

      // Auto switch fontType to 'custom' and apply immediately
      const newSettings: TypographySettings = {
        ...settings,
        fontType: 'custom',
        customFontName: fontDisplayName,
        customFontFileName: file.name,
        customFontFileSize: file.size
      };

      setSettings(newSettings);
      saveTypographySettings(newSettings);
      setPersistedSettings(newSettings);
      await applyTypography(newSettings);

      return { success: true };
    } catch (err: any) {
      console.error('Failed to upload custom font:', err);
      return {
        success: false,
        error: err.message || 'حدث خطأ أثناء معالجة وحفظ ملف الخط في قاعدة البيانات المحلية.'
      };
    }
  }, [settings]);

  const removeCustomFont = useCallback(async () => {
    await deleteCustomFontFromDB();
    setCustomFont(null);

    // Revert back to preset 'cairo'
    const newSettings: TypographySettings = {
      ...settings,
      fontType: 'preset',
      presetFontId: 'cairo',
      customFontName: 'الخط المخصص',
      customFontFileName: undefined,
      customFontFileSize: undefined
    };

    setSettings(newSettings);
    saveTypographySettings(newSettings);
    setPersistedSettings(newSettings);
    await applyTypography(newSettings);
  }, [settings]);

  const resetToDefaults = useCallback(async () => {
    setSettings(DEFAULT_TYPOGRAPHY_SETTINGS);
    saveTypographySettings(DEFAULT_TYPOGRAPHY_SETTINGS);
    setPersistedSettings(DEFAULT_TYPOGRAPHY_SETTINGS);
    await applyTypography(DEFAULT_TYPOGRAPHY_SETTINGS);
  }, []);

  const hasUnsavedChanges = JSON.stringify(settings) !== JSON.stringify(persistedSettings);

  return (
    <TypographyContext.Provider
      value={{
        settings,
        customFont,
        presets: ARABIC_FONT_PRESETS,
        updateSettings,
        saveSettings,
        uploadCustomFont,
        removeCustomFont,
        resetToDefaults,
        isInitialized,
        isSaving,
        hasUnsavedChanges
      }}
    >
      {children}
    </TypographyContext.Provider>
  );
};

export const useTypography = () => {
  const context = useContext(TypographyContext);
  if (!context) {
    throw new Error('useTypography must be used within a TypographyProvider');
  }
  return context;
};
