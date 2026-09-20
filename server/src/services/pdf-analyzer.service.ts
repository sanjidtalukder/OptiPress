import fs from 'fs';
import { PDFDocument, PDFName, PDFDict, PDFRawStream, PDFArray, PDFNumber } from 'pdf-lib';
import { PdfAnalysisResult, PdfType } from '@optipress/types';

export interface ImageDetail {
  refString: string;
  filter: string; // DCTDecode, FlateDecode, CCITTFaxDecode, JPXDecode, raw
  format: 'jpeg' | 'png' | 'monochrome' | 'grayscale' | 'color' | 'unknown';
  width: number;
  height: number;
  colorSpace: string;
  bitsPerComponent: number;
  byteSize: number;
  effectiveDpi: number;
}

export interface DetailedPdfAnalysisResult extends PdfAnalysisResult {
  fileSizeBytes: number;
  totalImageBytes: number;
  totalVectorBytes: number;
  jpegImageCount: number;
  pngImageCount: number;
  monochromeImageCount: number;
  grayscaleImageCount: number;
  colorImageCount: number;
  maxEffectiveDpi: number;
  avgEffectiveDpi: number;
  embeddedFontCount: number;
  hasVectorGraphics: boolean;
  hasTransparency: boolean;
  hasOcrTextLayer: boolean;
  isScannedDocument: boolean;
  imageDetails: ImageDetail[];
}

