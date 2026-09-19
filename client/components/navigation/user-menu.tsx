'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronDown,
  User,
  Settings,
  BarChart3,
  Crown,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/auth/hooks/use-auth';
import { UserAvatar } from './user-avatar';
import { Badge } from '@/components/ui/badge';

interface UserMenuProps {
  userPlan?: string;
}

export function UserMenu({ userPlan = 'Free' }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, signOut } = useAuth();
  const router = useRouter();

  const userEmail = user?.email || '';
  
  // Derive human display name from email (e.g., mdsanjidt@gmail.com -> Sanjid)
  const getDisplayName = () => {
    if (!userEmail) return 'User Account';
    const username = userEmail.split('@')[0];
    const cleaned = username.replace(/[._-]/g, ' ');
    const words = cleaned.split(' ').filter(Boolean);
    if (words.length > 0) {
      return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
    return userEmail;
  };

  const displayName = getDisplayName();

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleLogout = async () => {
    setIsOpen(false);
    await signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="flex items-center gap-2.5 p-1.5 rounded-2xl bg-card/80 border border-border/80 hover:border-primary/50 hover:bg-card transition-all shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/30 select-none"
      >
        <UserAvatar email={userEmail} name={displayName} />
        
        <div className="hidden sm:flex flex-col items-start text-left space-y-0.5 max-w-[130px]">
          <span className="text-xs font-semibold text-foreground truncate w-full">
            {displayName}
          </span>
          <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {userPlan} Plan
          </span>
        </div>

        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform duration-200 mr-1 ${
            isOpen ? 'rotate-180 text-primary' : ''
          }`}
        />
      </button>

      {/* Profile Dropdown */}
      {isOpen && (
        <div
          role="menu"
          tabIndex={-1}
          className="absolute right-0 top-full mt-2.5 z-50 w-72 rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl p-3 space-y-3 animate-fade-in text-neutral-200"
        >
          {/* Identity Header */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-neutral-800/60 border border-neutral-700/50">
            <UserAvatar email={userEmail} name={displayName} className="h-10 w-10 text-sm" />
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white truncate max-w-[130px]">{displayName}</span>
                <Badge variant="accent" className="text-[9px] font-semibold uppercase px-1.5 py-0">
                  {userPlan}
                </Badge>
              </div>
              <p className="text-[11px] text-neutral-400 truncate">{userEmail}</p>
            </div>
          </div>

          {/* Menu Actions */}
          <div className="space-y-1 pt-1">
            <Link
              href="/app"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-neutral-800 text-xs text-neutral-300 hover:text-white transition-colors group"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-800 text-neutral-400 group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                <User className="h-4 w-4" />
              </div>
              <div className="space-y-0.5">
                <span className="font-semibold block text-xs">My Profile</span>
                <span className="text-[10px] text-neutral-400 block">Manage your workspace account</span>
              </div>
            </Link>

            <Link
              href="/app"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-neutral-800 text-xs text-neutral-300 hover:text-white transition-colors group"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-800 text-neutral-400 group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                <Settings className="h-4 w-4" />
              </div>
              <div className="space-y-0.5">
                <span className="font-semibold block text-xs">Settings</span>
                <span className="text-[10px] text-neutral-400 block">Preferences & appearance</span>
              </div>
            </Link>

            <Link
              href="/app"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-neutral-800 text-xs text-neutral-300 hover:text-white transition-colors group"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-800 text-neutral-400 group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                <BarChart3 className="h-4 w-4" />
              </div>
              <div className="space-y-0.5">
                <span className="font-semibold block text-xs">Usage & Limits</span>
                <span className="text-[10px] text-neutral-400 block">Check active session usage</span>
              </div>
            </Link>

            <Link
              href="/app"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-emerald-500/10 text-xs text-neutral-300 hover:text-emerald-400 transition-colors group border border-emerald-500/20 bg-emerald-500/5"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 transition-colors">
                <Crown className="h-4 w-4" />
              </div>
              <div className="space-y-0.5">
                <span className="font-bold block text-xs text-emerald-400">Upgrade Plan</span>
                <span className="text-[10px] text-emerald-400/80 block">Get unlimited target size limits</span>
              </div>
            </Link>
          </div>

          <div className="pt-2 border-t border-neutral-800">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
            >
              <span className="flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                Logout
              </span>
              <span className="text-[10px] opacity-70">End session</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
