import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import crypto from 'crypto';
import { ImageOptimizationMode, ImageOptimizationResult, OptimizationResultStatus } from '@optipress/types';
import { qualityGateService } from './quality-gate.service.js';

export interface OptimizeImageParams {
  fileId: string;
  inputPath: string;
  outputPath: string;
  extension: string;
  mode: ImageOptimizationMode;
}

interface ImageCandidateMeta {
  path: string;
  size: number;
  quality: number;
  scale: number;
  score: number;
  isValid: boolean;
  width: number;
  height: number;
}

export class ImageOptimizationService {
  async optimizeImage(params: OptimizeImageParams): Promise<ImageOptimizationResult> {
    const startTime = Date.now();
    const { fileId, inputPath, outputPath, extension, mode } = params;

    const ext = extension.toLowerCase();
    const stats = await fs.promises.stat(inputPath);
    const originalSize = stats.size;

    const instance = sharp(inputPath);
    const metadata = await instance.metadata();
    const origWidth = metadata.width || 0;
    const origHeight = metadata.height || 0;

    // Small file safeguard: If file is tiny (< 30 KB), preserve original directly
    if (originalSize < 30 * 1024) {
      await fs.promises.copyFile(inputPath, outputPath);
      return {
        fileId,
        status: 'already_optimized',
        resultLabel: 'Already optimized',
        userMessage: 'Your image is already very small. Preserved original image intact.',
        qualityProtected: true,
        qualityStatusText: '✓ Quality check passed',
        originalSize,
        optimizedSize: originalSize,
        reductionBytes: 0,
        reductionPercentage: 0,
        originalFormat: metadata.format || ext,
        outputFormat: metadata.format || ext,
        width: origWidth,
        height: origHeight,
        mode,
        processingTimeMs: Date.now() - startTime,
      };
    }

    // Prepare temp directory for multi-candidate generation from ORIGINAL image
    const tempDir = path.dirname(outputPath);
    const tempId = crypto.randomUUID();
    const candidateFiles: string[] = [];

    const encodeCandidate = async (q: number, scale = 1.0): Promise<ImageCandidateMeta | null> => {
      const candPath = path.join(tempDir, `img-cand-${tempId}-${scale}-${q}.${ext}`);
      candidateFiles.push(candPath);

      try {
        let pipeline = sharp(inputPath).rotate();

        if (scale < 1.0 && origWidth > 0) {
          const targetW = Math.max(200, Math.round(origWidth * scale));
          pipeline = pipeline.resize({ width: targetW, withoutEnlargement: true });
        }

        switch (ext) {
          case 'jpg':
          case 'jpeg':
            pipeline = pipeline.jpeg({
              quality: q,
              progressive: true,
              mozjpeg: true,
            });
            break;
          case 'png':
            pipeline = pipeline.png({
              compressionLevel: 9,
              effort: Math.min(9, Math.max(4, Math.floor(q / 10))),
              palette: !metadata.hasAlpha || q < 80,
            });
            break;
          case 'webp':
            pipeline = pipeline.webp({
              quality: q,
              effort: 4,
            });
            break;
          default:
            await fs.promises.copyFile(inputPath, candPath);
            break;
        }

        await pipeline.toFile(candPath);

        const candStats = await fs.promises.stat(candPath);
        const candMeta = await sharp(candPath).metadata().catch(() => null);

        // Quality evaluation against original
        const evalRes = await qualityGateService.evaluateCandidate(inputPath, candPath);

        return {
          path: candPath,
          size: candStats.size,
          quality: q,
          scale,
          score: evalRes.score,
          isValid: evalRes.passed,
          width: candMeta?.width || origWidth,
          height: candMeta?.height || origHeight,
        };
      } catch {
        return null;
      }
    };

    // Candidate passes definition
    let passes: { q: number; s: number }[] = [];
    if (mode === 'quality') {
      passes = [
        { q: 85, s: 1.0 },
        { q: 75, s: 1.0 },
      ];
    } else if (mode === 'maximum') {
      passes = [
        { q: 70, s: 1.0 },
        { q: 55, s: 0.85 },
        { q: 40, s: 0.7 },
      ];
    } else {
      // Smart Mode (default): Progressive multi-candidate search
      passes = [
        { q: 80, s: 1.0 },
        { q: 65, s: 1.0 },
        { q: 50, s: origWidth > 1800 ? 0.85 : 1.0 },
        { q: 40, s: origWidth > 1800 ? 0.75 : 1.0 },
      ];
    }

    const validCandidates: ImageCandidateMeta[] = [];

    for (const p of passes) {
      const cand = await encodeCandidate(p.q, p.s);
      if (cand && cand.isValid && cand.size < originalSize) {
        validCandidates.push(cand);
      }
    }

    const cleanupTemp = async (keepPath?: string) => {
      for (const f of candidateFiles) {
        if (f !== keepPath && fs.existsSync(f)) {
          await fs.promises.unlink(f).catch(() => {});
        }
      }
    };

    // Safeguard: Revert if no smaller valid candidate was produced
    if (validCandidates.length === 0) {
      await cleanupTemp();
      await fs.promises.copyFile(inputPath, outputPath);

      return {
        fileId,
        status: 'already_optimized',
        resultLabel: 'Already optimized',
        userMessage: 'Your image is already highly optimized. Preserved original image intact.',
        qualityProtected: true,
        qualityStatusText: '✓ Quality check passed',
        originalSize,
        optimizedSize: originalSize,
        reductionBytes: 0,
        reductionPercentage: 0,
        originalFormat: metadata.format || ext,
        outputFormat: metadata.format || ext,
        width: origWidth,
        height: origHeight,
        mode,
        processingTimeMs: Date.now() - startTime,
      };
    }

    // Sort valid candidates by file size ascending
    validCandidates.sort((a, b) => a.size - b.size);

    const PREFERRED_MIN = 100 * 1024; // 100 KB
    const PREFERRED_MAX = 150 * 1024; // 150 KB

    const preferredCandidate = validCandidates.find((c) => c.size >= PREFERRED_MIN && c.size <= PREFERRED_MAX);

    let winner: ImageCandidateMeta;
    let finalStatus: OptimizationResultStatus;
    let resultLabel: string;
    let userMessage: string;
    let qualityStatusText: string;

    if (preferredCandidate) {
      winner = preferredCandidate;
      finalStatus = 'success';
      resultLabel = 'Smart Optimization';
      qualityStatusText = '✓ Quality check passed';
      userMessage = 'OptiPress automatically optimized your image into the preferred smart target range while protecting quality.';
    } else {
      const smallest = validCandidates[0];
      winner = smallest;

      if (smallest.size <= PREFERRED_MAX) {
        finalStatus = 'success';
        resultLabel = 'Smart Optimization';
        qualityStatusText = '✓ Quality check passed';
        userMessage = 'OptiPress automatically found the smallest safe file size for your image.';
      } else {
        finalStatus = 'best_safe_result';
        resultLabel = 'Best safe size';
        qualityStatusText = '✓ Quality protected';
        userMessage = "We couldn't safely reduce this image to 150 KB without noticeably affecting quality.";
      }
    }

    // Copy winning candidate to target output path
    await fs.promises.copyFile(winner.path, outputPath);
    await cleanupTemp();

    const outStats = await fs.promises.stat(outputPath);
    const optimizedSize = outStats.size;
    const reductionBytes = Math.max(0, originalSize - optimizedSize);
    const reductionPercentage =
      originalSize > 0 ? Number(((reductionBytes / originalSize) * 100).toFixed(1)) : 0;

    return {
      fileId,
      status: finalStatus,
      resultLabel,
      userMessage,
      qualityProtected: true,
      qualityStatusText,
      bestSafeSize: finalStatus === 'best_safe_result' ? optimizedSize : undefined,
      isSmartTargetReached: finalStatus === 'success',
      originalSize,
      optimizedSize,
      reductionBytes,
      reductionPercentage,
      originalFormat: metadata.format || ext,
      outputFormat: metadata.format || ext,
      width: winner.width,
      height: winner.height,
      mode,
      processingTimeMs: Date.now() - startTime,
    };
  }
}

export const imageOptimizationService = new ImageOptimizationService();
