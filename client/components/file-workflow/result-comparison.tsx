'use client';

import React, { useState } from 'react';
import { Sliders, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatBytes } from '@/lib/utils';
import { FilePreview } from './file-preview';

interface ResultComparisonProps {
  originalSrc?: string | File | null;
  optimizedSrc?: string | null;
  originalName: string;
  originalSize: number;
  optimizedSize: number;
  extension: string;
  dimensions?: { width: number; height: number } | null;
  pageCount?: number;
}

export function ResultComparison({
  originalSrc,
  optimizedSrc,
  originalName,
  originalSize,
  optimizedSize,
  extension,
  dimensions,
  pageCount,
}: ResultComparisonProps) {
  const [activeTab, setActiveTab] = useState<'sideBySide' | 'toggle'>('sideBySide');
  const [toggleState, setToggleState] = useState<'before' | 'after'>('after');

  const isPdf = extension.toLowerCase() === 'pdf';

  return (
    <div className="space-y-4 rounded-2xl border border-border/80 bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Sliders className="h-4 w-4 text-primary" />
            Compare Original vs Optimized
          </h4>
          <p className="text-xs text-muted-foreground">Visual comparison of your file.</p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center rounded-lg bg-muted p-0.5 border border-border/60">
          <button
            type="button"
            onClick={() => setActiveTab('sideBySide')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'sideBySide'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Side by Side
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('toggle')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'toggle'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Before / After Toggle
          </button>
        </div>
      </div>

      {/* Side by Side View */}
      {activeTab === 'sideBySide' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Original
              </span>
              <Badge variant="outline" className="text-[10px] font-mono">
                {formatBytes(originalSize)}
              </Badge>
            </div>
            <FilePreview
              src={originalSrc}
              fileName={originalName}
              fileSize={originalSize}
              extension={extension}
              dimensions={dimensions}
              pageCount={pageCount}
              label="Original"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-accent uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Optimized
              </span>
              <Badge variant="accent" className="text-[10px] font-mono">
                {formatBytes(optimizedSize)}
              </Badge>
            </div>
            <FilePreview
              src={optimizedSrc || originalSrc}
              fileName={`${originalName.replace(/\.[^/.]+$/, '')}_optimized.${extension}`}
              fileSize={optimizedSize}
              extension={extension}
              dimensions={dimensions}
              pageCount={pageCount}
              label="Optimized"
            />
          </div>
        </div>
      )}

      {/* Toggle View */}
      {activeTab === 'toggle' && (
        <div className="space-y-3">
          <div className="flex justify-center gap-2">
            <Button
              type="button"
              variant={toggleState === 'before' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setToggleState('before')}
              className="text-xs font-semibold"
            >
              Before ({formatBytes(originalSize)})
            </Button>
            <Button
              type="button"
              variant={toggleState === 'after' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setToggleState('after')}
              className="text-xs font-semibold"
            >
              After ({formatBytes(optimizedSize)})
            </Button>
          </div>

          {toggleState === 'before' ? (
            <FilePreview
              src={originalSrc}
              fileName={originalName}
              fileSize={originalSize}
              extension={extension}
              dimensions={dimensions}
              pageCount={pageCount}
              label="Original File"
            />
          ) : (
            <FilePreview
              src={optimizedSrc || originalSrc}
              fileName={`${originalName.replace(/\.[^/.]+$/, '')}_optimized.${extension}`}
              fileSize={optimizedSize}
              extension={extension}
              dimensions={dimensions}
              pageCount={pageCount}
              label="Optimized File"
            />
          )}
        </div>
      )}
    </div>
  );
}
