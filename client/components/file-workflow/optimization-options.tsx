'use client';

import React from 'react';
import { Sparkles, ShieldCheck, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export type OptimizationStrategyMode = 'smart' | 'quality' | 'maximum';

interface OptimizationOptionsProps {
  selectedMode: OptimizationStrategyMode;
  onSelectMode: (mode: OptimizationStrategyMode) => void;
  disabled?: boolean;
}

export function OptimizationOptions({
  selectedMode,
  onSelectMode,
  disabled = false,
}: OptimizationOptionsProps) {
  const options = [
    {
      id: 'smart' as const,
      title: 'SMART',
      description: 'OptiPress automatically finds the smallest safe file size (preferred compact range: 100–150 KB).',
      recommended: true,
      icon: Sparkles,
    },
    {
      id: 'quality' as const,
      title: 'QUALITY',
      description: 'Keep more detail while reducing the file size',
      recommended: false,
      icon: ShieldCheck,
    },
    {
      id: 'maximum' as const,
      title: 'MAXIMUM',
      description: 'Reduce the file size as much as possible',
      recommended: false,
      icon: Zap,
    },
  ];

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <h3 className="text-base font-bold text-foreground">How would you like to optimize your file?</h3>
        <p className="text-xs text-muted-foreground">Choose the option that best fits your needs.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {options.map((opt) => {
          const Icon = opt.icon;
          const isSelected = selectedMode === opt.id;

          return (
            <button
              key={opt.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelectMode(opt.id)}
              className={`relative p-4 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-3 ${
                isSelected
                  ? 'border-primary bg-primary/10 ring-2 ring-primary/40 shadow-sm'
                  : 'border-border/80 bg-card hover:border-primary/50 hover:bg-card/90'
              } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="font-bold text-sm text-foreground tracking-wide">{opt.title}</span>
                </div>

                {opt.recommended && (
                  <Badge variant="accent" className="text-[10px] font-semibold">
                    Recommended
                  </Badge>
                )}
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">{opt.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
