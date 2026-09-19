'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  Home,
  FileText,
  Image as ImageIcon,
  SlidersHorizontal,
  BookOpen,
  HelpCircle,
} from 'lucide-react';
import { NavItem, NavItemConfig } from './nav-item';

export const NAV_ITEMS: NavItemConfig[] = [
  {
    label: 'Home',
    href: '/app',
    icon: Home,
    matchPaths: ['/', '/app'],
  },
  {
    label: 'Compress PDF',
    href: '/compress-pdf',
    icon: FileText,
    matchPaths: ['/compress-pdf'],
    matchHashes: ['#upload-section'],
  },
  {
    label: 'Compress Images',
    href: '/compress-images',
    icon: ImageIcon,
    matchPaths: ['/compress-images'],
  },
  {
    label: 'Target Size',
    href: '/target-size',
    icon: SlidersHorizontal,
    matchPaths: ['/target-size'],
  },
  {
    label: 'How It Works',
    href: '/how-it-works',
    icon: BookOpen,
    matchPaths: ['/how-it-works'],
    matchHashes: ['#how-it-works'],
  },
  {
    label: 'FAQ',
    href: '/faq',
    icon: HelpCircle,
    matchPaths: ['/faq'],
    matchHashes: ['#faq-section'],
  },
];

export function DesktopNav() {
  const pathname = usePathname();
  const [currentHash, setCurrentHash] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentHash(window.location.hash);
      const handleHashChange = () => setCurrentHash(window.location.hash);
      window.addEventListener('hashchange', handleHashChange);
      return () => window.removeEventListener('hashchange', handleHashChange);
    }
  }, []);

  const isItemActive = (item: NavItemConfig) => {
    if (item.matchPaths && item.matchPaths.includes(pathname)) {
      return true;
    }
    if (currentHash && item.matchHashes && item.matchHashes.includes(currentHash)) {
      return true;
    }
    if (pathname !== '/' && pathname !== '/app' && item.href !== '/app' && pathname.startsWith(item.href)) {
      return true;
    }
    return false;
  };

  return (
    <nav className="hidden md:flex items-center gap-1.5 bg-card/40 p-1 rounded-2xl border border-border/40 backdrop-blur-xs">
      {NAV_ITEMS.map((item) => (
        <NavItem
          key={item.label}
          item={item}
          isActive={isItemActive(item)}
        />
      ))}
    </nav>
  );
}
