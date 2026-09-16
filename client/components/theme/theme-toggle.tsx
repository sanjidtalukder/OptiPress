'use client';

import * as React from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';
import { useTheme } from 'next-themes';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-9 w-9 rounded-lg border border-border bg-muted/40 animate-pulse" />
    );
  }

  return (
    <div className="flex items-center rounded-lg border border-border bg-card p-1 shadow-sm">
      <button
        onClick={() => setTheme('light')}
        className={`flex items-center justify-center h-7 w-7 rounded-md text-xs transition-colors ${
          theme === 'light'
            ? 'bg-primary text-primary-foreground font-medium shadow-sm'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        }`}
        title="Light theme"
        aria-label="Light theme"
      >
        <Sun className="h-3.5 w-3.5" />
      </button>

      <button
        onClick={() => setTheme('dark')}
        className={`flex items-center justify-center h-7 w-7 rounded-md text-xs transition-colors ${
          theme === 'dark'
            ? 'bg-primary text-primary-foreground font-medium shadow-sm'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        }`}
        title="Dark theme"
        aria-label="Dark theme"
      >
        <Moon className="h-3.5 w-3.5" />
      </button>

      <button
        onClick={() => setTheme('system')}
        className={`flex items-center justify-center h-7 w-7 rounded-md text-xs transition-colors ${
          theme === 'system'
            ? 'bg-primary text-primary-foreground font-medium shadow-sm'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        }`}
        title="System theme"
        aria-label="System theme"
      >
        <Laptop className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
