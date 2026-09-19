'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  RefreshCw,
  Trash2,
  AlertCircle,
  Sparkles,
  Target as TargetIcon,
} from 'lucide-react';
import {
  SessionFileMetadata,
  ImageOptimizationResult,
  TargetSizeOptimizationResult,
  PdfOptimizationResult,
} from '@optipress/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/auth/hooks/use-auth';
import { FilePreview } from './file-preview';
import { FileMetadataView } from './file-metadata';
import { OptimizationOptions, OptimizationStrategyMode } from './optimization-options';
import { TargetSizeSelector } from './target-size-selector';
import { OptimizationProgress } from './optimization-progress';
import { OptimizationResultView } from './optimization-result';
import { imageOptimizerService } from '@/features/optimizer/services/image-optimizer.service';
import { pdfOptimizerService } from '@/features/optimizer/services/pdf-optimizer.service';

interface UploadedFileCardProps {
  file: SessionFileMetadata;
  localFileObj?: File | null;
  onReplaceFile: () => void;
  onRemoveFile: () => void;
  onOptimizationComplete?: () => void;
}

export function UploadedFileCard({
  file,
  localFileObj,
  onReplaceFile,
  onRemoveFile,
  onOptimizationComplete,
}: UploadedFileCardProps) {
  const [tabMode, setTabMode] = useState<'strategy' | 'target'>('strategy');

  // Strategy Mode State
  const [strategyMode, setStrategyMode] = useState<OptimizationStrategyMode>('smart');

  // Target Size Mode State
  const [targetSize, setTargetSize] = useState<number>(100);
  const [targetUnit, setTargetUnit] = useState<'KB' | 'MB'>('KB');
  const [forceTarget, setForceTarget] = useState<boolean>(false);

  // Workflow Execution State
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Results State
  const [imageResult, setImageResult] = useState<ImageOptimizationResult | null>(null);
  const [targetResult, setTargetResult] = useState<TargetSizeOptimizationResult | null>(null);
  const [pdfResult, setPdfResult] = useState<PdfOptimizationResult | null>(null);

  const { session } = useAuth();
  const isPdf = file.extension.toLowerCase() === 'pdf';
  const isImage = ['jpg', 'jpeg', 'png', 'webp'].includes(file.extension.toLowerCase());

  // Handle Strategy Optimization
  const handleOptimizeStrategy = async () => {
    if (!session?.accessToken) {
      setError('Authentication session required for optimization.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setImageResult(null);
    setTargetResult(null);
    setPdfResult(null);

    try {
      if (isPdf) {
        const res = await pdfOptimizerService.optimizePdf(file.id, strategyMode, session.accessToken);
        if (res.success && res.data) {
          setPdfResult(res.data);
          onOptimizationComplete?.();
        } else {
          setError(res.error || 'PDF optimization failed.');
        }
      } else if (isImage) {
        const res = await imageOptimizerService.optimizeImage(file.id, strategyMode, session.accessToken);
        if (res.success && res.data) {
          setImageResult(res.data);
          onOptimizationComplete?.();
        } else {
          setError(res.error || 'Image optimization failed.');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Optimization processing failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Target Size Optimization
  const handleOptimizeTargetSize = async () => {
    if (!session?.accessToken) {
      setError('Authentication session required for target size optimization.');
      return;
    }

    if (!targetSize || targetSize <= 0) {
      setError('Please enter a valid target size.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setImageResult(null);
    setTargetResult(null);
    setPdfResult(null);

    try {
      const res = await imageOptimizerService.optimizeTargetSize(
        file.id,
        {
          targetSize,
          unit: targetUnit,
          forceTarget,
        },
        session.accessToken
      );

      if (res.success && res.data) {
        setTargetResult(res.data);
        onOptimizationComplete?.();
      } else {
        setError(res.error || 'Target size optimization failed.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Target size optimization failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Download for Active Result
  const handleDownloadActiveResult = async (): Promise<boolean> => {
    if (!session?.accessToken) return false;

    if (pdfResult?.outputFileId) {
      const res = await pdfOptimizerService.downloadOptimizedPdf(
        pdfResult.outputFileId,
        session.accessToken,
        pdfResult.outputFileName || `${file.originalName.replace(/\.pdf$/i, '')}_optimized.pdf`
      );
      return res.success;
    }

    if (imageResult?.outputFileId) {
      const res = await imageOptimizerService.downloadOptimizedImage(
        imageResult.outputFileId,
        session.accessToken,
        imageResult.outputFileName || `${file.originalName.replace(/\.[^/.]+$/, '')}_optimized.${file.extension}`
      );
      return res.success;
    }

    if (targetResult?.outputFileId) {
      const res = await imageOptimizerService.downloadOptimizedImage(
        targetResult.outputFileId,
        session.accessToken,
        targetResult.outputFileName || `${file.originalName.replace(/\.[^/.]+$/, '')}_target.${file.extension}`
      );
      return res.success;
    }

    return false;
  };

  // Dynamic Primary Action Button Label
  const getOptimizeButtonLabel = () => {
    if (tabMode === 'target') {
      return `Reduce to ${targetSize || 0} ${targetUnit}`;
    }
    if (isPdf) return 'Optimize PDF';
    return 'Optimize Image';
  };

  const hasResult = Boolean(pdfResult || imageResult || targetResult);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Step 1: Upload Success Banner & Actions */}
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              File uploaded successfully
            </h3>
            <p className="text-xs text-muted-foreground">Your file is ready to optimize.</p>
          </div>
        </div>

        {/* Actions: Replace File & Remove File */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onReplaceFile}
            className="text-xs font-semibold gap-1.5 shadow-xs"
          >
            <RefreshCw className="h-3.5 w-3.5 text-primary" />
            <span>Replace File</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemoveFile}
            className="text-xs font-semibold gap-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            title="Remove file"
          >
            <Trash2 className="h-4 w-4" />
            <span>Remove</span>
          </Button>
        </div>
      </div>

      {/* Step 2: Uploaded File Large Preview */}
      <FilePreview
        src={localFileObj || undefined}
        fileName={file.originalName}
        fileSize={file.fileSize || file.size || 0}
        extension={file.extension}
      />

      {/* Step 3: File Information Metadata */}
      <FileMetadataView
        extension={file.extension}
        fileSize={file.fileSize || file.size || 0}
        pageCount={pdfResult?.pageCount}
      />

      {/* Step 4: Optimization Strategy / Target Size Selection */}
      <div className="rounded-3xl border border-border/80 bg-card p-6 space-y-6 shadow-sm">
        {/* Mode Switcher Header for Images */}
        {isImage && (
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <span className="text-xs font-semibold text-muted-foreground">Choose how to optimize</span>
            <div className="flex items-center rounded-lg bg-muted p-0.5 border border-border/60">
              <button
                type="button"
                onClick={() => setTabMode('strategy')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  tabMode === 'strategy'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Optimization Modes
              </button>
              <button
                type="button"
                onClick={() => setTabMode('target')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1 ${
                  tabMode === 'target'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <TargetIcon className="h-3 w-3 text-primary" />
                Target Size
              </button>
            </div>
          </div>
        )}

        {/* Strategy Options */}
        {tabMode === 'strategy' && (
          <OptimizationOptions
            selectedMode={strategyMode}
            onSelectMode={setStrategyMode}
            disabled={isProcessing}
          />
        )}

        {/* Target Size Options */}
        {tabMode === 'target' && (
          <TargetSizeSelector
            targetSize={targetSize}
            targetUnit={targetUnit}
            forceTarget={forceTarget}
            onTargetChange={(val, unit) => {
              setTargetSize(val);
              setTargetUnit(unit);
            }}
            onForceTargetChange={setForceTarget}
            disabled={isProcessing}
          />
        )}

        {/* Primary CTA Optimize Button */}
        {!isProcessing && (
          <Button
            type="button"
            variant="default"
            size="lg"
            onClick={tabMode === 'target' ? handleOptimizeTargetSize : handleOptimizeStrategy}
            disabled={isProcessing}
            className="w-full font-bold text-base shadow-xl gap-2 bg-primary hover:bg-primary/90 text-primary-foreground py-6 rounded-2xl transition-all scale-[1.01] hover:scale-[1.02]"
          >
            <Sparkles className="h-5 w-5" />
            <span>{getOptimizeButtonLabel()}</span>
          </Button>
        )}
      </div>

      {/* Step 5: Processing State */}
      {isProcessing && <OptimizationProgress label="Optimizing your file..." />}

      {/* Error Display */}
      {error && (
        <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/30 text-xs text-destructive flex items-center gap-2.5">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Step 6: Optimization Complete & Results */}
      {hasResult && !isProcessing && (
        <>
          {/* PDF Optimization Result */}
          {pdfResult && (
            <OptimizationResultView
              originalFileId={file.id}
              originalName={file.originalName}
              originalSize={pdfResult.originalSize}
              optimizedSize={pdfResult.optimizedSize}
              reductionBytes={pdfResult.reductionBytes}
              reductionPercentage={pdfResult.reductionPercentage}
              extension="pdf"
              originalSrc={localFileObj || undefined}
              outputFileId={pdfResult.outputFileId}
              outputFileName={pdfResult.outputFileName}
              onDownload={handleDownloadActiveResult}
              pageCount={pdfResult.pageCount}
            />
          )}

          {/* Strategy Image Optimization Result */}
          {imageResult && (
            <OptimizationResultView
              originalFileId={file.id}
              originalName={file.originalName}
              originalSize={imageResult.originalSize}
              optimizedSize={imageResult.optimizedSize}
              reductionBytes={imageResult.reductionBytes}
              reductionPercentage={imageResult.reductionPercentage}
              extension={file.extension}
              originalSrc={localFileObj || undefined}
              outputFileId={imageResult.outputFileId}
              outputFileName={imageResult.outputFileName}
              onDownload={handleDownloadActiveResult}
              dimensions={{ width: imageResult.width, height: imageResult.height }}
            />
          )}

          {/* Target Size Optimization Result */}
          {targetResult && (
            <OptimizationResultView
              originalFileId={file.id}
              originalName={file.originalName}
              originalSize={targetResult.originalSize}
              optimizedSize={targetResult.outputSize}
              reductionBytes={targetResult.reductionBytes}
              reductionPercentage={targetResult.reductionPercentage}
              extension={file.extension}
              originalSrc={localFileObj || undefined}
              outputFileId={targetResult.outputFileId}
              outputFileName={targetResult.outputFileName}
              onDownload={handleDownloadActiveResult}
              targetSizeInfo={{
                targetSizeBytes: targetResult.targetSizeBytes,
                targetReached: targetResult.targetReached,
                bestSafeSize: targetResult.bestSafeSize,
                forced: targetResult.forced,
                message: targetResult.message,
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
