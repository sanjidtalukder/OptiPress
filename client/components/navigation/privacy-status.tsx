'use client';

import React, { useState } from 'react';
import { Shield, Lock } from 'lucide-react';

export function PrivacyStatus() {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(!showTooltip)}
        aria-label="Privacy guarantee details"
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-[11px] font-medium text-emerald-400 transition-all hover:bg-emerald-500/15 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 select-none"
      >
        <Shield className="h-3.5 w-3.5 text-emerald-400" />
        <span>Zero Storage</span>
      </button>

      {/* Popover / Tooltip */}
      {showTooltip && (
        <div className="absolute right-0 top-full mt-2 z-50 w-64 p-3 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-xl text-xs space-y-1.5 animate-fade-in text-neutral-300">
          <div className="flex items-center gap-1.5 font-bold text-emerald-400">
            <Lock className="h-3.5 w-3.5" />
            <span>Privacy Guaranteed</span>
          </div>
          <p className="text-[11px] text-neutral-400 leading-relaxed">
            Your uploaded files are temporary and automatically cleaned up from memory after processing.
          </p>
        </div>
      )}
    </div>
  );
}
