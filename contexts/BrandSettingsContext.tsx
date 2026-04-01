import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@livdaily_brand_settings';

export interface BrandSettings {
  primaryHex: string;
  secondaryHex: string;
  fontSize: number;
  lineHeightMultiplier: number;
  manualOverride: string;
}

const DEFAULT_SETTINGS: BrandSettings = {
  primaryHex: '#FFD580',
  secondaryHex: '#FF6B35',
  fontSize: 17,
  lineHeightMultiplier: 1.65,
  manualOverride: '',
};

interface BrandSettingsContextType {
  brandSettings: BrandSettings;
  updateSettings: (partial: Partial<BrandSettings>) => Promise<void>;
  isLoaded: boolean;
}

const BrandSettingsContext = createContext<BrandSettingsContextType | null>(null);

export function BrandSettingsProvider({ children }: { children: React.ReactNode }) {
  const [brandSettings, setBrandSettings] = useState<BrandSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<BrandSettings>;
          setBrandSettings({ ...DEFAULT_SETTINGS, ...parsed });
        }
      } catch (e) {
        console.log('[BrandSettings] Failed to load settings from AsyncStorage:', e);
      } finally {
        setIsLoaded(true);
      }
    };
    load();
  }, []);

  const updateSettings = useCallback(async (partial: Partial<BrandSettings>) => {
    console.log('[BrandSettings] Saving settings:', partial);
    const next = { ...brandSettings, ...partial };
    setBrandSettings(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      console.log('[BrandSettings] Settings saved successfully');
    } catch (e) {
      console.log('[BrandSettings] Failed to save settings:', e);
    }
  }, [brandSettings]);

  return (
    <BrandSettingsContext.Provider value={{ brandSettings, updateSettings, isLoaded }}>
      {children}
    </BrandSettingsContext.Provider>
  );
}

export function useBrandSettings() {
  const ctx = useContext(BrandSettingsContext);
  if (!ctx) throw new Error('useBrandSettings must be used within BrandSettingsProvider');
  return ctx;
}
