'use client';

import React, { useState } from 'react';
import { Sliders, Sparkles, Shield, Cpu, Gauge, Zap } from 'lucide-react';
import { TARGET_SIZE_PRESETS } from '@optipress/config';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export function TargetSizeDemo() {
  const [targetKb, setTargetKb] = useState<number>(200);
  const [originalMb] = useState<number>(4.2); // 4.2 MB sample document

  const originalKb = originalMb * 1024;
  const reductionPercentage = Math.round(((originalKb - targetKb) / originalKb) * 100);

  // Simulated visual fidelity score based on compression aggressiveness
  const estimatedFidelity = targetKb < 100 ? 92 : targetKb < 300 ? 96 : 99;

  return (
    <Card className="w-full max-w-3xl mx-auto border-border bg-card/90 shadow-lg overflow-hidden">
      <div className="bg-primary/5 border-b border-border p-4 md:p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Sliders className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              Target-Size Control Engine
              <Badge variant="accent" className="text-[10px]">Preview Concept</Badge>
            </h3>
            <p className="text-xs text-muted-foreground">
              Define your exact file size threshold. Our adaptive pipeline tunes downscaling & quantization.
            </p>
          </div>
        </div>
      </div>

      <CardContent className="p-6 md:p-8 space-y-6">
        {/* Preset Selector */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
            Target Presets
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {TARGET_SIZE_PRESETS.map((preset) => (
              <button
                key={preset.value}
                onClick={() => setTargetKb(preset.value)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  targetKb === preset.value
                    ? 'border-primary bg-primary/10 text-foreground ring-1 ring-primary'
                    : 'border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className="font-bold text-sm text-foreground">{preset.label}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                  {preset.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Target Slider */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">Custom Target File Size</span>
            <span className="text-sm font-mono font-bold text-primary bg-primary/10 px-3 py-1 rounded-md border border-primary/20">
              {targetKb >= 1000 ? `${(targetKb / 1000).toFixed(1)} MB` : `${targetKb} KB`}
            </span>
          </div>

          <input
            type="range"
            min="99"
            max="2000"
            step="10"
            value={targetKb}
            onChange={(e) => setTargetKb(Number(e.target.value))}
            className="w-full h-2 rounded-lg bg-muted appearance-none cursor-pointer accent-primary"
          />

          <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
            <span>99 KB (Strict Min)</span>
            <span>500 KB</span>
            <span>1 MB</span>
            <span>2 MB (Max Custom)</span>
          </div>
        </div>

        {/* Simulated Compression Impact Display */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border">
          <div className="p-3.5 rounded-xl bg-background border border-border flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted text-muted-foreground">
              <Gauge className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Estimated Reduction</div>
              <div className="text-base font-bold text-accent font-mono">-{reductionPercentage}%</div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-background border border-border flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted text-muted-foreground">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Visual Quality Score</div>
              <div className="text-base font-bold text-primary font-mono">{estimatedFidelity}% SSIM</div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-background border border-border flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted text-muted-foreground">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Privacy Protection</div>
              <div className="text-base font-bold text-success font-mono">Zero Storage</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
