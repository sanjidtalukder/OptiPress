import fs from 'fs';
import zlib from 'zlib';
import sharp from 'sharp';
import { PDFDocument, PDFName, PDFDict, PDFRawStream } from 'pdf-lib';

export interface ImageRecompressorOptions {
  inputPath: string;
  outputPath: string;
  jpegQuality: number; // 40..95
  maxDimensionScale?: number; // 0.3..1.0
  optimizePng?: boolean;
}

export interface ImageRecompressorResult {
  success: boolean;
  inputSize: number;
  outputSize: number;
  imagesInspected: number;
  imagesRecompressed: number;
  bytesSaved: number;
  durationMs: number;
  error?: string;
}

export class ImageRecompressorService {
  /**
   * Performs in-memory image stream dereferencing, extraction, Sharp recompression,
   * downsampling, and stream replacement inside PDF documents.
   */
  async recompressEmbeddedImages(options: ImageRecompressorOptions): Promise<ImageRecompressorResult> {
    const { inputPath, outputPath, jpegQuality, maxDimensionScale = 1.0, optimizePng = true } = options;
    const startTime = Date.now();

    if (!fs.existsSync(inputPath)) {
      return {
        success: false,
        inputSize: 0,
        outputSize: 0,
        imagesInspected: 0,
        imagesRecompressed: 0,
        bytesSaved: 0,
        durationMs: 0,
        error: 'Input PDF file does not exist.',
      };
    }

    const stats = await fs.promises.stat(inputPath);
    const inputSize = stats.size;

    let imagesInspected = 0;
    let imagesRecompressed = 0;
    let totalBytesSaved = 0;

    try {
      const pdfBuffer = await fs.promises.readFile(inputPath);
      const doc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
      const context = doc.context;

      const asyncImagePasses: Promise<void>[] = [];

      context.enumerateIndirectObjects().forEach(([_, obj]) => {
        if (obj instanceof PDFRawStream) {
          const dict = obj.dict;
          if (dict.get(PDFName.of('Subtype')) === PDFName.of('Image')) {
            imagesInspected++;
            const rawBytes = Buffer.from(obj.contents);
            if (!rawBytes || rawBytes.length < 300) return;

            const p = (async () => {
              try {
                const filterObj = dict.get(PDFName.of('Filter'));
                let filterStr = 'raw';
                if (filterObj instanceof PDFName) {
                  filterStr = filterObj.decodeText().replace('/', '');
                }

                // If filter is CCITTFaxDecode or raw without header, skip Sharp recompression
                if (filterStr.includes('CCITTFaxDecode')) return;

                let inputBuf = rawBytes;
                let isFlate = false;

                if (filterStr.includes('FlateDecode')) {
                  isFlate = true;
                  try {
                    inputBuf = zlib.inflateSync(rawBytes);
                  } catch {
                    inputBuf = rawBytes;
                  }
                }

                // Safely query metadata
                const meta = await sharp(inputBuf).metadata().catch(() => null);
                if (!meta || !meta.width || !meta.height) return;

                let instance = sharp(inputBuf).rotate();
                if (maxDimensionScale < 1.0 && meta.width > 400) {
                  const targetW = Math.max(200, Math.round(meta.width * maxDimensionScale));
                  instance = instance.resize({ width: targetW, withoutEnlargement: true });
                }

                let optBuf: Buffer | null = null;
                if (isFlate && optimizePng && meta.channels !== undefined && meta.channels > 1) {
                  if (!meta.hasAlpha && meta.channels === 3) {
                    optBuf = await instance.jpeg({ quality: jpegQuality, progressive: true, mozjpeg: true }).toBuffer().catch(() => null);
                  } else {
                    optBuf = await instance.png({ compressionLevel: 9, palette: true, quality: jpegQuality }).toBuffer().catch(() => null);
                  }
                } else {
                  optBuf = await instance.jpeg({ quality: jpegQuality, progressive: true, mozjpeg: true }).toBuffer().catch(() => null);
                }

                if (optBuf && optBuf.length < rawBytes.length) {
                  const saved = rawBytes.length - optBuf.length;
                  totalBytesSaved += saved;
                  imagesRecompressed++;

                  (obj as unknown as { contents: Uint8Array }).contents = new Uint8Array(optBuf);
                  dict.set(PDFName.of('Filter'), PDFName.of('DCTDecode'));
                }
              } catch {
                // Safely skip any stream error
              }
            })();

            asyncImagePasses.push(p);
          }
        }
      });

      await Promise.all(asyncImagePasses);

      const bytes = await doc.save({
        useObjectStreams: true,
        addDefaultPage: false,
      });

      await fs.promises.writeFile(outputPath, bytes);
      const outStats = await fs.promises.stat(outputPath);
      const outputSize = outStats.size;

      return {
        success: true,
        inputSize,
        outputSize,
        imagesInspected,
        imagesRecompressed,
        bytesSaved: Math.max(0, inputSize - outputSize),
        durationMs: Date.now() - startTime,
      };
    } catch (err: any) {
      await fs.promises.copyFile(inputPath, outputPath).catch(() => {});
      return {
        success: false,
        inputSize,
        outputSize: inputSize,
        imagesInspected,
        imagesRecompressed: 0,
        bytesSaved: 0,
        durationMs: Date.now() - startTime,
        error: err.message || 'Image recompression processing failed.',
      };
    }
  }
}

export const imageRecompressorService = new ImageRecompressorService();
