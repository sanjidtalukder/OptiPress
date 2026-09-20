import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import crypto from 'crypto';
import {
  TargetSizeOptimizationRequest,
  TargetSizeOptimizationResult,
  TargetSizeResultState,
} from '@optipress/types';
import { TARGET_SIZE_CONFIG, parseTargetToBytes } from '@optipress/config';
import { imageQualityEvaluator } from './quality-evaluator.service.js';
import { pdfOptimizer } from './pdf-optimizer.service.js';

export interface TargetSizeServiceParams {
  fileId: string;
  originalPath: string;
  outputPath: string;
  extension: string;
  request: TargetSizeOptimizationRequest;
}

interface CandidateMeta {
  quality: number;
  size: number;
  psnr: number;
  score: number;
  isAcceptable: boolean;
}

export class TargetSizeService {
  async optimizeTargetSize(
    params: TargetSizeServiceParams
  ): Promise<TargetSizeOptimizationResult> {
    const { extension } = params;

    if (extension.toLowerCase() === 'pdf') {
      return this.optimizePdfTargetSize(params);
    }

    return this.optimizeImageTargetSize(params);
  }

  private async optimizePdfTargetSize(
    params: TargetSizeServiceParams
  ): Promise<TargetSizeOptimizationResult> {
    const startTime = Date.now();
    const { fileId, originalPath, outputPath, request } = params;

    const targetSizeBytes = parseTargetToBytes(request.targetSize, request.unit);
    const origStats = await fs.promises.stat(originalPath);
    const originalSize = origStats.size;

    if (originalSize <= targetSizeBytes) {
      await fs.promises.copyFile(originalPath, outputPath);
      return {
        fileId,
        status: 'already_below_target',
        originalSize,
        targetSizeBytes,
        outputSize: originalSize,
        reductionBytes: 0,
        savedBytes: 0,
        reductionPercentage: 0,
        qualityProtected: true,
        targetReached: true,
        forced: false,
        qualityScore: 100,
        iterationsCount: 0,
        message: 'Original PDF file is already below target size. Preserved original document intact.',
        processingTimeMs: Date.now() - startTime,
        label: 'LOSSLESS',
      };
    }

    const res = await pdfOptimizer.optimizePdf({
      fileId,
      inputPath: originalPath,
      outputPath,
      mode: 'smart',
      targetSize: request.targetSize,
      targetUnit: request.unit,
      forceTarget: request.forceTarget,
    });

    let status: TargetSizeResultState = 'success';
    if (res.status === 'best_safe_result') {
      status = 'target_unreachable';
    } else if (res.status === 'failed') {
      status = 'failed';
    }

    return {
      fileId,
      outputFileId: res.outputFileId,
      outputFileName: res.outputFileName,
      status,
      originalSize,
      targetSizeBytes,
      outputSize: res.optimizedSize,
      reductionBytes: res.reductionBytes,
      savedBytes: res.savedBytes,
      reductionPercentage: res.reductionPercentage,
      qualityProtected: res.qualityProtected ?? true,
      targetReached: res.targetAchieved ?? true,
      forced: Boolean(request.forceTarget),
      bestSafeSize: res.bestSafeSize,
      qualityScore: res.qualityScore || 85,
      iterationsCount: 4,
      message: res.userMessage || res.message,
      processingTimeMs: res.processingTimeMs,
      compressionProfile: res.compressionProfile,
      pdfType: res.pdfType,
      imageCount: res.imageCount,
      imagesOptimized: res.imagesOptimized,
      dpiReduction: res.dpiReduction,
      jpegQuality: res.jpegQuality,
      structuralCheck: res.structuralCheck,
      textPreserved: res.textPreserved,
      pageCountPreserved: res.pageCountPreserved,
      label: res.label,
    };
  }

