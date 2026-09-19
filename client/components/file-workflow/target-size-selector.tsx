'use client';

import React from 'react';
import { Target, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TargetPreset {
  label: string;
  value: number;
  unit: 'KB' | 'MB';
}

const PRESETS: TargetPreset[] = [
  { label: '99 KB', value: 99, unit: 'KB' },
  { label: '100 KB', value: 100, unit: 'KB' },
  { label: '200 KB', value: 200, unit: 'KB' },
  { label: '250 KB', value: 250, unit: 'KB' },
  { label: '500 KB', value: 500, unit: 'KB' },
  { label: '1 MB', value: 1, unit: 'MB' },
  { label: '2 MB', value: 2, unit: 'MB' },
  { label: '5 MB', value: 5, unit: 'MB' },
];

interface TargetSizeSelectorProps {
  targetSize: number;
  targetUnit: 'KB' | 'MB';
  forceTarget: boolean;
  onTargetChange: (value: number, unit: 'KB' | 'MB') => void;
  onForceTargetChange: (force: boolean) => void;
  disabled?: boolean;
}

export function TargetSizeSelector({
  targetSize,
  targetUnit,
  forceTarget,
  onTargetChange,
  onForceTargetChange,
  disabled = false,
}: TargetSizeSelectorProps) {
  const displayTarget = `${targetSize} ${targetUnit}`;

  return (
    <div className="space-y-4 rounded-2xl border border-border/80 bg-card/60 p-5">
      <div className="space-y-1">
        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          Choose a target file size
        </h3>
        <p className="text-xs text-muted-foreground">
          We&apos;ll try to reduce the file to your selected size while protecting visual quality.
        </p>
      </div>

      {/* Preset Chips */}
      <div className="space-y-2">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
          Quick Presets
        </span>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
          {PRESETS.map((preset) => {
            const isSelected = targetSize === preset.value && targetUnit === preset.unit;
            return (
              <button
                key={preset.label}
                type="button"
                disabled={disabled}
                onClick={() => onTargetChange(preset.value, preset.unit)}
                className={`py-2 px-1 rounded-xl border text-center transition-all text-xs font-mono font-semibold ${
                  isSelected
                    ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                    : 'border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Size Input */}
      <div className="space-y-2 pt-1 border-t border-border/50">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
          Custom Target Size
        </span>

        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <input
              type="number"
              step="any"
              min="1"
              disabled={disabled}
              value={targetSize || ''}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                onTargetChange(isNaN(val) ? 0 : val, targetUnit);
              }}
              placeholder="Enter custom target size"
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <select
            value={targetUnit}
            disabled={disabled}
            onChange={(e) => onTargetChange(targetSize, e.target.value as 'KB' | 'MB')}
            className="rounded-xl border border-border bg-background px-3.5 py-2 text-xs font-mono font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="KB">KB</option>
            <option value="MB">MB</option>
          </select>
        </div>
      </div>

      {/* Selected Target Visual Confirmation */}
      <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Target size:</span>
          <strong className="text-primary font-mono text-sm font-bold">{displayTarget}</strong>
        </div>
        <span className="text-[11px] text-muted-foreground font-medium">
          &quot;This is the maximum size I&apos;m asking for.&quot;
        </span>
      </div>

      {/* Force Target Option */}
      <label className="flex items-start gap-2.5 text-xs text-muted-foreground cursor-pointer pt-1">
        <input
          type="checkbox"
          checked={forceTarget}
          disabled={disabled}
          onChange={(e) => onForceTargetChange(e.target.checked)}
          className="mt-0.5 rounded border-border text-primary focus:ring-primary"
        />
        <div className="space-y-0.5">
          <span className="font-semibold text-foreground flex items-center gap-1">
            Try anyway (Force Target)
          </span>
          <p className="text-[11px] text-muted-foreground">
            Override quality protection if target requires extra compression.
          </p>
        </div>
      </label>
    </div>
  );
}
