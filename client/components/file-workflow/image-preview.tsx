/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect } from 'react';
import { Maximize2, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatBytes } from '@/lib/utils';

interface ImagePreviewProps {
  src?: string | File | null;
  fileName: string;
  fileSize: number;
  extension: string;
  dimensions?: { width: number; height: number } | null;
  label?: string;
  className?: string;
}

export function ImagePreview({
  src,
  fileName,
  fileSize,
  extension,
  dimensions: initialDimensions,
  label,
  className = '',
}: ImagePreviewProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(initialDimensions || null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
    if (!src) {
      setObjectUrl(null);
      return;
    }

    if (typeof src === 'string') {
      setObjectUrl(src);
      const img = new Image();
      img.src = src;
      img.onload = () => {
        setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      };
      return;
    }

    if (src instanceof File) {
      const url = URL.createObjectURL(src);
      setObjectUrl(url);

      const img = new Image();
      img.src = url;
      img.onload = () => {
        setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      };

      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [src]);

  const extUpper = extension.toUpperCase();
  const formatLabel = `${extUpper} Image`;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Main Preview Container */}
      <div className="relative group overflow-hidden rounded-2xl border border-border/80 bg-neutral-900/90 p-3 shadow-inner flex flex-col items-center justify-center min-h-[200px] max-h-[340px]">
        {label && (
          <div className="absolute top-3 left-3 z-10">
            <Badge variant="accent" className="text-[10px] font-semibold px-2 py-0.5 shadow-sm">
              {label}
            </Badge>
          </div>
        )}

        {objectUrl && !imageError ? (
          <>
            <div className="relative w-full h-full flex items-center justify-center py-2">
              <img
                src={objectUrl}
                alt={fileName}
                onError={() => setImageError(true)}
                className="max-h-[260px] w-auto max-w-full object-contain rounded-xl shadow-sm transition-transform duration-300 group-hover:scale-[1.01]"
              />
            </div>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsPreviewOpen(true)}
              className="absolute bottom-3 right-3 opacity-90 group-hover:opacity-100 transition-opacity text-xs gap-1.5 bg-neutral-800/90 backdrop-blur-md text-white border border-neutral-700 shadow-md hover:bg-neutral-700"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              <span>Preview</span>
            </Button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 space-y-2 text-muted-foreground">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-800 text-neutral-400 border border-neutral-700">
              <ImageIcon className="h-6 w-6" />
            </div>
            <span className="text-xs font-medium">Image Preview Unavailable</span>
          </div>
        )}
      </div>

      {/* Details Row */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <div className="flex items-center gap-2 truncate">
          <span className="font-semibold text-foreground truncate max-w-[200px] sm:max-w-xs">{fileName}</span>
          <Badge variant="outline" className="text-[10px] uppercase font-mono px-1.5 py-0">
            {extension}
          </Badge>
        </div>
        <div className="text-[11px] font-mono text-muted-foreground shrink-0">
          {formatLabel} • {formatBytes(fileSize)}
          {dimensions ? ` • ${dimensions.width} × ${dimensions.height} px` : ''}
        </div>
      </div>

      {/* Lightbox Modal */}
      {isPreviewOpen && objectUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="relative max-w-5xl max-h-[90vh] w-full flex flex-col items-center justify-center p-4 bg-neutral-900 rounded-3xl border border-neutral-800 shadow-2xl space-y-4">
            <div className="w-full flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-white truncate max-w-lg">{fileName}</h4>
                <p className="text-xs text-neutral-400 font-mono">
                  {formatLabel} • {formatBytes(fileSize)}
                  {dimensions ? ` • ${dimensions.width} × ${dimensions.height} px` : ''}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPreviewOpen(false)}
                className="h-8 w-8 p-0 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-full"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="w-full flex items-center justify-center overflow-auto max-h-[75vh] p-2">
              <img src={objectUrl} alt={fileName} className="max-h-[70vh] max-w-full object-contain rounded-xl shadow-lg" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