  private async optimizeImageTargetSize(
    params: TargetSizeServiceParams
  ): Promise<TargetSizeOptimizationResult> {
    const startTime = Date.now();
    const { fileId, originalPath, outputPath, extension, request } = params;

    const targetSizeBytes = parseTargetToBytes(request.targetSize, request.unit);
    const ext = extension.toLowerCase();

    const origStats = await fs.promises.stat(originalPath);
    const originalSize = origStats.size;

    if (originalSize <= targetSizeBytes) {
      await fs.promises.copyFile(originalPath, outputPath);
      return {
        fileId,
        status: 'already_below_target',
        originalSize,
        targetSizeBytes,
        outputSize: originalSize,
        reductionBytes: 0,
        savedBytes: 0,
        reductionPercentage: 0,
        qualityProtected: true,
        targetReached: true,
        forced: false,
        qualityScore: 100,
        iterationsCount: 0,
        message: 'Original file is already below target size. Preserved original quality.',
        processingTimeMs: Date.now() - startTime,
        label: 'LOSSLESS',
      };
    }

    const tempDir = path.dirname(outputPath);
    const tempId = crypto.randomUUID();

    const origMetadata = await sharp(originalPath).metadata().catch(() => null);
    const origWidth = origMetadata?.width || 0;

    const candidates: CandidateMeta[] = [];
    let iterations = 0;

    const encodeCandidate = async (q: number, scale = 1.0): Promise<{ meta: CandidateMeta; tempFile: string }> => {
      iterations++;
      const candPath = path.join(tempDir, `cand-${tempId}-${scale}-${q}.${ext}`);
      let instance = sharp(originalPath).rotate();

      if (scale < 1.0 && origWidth > 0) {
        const targetW = Math.max(100, Math.round(origWidth * scale));
        instance = instance.resize({ width: targetW, withoutEnlargement: true });
      }

      switch (ext) {
        case 'jpg':
        case 'jpeg':
          await instance.jpeg({ quality: q, progressive: true, mozjpeg: true }).toFile(candPath);
          break;
        case 'png':
          await instance.png({ compressionLevel: 9, quality: q, palette: true }).toFile(candPath);
          break;
        case 'webp':
          await instance.webp({ quality: q, effort: 4 }).toFile(candPath);
          break;
        default:
          await fs.promises.copyFile(originalPath, candPath);
          break;
      }

      const candStats = await fs.promises.stat(candPath);
      const qualityEval = await imageQualityEvaluator.evaluateImageQuality(originalPath, candPath);

      const meta: CandidateMeta = {
        quality: q,
        size: candStats.size,
        psnr: qualityEval.metrics.psnr || 0,
        score: qualityEval.score,
        isAcceptable: qualityEval.passed,
      };

      return { meta, tempFile: candPath };
    };

    let winningTempFile: string | null = null;
    let selectedStatus: TargetSizeResultState = 'success';
    let isForced = false;
    let isQualityProtected = true;
    let isTargetReached = true;
    let bestSafeSize: number | undefined = undefined;

    try {
      const maxCand = await encodeCandidate(95, 1.0);
      candidates.push(maxCand.meta);

      if (maxCand.meta.size <= targetSizeBytes && maxCand.meta.isAcceptable) {
        winningTempFile = maxCand.tempFile;
      } else {
        await fs.promises.unlink(maxCand.tempFile).catch(() => {});

        let activeScale = 1.0;
        let minCand = await encodeCandidate(15, activeScale);
        candidates.push(minCand.meta);

        if (minCand.meta.size > targetSizeBytes) {
          const scalesToTry = [0.75, 0.5, 0.35, 0.25];
          for (const s of scalesToTry) {
            await fs.promises.unlink(minCand.tempFile).catch(() => {});
            minCand = await encodeCandidate(15, s);
            candidates.push(minCand.meta);
            if (minCand.meta.size <= targetSizeBytes) {
              activeScale = s;
              break;
            }
          }
        }

        if (minCand.meta.size > targetSizeBytes) {
          if (request.forceTarget) {
            winningTempFile = minCand.tempFile;
            isForced = true;
            isQualityProtected = false;
            isTargetReached = true;
            selectedStatus = 'success';
          } else {
            winningTempFile = minCand.tempFile;
            selectedStatus = 'target_unreachable';
            isTargetReached = false;
            isQualityProtected = true;
            bestSafeSize = minCand.meta.size;
          }
        } else {
          await fs.promises.unlink(minCand.tempFile).catch(() => {});

          let lowQ = 15;
          let highQ = 95;
          let bestValidCandFile: string | null = null;
          let bestValidMeta: CandidateMeta | null = null;

          while (lowQ <= highQ && iterations < TARGET_SIZE_CONFIG.MAX_ITERATIONS) {
            const midQ = Math.floor((lowQ + highQ) / 2);
            const cand = await encodeCandidate(midQ, activeScale);
            candidates.push(cand.meta);

            if (cand.meta.size <= targetSizeBytes) {
              if (bestValidCandFile) {
                await fs.promises.unlink(bestValidCandFile).catch(() => {});
              }
              bestValidCandFile = cand.tempFile;
              bestValidMeta = cand.meta;

              const diffPercent = ((targetSizeBytes - cand.meta.size) / targetSizeBytes) * 100;
              if (diffPercent <= TARGET_SIZE_CONFIG.TOLERANCE_PERCENT && cand.meta.isAcceptable) {
                break;
              }
              lowQ = midQ + 1;
            } else {
              await fs.promises.unlink(cand.tempFile).catch(() => {});
              highQ = midQ - 1;
            }
          }

          if (bestValidCandFile && bestValidMeta) {
            if (!bestValidMeta.isAcceptable && !request.forceTarget) {
              winningTempFile = bestValidCandFile;
              selectedStatus = 'target_unreachable';
              isTargetReached = false;
              isQualityProtected = true;
              bestSafeSize = bestValidMeta.size;
            } else {
              winningTempFile = bestValidCandFile;
              selectedStatus = 'success';
              isTargetReached = true;
              isQualityProtected = bestValidMeta.isAcceptable;
              isForced = !bestValidMeta.isAcceptable && Boolean(request.forceTarget);
            }
          }
        }
      }

      if (winningTempFile && fs.existsSync(winningTempFile)) {
        await fs.promises.copyFile(winningTempFile, outputPath);
        await fs.promises.unlink(winningTempFile).catch(() => {});
      } else {
        await fs.promises.copyFile(originalPath, outputPath);
      }
    } catch {
      await fs.promises.copyFile(originalPath, outputPath);
      selectedStatus = 'failed';
      isTargetReached = false;
    }

    const outStats = await fs.promises.stat(outputPath);
    const outputSize = outStats.size;
    const reductionBytes = Math.max(0, originalSize - outputSize);
    const reductionPercentage = originalSize > 0 ? Number(((reductionBytes / originalSize) * 100).toFixed(1)) : 0;

    const winningMeta = candidates.find((c) => c.size === outputSize) || candidates[candidates.length - 1];

    let message = 'Target size optimization completed successfully.';
    if (selectedStatus === 'target_unreachable') {
      message = `Target size ${request.targetSize} ${request.unit} cannot be reached without noticeable visual quality degradation. Best safe size reported.`;
    } else if (isForced) {
      message = 'Target size achieved under forced mode. Stronger compression was applied.';
    }

    return {
      fileId,
      status: selectedStatus,
      originalSize,
      targetSizeBytes,
      outputSize,
      reductionBytes,
      savedBytes: reductionBytes,
      reductionPercentage,
      qualityProtected: isQualityProtected,
      targetReached: isTargetReached,
      forced: isForced,
      bestSafeSize: bestSafeSize || (isTargetReached ? outputSize : originalSize),
      qualityScore: winningMeta?.score || 80,
      iterationsCount: iterations,
      message,
      processingTimeMs: Date.now() - startTime,
      label: 'LOSSY OPTIMIZATION',
    };
  }
}

export const targetSizeService = new TargetSizeService();
