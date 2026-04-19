import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';

export type ViewMode = 'auto' | 'desktop' | 'mobile';

interface ViewModeContextValue {
  mode: ViewMode;
  setMode: (m: ViewMode) => void;
  toggleMode: () => void;
}

const ViewModeContext = createContext<ViewModeContextValue | undefined>(undefined);
const STORAGE_KEY = 'dl-view-mode-v1';

function loadMode(): ViewMode {
  if (typeof window === 'undefined') return 'auto';
  const v = localStorage.getItem(STORAGE_KEY);
  if (v === 'desktop' || v === 'mobile' || v === 'auto') return v;
  return 'auto';
}

export function ViewModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ViewMode>(loadMode);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, mode);
    const root = document.documentElement;
    root.classList.remove('force-desktop', 'force-mobile');
    if (mode === 'desktop') root.classList.add('force-desktop');
    if (mode === 'mobile') root.classList.add('force-mobile');
  }, [mode]);

  // Hitung scale untuk force-desktop di layar kecil agar konten 1280px tetap muat
  // tanpa scroll horizontal & terlihat proporsional.
  useEffect(() => {
    if (mode !== 'desktop') {
      document.documentElement.style.removeProperty('--force-desktop-scale');
      document.body.style.removeProperty('min-height');
      return;
    }
    const apply = () => {
      const w = window.innerWidth;
      if (w >= 1280) {
        document.documentElement.style.removeProperty('--force-desktop-scale');
        document.body.style.removeProperty('min-height');
        return;
      }
      const scale = w / 1280;
      document.documentElement.style.setProperty('--force-desktop-scale', String(scale));
      // body discale, jadi tinggi visual berkurang. Pastikan body cukup tinggi
      // untuk mengisi viewport (kalkulasi terbalik dari scale).
      document.body.style.minHeight = `${window.innerHeight / scale}px`;
    };
    apply();
    window.addEventListener('resize', apply);
    return () => window.removeEventListener('resize', apply);
  }, [mode]);

  const setMode = useCallback((m: ViewMode) => setModeState(m), []);
  const toggleMode = useCallback(() => {
    setModeState((prev) => (prev === 'mobile' ? 'desktop' : 'mobile'));
  }, []);

  return (
    <ViewModeContext.Provider value={{ mode, setMode, toggleMode }}>
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewMode() {
  const ctx = useContext(ViewModeContext);
  if (!ctx) throw new Error('useViewMode must be used within ViewModeProvider');
  return ctx;
}
