'use client';

import React, { useState } from 'react';
import { Download, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DownloadButtonProps {
  onDownload: () => Promise<boolean>;
  fileType?: 'image' | 'pdf' | 'file';
  disabled?: boolean;
  className?: string;
}

export function DownloadButton({
  onDownload,
  fileType = 'file',
  disabled = false,
  className = '',
}: DownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadedState, setDownloadedState] = useState<'idle' | 'started' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const buttonLabel =
    fileType === 'image'
      ? 'Download optimized image'
      : fileType === 'pdf'
      ? 'Download optimized PDF'
      : 'Download optimized file';

  const handleDownloadClick = async () => {
    setIsDownloading(true);
    setErrorMsg(null);
    setDownloadedState('started');

    try {
      const ok = await onDownload();
      if (ok) {
        setDownloadedState('success');
      } else {
        setDownloadedState('error');
        setErrorMsg('Download failed. Please try again.');
      }
    } catch (err) {
      setDownloadedState('error');
      setErrorMsg(err instanceof Error ? err.message : 'Download failed.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Button
        type="button"
        variant="default"
        size="lg"
        onClick={handleDownloadClick}
        disabled={disabled || isDownloading}
        className="w-full font-bold text-sm shadow-lg gap-2.5 bg-primary hover:bg-primary/90 text-primary-foreground py-6 rounded-2xl transition-all scale-[1.01] hover:scale-[1.02]"
      >
        {isDownloading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Downloading...</span>
          </>
        ) : downloadedState === 'success' ? (
          <>
            <CheckCircle2 className="h-5 w-5 text-emerald-300" />
            <span>Downloaded successfully • Download again</span>
          </>
        ) : (
          <>
            <Download className="h-5 w-5" />
            <span>{buttonLabel}</span>
          </>
        )}
      </Button>

      {/* Confirmation indicator */}
      {downloadedState === 'started' && (
        <p className="text-[11px] text-accent text-center font-medium animate-fade-in">
          Download started...
        </p>
      )}

      {downloadedState === 'success' && (
        <p className="text-[11px] text-emerald-400 text-center font-medium animate-fade-in flex items-center justify-center gap-1">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Downloaded successfully! Your result remains available.
        </p>
      )}

      {errorMsg && (
        <div className="p-2.5 rounded-xl bg-destructive/10 border border-destructive/30 text-xs text-destructive flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
}
