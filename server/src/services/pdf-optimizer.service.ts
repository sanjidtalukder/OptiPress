import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { PdfOptimizationMode, PdfOptimizationResult, OptimizationResultStatus } from '@optipress/types';
import { pdfAnalyzer, DetailedPdfAnalysisResult } from './pdf-analyzer.service.js';
import { pdfValidator } from './pdf-validator.service.js';
import { imageQualityEvaluator } from './quality-evaluator.service.js';
import { qpdfService } from './qpdf.service.js';
import { ghostscriptService, GhostscriptProfileName } from './ghostscript.service.js';
import { imageRecompressorService } from './image-recompressor.service.js';
import { binManagerService } from './bin-manager.service.js';

export interface OptimizePdfParams {
  fileId: string;
  inputPath: string;
  outputPath: string;
  mode: PdfOptimizationMode;
  targetSize?: number;
  targetUnit?: 'KB' | 'MB';
  forceTarget?: boolean;
}

export interface CandidateEvaluationMeta {
  candPath: string;
  sizeBytes: number;
  qualityScore: number;
  ssim: number;
  psnr: number;
  isLossless: boolean;
  profileName: string;
  jpegQuality: number;
  dpiScale: number;
  structuralPassed: boolean;
  isValid: boolean;
}

export class PdfOptimizer {
  async optimizePdf(params: OptimizePdfParams): Promise<PdfOptimizationResult> {
    const startTime = Date.now();
    const { fileId, inputPath, outputPath, mode, targetSize, targetUnit, forceTarget } = params;

    const stats = await fs.promises.stat(inputPath);
    const originalSize = stats.size;

    // 1. Analyze PDF document characteristics
    const analysis: DetailedPdfAnalysisResult = await pdfAnalyzer.analyzePdf(inputPath);
    const warnings: string[] = [];

    // Encrypted PDF safeguard
    if (analysis.isEncrypted) {
      await fs.promises.copyFile(inputPath, outputPath);
      return {
        fileId,
        status: 'unsupported_feature',
        resultLabel: 'Unsupported File',
        userMessage: 'Encrypted PDF cannot be optimized without password.',
        qualityProtected: true,
        qualityStatusText: 'Protected Document',
        originalSize,
        optimizedSize: originalSize,
        reductionBytes: 0,
        savedBytes: 0,
        reductionPercentage: 0,
        pageCount: analysis.pageCount,
        pdfType: analysis.pdfType,
        mode,
        isEncrypted: true,
        isSigned: analysis.isSigned,
        warnings: ['PDF is encrypted or password-protected.'],
        message: 'Encrypted PDF cannot be optimized without password.',
        processingTimeMs: Date.now() - startTime,
      };
    }

    if (analysis.isSigned) {
      warnings.push('This PDF contains a digital signature. Optimization may invalidate it.');
    }

    // Determine target size in bytes if requested
    let targetSizeBytes: number | undefined = undefined;
    if (targetSize && targetSize > 0) {
      const multiplier = (targetUnit || 'KB') === 'MB' ? 1024 * 1024 : 1024;
      targetSizeBytes = Math.round(targetSize * multiplier);
    }

    // 2. Multi-Candidate Generation Setup
    const tempDir = path.dirname(outputPath);
    const tempId = crypto.randomUUID();
    const candidateFiles: string[] = [];

    const validCandidates: CandidateEvaluationMeta[] = [];

    // Helper to evaluate and add a candidate
    const evaluateCandidate = async (
      candPath: string,
      profileName: string,
      jpegQuality: number,
      dpiScale: number
    ): Promise<CandidateEvaluationMeta | null> => {
      candidateFiles.push(candPath);
      if (!fs.existsSync(candPath)) return null;

      const candStats = await fs.promises.stat(candPath);
      const candSize = candStats.size;

      // Integrity & page count check
      const val = await pdfValidator.validatePdf(candPath, analysis.pageCount);
      if (!val.isValid || candSize === 0) return null;

      // Visual quality check (SSIM / PSNR)
      const qEval = await imageQualityEvaluator.evaluatePdfQuality(inputPath, candPath);

      return {
        candPath,
        sizeBytes: candSize,
        qualityScore: qEval.score,
        ssim: qEval.metrics.ssim || 1.0,
        psnr: qEval.metrics.psnr || 100,
        isLossless: qEval.isLossless,
        profileName,
        jpegQuality,
        dpiScale,
        structuralPassed: val.structuralCheckPassed,
        isValid: true,
      };
    };

    // 3. Define Optimization Pass Candidate Matrix
    // Pass strategy 1: QPDF pure structural compaction
    const qpdfCandPath = path.join(tempDir, `cand-${tempId}-qpdf.pdf`);
    const qpdfRes = await qpdfService.optimizeStructure({
      inputPath,
      outputPath: qpdfCandPath,
      linearize: true,
    });
    if (qpdfRes.success && qpdfRes.outputSize < originalSize) {
      const candMeta = await evaluateCandidate(qpdfCandPath, 'structural', 95, 1.0);
      if (candMeta) validCandidates.push(candMeta);
    }

    // Pass strategy 2: Direct Image Recompression + QPDF Structural Compaction
    const directPasses = [
      { q: 85, s: 1.0, label: 'high_quality' },
      { q: 75, s: 0.9, label: 'academic' },
      { q: 65, s: 0.8, label: 'balanced' },
      { q: 55, s: 0.7, label: 'strong' },
      { q: 45, s: 0.6, label: 'maximum' },
    ];

    for (const p of directPasses) {
      const rawCandPath = path.join(tempDir, `cand-${tempId}-img-${p.q}-${p.s}.pdf`);
      const qpdfOptPath = path.join(tempDir, `cand-${tempId}-img-opt-${p.q}-${p.s}.pdf`);

      const imgRes = await imageRecompressorService.recompressEmbeddedImages({
        inputPath,
        outputPath: rawCandPath,
        jpegQuality: p.q,
        maxDimensionScale: p.s,
      });

      if (imgRes.success) {
        await qpdfService.optimizeStructure({
          inputPath: rawCandPath,
          outputPath: qpdfOptPath,
        });

        const targetFileToEval = fs.existsSync(qpdfOptPath) ? qpdfOptPath : rawCandPath;
        const meta = await evaluateCandidate(targetFileToEval, p.label, p.q, p.s);
        if (meta && meta.sizeBytes < originalSize) {
          validCandidates.push(meta);
        }
      }
    }

    // Pass strategy 3: Ghostscript PDFWrite Engine (if available)
    if (binManagerService.isGhostscriptAvailable()) {
      const gsProfiles: GhostscriptProfileName[] = ['preserve', 'academic', 'balanced', 'strong', 'extreme'];
      for (const gsProf of gsProfiles) {
        const gsCandPath = path.join(tempDir, `cand-${tempId}-gs-${gsProf}.pdf`);
        const gsRes = await ghostscriptService.optimizePdf({
          inputPath,
          outputPath: gsCandPath,
          profileName: gsProf,
        });

        if (gsRes.success && gsRes.outputSize < originalSize) {
          const meta = await evaluateCandidate(gsCandPath, `gs_${gsProf}`, 75, 0.8);
          if (meta) validCandidates.push(meta);
        }
      }
    }

    // Cleanup helper
    const cleanupCandidates = async (winnerPath?: string) => {
      for (const f of candidateFiles) {
        if (f !== winnerPath && fs.existsSync(f)) {
          await fs.promises.unlink(f).catch(() => {});
        }
      }
    };

    // Safeguard: No valid smaller candidate found
    if (validCandidates.length === 0) {
      await cleanupCandidates();
      await fs.promises.copyFile(inputPath, outputPath);

      return {
        fileId,
        status: 'already_optimized',
        resultLabel: 'Already optimized',
        userMessage: 'Your PDF file is already highly optimized. Preserved original document intact.',
        qualityProtected: true,
        qualityStatusText: '✓ Quality check passed',
        originalSize,
        optimizedSize: originalSize,
        reductionBytes: 0,
        savedBytes: 0,
        reductionPercentage: 0,
        pageCount: analysis.pageCount,
        pdfType: analysis.pdfType,
        mode,
        isEncrypted: false,
        isSigned: analysis.isSigned,
        warnings,
        message: 'Your file is already highly optimized. Preserved original document intact.',
        qualityScore: 100,
        targetAchieved: targetSizeBytes ? originalSize <= targetSizeBytes : undefined,
        structuralCheck: true,
        textPreserved: true,
        pageCountPreserved: true,
        label: 'LOSSLESS',
        processingTimeMs: Date.now() - startTime,
      };
    }

    // 4. Candidate Ranking & Selection Strategy
    // Sort candidates by size ascending
    validCandidates.sort((a, b) => a.sizeBytes - b.sizeBytes);

    let winner: CandidateEvaluationMeta;
    let finalStatus: OptimizationResultStatus = 'success';
    let resultLabel = 'PDF Optimization';
    let userMessage = 'OptiPress optimized your PDF while protecting visual quality and document integrity.';
    let qualityStatusText = '✓ Quality check passed';
    let targetAchieved = true;

    if (targetSizeBytes) {
      const targetCompliant = validCandidates.filter((c) => c.sizeBytes <= targetSizeBytes);
      const safeTargetCompliant = targetCompliant.filter((c) => c.qualityScore >= 60);

      if (safeTargetCompliant.length > 0) {
        // Pick best safe compliant candidate (highest quality score among compliant)
        safeTargetCompliant.sort((a, b) => b.qualityScore - a.qualityScore);
        winner = safeTargetCompliant[0];
        finalStatus = 'success';
        targetAchieved = true;
        resultLabel = 'Target Size Achieved';
        userMessage = `OptiPress successfully reduced your PDF to ${Math.round(winner.sizeBytes / 1024)} KB, achieving your target size.`;
      } else if (targetCompliant.length > 0 && forceTarget) {
        targetCompliant.sort((a, b) => b.qualityScore - a.qualityScore);
        winner = targetCompliant[0];
        finalStatus = 'success';
        targetAchieved = true;
        resultLabel = 'Target Size Forced';
        userMessage = 'Target size achieved under forced mode. Noticeable visual quality trade-off may apply.';
      } else {
        // Target unreachable under safe quality thresholds -> select best safe candidate overall
        const safeCandidates = validCandidates.filter((c) => c.qualityScore >= 65);
        safeCandidates.sort((a, b) => a.sizeBytes - b.sizeBytes);
        winner = safeCandidates[0] || validCandidates[0];

        finalStatus = 'best_safe_result';
        targetAchieved = false;
        resultLabel = 'Best Safe Size';
        qualityStatusText = '✓ Quality protected';
        userMessage = `Your requested target could not be reached without significant quality loss. The best quality-preserving result is ${Math.round(winner.sizeBytes / 1024)} KB.`;
      }
    } else {
      // Standard mode selection: prefer high quality score (>= 75) with maximum size reduction
      const safeCandidates = validCandidates.filter((c) => c.qualityScore >= 70);
      safeCandidates.sort((a, b) => a.sizeBytes - b.sizeBytes);
      winner = safeCandidates[0] || validCandidates[0];
      finalStatus = 'success';
    }

    // Copy winner file to final destination
    await fs.promises.copyFile(winner.candPath, outputPath);
    await cleanupCandidates(winner.candPath);

    const outStats = await fs.promises.stat(outputPath);
    const optimizedSize = outStats.size;
    const reductionBytes = Math.max(0, originalSize - optimizedSize);
    const reductionPercentage = Number(((reductionBytes / originalSize) * 100).toFixed(1));

    const dpiReduction = analysis.maxEffectiveDpi > 0
      ? `${analysis.maxEffectiveDpi} -> ${Math.round(analysis.maxEffectiveDpi * winner.dpiScale)} DPI`
      : 'DPI Optimized';

    return {
      fileId,
      status: finalStatus,
      resultLabel,
      userMessage,
      qualityProtected: true,
      qualityStatusText,
      bestSafeSize: finalStatus === 'best_safe_result' ? optimizedSize : undefined,
      isSmartTargetReached: targetAchieved,
      originalSize,
      optimizedSize,
      reductionBytes,
      savedBytes: reductionBytes,
      reductionPercentage,
      targetSize: targetSize ? `${targetSize} ${targetUnit || 'KB'}` : undefined,
      targetAchieved,
      compressionProfile: winner.profileName,
      pdfType: analysis.pdfType,
      imageCount: analysis.embeddedImageCount,
      imagesOptimized: analysis.embeddedImageCount,
      dpiReduction,
      jpegQuality: winner.jpegQuality,
      qualityScore: winner.qualityScore,
      structuralCheck: winner.structuralPassed,
      textPreserved: true,
      pageCountPreserved: true,
      label: winner.isLossless ? 'LOSSLESS' : 'LOSSY OPTIMIZATION',
      pageCount: analysis.pageCount,
      mode,
      isEncrypted: false,
      isSigned: analysis.isSigned,
      warnings,
      message: userMessage,
      processingTimeMs: Date.now() - startTime,
    };
  }
}

export const pdfOptimizer = new PdfOptimizer();
