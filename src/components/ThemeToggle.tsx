import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';

interface ThemeToggleProps {
  variant?: 'sidebar' | 'default';
}

export default function ThemeToggle({ variant = 'default' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  if (variant === 'sidebar') {
    return (
      <Button
        variant="ghost"
        className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:text-sidebar-primary hover:bg-sidebar-accent/50"
        onClick={toggleTheme}
      >
        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        {isDark ? 'Mode Terang' : 'Mode Gelap'}
      </Button>
    );
  }

  return (
    <Button variant="outline" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </Button>
  );
}
