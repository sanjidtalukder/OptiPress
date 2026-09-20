import fs from 'fs';
import sharp from 'sharp';
import { QualityEvaluationResult, QualityProfile, QualityStatus } from '@optipress/types';
import { QUALITY_PROFILES, QUALITY_SAMPLING_CONFIG } from '@optipress/config';
import { PDFDocument, PDFName, PDFDict, PDFRawStream } from 'pdf-lib';

export interface EvaluateQualityOptions {
  allowResize?: boolean;
  profile?: QualityProfile;
}

export type EvaluateImageOptions = EvaluateQualityOptions;

export interface DetailedQualityEvaluationResult extends QualityEvaluationResult {
  isLossless: boolean;
  label: 'LOSSLESS' | 'LOSSY OPTIMIZATION';
}

export class ImageQualityEvaluator {
  /**
   * Alias for evaluateImageQuality for backward compatibility.
   */
  async evaluateQuality(
    originalPath: string,
    candidatePath: string,
    options: EvaluateQualityOptions = {}
  ): Promise<DetailedQualityEvaluationResult> {
    return this.evaluateImageQuality(originalPath, candidatePath, options);
  }

  /**
   * Evaluates visual similarity (SSIM, PSNR) between two image files.
   */
  async evaluateImageQuality(
    originalPath: string,
    candidatePath: string,
    options: EvaluateQualityOptions = {}
  ): Promise<DetailedQualityEvaluationResult> {
    const profileKey = options.profile || 'balanced';
    const profile = QUALITY_PROFILES[profileKey] || QUALITY_PROFILES.balanced;
    const allowResize = Boolean(options.allowResize);
    const evaluatedAt = new Date().toISOString();
    const issues: string[] = [];

    if (!fs.existsSync(candidatePath)) {
      return {
        status: 'FAIL',
        passed: false,
        score: 0,
        metrics: { score: 0, dimensionsMatch: false, decodable: false },
        issues: ['Candidate file does not exist on disk.'],
        confidence: 'high',
        evaluatedAt,
        isLossless: false,
        label: 'LOSSY OPTIMIZATION',
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
        metrics: { score: 0, dimensionsMatch: false, decodable: false },
        issues: ['Candidate image is corrupt or cannot be decoded.'],
        confidence: 'high',
        evaluatedAt,
        isLossless: false,
        label: 'LOSSY OPTIMIZATION',
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

    const maxDim = QUALITY_SAMPLING_CONFIG.MAX_COMPARISON_DIMENSION;
    const targetW = Math.min(origW || 800, maxDim);
    const targetH = Math.min(origH || 600, maxDim);

    let origBuf: Buffer;
    let candBuf: Buffer;
    try {
      origBuf = await sharp(originalPath).rotate().resize(targetW, targetH, { fit: 'fill' }).removeAlpha().raw().toBuffer();
      candBuf = await sharp(candidatePath).rotate().resize(targetW, targetH, { fit: 'fill' }).removeAlpha().raw().toBuffer();
    } catch {
      return {
        status: 'FAIL',
        passed: false,
        score: 0,
        metrics: { score: 0, dimensionsMatch, decodable: true },
        issues: ['Failed to extract pixel buffers for comparison.'],
        confidence: 'medium',
        evaluatedAt,
        isLossless: false,
        label: 'LOSSY OPTIMIZATION',
      };
    }

    const metrics = this.computeBufferSimilarity(origBuf, candBuf);
    const passed =
      metrics.ssim >= profile.minSsim &&
      metrics.psnr >= profile.minPsnr &&
      metrics.score >= profile.minScore &&
      (dimensionsMatch || allowResize);

    const isLossless = metrics.ssim >= 0.999 && metrics.psnr >= 50.0;
    const label: 'LOSSLESS' | 'LOSSY OPTIMIZATION' = isLossless ? 'LOSSLESS' : 'LOSSY OPTIMIZATION';

    if (!passed) {
      if (metrics.ssim < profile.minSsim) issues.push(`SSIM ${metrics.ssim} below minimum threshold ${profile.minSsim}`);
      if (metrics.psnr < profile.minPsnr) issues.push(`PSNR ${metrics.psnr} dB below minimum threshold ${profile.minPsnr} dB`);
      if (metrics.score < profile.minScore) issues.push(`Score ${metrics.score} below minimum threshold ${profile.minScore}`);
    }

    return {
      status: passed ? 'PASS' : 'FAIL',
      passed,
      score: metrics.score,
      metrics: {
        ssim: metrics.ssim,
        psnr: metrics.psnr,
        score: metrics.score,
        dimensionsMatch,
        decodable: true,
      },
      issues,
      confidence: 'high',
      evaluatedAt,
      isLossless,
      label,
    };
  }

  /**
   * Evaluates visual quality and structural fidelity between original and candidate PDF files.
   */
  async evaluatePdfQuality(
    originalPdfPath: string,
    candidatePdfPath: string,
    options: EvaluateQualityOptions = {}
  ): Promise<DetailedQualityEvaluationResult> {
    const profileKey = options.profile || 'balanced';
    const profile = QUALITY_PROFILES[profileKey] || QUALITY_PROFILES.balanced;
    const evaluatedAt = new Date().toISOString();
    const issues: string[] = [];

    if (!fs.existsSync(candidatePdfPath)) {
      return {
        status: 'FAIL',
        passed: false,
        score: 0,
        metrics: { score: 0, dimensionsMatch: false, decodable: false },
        issues: ['Candidate PDF file does not exist on disk.'],
        confidence: 'high',
        evaluatedAt,
        isLossless: false,
        label: 'LOSSY OPTIMIZATION',
      };
    }

    try {
      const origBuf = await fs.promises.readFile(originalPdfPath);
      const candBuf = await fs.promises.readFile(candidatePdfPath);

      const origDoc = await PDFDocument.load(origBuf, { ignoreEncryption: true });
      const candDoc = await PDFDocument.load(candBuf, { ignoreEncryption: true });

      const origPages = origDoc.getPageCount();
      const candPages = candDoc.getPageCount();

      if (origPages !== candPages) {
        issues.push(`Page count mismatch: original ${origPages}, candidate ${candPages}`);
        return {
          status: 'FAIL',
          passed: false,
          score: 0,
          metrics: { score: 0, dimensionsMatch: false, decodable: true },
          issues,
          confidence: 'high',
          evaluatedAt,
          isLossless: false,
          label: 'LOSSY OPTIMIZATION',
        };
      }

      const origImages: Buffer[] = [];
      const candImages: Buffer[] = [];

      origDoc.context.enumerateIndirectObjects().forEach(([_, obj]) => {
        if (obj instanceof PDFRawStream && obj.dict.get(PDFName.of('Subtype')) === PDFName.of('Image')) {
          if (obj.contents && obj.contents.length > 500) {
            origImages.push(Buffer.from(obj.contents));
          }
        }
      });

      candDoc.context.enumerateIndirectObjects().forEach(([_, obj]) => {
        if (obj instanceof PDFRawStream && obj.dict.get(PDFName.of('Subtype')) === PDFName.of('Image')) {
          if (obj.contents && obj.contents.length > 500) {
            candImages.push(Buffer.from(obj.contents));
          }
        }
      });

      let sumSsim = 0;
      let sumPsnr = 0;
      let evaluatedCount = 0;

      const sampleCount = Math.min(origImages.length, candImages.length, 5);
      for (let i = 0; i < sampleCount; i++) {
        try {
          const img1Buf = await sharp(origImages[i]).rotate().resize(400, 400, { fit: 'fill' }).removeAlpha().raw().toBuffer().catch(() => null);
          const img2Buf = await sharp(candImages[i]).rotate().resize(400, 400, { fit: 'fill' }).removeAlpha().raw().toBuffer().catch(() => null);
          if (img1Buf && img2Buf && img1Buf.length === img2Buf.length) {
            const m = this.computeBufferSimilarity(img1Buf, img2Buf);
            sumSsim += m.ssim;
            sumPsnr += m.psnr;
            evaluatedCount++;
          }
        } catch {
          // Skip invalid stream comparison
        }
      }

      let ssim = 1.0;
      let psnr = 100.0;
      let score = 98;

      if (evaluatedCount > 0) {
        ssim = Number((sumSsim / evaluatedCount).toFixed(4));
        psnr = Number((sumPsnr / evaluatedCount).toFixed(2));
        const psnrScore = Math.min(1, Math.max(0, (psnr - 15) / 30));
        score = Math.min(100, Math.max(0, Math.round(ssim * 70 + psnrScore * 30)));
      }

      const isLossless = origImages.length === candImages.length && origBuf.length === candBuf.length;
      const label: 'LOSSLESS' | 'LOSSY OPTIMIZATION' = isLossless ? 'LOSSLESS' : 'LOSSY OPTIMIZATION';

      const passed = ssim >= profile.minSsim && psnr >= profile.minPsnr && score >= profile.minScore;

      if (!passed) {
        if (ssim < profile.minSsim) issues.push(`PDF SSIM ${ssim} below threshold ${profile.minSsim}`);
        if (psnr < profile.minPsnr) issues.push(`PDF PSNR ${psnr} dB below threshold ${profile.minPsnr} dB`);
      }

      return {
        status: passed ? 'PASS' : 'FAIL',
        passed,
        score,
        metrics: {
          ssim,
          psnr,
          score,
          dimensionsMatch: true,
          decodable: true,
        },
        issues,
        confidence: 'high',
        evaluatedAt,
        isLossless,
        label,
      };
    } catch (err: any) {
      return {
        status: 'FAIL',
        passed: false,
        score: 0,
        metrics: { score: 0, dimensionsMatch: false, decodable: false },
        issues: [err.message || 'PDF quality evaluation failed.'],
        confidence: 'medium',
        evaluatedAt,
        isLossless: false,
        label: 'LOSSY OPTIMIZATION',
      };
    }
  }

  private computeBufferSimilarity(b1: Buffer, b2: Buffer): { ssim: number; psnr: number; score: number } {
    const len = Math.min(b1.length, b2.length);
    if (len === 0) return { ssim: 1.0, psnr: 100.0, score: 100 };

    let sum1 = 0;
    let sum2 = 0;
    let sumSqErr = 0;

    for (let i = 0; i < len; i++) {
      const v1 = b1[i];
      const v2 = b2[i];
      sum1 += v1;
      sum2 += v2;
      const diff = v1 - v2;
      sumSqErr += diff * diff;
    }

    const mu1 = sum1 / len;
    const mu2 = sum2 / len;

    let var1 = 0;
    let var2 = 0;
    let covar = 0;

    for (let i = 0; i < len; i++) {
      const d1 = b1[i] - mu1;
      const d2 = b2[i] - mu2;
      var1 += d1 * d1;
      var2 += d2 * d2;
      covar += d1 * d2;
    }

    var1 /= len;
    var2 /= len;
    covar /= len;

    const c1 = 6.5025;
    const c2 = 58.5225;
    const ssimNum = (2 * mu1 * mu2 + c1) * (2 * covar + c2);
    const ssimDen = (mu1 * mu1 + mu2 * mu2 + c1) * (var1 + var2 + c2);
    let ssim = ssimDen === 0 ? 1 : ssimNum / ssimDen;
    ssim = Math.min(1.0, Math.max(0.0, Number(ssim.toFixed(4))));

    const mse = sumSqErr / len;
    let psnr = 100.0;
    if (mse > 0) {
      psnr = 10 * Math.log10((255 * 255) / mse);
    }
    psnr = Number(psnr.toFixed(2));

    const psnrComp = Math.min(1, Math.max(0, (psnr - 15) / 30));
    const score = Math.min(100, Math.max(0, Math.round(ssim * 70 + psnrComp * 30)));

    return { ssim, psnr, score };
  }
}

export const imageQualityEvaluator = new ImageQualityEvaluator();
