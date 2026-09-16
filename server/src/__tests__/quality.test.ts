import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import crypto from 'crypto';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { imageQualityEvaluator } from '../services/quality-evaluator.service.js';
import { qualityGateService } from '../services/quality-gate.service.js';
import { pdfValidator } from '../services/pdf-validator.service.js';

const TEST_DIR = path.join(__dirname, '../../test-qual-tmp-' + crypto.randomUUID().slice(0, 8));

async function setupTestDir() {
  await fs.promises.mkdir(TEST_DIR, { recursive: true });
}

async function cleanupTestDir() {
  await fs.promises.rm(TEST_DIR, { recursive: true, force: true }).catch(() => {});
}

async function createTestImage(filename: string, width = 800, height = 600, quality = 95): Promise<string> {
  const filePath = path.join(TEST_DIR, filename);
  const rawPixels = Buffer.alloc(width * height * 3);
  for (let i = 0; i < rawPixels.length; i++) {
    rawPixels[i] = (i % 256);
  }

  await sharp(rawPixels, { raw: { width, height, channels: 3 } })
    .jpeg({ quality })
    .toFile(filePath);

  return filePath;
}

test('ImageQualityEvaluator - Visual Metrics & Decodability', async (t) => {
  await setupTestDir();
  const origPath = await createTestImage('orig.jpg', 800, 600, 95);
  const highQualPath = await createTestImage('high.jpg', 800, 600, 90);
  const lowQualPath = await createTestImage('low.jpg', 800, 600, 20);
  const diffDimPath = await createTestImage('diff-dim.jpg', 400, 300, 90);

  await t.test('High quality candidate achieves SSIM > 0.90 and PSNR > 30 dB', async () => {
    const res = await imageQualityEvaluator.evaluateQuality(origPath, highQualPath);
    assert.equal(res.status, 'PASS');
    assert.equal(res.passed, true);
    assert.ok((res.metrics.ssim || 0) >= 0.90, `SSIM ${res.metrics.ssim} < 0.90`);
    assert.ok((res.metrics.psnr || 0) >= 30, `PSNR ${res.metrics.psnr} < 30`);
  });

  await t.test('Aggressively degraded candidate yields lower quality score', async () => {
    const resHigh = await imageQualityEvaluator.evaluateQuality(origPath, highQualPath);
    const resLow = await imageQualityEvaluator.evaluateQuality(origPath, lowQualPath);
    assert.ok(resHigh.score > resLow.score, `High score ${resHigh.score} not greater than low ${resLow.score}`);
  });

  await t.test('Dimension mismatch fails validation when allowResize is false', async () => {
    const res = await imageQualityEvaluator.evaluateQuality(origPath, diffDimPath, { allowResize: false });
    assert.equal(res.status, 'FAIL');
    assert.equal(res.metrics.dimensionsMatch, false);
    assert.ok(res.issues.some((i) => i.includes('Dimension mismatch')));
  });

  await t.test('Corrupted or missing file fails decodability check', async () => {
    const missingPath = path.join(TEST_DIR, 'non-existent.jpg');
    const res = await imageQualityEvaluator.evaluateQuality(origPath, missingPath);
    assert.equal(res.status, 'FAIL');
    assert.equal(res.passed, false);
    assert.equal(res.metrics.decodable, false);
  });

  await cleanupTestDir();
});

test('QualityGateService - Ranking Mechanism', async (t) => {
  await setupTestDir();
  const origPath = await createTestImage('qgate-orig.jpg');
  const candPass = await createTestImage('qgate-pass.jpg', 800, 600, 80);

  await t.test('Ranks and selects candidate passing quality gate', async () => {
    const evalResult = await qualityGateService.evaluateCandidate(origPath, candPass);
    const candStats = await fs.promises.stat(candPass);

    const ranked = qualityGateService.rankCandidates(
      [
        {
          qualityParam: 80,
          filePath: candPass,
          fileSize: candStats.size,
          evaluation: evalResult,
        },
      ],
      500 * 1024
    );

    assert.ok(ranked.winningCandidate !== null);
    assert.equal(ranked.winningCandidate?.filePath, candPass);
  });

  await cleanupTestDir();
});

test('PdfValidator - Structural & Page Preservation Checks', async (t) => {
  await setupTestDir();

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < 2; i++) {
    const page = doc.addPage([500, 300]);
    page.drawText(`Quality PDF Test - Page ${i + 1}`, { x: 50, y: 200, font, size: 18 });
  }
  const pdfBytes = await doc.save();
  const pdfPath = path.join(TEST_DIR, 'valid-test.pdf');
  await fs.promises.writeFile(pdfPath, pdfBytes);

  await t.test('Valid PDF passes structural, text extractability, and page count checks', async () => {
    const val = await pdfValidator.validatePdf(pdfPath, 2);
    assert.equal(val.isValid, true);
    assert.equal(val.pageCount, 2);
    assert.equal(val.textExtractable, true);
  });

  await t.test('Page count mismatch returns invalid result', async () => {
    const val = await pdfValidator.validatePdf(pdfPath, 5);
    assert.equal(val.isValid, false);
    assert.ok(val.issues.some((i) => i.includes('Page count mismatch')));
  });

  await cleanupTestDir();
});
