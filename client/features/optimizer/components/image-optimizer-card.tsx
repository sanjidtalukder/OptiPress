'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowDown,
  Sliders,
  Target,
  ShieldCheck,
  Zap,
  Download,
} from 'lucide-react';
import {
  SessionFileMetadata,
  ImageOptimizationMode,
  ImageOptimizationResult,
  TargetSizeOptimizationResult,
} from '@optipress/types';
import { TARGET_SIZE_PRESETS, formatBytesBinary } from '@optipress/config';
import { formatBytes } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/auth/hooks/use-auth';
import { imageOptimizerService } from '../services/image-optimizer.service';

interface ImageOptimizerCardProps {
  file: SessionFileMetadata;
  onOptimizationComplete?: (result: ImageOptimizationResult | TargetSizeOptimizationResult) => void;
}

export function ImageOptimizerCard({ file, onOptimizationComplete }: ImageOptimizerCardProps) {
  const [tabMode, setTabMode] = useState<'strategy' | 'target'>('strategy');

  // Strategy mode state
  const [selectedStrategy, setSelectedStrategy] = useState<ImageOptimizationMode>('smart');

  // Target size mode state
  const [selectedPreset, setSelectedPreset] = useState<number | 'custom'>(500);
  const [customValue, setCustomValue] = useState<string>('500');
  const [targetUnit, setTargetUnit] = useState<'KB' | 'MB'>('KB');
  const [forceTarget, setForceTarget] = useState<boolean>(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // Results state
  const [strategyResult, setStrategyResult] = useState<ImageOptimizationResult | null>(null);
  const [targetResult, setTargetResult] = useState<TargetSizeOptimizationResult | null>(null);

  const { session } = useAuth();

  const handlePresetSelect = (val: number | 'custom', unit?: 'KB' | 'MB') => {
    setSelectedPreset(val);
    if (typeof val === 'number') {
      setCustomValue(val.toString());
      if (unit) setTargetUnit(unit);
    }
  };

  const handleOptimizeStrategy = async () => {
    if (!session?.accessToken) {
      setError('Authentication session required for image optimization.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setDownloadError(null);
    setTargetResult(null);

    const res = await imageOptimizerService.optimizeImage(file.id, selectedStrategy, session.accessToken);

    if (res.success && res.data) {
      setStrategyResult(res.data);
      if (onOptimizationComplete) {
        onOptimizationComplete(res.data);
      }
    } else {
      setError(res.error || 'Optimization failed.');
    }

    setIsProcessing(false);
  };

  const handleOptimizeTargetSize = async () => {
    if (!session?.accessToken) {
      setError('Authentication session required for target size optimization.');
      return;
    }

    const numVal = parseFloat(customValue);
    if (isNaN(numVal) || numVal <= 0) {
      setError('Please enter a valid positive target size.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setDownloadError(null);
    setStrategyResult(null);

    const res = await imageOptimizerService.optimizeTargetSize(
      file.id,
      {
        targetSize: numVal,
        unit: targetUnit,
        forceTarget,
      },
      session.accessToken
    );

    if (res.success && res.data) {
      setTargetResult(res.data);
      if (onOptimizationComplete) {
        onOptimizationComplete(res.data);
      }
    } else {
      setError(res.error || 'Target size optimization failed.');
    }

    setIsProcessing(false);
  };

  const handleDownload = async (outputFileId?: string, outputFileName?: string) => {
    if (!session?.accessToken) {
      setDownloadError('Authentication session required to download optimized image.');
      return;
    }

    if (!outputFileId) {
      setDownloadError('Optimized image file reference is missing. Please run optimization again.');
      return;
    }

    setIsDownloading(true);
    setDownloadError(null);

    const download = await imageOptimizerService.downloadOptimizedImage(
      outputFileId,
      session.accessToken,
      outputFileName || `${file.originalName.replace(/\.[^/.]+$/, '')}-optimized.${file.extension}`
    );

    if (!download.success) {
      setDownloadError(download.error || 'Optimized image download failed.');
    }

    setIsDownloading(false);
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-sm animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent border border-accent/20">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground">Image Optimization Engine</h4>
            <p className="text-[11px] text-muted-foreground font-mono">
              Source: <strong className="text-foreground">{file.originalName}</strong> ({formatBytes(file.fileSize || file.size)})
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center rounded-lg bg-muted p-0.5 border border-border/60 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setTabMode('strategy')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              tabMode === 'strategy'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Strategy Mode
          </button>
          <button
            type="button"
            onClick={() => setTabMode('target')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1 ${
              tabMode === 'target'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Target className="h-3 w-3 text-primary" />
            Target Size
          </button>
        </div>
      </div>

      {/* STRATEGY MODE */}
      {tabMode === 'strategy' && (
        <div className="space-y-4 animate-fade-in">
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
                  { id: 'maximum', label: 'Maximum', desc: 'Max Reduction' },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedStrategy(m.id)}
                  disabled={isProcessing}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    selectedStrategy === m.id
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

          <Button
            variant="default"
            size="default"
            onClick={handleOptimizeStrategy}
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
        </div>
      )}

      {/* TARGET SIZE MODE */}
      {tabMode === 'target' && (
        <div className="space-y-4 animate-fade-in">
          <div className="space-y-2.5">
            <label className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-primary" />
                Target File Size Presets
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">Max &lt;= Target</span>
            </label>

            {/* Presets Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-4 gap-1.5">
              {TARGET_SIZE_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => handlePresetSelect(p.value, p.unit)}
                  disabled={isProcessing}
                  className={`py-1.5 px-2 rounded-lg border text-center transition-all text-xs font-mono font-semibold ${
                    selectedPreset === p.value && targetUnit === p.unit
                      ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary'
                      : 'border-border bg-muted/20 text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Custom Input */}
            <div className="pt-1 space-y-2">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="number"
                    step="any"
                    min="1"
                    value={customValue}
                    onChange={(e) => {
                      setCustomValue(e.target.value);
                      setSelectedPreset('custom');
                    }}
                    placeholder="Enter target size"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <select
                  value={targetUnit}
                  onChange={(e) => {
                    setTargetUnit(e.target.value as 'KB' | 'MB');
                    setSelectedPreset('custom');
                  }}
                  className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="KB">KB</option>
                  <option value="MB">MB</option>
                </select>
              </div>

              {/* Force Target Checkbox */}
              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer pt-0.5">
                <input
                  type="checkbox"
                  checked={forceTarget}
                  onChange={(e) => setForceTarget(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <span>
                  <strong>Force Target:</strong> Override quality protection if target requires heavy compression
                </span>
              </label>
            </div>
          </div>

          <Button
            variant="default"
            size="default"
            onClick={handleOptimizeTargetSize}
            disabled={isProcessing}
            className="w-full font-semibold shadow-md gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Running Target Binary Search...</span>
              </>
            ) : (
              <>
                <Target className="h-4 w-4" />
                <span>
                  Optimize to &le; {customValue || '0'} {targetUnit}
                </span>
              </>
            )}
          </Button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-xs text-destructive flex items-center gap-2 animate-fade-in">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* STRATEGY RESULT */}
      {strategyResult && (
        <div className="p-4 rounded-xl border border-accent/40 bg-accent/5 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-accent" />
              Optimization Result (Strategy Mode)
            </span>
            <Badge variant="accent" className="text-[10px] capitalize">
              {strategyResult.mode} Mode
            </Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
            <div className="p-2.5 rounded-lg bg-background border border-border/60">
              <span className="text-[10px] text-muted-foreground block">Original Size</span>
              <strong className="text-foreground text-xs font-mono">{formatBytes(strategyResult.originalSize)}</strong>
            </div>

            <div className="p-2.5 rounded-lg bg-background border border-border/60">
              <span className="text-[10px] text-muted-foreground block">Optimized Size</span>
              <strong className="text-accent text-xs font-mono">{formatBytes(strategyResult.optimizedSize)}</strong>
            </div>

            <div className="p-2.5 rounded-lg bg-background border border-border/60">
              <span className="text-[10px] text-muted-foreground block">Space Saved</span>
              <strong className="text-success text-xs font-mono">{formatBytes(strategyResult.reductionBytes)}</strong>
            </div>

            <div className="p-2.5 rounded-lg bg-background border border-border/60">
              <span className="text-[10px] text-muted-foreground block">Reduction</span>
              <strong className="text-primary text-xs font-mono flex items-center gap-0.5">
                <ArrowDown className="h-3 w-3" />
                {strategyResult.reductionPercentage}%
              </strong>
            </div>
          </div>

          {strategyResult.outputFileId && (
            <Button
              variant="default"
              size="default"
              onClick={() => handleDownload(strategyResult.outputFileId, strategyResult.outputFileName)}
              disabled={isDownloading}
              className="w-full font-semibold shadow-md gap-2 mt-2"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Downloading optimized image...</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span>Download Optimized Image</span>
                </>
              )}
            </Button>
          )}
        </div>
      )}

      {/* TARGET RESULT */}
      {targetResult && (
        <div className="p-4 rounded-xl border border-primary/40 bg-primary/5 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold text-foreground">Target Size Result</span>
            </div>

            <div className="flex items-center gap-1.5">
              {targetResult.targetReached ? (
                <Badge variant="accent" className="text-[10px]">
                  &check; Target Reached
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] border-amber-500/50 text-amber-500">
                  Target Unreachable
                </Badge>
              )}

              {targetResult.qualityProtected ? (
                <Badge variant="outline" className="text-[10px] border-green-500/50 text-green-500 gap-1">
                  <ShieldCheck className="h-3 w-3" /> Quality Protected
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] border-amber-500/50 text-amber-500 gap-1">
                  <Zap className="h-3 w-3" /> Forced Mode
                </Badge>
              )}
            </div>
          </div>

          <p className="text-xs text-muted-foreground">{targetResult.message}</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
            <div className="p-2.5 rounded-lg bg-background border border-border/60">
              <span className="text-[10px] text-muted-foreground block">Target Requested</span>
              <strong className="text-foreground text-xs font-mono">
                {formatBytesBinary(targetResult.targetSizeBytes)}
              </strong>
            </div>

            <div className="p-2.5 rounded-lg bg-background border border-border/60">
              <span className="text-[10px] text-muted-foreground block">Optimized Output</span>
              <strong className="text-primary text-xs font-mono">{formatBytesBinary(targetResult.outputSize)}</strong>
            </div>

            <div className="p-2.5 rounded-lg bg-background border border-border/60">
              <span className="text-[10px] text-muted-foreground block">Space Saved</span>
              <strong className="text-success text-xs font-mono">
                {formatBytesBinary(targetResult.reductionBytes)}
              </strong>
            </div>

            <div className="p-2.5 rounded-lg bg-background border border-border/60">
              <span className="text-[10px] text-muted-foreground block">
                {!targetResult.targetReached && targetResult.bestSafeSize ? 'Best Safe Size' : 'Quality Score'}
              </span>
              <strong className="text-foreground text-xs font-mono">
                {!targetResult.targetReached && targetResult.bestSafeSize
                  ? formatBytesBinary(targetResult.bestSafeSize)
                  : `${targetResult.qualityScore || 80}/100`}
              </strong>
            </div>
          </div>

          {targetResult.outputFileId && (
            <Button
              variant="default"
              size="default"
              onClick={() => handleDownload(targetResult.outputFileId, targetResult.outputFileName)}
              disabled={isDownloading}
              className="w-full font-semibold shadow-md gap-2 mt-2"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Downloading optimized image...</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span>Download Optimized Image</span>
                </>
              )}
            </Button>
          )}
        </div>
      )}

      {/* Download Error Message */}
      {downloadError && (
        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-xs text-destructive flex items-center gap-2 animate-fade-in">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{downloadError}</span>
        </div>
      )}
    </div>
  );
}
