'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Layers, Menu, X, Shield, Sparkles, User } from 'lucide-react';
import { siteConfig } from '@/config/site';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { AuthModal } from '@/auth/components/auth-modal';
import { LogoutButton } from '@/auth/components/logout-button';
import { useAuth } from '@/auth/hooks/use-auth';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { user, isAuthenticated, isLoading } = useAuth();

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md transition-colors">
        <div className="container flex h-16 items-center justify-between">
          {/* Logo / Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
              <Layers className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-foreground flex items-center gap-1.5">
                {siteConfig.name}
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent animate-pulse-subtle" />
              </span>
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                Target-Size Engine
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {siteConfig.navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
              >
                {item.label}
                {item.badge && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary border border-primary/20">
                    {item.badge}
                  </span>
                )}
              </a>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-1 px-2.5 py-1 rounded-md bg-muted/50 border border-border">
              <Shield className="h-3.5 w-3.5 text-accent" />
              <span>Zero-Storage</span>
            </div>

            <ThemeToggle />

            {!isLoading && (
              <>
                {isAuthenticated && user ? (
                  <div className="flex items-center gap-2">
                    <Link
                      href="/app"
                      className="text-xs font-semibold text-foreground hover:text-primary transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/60 border border-border"
                    >
                      <User className="h-3.5 w-3.5 text-accent" />
                      <span className="truncate max-w-[140px]">{user.email}</span>
                    </Link>
                    <LogoutButton variant="outline" size="sm" />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAuthModalOpen(true)}
                      className="text-xs font-semibold"
                    >
                      Sign In
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      asChild
                      className="text-xs font-semibold shadow-sm"
                    >
                      <Link href="/signup">Sign Up</Link>
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-border bg-card p-4 space-y-3 animate-fade-in">
            <nav className="flex flex-col space-y-2">
              {siteConfig.navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 text-sm font-medium rounded-md text-foreground hover:bg-muted transition-colors flex items-center justify-between"
                >
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary font-semibold">
                      {item.badge}
                    </span>
                  )}
                </a>
              ))}
            </nav>

            <div className="pt-3 border-t border-border flex flex-col gap-2">
              {isAuthenticated && user ? (
                <>
                  <Link
                    href="/app"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold rounded-lg bg-muted text-foreground"
                  >
                    <span>Workspace ({user.email})</span>
                  </Link>
                  <LogoutButton variant="outline" className="w-full" />
                </>
              ) : (
                <>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setAuthModalOpen(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 text-xs"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Sign In / Sign Up
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
}
