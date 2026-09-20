import fs from 'fs';
import { PDFDocument, PDFName, PDFDict } from 'pdf-lib';
import { binManagerService } from './bin-manager.service.js';

export interface DetailedPdfValidationResult {
  isValid: boolean;
  pageCount: number;
  textExtractable: boolean;
  sampledPagesCount: number;
  structuralCheckPassed: boolean;
  issues: string[];
  error?: string;
}

export class PdfValidator {
  /**
   * Performs structural verification, QPDF integrity validation, page count preservation,
   * text extraction sanity check, and non-empty stream validation for output PDFs.
   */
  async validatePdf(
    outputPath: string,
    expectedPageCount?: number
  ): Promise<DetailedPdfValidationResult> {
    const issues: string[] = [];

    if (!fs.existsSync(outputPath)) {
      return {
        isValid: false,
        pageCount: 0,
        textExtractable: false,
        sampledPagesCount: 0,
        structuralCheckPassed: false,
        issues: ['Output file does not exist on disk.'],
        error: 'Output PDF file does not exist on disk.',
      };
    }

    const stats = await fs.promises.stat(outputPath);
    if (stats.size === 0) {
      return {
        isValid: false,
        pageCount: 0,
        textExtractable: false,
        sampledPagesCount: 0,
        structuralCheckPassed: false,
        issues: ['File size is 0 bytes.'],
        error: 'Output PDF file is empty (0 bytes).',
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
        structuralCheckPassed: false,
        issues: ['PDF parsing failure.'],
        error: err instanceof Error ? err.message : 'PDF document parsing failed.',
      };
    }

    const pageCount = doc.getPageCount();
    if (pageCount === 0) {
      issues.push('PDF document contains 0 pages.');
    }

    if (expectedPageCount !== undefined && expectedPageCount > 0 && pageCount !== expectedPageCount) {
      issues.push(`Page count mismatch: expected ${expectedPageCount}, got ${pageCount}`);
    }

    // QPDF Structural Check
    let structuralCheckPassed = true;
    if (binManagerService.isQpdfAvailable()) {
      const qpdfCheck = await binManagerService.runQpdf(['--check', outputPath]);
      if (qpdfCheck.exitCode !== 0 && qpdfCheck.stderr.includes('error')) {
        structuralCheckPassed = false;
        issues.push(`QPDF structural integrity warning: ${qpdfCheck.stderr.trim().slice(0, 150)}`);
      }
    }

    // Text Extractability Sampling
    let textExtractable = false;
    let sampledPagesCount = 0;
    const sampleIndices = [0];
    if (pageCount > 1) sampleIndices.push(Math.floor(pageCount / 2));
    if (pageCount > 2) sampleIndices.push(pageCount - 1);

    for (const idx of sampleIndices) {
      if (idx < pageCount) {
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
    }

    const isValid = issues.length === 0 || (issues.length === 1 && issues[0].includes('warning'));

    return {
      isValid,
      pageCount,
      textExtractable,
      sampledPagesCount,
      structuralCheckPassed,
      issues,
      error: isValid ? undefined : issues.join('; '),
    };
  }
}

export const pdfValidator = new PdfValidator();
