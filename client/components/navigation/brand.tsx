'use client';

import React from 'react';
import Link from 'next/link';
import { Layers } from 'lucide-react';

export function Brand() {
  return (
    <Link href="/" className="flex items-center gap-3 group shrink-0 select-none">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-all duration-200 group-hover:scale-105 group-hover:bg-primary/90">
        <Layers className="h-5 w-5" />
      </div>

      <div className="flex flex-col space-y-0.5">
        <div className="flex items-center gap-1.5">
          <span className="text-base font-extrabold tracking-tight text-foreground group-hover:text-primary transition-colors">
            OptiPress
          </span>
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" title="Engine Operational" />
        </div>
        <span className="text-[10px] text-muted-foreground font-medium tracking-wide">
          Compress Smarter, Share Faster
        </span>
      </div>
    </Link>
  );
}
