import fs from 'fs';
import { PDFDocument, PDFName, PDFDict } from 'pdf-lib';
import { PdfAnalysisResult, PdfType } from '@optipress/types';

export class PdfAnalyzer {
  async analyzePdf(inputPath: string): Promise<PdfAnalysisResult> {
    const pdfBuffer = await fs.promises.readFile(inputPath);
    const pdfString = pdfBuffer.toString('latin1', 0, Math.min(pdfBuffer.length, 1024));

    // Extract PDF version header
    let pdfVersion = '1.7';
    const versionMatch = pdfString.match(/%PDF-(\d\.\d)/);
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
        };
      }
      throw err;
    }

    if (doc.isEncrypted) {
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
      };
    }

    const pageCount = doc.getPageCount();

    // Digital signature detection
    const fullBufferStr = pdfBuffer.toString('latin1');
    const isSigned = fullBufferStr.includes('/ByteRange') || fullBufferStr.includes('/Contents') && fullBufferStr.includes('/Sig');

    // Forms detection
    let hasForms = false;
    try {
      const form = doc.getForm();
      hasForms = form.getFields().length > 0;
    } catch {
      hasForms = fullBufferStr.includes('/AcroForm');
    }

    // Annotations & Bookmarks
    const hasAnnotations = fullBufferStr.includes('/Annots');
    const hasBookmarks = fullBufferStr.includes('/Outlines');

    // Embedded image count & PDF classification
    let embeddedImageCount = 0;
    let pagesWithText = 0;
    let pagesWithImages = 0;

    const pages = doc.getPages();
    for (const page of pages) {
      const { node } = page as unknown as { node: PDFDict };
      const resources = node.get(PDFName.of('Resources'));

      let hasPageImage = false;

      if (resources instanceof PDFDict) {
        const xObjects = resources.get(PDFName.of('XObject'));
        if (xObjects instanceof PDFDict) {
          for (const key of xObjects.keys()) {
            const xObject = xObjects.get(key);
            if (xObject instanceof PDFDict) {
              const subtype = xObject.get(PDFName.of('Subtype'));
              if (subtype === PDFName.of('Image')) {
                embeddedImageCount++;
                hasPageImage = true;
              }
            }
          }
        }
      }

      if (hasPageImage) {
        pagesWithImages++;
      }

      // Check text stream objects in Contents
      const contents = node.get(PDFName.of('Contents'));
      if (contents) {
        pagesWithText++;
      }
    }

    let pdfType: PdfType = 'text';
    if (embeddedImageCount > 0 && pagesWithText > 0) {
      if (pagesWithImages >= pageCount * 0.8 && pagesWithText < pageCount * 0.5) {
        pdfType = 'image';
      } else if (embeddedImageCount > 0 && pagesWithText > 0) {
        pdfType = 'mixed';
      }
    } else if (embeddedImageCount > 0) {
      pdfType = 'image';
    }

    return {
      pageCount,
      pdfVersion,
      isEncrypted: false,
      isSigned,
      hasForms,
      hasAnnotations,
      hasBookmarks,
      embeddedImageCount,
      pdfType,
    };
  }
}

export const pdfAnalyzer = new PdfAnalyzer();
