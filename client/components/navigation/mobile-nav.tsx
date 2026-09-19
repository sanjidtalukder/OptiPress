'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Shield, Sparkles, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { useAuth } from '@/auth/hooks/use-auth';
import { NAV_ITEMS } from './desktop-nav';

interface MobileNavProps {
  onOpenAuthModal: () => void;
}

export function MobileNav({ onOpenAuthModal }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { user, isAuthenticated, signOut } = useAuth();

  const handleLogout = async () => {
    setIsOpen(false);
    await signOut();
  };

  return (
    <div className="flex md:hidden items-center gap-2">
      <ThemeToggle />

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle navigation menu"
        className="p-2 rounded-xl border border-border/80 bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-x-0 top-16 z-50 border-b border-border bg-background/95 backdrop-blur-md p-5 space-y-5 animate-fade-in shadow-2xl">
          {/* Navigation Items */}
          <nav className="flex flex-col space-y-1.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = item.matchPaths?.includes(pathname) || (pathname !== '/' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center justify-between p-3 rounded-2xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="rounded-full bg-primary/20 text-primary px-2 py-0.5 text-[10px] font-mono">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Privacy Badge in Mobile Drawer */}
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="font-semibold">Zero Storage Privacy</span>
            </div>
            <span className="text-[10px] font-mono">Auto Cleanup</span>
          </div>

          {/* Auth Section */}
          <div className="pt-2 border-t border-border flex flex-col gap-2">
            {isAuthenticated && user ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/60 border border-border">
                  <User className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold text-foreground truncate">{user.email}</span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="w-full text-xs font-semibold text-destructive border-destructive/30 hover:bg-destructive/10 gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenAuthModal();
                  }}
                  className="text-xs font-semibold"
                >
                  Sign In
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  asChild
                  onClick={() => setIsOpen(false)}
                  className="text-xs font-semibold shadow-sm gap-1.5"
                >
                  <Link href="/signup">
                    <Sparkles className="h-3.5 w-3.5" />
                    Sign Up
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
