'use client';

import React from 'react';
import { ShieldCheck, Info, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function PrivacyNoticeBanner() {
  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2 text-xs text-foreground">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span>Privacy & Workspace Persistence Notice</span>
        </div>
        <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary">
          Zero Permanent Retention
        </Badge>
      </div>

      <p className="text-muted-foreground leading-relaxed text-[11px]">
        Your files are processed in a temporary, session-isolated workspace and are automatically removed when you refresh or leave OptiPress, or when the workspace session expires. Downloaded files remain safely on your local device.
      </p>

      <div className="flex items-center gap-4 text-[11px] text-muted-foreground pt-1 border-t border-primary/10">
        <span className="flex items-center gap-1 font-medium text-foreground">
          <Lock className="h-3 w-3 text-accent" /> Authentication is persistent
        </span>
        <span className="flex items-center gap-1 font-medium text-foreground">
          <Info className="h-3 w-3 text-primary" /> Refresh clears workspace
        </span>
      </div>
    </div>
  );
}
