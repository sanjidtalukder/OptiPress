'use client';

import React, { useState, useRef } from 'react';
import { Upload, FileText, Image as ImageIcon, CheckCircle2, AlertCircle, X, Loader2, Trash2, FileCheck } from 'lucide-react';
import { siteConfig } from '@/config/site';
import { formatBytes } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ImageOptimizerCard } from '@/features/optimizer/components/image-optimizer-card';
import { PdfOptimizerCard } from '@/features/optimizer/components/pdf-optimizer-card';
import { useFileUpload } from '../hooks/use-file-upload';

interface UploadZoneProps {
  sessionId?: string;
  onFileSelect?: (file: File) => void;
  onOptimizationComplete?: () => void;
  disabled?: boolean;
}

export function UploadZone({ sessionId, onFileSelect, onOptimizationComplete, disabled = false }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { files, isUploading, error, clearError, uploadLocalFile, removeFile } = useFileUpload(sessionId);

  const handleFileSelection = async (file: File) => {
    clearError();
    await uploadLocalFile(file);
    onFileSelect?.(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isUploading) setIsDragging(true);
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
    if (disabled || isUploading) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelection(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        disabled={disabled || isUploading}
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        className="hidden"
        id="optipress-file-input"
      />

      {/* Main Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
        className={`relative rounded-2xl border-2 border-dashed p-8 md:p-10 text-center transition-all ${
          isDragging
            ? 'border-primary bg-primary/10 scale-[1.01]'
            : error
            ? 'border-destructive/50 bg-destructive/5'
            : 'border-border bg-card/80 hover:border-primary/50 hover:bg-card shadow-sm cursor-pointer'
        } ${disabled || isUploading ? 'opacity-75 cursor-not-allowed' : ''}`}
      >
        {isUploading ? (
          /* Loading / Uploading State */
          <div className="flex flex-col items-center space-y-3 py-4 animate-fade-in">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
              <Loader2 className="h-7 w-7 animate-spin" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-foreground">Uploading temporary file...</h3>
              <p className="text-xs text-muted-foreground font-mono">Validating format & signature</p>
            </div>
          </div>
        ) : (
          /* Default Drop Zone Prompt */
          <div className="flex flex-col items-center space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 transition-transform group-hover:scale-105">
              <Upload className="h-8 w-8" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-bold tracking-tight text-foreground">
                Drop your PDF or Image file here
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Drag & drop or click browse to upload into temporary workspace session.
              </p>
            </div>

            <Button
              type="button"
              variant="default"
              size="lg"
              disabled={disabled || isUploading}
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="font-semibold shadow-md gap-2"
            >
              Browse Local Files
            </Button>

            {/* Format Badges */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
              <span className="text-[11px] text-muted-foreground font-medium mr-1">Supported Formats:</span>
              {['PDF', 'JPG', 'PNG', 'WEBP'].map((fmt) => (
                <Badge key={fmt} variant="outline" className="text-[10px] font-mono">
                  {fmt}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 text-xs text-destructive flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={clearError} className="text-destructive hover:opacity-75">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Active Session Files List */}
      {files.length > 0 && (
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
            <span>Temporary Workspace Files ({files.length})</span>
            <span className="text-[10px] font-normal text-muted-foreground">Session Bound</span>
          </h4>

          <div className="space-y-2">
            {files.map((file) => {
              const isPdf = file.extension === 'pdf';
              const isImage = ['jpg', 'jpeg', 'png', 'webp'].includes(file.extension.toLowerCase());
              return (
                <div key={file.id} className="space-y-2">
                  <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card shadow-sm hover:border-accent/40 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent border border-accent/20">
                        {isPdf ? <FileText className="h-5 w-5" /> : <ImageIcon className="h-5 w-5" />}
                      </div>

                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground truncate max-w-[240px] sm:max-w-xs">
                            {file.originalName}
                          </span>
                          <Badge variant="outline" className="uppercase text-[10px] font-mono">
                            {file.extension}
                          </Badge>
                          <Badge variant="accent" className="capitalize text-[10px] gap-1">
                            <FileCheck className="h-3 w-3" />
                            {file.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground font-mono">
                          Size: <strong className="text-foreground">{formatBytes(file.fileSize || file.size)}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pl-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(file.id)}
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0 rounded-lg"
                        aria-label="Remove temporary file"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {isImage && <ImageOptimizerCard file={file} onOptimizationComplete={onOptimizationComplete} />}
                  {isPdf && <PdfOptimizerCard file={file} onOptimizationComplete={onOptimizationComplete} />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upload Zone Metadata Bar */}
      <div className="flex items-center justify-between text-[11px] text-muted-foreground px-2 pt-1">
        <span className="flex items-center gap-1">
          <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
          Max File Size: {formatBytes(siteConfig.maxFileSizeBytes)} per file
        </span>
        <span className="font-mono">Temporary Storage • Metadata Only in DB</span>
      </div>
    </div>
  );
}
