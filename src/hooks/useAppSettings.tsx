import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';

export type FontFamilyKey = 'dm-sans' | 'inter' | 'poppins' | 'roboto' | 'plus-jakarta' | 'space-grotesk' | 'manrope';

export const FONT_OPTIONS: { key: FontFamilyKey; label: string; stack: string; googleName: string }[] = [
  { key: 'dm-sans', label: 'DM Sans (Default)', stack: "'DM Sans', sans-serif", googleName: 'DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000' },
  { key: 'inter', label: 'Inter', stack: "'Inter', sans-serif", googleName: 'Inter:wght@300;400;500;600;700;800' },
  { key: 'poppins', label: 'Poppins', stack: "'Poppins', sans-serif", googleName: 'Poppins:wght@300;400;500;600;700;800' },
  { key: 'roboto', label: 'Roboto', stack: "'Roboto', sans-serif", googleName: 'Roboto:wght@300;400;500;700;900' },
  { key: 'plus-jakarta', label: 'Plus Jakarta Sans', stack: "'Plus Jakarta Sans', sans-serif", googleName: 'Plus+Jakarta+Sans:wght@300;400;500;600;700;800' },
  { key: 'space-grotesk', label: 'Space Grotesk', stack: "'Space Grotesk', sans-serif", googleName: 'Space+Grotesk:wght@300;400;500;600;700' },
  { key: 'manrope', label: 'Manrope', stack: "'Manrope', sans-serif", googleName: 'Manrope:wght@300;400;500;600;700;800' },
];

export interface AppSettings {
  fontFamily: FontFamilyKey;
  fontScale: number; // 0.85 - 1.25
  primaryLight: string; // HSL "H S% L%"
  primaryDark: string;
  sidebarLight: string;
  sidebarDark: string;
  customLogoUrl: string | null;
  showBgArtwork: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  fontFamily: 'dm-sans',
  fontScale: 1,
  primaryLight: '159 71% 43%',
  primaryDark: '159 71% 48%',
  sidebarLight: '226 41% 40%',
  sidebarDark: '226 41% 28%',
  customLogoUrl: null,
  showBgArtwork: true,
};

interface AppSettingsContextValue {
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  resetSettings: () => void;
}

const AppSettingsContext = createContext<AppSettingsContextValue | undefined>(undefined);
const STORAGE_KEY = 'dl-app-settings-v1';

function loadSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function ensureFontLoaded(key: FontFamilyKey) {
  const opt = FONT_OPTIONS.find((f) => f.key === key);
  if (!opt) return;
  const id = `font-${key}`;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${opt.googleName}&display=swap`;
  document.head.appendChild(link);
}

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));

    const root = document.documentElement;
    const fontOpt = FONT_OPTIONS.find((f) => f.key === settings.fontFamily) ?? FONT_OPTIONS[0];
    ensureFontLoaded(settings.fontFamily);

    root.style.setProperty('--font-heading', fontOpt.stack);
    root.style.setProperty('--font-body', fontOpt.stack);
    root.style.fontSize = `${settings.fontScale * 100}%`;

    // Inject dynamic theme overrides via a single <style> tag
    const styleId = 'dl-dynamic-theme';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    styleEl.innerHTML = `
      :root {
        --primary: ${settings.primaryLight};
        --accent: ${settings.primaryLight};
        --ring: ${settings.primaryLight};
        --success: ${settings.primaryLight};
        --sidebar-background: ${settings.sidebarLight};
      }
      .dark {
        --primary: ${settings.primaryDark};
        --accent: ${settings.primaryDark};
        --ring: ${settings.primaryDark};
        --success: ${settings.primaryDark};
        --sidebar-background: ${settings.sidebarDark};
      }
    `;
  }, [settings]);

  const updateSetting = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetSettings = useCallback(() => setSettings(DEFAULT_SETTINGS), []);

  return (
    <AppSettingsContext.Provider value={{ settings, updateSetting, resetSettings }}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings() {
  const ctx = useContext(AppSettingsContext);
  if (!ctx) throw new Error('useAppSettings must be used within AppSettingsProvider');
  return ctx;
}

// HSL helpers ---------------------------------------------------------------
export function hexToHsl(hex: string): string {
  const cleaned = hex.replace('#', '');
  const r = parseInt(cleaned.substring(0, 2), 16) / 255;
  const g = parseInt(cleaned.substring(2, 4), 16) / 255;
  const b = parseInt(cleaned.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)); break;
      case g: h = ((b - r) / d + 2); break;
      case b: h = ((r - g) / d + 4); break;
    }
    h *= 60;
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function hslToHex(hsl: string): string {
  const [hStr, sStr, lStr] = hsl.split(' ');
  const h = parseFloat(hStr);
  const s = parseFloat(sStr) / 100;
  const l = parseFloat(lStr) / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  const toHex = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
