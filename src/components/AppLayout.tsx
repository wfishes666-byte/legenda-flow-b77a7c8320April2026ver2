import { ReactNode } from 'react';
import AppSidebar from './AppSidebar';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className="md:ml-64 min-h-screen px-3 py-16 sm:px-4 sm:py-6 md:p-8 max-w-full overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
