import fs from 'fs';
import sharp from 'sharp';
import { PDFDocument, PDFName, PDFDict, PDFRawStream } from 'pdf-lib';
import { PdfOptimizationMode, PdfOptimizationResult } from '@optipress/types';
import { PDF_OPTIMIZATION_CONFIG } from '@optipress/config';
import { pdfAnalyzer } from './pdf-analyzer.service';

export interface OptimizePdfParams {
  fileId: string;
  inputPath: string;
  outputPath: string;
  mode: PdfOptimizationMode;
}

export class PdfOptimizer {
  async optimizePdf(params: OptimizePdfParams): Promise<PdfOptimizationResult> {
    const startTime = Date.now();
    const { fileId, inputPath, outputPath, mode } = params;

    const stats = await fs.promises.stat(inputPath);
    const originalSize = stats.size;

    // Analyze PDF characteristics
    const analysis = await pdfAnalyzer.analyzePdf(inputPath);
    const warnings: string[] = [];

    // Encrypted PDF safeguard
    if (analysis.isEncrypted) {
      await fs.promises.copyFile(inputPath, outputPath);
      return {
        fileId,
        status: 'unsupported_feature',
        originalSize,
        optimizedSize: originalSize,
        reductionBytes: 0,
        reductionPercentage: 0,
        pageCount: analysis.pageCount,
        pdfType: analysis.pdfType,
        mode,
        isEncrypted: true,
        isSigned: analysis.isSigned,
        warnings: ['PDF is encrypted or password-protected. Password required.'],
        message: 'Encrypted PDF cannot be optimized without password.',
        processingTimeMs: Date.now() - startTime,
      };
    }

    // Digitally signed PDF warning
    if (analysis.isSigned) {
      warnings.push('This PDF contains a digital signature. Optimization may invalidate it.');
    }

    const pdfBuffer = await fs.promises.readFile(inputPath);
    const doc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });

    // Target quality mapping
    const qualityMap: Record<PdfOptimizationMode, number> = PDF_OPTIMIZATION_CONFIG.DEFAULT_JPEG_QUALITY;
    const targetJpegQuality = qualityMap[mode] || 80;

    // Re-compress embedded JPEG raster images if available
    try {
      const pages = doc.getPages();
      for (const page of pages) {
        const { node } = page as unknown as { node: PDFDict };
        const resources = node.get(PDFName.of('Resources'));

        if (resources instanceof PDFDict) {
          const xObjects = resources.get(PDFName.of('XObject'));
          if (xObjects instanceof PDFDict) {
            for (const key of xObjects.keys()) {
              const xObject = xObjects.get(key);
              if (xObject instanceof PDFRawStream) {
                const dict = xObject.dict;
                const subtype = dict.get(PDFName.of('Subtype'));
                const filter = dict.get(PDFName.of('Filter'));

                if (subtype === PDFName.of('Image') && filter === PDFName.of('DCTDecode')) {
                  try {
                    const rawBuffer = Buffer.from(xObject.contents);
                    const optBuffer = await sharp(rawBuffer)
                      .rotate()
                      .jpeg({ quality: targetJpegQuality, progressive: true, mozjpeg: true })
                      .toBuffer();

                    if (optBuffer.length < rawBuffer.length) {
                      (xObject as unknown as { contents: Uint8Array }).contents = new Uint8Array(optBuffer);
                    }
                  } catch {
                    // Ignore image re-encoding error for invalid/corrupt stream
                  }
                }
              }
            }
          }
        }
      }
    } catch {
      // Ignore resource iteration error
    }

    // Save with structural object stream compression
    const optimizedBytes = await doc.save({
      useObjectStreams: true,
      addDefaultPage: false,
    });

    await fs.promises.writeFile(outputPath, optimizedBytes);

    const outStats = await fs.promises.stat(outputPath);
    let optimizedSize = outStats.size;

    // Non-reduction safeguard: If optimized output is larger than or equal to original, preserve original
    if (optimizedSize >= originalSize - 100) {
      await fs.promises.copyFile(inputPath, outputPath);
      optimizedSize = originalSize;

      return {
        fileId,
        status: 'already_optimized',
        originalSize,
        optimizedSize: originalSize,
        reductionBytes: 0,
        reductionPercentage: 0,
        pageCount: analysis.pageCount,
        pdfType: analysis.pdfType,
        mode,
        isEncrypted: false,
        isSigned: analysis.isSigned,
        warnings,
        message: 'This PDF is already optimized. Preserved original document intact.',
        processingTimeMs: Date.now() - startTime,
      };
    }

    const reductionBytes = originalSize - optimizedSize;
    const reductionPercentage = Number(((reductionBytes / originalSize) * 100).toFixed(1));

    return {
      fileId,
      status: 'success',
      originalSize,
      optimizedSize,
      reductionBytes,
      reductionPercentage,
      pageCount: analysis.pageCount,
      pdfType: analysis.pdfType,
      mode,
      isEncrypted: false,
      isSigned: analysis.isSigned,
      warnings,
      message: 'PDF optimization completed successfully.',
      processingTimeMs: Date.now() - startTime,
    };
  }
}

export const pdfOptimizer = new PdfOptimizer();
