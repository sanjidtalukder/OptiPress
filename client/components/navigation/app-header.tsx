'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { AuthModal } from '@/auth/components/auth-modal';
import { useAuth } from '@/auth/hooks/use-auth';

import { Brand } from './brand';
import { DesktopNav } from './desktop-nav';
import { PrivacyStatus } from './privacy-status';
import { UserMenu } from './user-menu';
import { MobileNav } from './mobile-nav';

export function AppHeader() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { user, isAuthenticated, isLoading } = useAuth();

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/80 backdrop-blur-md transition-colors select-none">
        <div className="container flex h-16 items-center justify-between gap-4 px-4">
          {/* LEFT: Branding */}
          <Brand />

          {/* CENTER: Primary Product Navigation */}
          <DesktopNav />

          {/* RIGHT: Privacy Status + Theme Toggle + User Profile / Auth Actions */}
          <div className="hidden md:flex items-center gap-3">
            <PrivacyStatus />
            <ThemeToggle />

            {!isLoading && (
              <>
                {isAuthenticated && user ? (
                  <UserMenu userPlan="Free" />
                ) : (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAuthModalOpen(true)}
                      className="text-xs font-semibold hover:bg-muted/80 rounded-xl"
                    >
                      Sign In
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      asChild
                      className="text-xs font-semibold shadow-md rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      <Link href="/signup">Sign Up</Link>
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* MOBILE: Navigation Actions */}
          <MobileNav onOpenAuthModal={() => setAuthModalOpen(true)} />
        </div>
      </header>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
}
