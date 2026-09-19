'use client';

import React from 'react';
import { formatBytes } from '@/lib/utils';

interface FileMetadataProps {
  extension: string;
  fileSize?: number | null;
  dimensions?: { width: number; height: number } | null;
  pageCount?: number | null;
  className?: string;
}

export function FileMetadataView({
  extension,
  fileSize,
  dimensions,
  pageCount,
  className = '',
}: FileMetadataProps) {
  const isPdf = extension.toLowerCase() === 'pdf';
  const extUpper = extension.toUpperCase();
  const fileTypeDisplay = isPdf ? 'PDF Document' : `${extUpper} Image`;

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs ${className}`}>
      {/* File Type */}
      <div className="p-3 rounded-xl bg-card border border-border/70 space-y-1">
        <span className="text-[11px] font-medium text-muted-foreground block">File type</span>
        <strong className="text-foreground font-semibold text-xs">{fileTypeDisplay}</strong>
      </div>

      {/* File Size */}
      <div className="p-3 rounded-xl bg-card border border-border/70 space-y-1">
        <span className="text-[11px] font-medium text-muted-foreground block">File size</span>
        <strong className="text-foreground font-semibold text-xs">{formatBytes(fileSize)}</strong>
      </div>

      {/* Dynamic Third Field: Dimensions or Page Count */}
      {isPdf ? (
        <div className="p-3 rounded-xl bg-card border border-border/70 space-y-1">
          <span className="text-[11px] font-medium text-muted-foreground block">Pages</span>
          <strong className="text-foreground font-semibold text-xs">
            {pageCount !== undefined && pageCount !== null && !isNaN(Number(pageCount))
              ? `${pageCount} ${pageCount === 1 ? 'page' : 'pages'}`
              : 'Not available'}
          </strong>
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-card border border-border/70 space-y-1">
          <span className="text-[11px] font-medium text-muted-foreground block">Dimensions</span>
          <strong className="text-foreground font-semibold text-xs">
            {dimensions?.width && dimensions?.height
              ? `${dimensions.width} × ${dimensions.height} px`
              : 'Not available'}
          </strong>
        </div>
      )}

      {/* Optimization Readiness */}
      <div className="p-3 rounded-xl bg-card border border-border/70 space-y-1">
        <span className="text-[11px] font-medium text-muted-foreground block">Status</span>
        <strong className="text-accent font-semibold text-xs flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-accent" />
          Ready to optimize
        </strong>
      </div>
    </div>
  );
}
