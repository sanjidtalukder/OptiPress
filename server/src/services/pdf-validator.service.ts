import fs from 'fs';
import { PDFDocument } from 'pdf-lib';

export interface PdfValidationResult {
  isValid: boolean;
  pageCount: number;
  error?: string;
}

export class PdfValidator {
  async validatePdf(
    outputPath: string,
    expectedPageCount?: number
  ): Promise<PdfValidationResult> {
    try {
      if (!fs.existsSync(outputPath)) {
        return { isValid: false, pageCount: 0, error: 'Output PDF file does not exist on disk.' };
      }

      const stats = await fs.promises.stat(outputPath);
      if (stats.size === 0) {
        return { isValid: false, pageCount: 0, error: 'Output PDF file is empty (0 bytes).' };
      }

      const pdfBuffer = await fs.promises.readFile(outputPath);
      const doc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
      const pageCount = doc.getPageCount();

      if (expectedPageCount !== undefined && expectedPageCount > 0 && pageCount !== expectedPageCount) {
        return {
          isValid: false,
          pageCount,
          error: `Page count mismatch: expected ${expectedPageCount}, got ${pageCount}.`,
        };
      }

      return {
        isValid: true,
        pageCount,
      };
    } catch (err: unknown) {
      return {
        isValid: false,
        pageCount: 0,
        error: err instanceof Error ? err.message : 'PDF validation parsing error.',
      };
    }
  }
}

export const pdfValidator = new PdfValidator();
