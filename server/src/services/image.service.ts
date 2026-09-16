import fs from 'fs';
import sharp from 'sharp';
import { ImageOptimizationMode, ImageOptimizationResult } from '@optipress/types';

export interface OptimizeImageParams {
  fileId: string;
  inputPath: string;
  outputPath: string;
  extension: string;
  mode: ImageOptimizationMode;
}

export class ImageOptimizationService {
  async optimizeImage(params: OptimizeImageParams): Promise<ImageOptimizationResult> {
    const startTime = Date.now();
    const { fileId, inputPath, outputPath, extension, mode } = params;

    const ext = extension.toLowerCase();
    const stats = await fs.promises.stat(inputPath);
    const originalSize = stats.size;

    // Small file safeguard: If file is tiny (< 30 KB), copy original directly
    if (originalSize < 30 * 1024) {
      await fs.promises.copyFile(inputPath, outputPath);
      const meta = await sharp(inputPath).metadata();
      return {
        fileId,
        originalSize,
        optimizedSize: originalSize,
        reductionBytes: 0,
        reductionPercentage: 0,
        originalFormat: meta.format || ext,
        outputFormat: meta.format || ext,
        width: meta.width || 0,
        height: meta.height || 0,
        mode,
        processingTimeMs: Date.now() - startTime,
      };
    }

    // Inspect image metadata
    const instance = sharp(inputPath);
    const metadata = await instance.metadata();

    // Auto-rotate based on EXIF orientation before processing
    let pipeline = instance.rotate();

    // Apply mode-specific Sharp compression parameters
    switch (ext) {
      case 'jpg':
      case 'jpeg': {
        const qualityMap: Record<ImageOptimizationMode, number> = {
          quality: 90,
          smart: 80,
          maximum: 65,
        };
        pipeline = pipeline.jpeg({
          quality: qualityMap[mode],
          progressive: true,
          mozjpeg: true,
        });
        break;
      }
      case 'png': {
        const compressionMap: Record<ImageOptimizationMode, { effort: number; palette?: boolean }> = {
          quality: { effort: 8, palette: false },
          smart: { effort: 7, palette: !metadata.hasAlpha },
          maximum: { effort: 9, palette: true },
        };
        const pngOpts = compressionMap[mode];
        pipeline = pipeline.png({
          compressionLevel: 9,
          effort: pngOpts.effort,
          palette: pngOpts.palette,
        });
        break;
      }
      case 'webp': {
        const webpQualityMap: Record<ImageOptimizationMode, { quality: number; effort: number }> = {
          quality: { quality: 90, effort: 6 },
          smart: { quality: 80, effort: 4 },
          maximum: { quality: 65, effort: 6 },
        };
        const webpOpts = webpQualityMap[mode];
        pipeline = pipeline.webp({
          quality: webpOpts.quality,
          effort: webpOpts.effort,
        });
        break;
      }
      default: {
        // Fallback for unexpected image extension
        await fs.promises.copyFile(inputPath, outputPath);
        return {
          fileId,
          originalSize,
          optimizedSize: originalSize,
          reductionBytes: 0,
          reductionPercentage: 0,
          originalFormat: metadata.format || ext,
          outputFormat: metadata.format || ext,
          width: metadata.width || 0,
          height: metadata.height || 0,
          mode,
          processingTimeMs: Date.now() - startTime,
        };
      }
    }

    // Write optimized output to target path
    await pipeline.toFile(outputPath);

    const outStats = await fs.promises.stat(outputPath);
    let optimizedSize = outStats.size;

    // Safeguard: If output is larger than or equal to original, revert to original file
    if (optimizedSize >= originalSize) {
      await fs.promises.copyFile(inputPath, outputPath);
      optimizedSize = originalSize;
    }

    const reductionBytes = Math.max(0, originalSize - optimizedSize);
    const reductionPercentage =
      originalSize > 0 ? Number(((reductionBytes / originalSize) * 100).toFixed(1)) : 0;

    return {
      fileId,
      originalSize,
      optimizedSize,
      reductionBytes,
      reductionPercentage,
      originalFormat: metadata.format || ext,
      outputFormat: metadata.format || ext,
      width: metadata.width || 0,
      height: metadata.height || 0,
      mode,
      processingTimeMs: Date.now() - startTime,
    };
  }
}

export const imageOptimizationService = new ImageOptimizationService();
