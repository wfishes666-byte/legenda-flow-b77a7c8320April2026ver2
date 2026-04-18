import { ReactNode } from 'react';
import AppSidebar from './AppSidebar';
import macanBg from '@/assets/macan-bg.png';
import nagaBg from '@/assets/naga-bg.png';
import { useAppSettings } from '@/hooks/useAppSettings';

export default function AppLayout({ children }: { children: ReactNode }) {
  const { settings } = useAppSettings();
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className="relative md:ml-64 min-h-screen px-3 py-16 sm:px-4 sm:py-6 md:p-8 max-w-full overflow-x-hidden">
        {settings.showBgArtwork && (
          <>
            <img
              src={nagaBg}
              alt=""
              aria-hidden="true"
              className="pointer-events-none select-none fixed top-16 left-0 md:top-4 md:left-64 w-[10vw] min-w-[80px] opacity-25 z-0"
            />
            <img
              src={macanBg}
              alt=""
              aria-hidden="true"
              className="pointer-events-none select-none fixed bottom-0 right-0 w-[30vw] opacity-25 z-0"
            />
          </>
        )}
        <div className="relative z-10">
          {children}
        </div>
      </main>
    </div>
  );
}
