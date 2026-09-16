import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import crypto from 'crypto';
import { parseTargetToBytes, formatBytesBinary, TARGET_SIZE_PRESETS } from '@optipress/config';
import { imageQualityEvaluator } from '../services/quality-evaluator.service.js';
import { targetSizeService } from '../services/target-size.service.js';

const TEST_DIR = path.join(__dirname, '../../test-tmp-' + crypto.randomUUID().slice(0, 8));

async function setupTestDir() {
  await fs.promises.mkdir(TEST_DIR, { recursive: true });
}

async function cleanupTestDir() {
  await fs.promises.rm(TEST_DIR, { recursive: true, force: true }).catch(() => {});
}

async function createTestImage(filename: string, width = 800, height = 600): Promise<string> {
  const filePath = path.join(TEST_DIR, filename);
  await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 120, g: 180, b: 240 },
    },
  })
    .jpeg({ quality: 90 })
    .toFile(filePath);
  return filePath;
}

test('Target Size Utilities & Presets', async (t) => {
  await t.test('parseTargetToBytes calculates binary bytes correctly', () => {
    assert.equal(parseTargetToBytes(500, 'KB'), 512000);
    assert.equal(parseTargetToBytes(1, 'MB'), 1048576);
    assert.equal(parseTargetToBytes(1.5, 'MB'), 1572864);
    assert.throws(() => parseTargetToBytes(-10, 'KB'));
    assert.throws(() => parseTargetToBytes(0, 'KB'));
    assert.throws(() => parseTargetToBytes(NaN, 'KB'));
  });

  await t.test('formatBytesBinary formats bytes correctly', () => {
    assert.equal(formatBytesBinary(1024), '1 KB');
    assert.equal(formatBytesBinary(512000), '500 KB');
    assert.equal(formatBytesBinary(1048576), '1 MB');
  });

  await t.test('TARGET_SIZE_PRESETS contains all required presets', () => {
    const labels = TARGET_SIZE_PRESETS.map((p) => p.label);
    const expected = ['99 KB', '100 KB', '200 KB', '250 KB', '500 KB', '1 MB', '2 MB', '5 MB'];
    for (const exp of expected) {
      assert.ok(labels.includes(exp), `Missing preset ${exp}`);
    }
  });
});

test('ImageQualityEvaluator Service', async (t) => {
  await setupTestDir();
  const imgPath = await createTestImage('quality-orig.jpg');

  await t.test('Identical images return perfect PSNR 100', async () => {
    const result = await imageQualityEvaluator.evaluateQuality(imgPath, imgPath);
    assert.equal(result.psnr, 100);
    assert.equal(result.score, 100);
    assert.equal(result.isAcceptable, true);
  });

  await cleanupTestDir();
});

test('TargetSizeService Engine', async (t) => {
  await setupTestDir();

  await t.test('Safeguard: Already below target returns original intact', async () => {
    const origPath = await createTestImage('small-orig.jpg', 200, 200);
    const outPath = path.join(TEST_DIR, 'small-out.jpg');
    const origStats = await fs.promises.stat(origPath);

    const result = await targetSizeService.optimizeTargetSize({
      fileId: 'test-file-1',
      originalPath: origPath,
      outputPath: outPath,
      extension: 'jpg',
      request: { targetSize: 500, unit: 'KB' },
    });

    assert.equal(result.status, 'already_below_target');
    assert.equal(result.outputSize, origStats.size);
    assert.equal(result.targetReached, true);
    assert.equal(result.qualityProtected, true);
  });

  await t.test('Optimization reduces large image to <= target size', async () => {
    // Generate a noise/pattern image that produces a larger file size (~100 KB)
    const rawPixels = Buffer.alloc(1200 * 900 * 3);
    for (let i = 0; i < rawPixels.length; i++) {
      rawPixels[i] = Math.floor(Math.random() * 256);
    }
    const origPath = path.join(TEST_DIR, 'noise-orig.jpg');
    await sharp(rawPixels, { raw: { width: 1200, height: 900, channels: 3 } })
      .jpeg({ quality: 95 })
      .toFile(origPath);

    const origStats = await fs.promises.stat(origPath);
    const targetKB = Math.max(20, Math.floor((origStats.size * 0.4) / 1024));
    const targetBytes = targetKB * 1024;
    const outPath = path.join(TEST_DIR, 'large-out.jpg');

    const result = await targetSizeService.optimizeTargetSize({
      fileId: 'test-file-2',
      originalPath: origPath,
      outputPath: outPath,
      extension: 'jpg',
      request: { targetSize: targetKB, unit: 'KB' },
    });

    assert.ok(result.outputSize <= targetBytes, `Output size ${result.outputSize} exceeds target ${targetBytes}`);
    assert.ok(['success', 'target_unreachable'].includes(result.status), `Unexpected status ${result.status}`);
    assert.ok(fs.existsSync(outPath));
  });

  await t.test('Force Target mode forces compliance', async () => {
    const origPath = await createTestImage('forced-orig.jpg', 1200, 900);
    const outPath = path.join(TEST_DIR, 'forced-out.jpg');

    const result = await targetSizeService.optimizeTargetSize({
      fileId: 'test-file-3',
      originalPath: origPath,
      outputPath: outPath,
      extension: 'jpg',
      request: { targetSize: 50, unit: 'KB', forceTarget: true },
    });

    assert.ok(result.outputSize <= 50 * 1024 || result.forced);
    assert.ok(fs.existsSync(outPath));
  });

  await t.test('Candidate temporary files are cleaned up', async () => {
    const origPath = await createTestImage('cleanup-orig.jpg', 800, 600);
    const outPath = path.join(TEST_DIR, 'cleanup-out.jpg');

    await targetSizeService.optimizeTargetSize({
      fileId: 'test-file-4',
      originalPath: origPath,
      outputPath: outPath,
      extension: 'jpg',
      request: { targetSize: 150, unit: 'KB' },
    });

    const filesInDir = await fs.promises.readdir(TEST_DIR);
    const candidateFiles = filesInDir.filter((f) => f.startsWith('cand-'));
    assert.equal(candidateFiles.length, 0, 'Candidate files were not cleaned up');
  });

  await cleanupTestDir();
});
