'use client';

import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';

interface OptimizationProgressProps {
  label?: string;
}

export function OptimizationProgress({ label = 'Optimizing your file...' }: OptimizationProgressProps) {
  return (
    <div className="p-8 rounded-2xl border border-primary/30 bg-primary/5 text-center space-y-4 animate-fade-in">
      <div className="relative flex items-center justify-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary border border-primary/30 shadow-inner">
          <Loader2 className="h-7 w-7 animate-spin" />
        </div>
      </div>

      <div className="space-y-1">
        <h3 className="text-base font-bold text-foreground flex items-center justify-center gap-2">
          <Sparkles className="h-4 w-4 text-primary animate-pulse" />
          {label}
        </h3>
        <p className="text-xs text-muted-foreground">
          Analyzing visual structure & protecting image clarity...
        </p>
      </div>

      <div className="w-full bg-muted/60 h-1.5 rounded-full overflow-hidden max-w-md mx-auto">
        <div className="bg-primary h-full rounded-full animate-pulse w-3/4 transition-all duration-500" />
      </div>
    </div>
  );
}
