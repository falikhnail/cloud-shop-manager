import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { StoreSettings, defaultStoreSettings } from '@/types/store';

interface StoreContextType {
  settings: StoreSettings;
  updateSettings: (newSettings: Partial<StoreSettings>) => void;
  updateReceiptConfig: (config: Partial<StoreSettings['receiptConfig']>) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const STORAGE_KEY = 'vapestore_settings';

export function StoreProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<StoreSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return { ...defaultStoreSettings, ...JSON.parse(saved) };
      } catch {
        return defaultStoreSettings;
      }
    }
    return defaultStoreSettings;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings: Partial<StoreSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const updateReceiptConfig = (config: Partial<StoreSettings['receiptConfig']>) => {
    setSettings(prev => ({
      ...prev,
      receiptConfig: { ...prev.receiptConfig, ...config },
    }));
  };

  return (
    <StoreContext.Provider value={{ settings, updateSettings, updateReceiptConfig }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
