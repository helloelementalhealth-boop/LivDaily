import React, { createContext, useContext, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface BrandSettings {
  fontSize: number;
  lineHeightMultiplier: number;
  manualOverride: string;
}

const DEFAULT_BRAND_SETTINGS: BrandSettings = {
  fontSize: 17,
  lineHeightMultiplier: 1.65,
  manualOverride: '',
};

interface BrandSettingsContextValue {
  brandSettings: BrandSettings;
  loadBrandSettings: () => Promise<void>;
  saveBrandSettings: (settings: Partial<BrandSettings>) => Promise<void>;
}

const BrandSettingsContext = createContext<BrandSettingsContextValue>({
  brandSettings: DEFAULT_BRAND_SETTINGS,
  loadBrandSettings: async () => {},
  saveBrandSettings: async () => {},
});

const STORAGE_KEY = 'ld_brand_settings';

export function BrandSettingsProvider({ children }: { children: React.ReactNode }) {
  const [brandSettings, setBrandSettings] = useState<BrandSettings>(DEFAULT_BRAND_SETTINGS);

  const loadBrandSettings = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<BrandSettings>;
        setBrandSettings({ ...DEFAULT_BRAND_SETTINGS, ...parsed });
      }
    } catch (e) {
      console.warn('[BrandSettings] load error:', e);
    }
  }, []);

  const saveBrandSettings = useCallback(async (settings: Partial<BrandSettings>) => {
    try {
      const updated = { ...brandSettings, ...settings };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setBrandSettings(updated);
      console.log('[BrandSettings] saved:', settings);
    } catch (e) {
      console.warn('[BrandSettings] save error:', e);
    }
  }, [brandSettings]);

  return (
    <BrandSettingsContext.Provider value={{ brandSettings, loadBrandSettings, saveBrandSettings }}>
      {children}
    </BrandSettingsContext.Provider>
  );
}

export function useBrandSettings() {
  return useContext(BrandSettingsContext);
}
