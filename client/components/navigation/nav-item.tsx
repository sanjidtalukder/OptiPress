'use client';

import React from 'react';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';

export interface NavItemConfig {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  matchPaths?: string[];
  matchHashes?: string[];
}

interface NavItemProps {
  item: NavItemConfig;
  isActive: boolean;
  onClick?: () => void;
}

export function NavItem({ item, isActive, onClick }: NavItemProps) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
      className={`relative flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs transition-all duration-200 select-none ${
        isActive
          ? 'bg-primary/10 text-primary font-semibold border border-primary/20 shadow-xs'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/60 font-medium'
      }`}
    >
      <Icon className={`h-4 w-4 shrink-0 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
      <span>{item.label}</span>

      {item.badge && (
        <span
          className={`rounded-full px-1.5 py-0.2 text-[9px] font-mono font-semibold ${
            isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground border border-border'
          }`}
        >
          {item.badge}
        </span>
      )}

      {/* Subtle Bottom Active Line */}
      {isActive && (
        <span className="absolute -bottom-1.5 left-3 right-3 h-0.5 rounded-full bg-primary animate-fade-in" />
      )}
    </Link>
  );
}
