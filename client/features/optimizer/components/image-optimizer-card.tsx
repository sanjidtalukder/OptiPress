'use client';

import React, { useState } from 'react';
import { Sparkles, Loader2, CheckCircle2, AlertCircle, ArrowDown, Sliders, Layers } from 'lucide-react';
import { SessionFileMetadata, ImageOptimizationMode, ImageOptimizationResult } from '@optipress/types';
import { formatBytes } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/auth/hooks/use-auth';
import { imageOptimizerService } from '../services/image-optimizer.service';

interface ImageOptimizerCardProps {
  file: SessionFileMetadata;
  onOptimizationComplete?: (result: ImageOptimizationResult) => void;
}

export function ImageOptimizerCard({ file, onOptimizationComplete }: ImageOptimizerCardProps) {
  const [selectedMode, setSelectedMode] = useState<ImageOptimizationMode>('smart');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImageOptimizationResult | null>(null);

  const { session } = useAuth();

  const handleOptimize = async () => {
    if (!session?.accessToken) {
      setError('Authentication session required for image optimization.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    const res = await imageOptimizerService.optimizeImage(file.id, selectedMode, session.accessToken);

    if (res.success && res.data) {
      setResult(res.data);
      if (onOptimizationComplete) {
        onOptimizationComplete(res.data);
      }
    } else {
      setError(res.error || 'Optimization failed.');
    }

    setIsProcessing(false);
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-sm animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent border border-accent/20">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground">Image Optimization Engine</h4>
            <p className="text-[11px] text-muted-foreground font-mono">
              Target: <strong className="text-foreground">{file.originalName}</strong> ({formatBytes(file.fileSize)})
            </p>
          </div>
        </div>

        <Badge variant="outline" className="uppercase text-[10px] self-start sm:self-auto font-mono">
          {file.extension}
        </Badge>
      </div>

      {/* Mode Selection */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Sliders className="h-3.5 w-3.5 text-primary" />
          Select Optimization Strategy
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { id: 'smart', label: 'Smart', desc: 'Balanced' },
              { id: 'quality', label: 'Quality', desc: 'High Detail' },
              { id: 'maximum', label: 'Maximum', desc: 'Max Size Reduction' },
            ] as const
          ).map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setSelectedMode(m.id)}
              disabled={isProcessing}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                selectedMode === m.id
                  ? 'border-primary bg-primary/10 text-foreground ring-1 ring-primary'
                  : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <div className="text-xs font-bold capitalize">{m.label}</div>
              <div className="text-[10px] opacity-80">{m.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Trigger Button */}
      <Button
        variant="default"
        size="default"
        onClick={handleOptimize}
        disabled={isProcessing}
        className="w-full font-semibold shadow-md gap-2"
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Processing Sharp Engine...</span>
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            <span>Optimize {file.extension.toUpperCase()} Image</span>
          </>
        )}
      </Button>

      {/* Error State */}
      {error && (
        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-xs text-destructive flex items-center gap-2 animate-fade-in">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Result Metrics */}
      {result && (
        <div className="p-4 rounded-xl border border-accent/40 bg-accent/5 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-accent" />
              Optimization Result
            </span>
            <Badge variant="accent" className="text-[10px] capitalize">
              {result.mode} Mode
            </Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
            <div className="p-2.5 rounded-lg bg-background border border-border/60">
              <span className="text-[10px] text-muted-foreground block">Original Size</span>
              <strong className="text-foreground text-xs font-mono">{formatBytes(result.originalSize)}</strong>
            </div>

            <div className="p-2.5 rounded-lg bg-background border border-border/60">
              <span className="text-[10px] text-muted-foreground block">Optimized Size</span>
              <strong className="text-accent text-xs font-mono">{formatBytes(result.optimizedSize)}</strong>
            </div>

            <div className="p-2.5 rounded-lg bg-background border border-border/60">
              <span className="text-[10px] text-muted-foreground block">Space Saved</span>
              <strong className="text-success text-xs font-mono">{formatBytes(result.reductionBytes)}</strong>
            </div>

            <div className="p-2.5 rounded-lg bg-background border border-border/60">
              <span className="text-[10px] text-muted-foreground block">Reduction</span>
              <strong className="text-primary text-xs font-mono flex items-center gap-0.5">
                <ArrowDown className="h-3 w-3" />
                {result.reductionPercentage}%
              </strong>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/50">
            <span>
              Dimensions: <strong>{result.width} × {result.height} px</strong>
            </span>
            <span>Time: {result.processingTimeMs} ms</span>
          </div>
        </div>
      )}
    </div>
  );
}
