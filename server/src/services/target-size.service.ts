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
import { imageQualityEvaluator } from './quality-evaluator.service';

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
    const startTime = Date.now();
    const { fileId, originalPath, outputPath, extension, request } = params;

    const targetSizeBytes = parseTargetToBytes(request.targetSize, request.unit);
    const ext = extension.toLowerCase();

    // Verify original file exists and check stats
    const origStats = await fs.promises.stat(originalPath);
    const originalSize = origStats.size;

    // 1. Safeguard: Already below target
    if (originalSize <= targetSizeBytes) {
      await fs.promises.copyFile(originalPath, outputPath);

      return {
        fileId,
        status: 'already_below_target',
        originalSize,
        targetSizeBytes,
        outputSize: originalSize,
        reductionBytes: 0,
        reductionPercentage: 0,
        qualityProtected: true,
        targetReached: true,
        forced: false,
        qualityScore: 100,
        iterationsCount: 0,
        message: 'Original file is already below target size. Preserved original quality.',
        processingTimeMs: Date.now() - startTime,
      };
    }

    // Prepare temp directory for candidate evaluation
    const tempDir = path.dirname(outputPath);
    const tempId = crypto.randomUUID();

    const candidates: CandidateMeta[] = [];
    let iterations = 0;

    const encodeCandidate = async (q: number): Promise<{ meta: CandidateMeta; tempFile: string }> => {
      iterations++;
      const candPath = path.join(tempDir, `cand-${tempId}-${q}.${ext}`);
      const instance = sharp(originalPath).rotate();

      switch (ext) {
        case 'jpg':
        case 'jpeg':
          await instance
            .jpeg({ quality: q, progressive: true, mozjpeg: true })
            .toFile(candPath);
          break;
        case 'png':
          await instance
            .png({
              compressionLevel: 9,
              quality: q,
              palette: true,
            })
            .toFile(candPath);
          break;
        case 'webp':
          await instance
            .webp({ quality: q, effort: 4 })
            .toFile(candPath);
          break;
        default:
          await fs.promises.copyFile(originalPath, candPath);
          break;
      }

      const candStats = await fs.promises.stat(candPath);
      const qualityEval = await imageQualityEvaluator.evaluateQuality(originalPath, candPath);

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
      // 2. Bound Check: Max Quality (q = 95)
      const maxCand = await encodeCandidate(95);
      candidates.push(maxCand.meta);

      if (maxCand.meta.size <= targetSizeBytes && maxCand.meta.isAcceptable) {
        // High quality candidate already fits target size
        winningTempFile = maxCand.tempFile;
      } else {
        await fs.promises.unlink(maxCand.tempFile).catch(() => {});

        // 3. Bound Check: Min Quality (q = 15)
        const minCand = await encodeCandidate(15);
        candidates.push(minCand.meta);

        if (minCand.meta.size > targetSizeBytes) {
          // Even lowest quality exceeds target
          if (request.forceTarget) {
            winningTempFile = minCand.tempFile;
            isForced = true;
            isQualityProtected = false;
            isTargetReached = true;
            selectedStatus = 'success';
          } else {
            // Target is unreachable under quality protection
            winningTempFile = minCand.tempFile;
            selectedStatus = 'target_unreachable';
            isTargetReached = false;
            isQualityProtected = true;
            bestSafeSize = minCand.meta.size;
          }
        } else {
          await fs.promises.unlink(minCand.tempFile).catch(() => {});

          // 4. Binary Search Loop over quality (q = 15 .. 95)
          let lowQ = 15;
          let highQ = 95;
          let bestValidCandFile: string | null = null;
          let bestValidMeta: CandidateMeta | null = null;

          while (lowQ <= highQ && iterations < TARGET_SIZE_CONFIG.MAX_ITERATIONS) {
            const midQ = Math.floor((lowQ + highQ) / 2);
            const cand = await encodeCandidate(midQ);
            candidates.push(cand.meta);

            if (cand.meta.size <= targetSizeBytes) {
              if (bestValidCandFile) {
                await fs.promises.unlink(bestValidCandFile).catch(() => {});
              }
              bestValidCandFile = cand.tempFile;
              bestValidMeta = cand.meta;

              // Check tolerance window (within 3% of target)
              const diffPercent = ((targetSizeBytes - cand.meta.size) / targetSizeBytes) * 100;
              if (diffPercent <= TARGET_SIZE_CONFIG.TOLERANCE_PERCENT && cand.meta.isAcceptable) {
                break; // Converged within tolerance!
              }

              // Try higher quality to get closer to target
              lowQ = midQ + 1;
            } else {
              // Exceeds target, try lower quality
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

      // 5. Final output handling
      if (winningTempFile && fs.existsSync(winningTempFile)) {
        await fs.promises.copyFile(winningTempFile, outputPath);
        await fs.promises.unlink(winningTempFile).catch(() => {});
      } else {
        await fs.promises.copyFile(originalPath, outputPath);
      }
    } catch {
      // Revert to original file on failure
      await fs.promises.copyFile(originalPath, outputPath);
      selectedStatus = 'failed';
      isTargetReached = false;
    }

    const outStats = await fs.promises.stat(outputPath);
    const outputSize = outStats.size;
    const reductionBytes = Math.max(0, originalSize - outputSize);
    const reductionPercentage =
      originalSize > 0 ? Number(((reductionBytes / originalSize) * 100).toFixed(1)) : 0;

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
      reductionPercentage,
      qualityProtected: isQualityProtected,
      targetReached: isTargetReached,
      forced: isForced,
      bestSafeSize: bestSafeSize || (isTargetReached ? outputSize : originalSize),
      qualityScore: winningMeta?.score || 80,
      iterationsCount: iterations,
      message,
      processingTimeMs: Date.now() - startTime,
    };
  }
}

export const targetSizeService = new TargetSizeService();
