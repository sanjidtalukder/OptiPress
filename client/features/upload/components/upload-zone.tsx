'use client';

import React, { useState, useRef } from 'react';
import { Upload, File, FileText, Image as ImageIcon, CheckCircle2, AlertCircle, X, Shield, ArrowRight } from 'lucide-react';
import { siteConfig } from '@/config/site';
import { formatBytes } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LocalSelectedFile } from '@/types';

interface UploadZoneProps {
  onFileSelect?: (file: File) => void;
  disabled?: boolean;
}

export function UploadZone({ onFileSelect, disabled = false }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<LocalSelectedFile | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSetFile = (file: File) => {
    setErrorMessage(null);

    // Validate size
    if (file.size > siteConfig.maxFileSizeBytes) {
      setErrorMessage(`File exceeds max size limit of ${formatBytes(siteConfig.maxFileSizeBytes)}.`);
      return;
    }

    // Validate mime / format
    const matchedFormat = siteConfig.supportedFormats.find(
      (f) => f.mime === file.type || file.name.toLowerCase().endsWith(f.extension)
    );

    if (!matchedFormat) {
      setErrorMessage(
        `Unsupported format (${file.type || 'unknown'}). Please upload a PDF, JPG, PNG, WEBP, or AVIF file.`
      );
      return;
    }

    const newLocalFile: LocalSelectedFile = {
      id: Math.random().toString(36).substring(7),
      file,
      name: file.name,
      size: file.size,
      type: matchedFormat.label.toLowerCase() as any,
    };

    setSelectedFile(newLocalFile);
    if (onFileSelect) {
      onFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        disabled={disabled}
        accept=".pdf,.jpg,.jpeg,.png,.webp,.avif"
        className="hidden"
        id="optipress-file-input"
      />

      {/* Main Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !selectedFile && !disabled && fileInputRef.current?.click()}
        className={`relative rounded-2xl border-2 border-dashed p-8 md:p-12 text-center transition-all cursor-pointer ${
          isDragging
            ? 'border-primary bg-primary/10 scale-[1.01]'
            : selectedFile
            ? 'border-accent/50 bg-accent/5 cursor-default'
            : errorMessage
            ? 'border-destructive/50 bg-destructive/5'
            : 'border-border bg-card/80 hover:border-primary/50 hover:bg-card shadow-sm'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {selectedFile ? (
          /* Selected File Card State */
          <div className="flex flex-col items-center space-y-4 animate-fade-in">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent border border-accent/20">
              {selectedFile.type === 'pdf' ? (
                <FileText className="h-7 w-7" />
              ) : (
                <ImageIcon className="h-7 w-7" />
              )}
            </div>

            <div className="space-y-1 text-center max-w-md">
              <div className="flex items-center justify-center gap-2">
                <span className="font-bold text-base text-foreground truncate">{selectedFile.name}</span>
                <Badge variant="accent" className="uppercase text-[10px]">
                  {selectedFile.type}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground font-mono">
                Original Size: <strong className="text-foreground">{formatBytes(selectedFile.size)}</strong>
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button
                variant="accent"
                size="default"
                onClick={(e) => {
                  e.stopPropagation();
                  alert(`Ready for target size configuration! (${selectedFile.name})`);
                }}
                className="gap-2 font-semibold shadow-md"
              >
                Configure Target Size
                <ArrowRight className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="default"
                onClick={(e) => {
                  e.stopPropagation();
                  clearSelection();
                }}
                className="gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
                Remove File
              </Button>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-2">
              <Shield className="h-3.5 w-3.5 text-accent" />
              <span>File loaded locally. Zero server upload until target compression is started.</span>
            </div>
          </div>
        ) : (
          /* Default Upload State */
          <div className="flex flex-col items-center space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 transition-transform group-hover:scale-105">
              <Upload className="h-8 w-8" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-bold tracking-tight text-foreground">
                Drop your PDF or Image file here
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Drag and drop your file or click browse to select. Target sizes start from <strong>99 KB</strong>.
              </p>
            </div>

            <Button
              type="button"
              variant="default"
              size="lg"
              disabled={disabled}
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="font-semibold shadow-md gap-2"
            >
              Browse Local Files
            </Button>

            {/* Format Badges */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-2">
              <span className="text-[11px] text-muted-foreground font-medium mr-1">Supported Formats:</span>
              {siteConfig.supportedFormats.map((fmt) => (
                <Badge key={fmt.label} variant="outline" className="text-[10px] font-mono">
                  {fmt.label}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 text-xs text-destructive flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-destructive hover:opacity-75">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Upload Zone Metadata Bar */}
      <div className="flex items-center justify-between text-[11px] text-muted-foreground px-2">
        <span className="flex items-center gap-1">
          <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
          Max File Size: 100 MB per file
        </span>
        <span className="font-mono">Privacy Preserved • Auto-Purge Session</span>
      </div>
    </div>
  );
}
