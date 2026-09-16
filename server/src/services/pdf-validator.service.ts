import fs from 'fs';
import { PDFDocument, PDFName, PDFDict } from 'pdf-lib';
import { QUALITY_SAMPLING_CONFIG } from '@optipress/config';

export interface PdfValidationResult {
  isValid: boolean;
  pageCount: number;
  textExtractable: boolean;
  sampledPagesCount: number;
  error?: string;
  issues: string[];
}

export class PdfValidator {
  /**
   * Validates structural integrity, page count preservation, text extractability,
   * and representative page sampling for an output PDF.
   */
  async validatePdf(
    outputPath: string,
    expectedPageCount?: number
  ): Promise<PdfValidationResult> {
    const issues: string[] = [];

    if (!fs.existsSync(outputPath)) {
      return {
        isValid: false,
        pageCount: 0,
        textExtractable: false,
        sampledPagesCount: 0,
        error: 'Output PDF file does not exist on disk.',
        issues: ['File missing on disk.'],
      };
    }

    const stats = await fs.promises.stat(outputPath);
    if (stats.size === 0) {
      return {
        isValid: false,
        pageCount: 0,
        textExtractable: false,
        sampledPagesCount: 0,
        error: 'Output PDF file is empty (0 bytes).',
        issues: ['File size is 0 bytes.'],
      };
    }

    let doc: PDFDocument;
    try {
      const pdfBuffer = await fs.promises.readFile(outputPath);
      doc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
    } catch (err: unknown) {
      return {
        isValid: false,
        pageCount: 0,
        textExtractable: false,
        sampledPagesCount: 0,
        error: err instanceof Error ? err.message : 'PDF document parsing failed.',
        issues: ['PDF parsing failure.'],
      };
    }

    const pageCount = doc.getPageCount();
    if (pageCount === 0) {
      issues.push('PDF contains 0 pages.');
    }

    if (expectedPageCount !== undefined && expectedPageCount > 0 && pageCount !== expectedPageCount) {
      issues.push(`Page count mismatch: expected ${expectedPageCount}, got ${pageCount}`);
    }

    // Representative page sampling (sample beginning, middle, and end pages)
    const maxSample = QUALITY_SAMPLING_CONFIG.MAX_PDF_SAMPLE_PAGES;
    const sampleIndices: number[] = [];

    if (pageCount <= maxSample) {
      for (let i = 0; i < pageCount; i++) sampleIndices.push(i);
    } else {
      sampleIndices.push(0);
      sampleIndices.push(Math.floor(pageCount / 2));
      sampleIndices.push(pageCount - 1);
    }

    let textExtractable = false;
    let sampledPagesCount = 0;

    for (const idx of sampleIndices) {
      const page = doc.getPage(idx);
      if (page) {
        sampledPagesCount++;
        const { node } = page as unknown as { node: PDFDict };
        const contents = node.get(PDFName.of('Contents'));
        if (contents) {
          textExtractable = true;
        }
      }
    }

    const isValid = issues.length === 0;

    return {
      isValid,
      pageCount,
      textExtractable,
      sampledPagesCount,
      error: isValid ? undefined : issues.join('; '),
      issues,
    };
  }
}

export const pdfValidator = new PdfValidator();
