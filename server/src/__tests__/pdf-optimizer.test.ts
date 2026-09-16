import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { pdfAnalyzer } from '../services/pdf-analyzer.service.js';
import { pdfOptimizer } from '../services/pdf-optimizer.service.js';
import { pdfValidator } from '../services/pdf-validator.service.js';

const TEST_DIR = path.join(__dirname, '../../test-pdf-tmp-' + crypto.randomUUID().slice(0, 8));

async function setupTestDir() {
  await fs.promises.mkdir(TEST_DIR, { recursive: true });
}

async function cleanupTestDir() {
  await fs.promises.rm(TEST_DIR, { recursive: true, force: true }).catch(() => {});
}

async function createTextPdf(filename: string, text = 'OptiPress Text Preservation Test'): Promise<string> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);

  for (let i = 0; i < 3; i++) {
    const page = doc.addPage([600, 400]);
    page.drawText(`${text} - Page ${i + 1}`, {
      x: 50,
      y: 350,
      size: 24,
      font,
      color: rgb(0, 0.23, 0.5),
    });
  }

  const pdfBytes = await doc.save({ useObjectStreams: false });
  const filePath = path.join(TEST_DIR, filename);
  await fs.promises.writeFile(filePath, pdfBytes);
  return filePath;
}

test('PDF Analyzer Service', async (t) => {
  await setupTestDir();
  const pdfPath = await createTextPdf('sample-text.pdf');

  await t.test('Analyzes page count and PDF type accurately', async () => {
    const analysis = await pdfAnalyzer.analyzePdf(pdfPath);
    assert.equal(analysis.pageCount, 3);
    assert.equal(analysis.pdfType, 'text');
    assert.equal(analysis.isEncrypted, false);
  });

  await cleanupTestDir();
});

test('PDF Optimizer & Validator Services', async (t) => {
  await setupTestDir();

  await t.test('Text-based PDF preserves page count and text contents', async () => {
    const inputPath = await createTextPdf('text-orig.pdf');
    const outputPath = path.join(TEST_DIR, 'text-opt.pdf');

    const result = await pdfOptimizer.optimizePdf({
      fileId: 'pdf-test-1',
      inputPath,
      outputPath,
      mode: 'smart',
    });

    assert.ok(['success', 'already_optimized'].includes(result.status));
    assert.equal(result.pageCount, 3);
    assert.equal(result.isEncrypted, false);

    const validation = await pdfValidator.validatePdf(outputPath, 3);
    assert.equal(validation.isValid, true);
    assert.equal(validation.pageCount, 3);
  });

  await t.test('Already optimized PDF safeguard preserves original', async () => {
    const inputPath = await createTextPdf('already-opt.pdf');
    const outputPath = path.join(TEST_DIR, 'already-opt-out.pdf');

    const result = await pdfOptimizer.optimizePdf({
      fileId: 'pdf-test-2',
      inputPath,
      outputPath,
      mode: 'smart',
    });

    assert.ok(['success', 'already_optimized'].includes(result.status));
    assert.ok(fs.existsSync(outputPath));
  });

  await cleanupTestDir();
});
