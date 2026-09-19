'use client';

import React, { useState, useRef } from 'react';
import { Upload, AlertCircle, X, Loader2, CheckCircle2 } from 'lucide-react';
import { siteConfig } from '@/config/site';
import { formatBytes } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFileUpload } from '@/features/upload/hooks/use-file-upload';
import { UploadedFileCard } from './uploaded-file-card';

interface ModernUploadZoneProps {
  sessionId?: string;
  onFileSelect?: (file: File) => void;
  onOptimizationComplete?: () => void;
  disabled?: boolean;
}

export function ModernUploadZone({
  sessionId,
  onFileSelect,
  onOptimizationComplete,
  disabled = false,
}: ModernUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [activeLocalFile, setActiveLocalFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { files, isUploading, error, clearError, uploadLocalFile, removeFile } = useFileUpload(sessionId);

  const activeFile = files.length > 0 ? files[0] : null;

  const handleFileSelection = async (file: File) => {
    clearError();
    setActiveLocalFile(file);
    const res = await uploadLocalFile(file);
    if (res.success) {
      onFileSelect?.(file);
    } else {
      setActiveLocalFile(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isUploading && !activeFile) setIsDragging(true);
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
    if (disabled || isUploading || activeFile) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleReplaceFile = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = async () => {
    if (activeFile) {
      await removeFile(activeFile.id);
    }
    setActiveLocalFile(null);
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        disabled={disabled || isUploading}
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        className="hidden"
        id="optipress-file-input"
      />

      {/* AFTER UPLOAD: Render File Preview / Success Workflow State */}
      {activeFile ? (
        <UploadedFileCard
          file={activeFile}
          localFileObj={activeLocalFile}
          onReplaceFile={handleReplaceFile}
          onRemoveFile={handleRemoveFile}
          onOptimizationComplete={onOptimizationComplete}
        />
      ) : (
        /* BEFORE UPLOAD: Lightweight, welcoming drag-and-drop area */
        <div className="space-y-4">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
            className={`relative rounded-3xl border-2 border-dashed p-8 sm:p-12 text-center transition-all ${
              isDragging
                ? 'border-primary bg-primary/10 scale-[1.01]'
                : error
                ? 'border-destructive/50 bg-destructive/5'
                : 'border-border/80 bg-card/80 hover:border-primary/50 hover:bg-card shadow-sm cursor-pointer'
            } ${disabled || isUploading ? 'opacity-75 cursor-not-allowed' : ''}`}
          >
            {isUploading ? (
              /* Uploading Progress State */
              <div className="flex flex-col items-center space-y-4 py-4 animate-fade-in">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-foreground">Uploading your file...</h3>
                  <p className="text-xs text-muted-foreground">Validating file structure</p>
                </div>
              </div>
            ) : (
              /* Idle Upload Prompt */
              <div className="flex flex-col items-center space-y-5">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 transition-transform group-hover:scale-105 shadow-sm">
                  <Upload className="h-8 w-8" />
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                    Upload your file
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                    Drop a PDF or image here, or browse from your computer.
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
                  className="font-bold text-sm shadow-md gap-2 px-6 py-5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Browse Files
                </Button>

                {/* Supported Formats */}
                <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                  <span className="text-[11px] text-muted-foreground font-medium mr-1">Supported formats:</span>
                  {['PDF', 'JPG', 'PNG', 'WEBP'].map((fmt) => (
                    <Badge key={fmt} variant="outline" className="text-[10px] font-mono px-2 py-0.5">
                      {fmt}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/30 text-xs text-destructive flex items-center justify-between animate-fade-in">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
              <button onClick={clearError} className="text-destructive hover:opacity-75">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Privacy & Max Size Footer */}
          <div className="flex items-center justify-between text-[11px] text-muted-foreground px-2 pt-1">
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
              Maximum file size: {formatBytes(siteConfig.maxFileSizeBytes)}
            </span>
            <span className="text-muted-foreground">
              Files are temporary and automatically cleaned up for your privacy.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
