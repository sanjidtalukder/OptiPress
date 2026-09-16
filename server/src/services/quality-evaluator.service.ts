import fs from 'fs';
import sharp from 'sharp';
import { QualityEvaluationResult, QualityProfile, QualityStatus } from '@optipress/types';
import { QUALITY_PROFILES, QUALITY_SAMPLING_CONFIG } from '@optipress/config';

export interface EvaluateImageOptions {
  allowResize?: boolean;
  profile?: QualityProfile;
}

export class ImageQualityEvaluator {
  /**
   * Evaluates perceptual visual similarity between an original and optimized candidate image
   * using Structural Similarity (SSIM), PSNR, dimension check, and decodability validation.
   */
  async evaluateQuality(
    originalPath: string,
    candidatePath: string,
    options: EvaluateImageOptions = {}
  ): Promise<QualityEvaluationResult> {
    const profileKey = options.profile || 'balanced';
    const profile = QUALITY_PROFILES[profileKey] || QUALITY_PROFILES.balanced;
    const allowResize = Boolean(options.allowResize);
    const evaluatedAt = new Date().toISOString();
    const issues: string[] = [];

    // 1. File Existence & Decodability Sanity Check
    if (!fs.existsSync(candidatePath)) {
      return {
        status: 'FAIL',
        passed: false,
        score: 0,
        metrics: {
          score: 0,
          dimensionsMatch: false,
          decodable: false,
        },
        issues: ['Candidate file does not exist on disk.'],
        confidence: 'high',
        evaluatedAt,
      };
    }

    let origMeta: sharp.Metadata;
    let candMeta: sharp.Metadata;
    try {
      origMeta = await sharp(originalPath).metadata();
      candMeta = await sharp(candidatePath).metadata();
    } catch {
      return {
        status: 'FAIL',
        passed: false,
        score: 0,
        metrics: {
          score: 0,
          dimensionsMatch: false,
          decodable: false,
        },
        issues: ['Candidate image is corrupt or cannot be decoded by Sharp.'],
        confidence: 'high',
        evaluatedAt,
      };
    }

    const origW = origMeta.width || 0;
    const origH = origMeta.height || 0;
    const candW = candMeta.width || 0;
    const candH = candMeta.height || 0;

    const dimensionsMatch = origW === candW && origH === candH;
    if (!dimensionsMatch && !allowResize) {
      issues.push(`Dimension mismatch: expected ${origW}x${origH}, got ${candW}x${candH}`);
    }

    // 2. Extract normalized Luminance Buffer for SSIM & PSNR calculation
    const maxDim = QUALITY_SAMPLING_CONFIG.MAX_COMPARISON_DIMENSION;
    const targetW = Math.min(origW || 800, maxDim);
    const targetH = Math.min(origH || 600, maxDim);

    let origBuf: Buffer;
    let candBuf: Buffer;

    try {
      origBuf = await sharp(originalPath)
        .rotate()
        .resize(targetW, targetH, { fit: 'fill' })
        .removeAlpha()
        .raw()
        .toBuffer();

      candBuf = await sharp(candidatePath)
        .rotate()
        .resize(targetW, targetH, { fit: 'fill' })
        .removeAlpha()
        .raw()
        .toBuffer();
    } catch {
      return {
        status: 'FAIL',
        passed: false,
        score: 0,
        metrics: {
          score: 0,
          dimensionsMatch,
          decodable: true,
        },
        issues: ['Failed to extract raw pixel buffers for quality comparison.'],
        confidence: 'medium',
        evaluatedAt,
      };
    }

    if (origBuf.length !== candBuf.length || origBuf.length === 0) {
      return {
        status: 'UNABLE_TO_EVALUATE',
        passed: false,
        score: 50,
        metrics: {
          score: 50,
          dimensionsMatch,
          decodable: true,
        },
        issues: ['Buffer size mismatch during evaluation.'],
        confidence: 'low',
        evaluatedAt,
      };
    }

    const len = origBuf.length;
    let sumOrig = 0;
    let sumCand = 0;
    let sumSqErr = 0;

    for (let i = 0; i < len; i++) {
      const o = origBuf[i];
      const c = candBuf[i];
      sumOrig += o;
      sumCand += c;
      const diff = o - c;
      sumSqErr += diff * diff;
    }

    // Compute Mean & Variance
    const muOrig = sumOrig / len;
    const muCand = sumCand / len;

    let varOrig = 0;
    let varCand = 0;
    let covar = 0;

    for (let i = 0; i < len; i++) {
      const diffO = origBuf[i] - muOrig;
      const diffC = candBuf[i] - muCand;
      varOrig += diffO * diffO;
      varCand += diffC * diffC;
      covar += diffO * diffC;
    }

    varOrig /= len;
    varCand /= len;
    covar /= len;

    // SSIM Formula Constants
    const c1 = Math.pow(0.01 * 255, 2); // 6.5025
    const c2 = Math.pow(0.03 * 255, 2); // 58.5225

    const ssimNumerator = (2 * muOrig * muCand + c1) * (2 * covar + c2);
    const ssimDenominator = (Math.pow(muOrig, 2) + Math.pow(muCand, 2) + c1) * (varOrig + varCand + c2);
    let ssim = ssimDenominator === 0 ? 1 : ssimNumerator / ssimDenominator;
    ssim = Math.min(1, Math.max(0, Number(ssim.toFixed(4))));

    // PSNR Formula
    const mse = sumSqErr / len;
    let psnr = 100;
    if (mse > 0) {
      psnr = 10 * Math.log10((255 * 255) / mse);
    }
    psnr = Number(psnr.toFixed(2));

    // Composite Quality Score (0..100)
    const psnrScoreComponent = Math.min(1, Math.max(0, (psnr - 15) / 30));
    const rawScore = ssim * 70 + psnrScoreComponent * 30;
    const score = Math.min(100, Math.max(0, Math.round(rawScore)));

    // Quality Gate Status Evaluation against Profile
    const passed =
      ssim >= profile.minSsim &&
      psnr >= profile.minPsnr &&
      score >= profile.minScore &&
      (dimensionsMatch || allowResize);

    let status: QualityStatus = passed ? 'PASS' : 'FAIL';
    if (!dimensionsMatch && !allowResize) {
      status = 'FAIL';
    }

    if (!passed) {
      if (ssim < profile.minSsim) {
        issues.push(`SSIM ${ssim} below minimum threshold ${profile.minSsim}`);
      }
      if (psnr < profile.minPsnr) {
        issues.push(`PSNR ${psnr} dB below minimum threshold ${profile.minPsnr} dB`);
      }
      if (score < profile.minScore) {
        issues.push(`Composite score ${score} below minimum threshold ${profile.minScore}`);
      }
    }

    return {
      status,
      passed,
      score,
      metrics: {
        ssim,
        psnr,
        score,
        dimensionsMatch,
        decodable: true,
      },
      issues,
      confidence: 'high',
      evaluatedAt,
    };
  }
}

export const imageQualityEvaluator = new ImageQualityEvaluator();
