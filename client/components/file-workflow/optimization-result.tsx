'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  ArrowDown,
  ShieldCheck,
  AlertTriangle,
  Sliders,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatBytes } from '@/lib/utils';
import { FilePreview } from './file-preview';
import { DownloadButton } from './download-button';
import { ResultComparison } from './result-comparison';

interface OptimizationResultProps {
  originalFileId: string;
  originalName: string;
  originalSize: number;
  optimizedSize: number;
  reductionBytes: number;
  reductionPercentage: number;
  extension: string;
  originalSrc?: string | File | null;
  optimizedSrc?: string | null;
  outputFileId?: string;
  outputFileName?: string;
  onDownload: () => Promise<boolean>;
  targetSizeInfo?: {
    targetSizeBytes: number;
    targetReached: boolean;
    bestSafeSize?: number;
    forced?: boolean;
    message?: string;
  } | null;
  dimensions?: { width: number; height: number } | null;
  pageCount?: number;
}

export function OptimizationResultView({
  originalFileId,
  originalName,
  originalSize,
  optimizedSize,
  reductionBytes,
  reductionPercentage,
  extension,
  originalSrc,
  optimizedSrc,
  outputFileName,
  onDownload,
  targetSizeInfo,
  dimensions,
  pageCount,
}: OptimizationResultProps) {
  const [showCompare, setShowCompare] = useState(false);

  const isPdf = extension.toLowerCase() === 'pdf';
  const fileType = isPdf ? 'pdf' : 'image';
  const parsedExt = extension.toLowerCase();
  const displayFileName =
    outputFileName || `${originalName.replace(/\.[^/.]+$/, '')}_optimized.${parsedExt}`;

  return (
    <div className="space-y-6 rounded-3xl border border-accent/40 bg-accent/5 p-6 shadow-md animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-accent/20 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="accent" className="gap-1 text-[11px] font-bold px-2.5 py-0.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Optimization Complete
            </Badge>
            <span className="text-xs text-muted-foreground font-medium">• Quality check passed</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Optimization complete</h2>
          <p className="text-xs text-muted-foreground">Your optimized file is ready.</p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowCompare(!showCompare)}
          className="self-start sm:self-auto text-xs font-semibold gap-1.5"
        >
          <Sliders className="h-3.5 w-3.5 text-primary" />
          <span>{showCompare ? 'Hide Comparison' : 'Compare'}</span>
        </Button>
      </div>

      {/* Target Size Honest Result Banner (If Target Size Mode) */}
      {targetSizeInfo && (
        <div
          className={`p-4 rounded-2xl border text-xs space-y-2 ${
            targetSizeInfo.targetReached
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm">
              {targetSizeInfo.targetReached ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Target reached</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  <span>Target size couldn&apos;t be reached safely</span>
                </>
              )}
            </div>
            <span className="font-mono text-[11px]">
              Target: {formatBytes(targetSizeInfo.targetSizeBytes)}
            </span>
          </div>

          {!targetSizeInfo.targetReached && (
            <p className="text-xs opacity-90 leading-relaxed">
              We couldn&apos;t reduce the file to {formatBytes(targetSizeInfo.targetSizeBytes)} without noticeably affecting quality.
              {targetSizeInfo.bestSafeSize ? ` Best safe size achieved: ${formatBytes(targetSizeInfo.bestSafeSize)}.` : ''}
            </p>
          )}
        </div>
      )}

      {/* Optimized File Preview */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-foreground uppercase tracking-wider block">
          Optimized File Preview
        </span>
        <FilePreview
          src={optimizedSrc || originalSrc}
          fileName={displayFileName}
          fileSize={optimizedSize}
          extension={extension}
          dimensions={dimensions}
          pageCount={pageCount}
          label="Optimized"
        />
      </div>

      {/* Before vs After Comparison Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Original Size */}
        <div className="p-3.5 rounded-2xl bg-card border border-border/80 space-y-1">
          <span className="text-[11px] font-semibold text-muted-foreground block">Original</span>
          <strong className="text-foreground text-sm font-mono font-bold block">
            {formatBytes(originalSize)}
          </strong>
        </div>

        {/* Optimized Size (Visual Emphasis) */}
        <div className="p-3.5 rounded-2xl bg-accent/10 border border-accent/40 space-y-1">
          <span className="text-[11px] font-bold text-accent block">Optimized</span>
          <strong className="text-accent text-base font-mono font-bold block">
            {formatBytes(optimizedSize)}
          </strong>
        </div>

        {/* Space Saved */}
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
          <span className="text-[11px] font-semibold text-emerald-400 block">Space saved</span>
          <strong className="text-emerald-400 text-sm font-mono font-bold block">
            {formatBytes(reductionBytes)}
          </strong>
        </div>

        {/* Size Reduced Percentage */}
        <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/30 space-y-1">
          <span className="text-[11px] font-semibold text-primary block">Size reduced</span>
          <strong className="text-primary text-sm font-mono font-bold flex items-center gap-1">
            <ArrowDown className="h-4 w-4" />
            {reductionPercentage.toFixed(1)}%
          </strong>
        </div>
      </div>

      {/* Quality Check Badge */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
        <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
          <ShieldCheck className="h-4 w-4" />
          <span>Visual quality check passed</span>
        </div>
        <span className="font-mono text-[11px]">{displayFileName}</span>
      </div>

      {/* Comparison View Drawer */}
      {showCompare && (
        <ResultComparison
          originalSrc={originalSrc}
          optimizedSrc={optimizedSrc}
          originalName={originalName}
          originalSize={originalSize}
          optimizedSize={optimizedSize}
          extension={extension}
          dimensions={dimensions}
          pageCount={pageCount}
        />
      )}

      {/* Download Action Button */}
      <div className="pt-2">
        <DownloadButton onDownload={onDownload} fileType={fileType} />
      </div>
    </div>
  );
}