export class PdfAnalyzer {
  async analyzePdf(inputPath: string): Promise<DetailedPdfAnalysisResult> {
    const stats = await fs.promises.stat(inputPath);
    const fileSizeBytes = stats.size;

    const pdfBuffer = await fs.promises.readFile(inputPath);
    const pdfHeaderStr = pdfBuffer.toString('latin1', 0, Math.min(pdfBuffer.length, 1024));

    // Extract PDF version header
    let pdfVersion = '1.7';
    const versionMatch = pdfHeaderStr.match(/%PDF-(\d\.\d)/);
    if (versionMatch) {
      pdfVersion = versionMatch[1];
    }

    // Check encryption
    let doc: PDFDocument;
    try {
      doc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: false });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message.toLowerCase() : '';
      if (msg.includes('encrypt') || msg.includes('password')) {
        return this.createEncryptedFallback(pdfVersion, fileSizeBytes);
      }
      throw err;
    }

    if (doc.isEncrypted) {
      return this.createEncryptedFallback(pdfVersion, fileSizeBytes);
    }

    const pageCount = doc.getPageCount();
    const fullBufferStr = pdfBuffer.toString('latin1');

    // 1. Digital signatures & Forms detection
    const isSigned =
      fullBufferStr.includes('/ByteRange') ||
      (fullBufferStr.includes('/Contents') && fullBufferStr.includes('/Sig'));

    let hasForms = false;
    try {
      const form = doc.getForm();
      hasForms = form.getFields().length > 0;
    } catch {
      hasForms = fullBufferStr.includes('/AcroForm');
    }

    const hasAnnotations = fullBufferStr.includes('/Annots');
    const hasBookmarks = fullBufferStr.includes('/Outlines');
    const hasTransparency =
      fullBufferStr.includes('/ExtGState') &&
      (fullBufferStr.includes('/ca') || fullBufferStr.includes('/CA') || fullBufferStr.includes('/SMask'));

    // 2. Page Geometry (average width/height in inches, 72 pt = 1 inch)
    let avgPageWidthInches = 8.5; // default US Letter width
    let avgPageHeightInches = 11.0;
    if (pageCount > 0) {
      let totalW = 0;
      let totalH = 0;
      const pages = doc.getPages();
      for (const p of pages) {
        const { width, height } = p.getSize();
        totalW += width;
        totalH += height;
      }
      avgPageWidthInches = totalW / pageCount / 72;
      avgPageHeightInches = totalH / pageCount / 72;
    }

    // 3. Deep Indirect Object Enumeration for Images & Fonts
    const imageDetails: ImageDetail[] = [];
    let fontCount = 0;
    let totalImageBytes = 0;
    let totalVectorBytes = 0;
    let jpegImageCount = 0;
    let pngImageCount = 0;
    let monochromeImageCount = 0;
    let grayscaleImageCount = 0;
    let colorImageCount = 0;

    const context = doc.context;
    const visitedRefs = new Set<string>();

    context.enumerateIndirectObjects().forEach(([ref, obj]) => {
      const refStr = ref.toString();
      if (visitedRefs.has(refStr)) return;
      visitedRefs.add(refStr);

      if (obj instanceof PDFRawStream) {
        const dict = obj.dict;
        const subtype = dict.get(PDFName.of('Subtype'));
        const type = dict.get(PDFName.of('Type'));
        const filterObj = dict.get(PDFName.of('Filter'));
        const contentsLen = obj.contents ? obj.contents.length : 0;

        // Detect Fonts
        if (
          type === PDFName.of('Font') ||
          dict.has(PDFName.of('FontDescriptor')) ||
          subtype === PDFName.of('CIDFontType2') ||
          subtype === PDFName.of('Type1C') ||
          subtype === PDFName.of('FontFile2') ||
          subtype === PDFName.of('FontFile3')
        ) {
          fontCount++;
        }

        // Detect Vector Content Streams
        if (subtype === PDFName.of('Form') || !subtype) {
          totalVectorBytes += contentsLen;
        }

        // Detect Images
        if (subtype === PDFName.of('Image')) {
          totalImageBytes += contentsLen;

          let filterStr = 'raw';
          if (filterObj instanceof PDFName) {
            filterStr = filterObj.decodeText().replace('/', '');
          } else if (filterObj instanceof PDFArray) {
            const first = filterObj.get(0);
            if (first instanceof PDFName) filterStr = first.decodeText().replace('/', '');
          }

          const width = dict.get(PDFName.of('Width')) instanceof PDFNumber ? (dict.get(PDFName.of('Width')) as PDFNumber).asNumber() : 0;
          const height = dict.get(PDFName.of('Height')) instanceof PDFNumber ? (dict.get(PDFName.of('Height')) as PDFNumber).asNumber() : 0;
          const bits = dict.get(PDFName.of('BitsPerComponent')) instanceof PDFNumber ? (dict.get(PDFName.of('BitsPerComponent')) as PDFNumber).asNumber() : 8;

          const colorSpaceObj = dict.get(PDFName.of('ColorSpace'));
          let csStr = 'DeviceRGB';
          if (colorSpaceObj instanceof PDFName) {
            csStr = colorSpaceObj.decodeText().replace('/', '');
          } else if (colorSpaceObj instanceof PDFArray) {
            const first = colorSpaceObj.get(0);
            if (first instanceof PDFName) csStr = first.decodeText().replace('/', '');
          }

          let format: ImageDetail['format'] = 'unknown';
          if (filterStr.includes('DCTDecode') || filterStr.includes('JPXDecode')) {
            format = 'jpeg';
            jpegImageCount++;
          } else if (filterStr.includes('CCITTFaxDecode') || bits === 1) {
            format = 'monochrome';
            monochromeImageCount++;
          } else if (csStr.includes('Gray')) {
            format = 'grayscale';
            grayscaleImageCount++;
          } else if (filterStr.includes('FlateDecode')) {
            format = 'png';
            pngImageCount++;
          } else {
            format = 'color';
            colorImageCount++;
          }

          if (csStr.includes('Gray') && format !== 'monochrome') grayscaleImageCount++;
          if ((csStr.includes('RGB') || csStr.includes('CMYK')) && format !== 'jpeg' && format !== 'png') colorImageCount++;

          // Effective DPI calculation against average page dimensions
          const effectiveDpi = Math.max(
            72,
            Math.round(width / Math.max(1.0, avgPageWidthInches))
          );

          imageDetails.push({
            refString: refStr,
            filter: filterStr,
            format,
            width,
            height,
            colorSpace: csStr,
            bitsPerComponent: bits,
            byteSize: contentsLen,
            effectiveDpi,
          });
        }
      } else if (obj instanceof PDFDict) {
        const type = obj.get(PDFName.of('Type'));
        if (type === PDFName.of('Font')) {
          fontCount++;
        }
      }
    });

    // Calculate DPI metrics
    let maxEffectiveDpi = 0;
    let sumDpi = 0;
    for (const img of imageDetails) {
      if (img.effectiveDpi > maxEffectiveDpi) maxEffectiveDpi = img.effectiveDpi;
      sumDpi += img.effectiveDpi;
    }
    const avgEffectiveDpi = imageDetails.length > 0 ? Math.round(sumDpi / imageDetails.length) : 0;

    // 4. Scanned Page & Text Layer Analysis
    let textStreamCount = 0;
    const pages = doc.getPages();
    for (const page of pages) {
      const { node } = page as unknown as { node: PDFDict };
      const contents = node.get(PDFName.of('Contents'));
      if (contents) textStreamCount++;
    }

    const hasOcrTextLayer = textStreamCount > 0 && imageDetails.length >= pageCount;
    const isScannedDocument =
      imageDetails.length >= pageCount &&
      totalImageBytes > fileSizeBytes * 0.70 &&
      textStreamCount <= pageCount;

    // 5. Document Classification
    let pdfType: PdfType = 'text';
    if (isScannedDocument) {
      pdfType = 'image';
    } else if (imageDetails.length > 0 && totalImageBytes > fileSizeBytes * 0.40) {
      pdfType = 'mixed';
    } else if (imageDetails.length > 0) {
      pdfType = 'mixed';
    } else {
      pdfType = 'text';
    }

    return {
      pageCount,
      pdfVersion,
      isEncrypted: false,
      isSigned,
      hasForms,
      hasAnnotations,
      hasBookmarks,
      embeddedImageCount: imageDetails.length,
      pdfType,
      fileSizeBytes,
      totalImageBytes,
      totalVectorBytes,
      jpegImageCount,
      pngImageCount,
      monochromeImageCount,
      grayscaleImageCount,
      colorImageCount,
      maxEffectiveDpi,
      avgEffectiveDpi,
      embeddedFontCount: fontCount,
      hasVectorGraphics: totalVectorBytes > 0,
      hasTransparency,
      hasOcrTextLayer,
      isScannedDocument,
      imageDetails,
    };
  }

  private createEncryptedFallback(pdfVersion: string, fileSizeBytes: number): DetailedPdfAnalysisResult {
    return {
      pageCount: 0,
      pdfVersion,
      isEncrypted: true,
      isSigned: false,
      hasForms: false,
      hasAnnotations: false,
      hasBookmarks: false,
      embeddedImageCount: 0,
      pdfType: 'text',
      fileSizeBytes,
      totalImageBytes: 0,
      totalVectorBytes: 0,
      jpegImageCount: 0,
      pngImageCount: 0,
      monochromeImageCount: 0,
      grayscaleImageCount: 0,
      colorImageCount: 0,
      maxEffectiveDpi: 0,
      avgEffectiveDpi: 0,
      embeddedFontCount: 0,
      hasVectorGraphics: false,
      hasTransparency: false,
      hasOcrTextLayer: false,
      isScannedDocument: false,
      imageDetails: [],
    };
  }
}

export const pdfAnalyzer = new PdfAnalyzer();
