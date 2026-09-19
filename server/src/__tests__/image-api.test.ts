import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';
import { temporaryStorageService } from '../services/storage.service.js';
import { sessionFileRepository } from '../services/file-repository.service.js';
import { historyService } from '../services/history.service.js';
import { optimizeImage, optimizeTargetSize } from '../controllers/image.controller.js';
import { downloadFile } from '../controllers/file.controller.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const TEST_DIR = path.join(__dirname, '../../test-img-api-tmp-' + crypto.randomUUID().slice(0, 8));

async function createTestImageFile(filename: string, format: 'jpeg' | 'png' | 'webp', width = 1200, height = 900): Promise<string> {
  await fs.promises.mkdir(TEST_DIR, { recursive: true });
  const filePath = path.join(TEST_DIR, filename);

  const rawPixels = Buffer.alloc(width * height * 3);
  for (let i = 0; i < rawPixels.length; i++) {
    rawPixels[i] = (i * 17) % 256;
  }

  const instance = sharp(rawPixels, { raw: { width, height, channels: 3 } });

  if (format === 'jpeg') {
    await instance.jpeg({ quality: 90 }).toFile(filePath);
  } else if (format === 'png') {
    await instance.png().toFile(filePath);
  } else if (format === 'webp') {
    await instance.webp({ quality: 90 }).toFile(filePath);
  }

  return filePath;
}

async function cleanupTestDir() {
  await fs.promises.rm(TEST_DIR, { recursive: true, force: true }).catch(() => {});
}

function createMockResponse() {
  const res: any = {
    statusCode: 200,
    body: undefined,
    headers: new Map<string, string>(),
    downloadPath: undefined,
    downloadName: undefined,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.body = body;
      return this;
    },
    setHeader(name: string, value: string) {
      this.headers.set(name.toLowerCase(), value);
      return this;
    },
    download(filePath: string, filename: string) {
      this.downloadPath = filePath;
      this.downloadName = filename;
      this.statusCode = 200;
      return this;
    },
  };
  return res;
}

test('Image Optimization & Result Download End-to-End Flow', async (t) => {
  await fs.promises.mkdir(TEST_DIR, { recursive: true });

  const userId = 'usr_img_test_' + crypto.randomUUID().slice(0, 8);
  const mockUser = { id: userId, email: 'imgtest@optipress.local', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };

  await t.test('1. JPG Strategy Mode: Upload -> Optimize -> Result Registered -> Download -> File Intact', async () => {
    const sessionId = 'app_sess_strat_' + crypto.randomUUID().slice(0, 8);
    const jpgPath = await createTestImageFile('test-orig.jpg', 'jpeg');
    const jpgStats = await fs.promises.stat(jpgPath);

    const { fileId, storedName, storageKey } = temporaryStorageService.generateStorageKey(sessionId, 'jpg');
    const tempDest = await temporaryStorageService.saveTemporaryFile(jpgPath, sessionId, storedName);

    const fileRecord = await sessionFileRepository.saveFileRecord({
      id: fileId,
      sessionId,
      userId,
      originalName: 'sample-image.jpg',
      storedName,
      mimeType: 'image/jpeg',
      extension: 'jpg',
      fileSize: jpgStats.size,
      storageKey,
      status: 'uploaded',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const optReq = {
      user: mockUser,
      params: { fileId: fileRecord.id },
      body: { mode: 'smart' },
    } as unknown as AuthenticatedRequest;

    const optRes = createMockResponse();
    await optimizeImage(optReq, optRes);

    assert.equal(optRes.statusCode, 200);
    assert.equal(optRes.body.success, true);
    assert.ok(optRes.body.data.outputFileId, 'outputFileId must be returned');
    assert.ok(optRes.body.data.outputFileName, 'outputFileName must be returned');

    const resultFileId = optRes.body.data.outputFileId;
    const resultRecord = await sessionFileRepository.getFileRecord(resultFileId, userId);
    assert.ok(resultRecord, 'Result file record must exist in sessionFileRepository');
    assert.equal(resultRecord.id, resultFileId);

    // Verify physical result file exists
    const resultPhysicalPath = temporaryStorageService.getFilePath(sessionId, resultRecord.storedName);
    assert.ok(fs.existsSync(resultPhysicalPath), 'Physical result file must exist on disk');

    // Test GET /api/files/:resultFileId/download?type=result
    const dlReq = {
      user: mockUser,
      params: { id: resultFileId },
      query: { type: 'result' },
    } as unknown as AuthenticatedRequest;

    const dlRes = createMockResponse();
    await downloadFile(dlReq, dlRes);

    assert.equal(dlRes.statusCode, 200);
    assert.ok(dlRes.downloadPath, 'downloadPath should be populated');
    assert.equal(fs.existsSync(dlRes.downloadPath), true);
    assert.equal(dlRes.headers.get('content-type'), 'image/jpeg');

    // Verify downloaded file size matches result file size
    const dlStats = await fs.promises.stat(dlRes.downloadPath);
    assert.equal(dlStats.size, optRes.body.data.optimizedSize);

    // Verify original file remains intact
    assert.ok(fs.existsSync(tempDest), 'Original uploaded image file must remain intact');
    assert.ok(fs.existsSync(resultPhysicalPath), 'Result file must remain available after download');
  });

  await t.test('2. JPG Target Size Mode (100 KB and 500 KB): Target execution & download', async () => {
    const sessionId = 'app_sess_target_' + crypto.randomUUID().slice(0, 8);
    const jpgPath = await createTestImageFile('target-test.jpg', 'jpeg', 1600, 1200);
    const jpgStats = await fs.promises.stat(jpgPath);

    const { fileId, storedName, storageKey } = temporaryStorageService.generateStorageKey(sessionId, 'jpg');
    const tempDest = await temporaryStorageService.saveTemporaryFile(jpgPath, sessionId, storedName);

    const fileRecord = await sessionFileRepository.saveFileRecord({
      id: fileId,
      sessionId,
      userId,
      originalName: 'photo-large.jpg',
      storedName,
      mimeType: 'image/jpeg',
      extension: 'jpg',
      fileSize: jpgStats.size,
      storageKey,
      status: 'uploaded',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Test 500 KB Target
    const targetReq500 = {
      user: mockUser,
      params: { fileId: fileRecord.id },
      body: { targetSize: 500, unit: 'KB' },
    } as unknown as AuthenticatedRequest;

    const targetRes500 = createMockResponse();
    await optimizeTargetSize(targetReq500, targetRes500);

    assert.equal(targetRes500.statusCode, 200);
    assert.equal(targetRes500.body.success, true);
    assert.ok(targetRes500.body.data.outputFileId, 'Target output file ID must be returned');
    assert.ok(targetRes500.body.data.outputSize <= 512000, `Output size ${targetRes500.body.data.outputSize} must be <= 500 KB (512000 B)`);

    // Download 500 KB target result
    const dlReq500 = {
      user: mockUser,
      params: { id: targetRes500.body.data.outputFileId },
      query: { type: 'result' },
    } as unknown as AuthenticatedRequest;

    const dlRes500 = createMockResponse();
    await downloadFile(dlReq500, dlRes500);
    assert.equal(dlRes500.statusCode, 200);
    assert.equal(fs.existsSync(dlRes500.downloadPath), true);

    // Test 100 KB Target
    const targetReq100 = {
      user: mockUser,
      params: { fileId: fileRecord.id },
      body: { targetSize: 100, unit: 'KB' },
    } as unknown as AuthenticatedRequest;

    const targetRes100 = createMockResponse();
    await optimizeTargetSize(targetReq100, targetRes100);

    assert.equal(targetRes100.statusCode, 200);
    assert.equal(targetRes100.body.success, true);
    assert.ok(targetRes100.body.data.outputFileId);
    assert.ok(targetRes100.body.data.outputSize <= 102400 || targetRes100.body.data.status === 'target_unreachable');

    // Download 100 KB target result
    const dlReq100 = {
      user: mockUser,
      params: { id: targetRes100.body.data.outputFileId },
      query: { type: 'result' },
    } as unknown as AuthenticatedRequest;

    const dlRes100 = createMockResponse();
    await downloadFile(dlReq100, dlRes100);
    assert.equal(dlRes100.statusCode, 200);
    assert.equal(fs.existsSync(dlRes100.downloadPath), true);

    // Verify original file remains intact
    assert.ok(fs.existsSync(tempDest), 'Original uploaded image file must remain intact');
  });

  await t.test('3. PNG Optimization & Download', async () => {
    const sessionId = 'app_sess_png_' + crypto.randomUUID().slice(0, 8);
    const pngPath = await createTestImageFile('test-orig.png', 'png', 800, 600);
    const pngStats = await fs.promises.stat(pngPath);

    const { fileId, storedName, storageKey } = temporaryStorageService.generateStorageKey(sessionId, 'png');
    const tempDest = await temporaryStorageService.saveTemporaryFile(pngPath, sessionId, storedName);

    const fileRecord = await sessionFileRepository.saveFileRecord({
      id: fileId,
      sessionId,
      userId,
      originalName: 'graphic.png',
      storedName,
      mimeType: 'image/png',
      extension: 'png',
      fileSize: pngStats.size,
      storageKey,
      status: 'uploaded',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const optReq = {
      user: mockUser,
      params: { fileId: fileRecord.id },
      body: { mode: 'smart' },
    } as unknown as AuthenticatedRequest;

    const optRes = createMockResponse();
    await optimizeImage(optReq, optRes);

    assert.equal(optRes.statusCode, 200);
    assert.ok(optRes.body.data.outputFileId);

    const dlReq = {
      user: mockUser,
      params: { id: optRes.body.data.outputFileId },
      query: { type: 'result' },
    } as unknown as AuthenticatedRequest;

    const dlRes = createMockResponse();
    await downloadFile(dlReq, dlRes);
    assert.equal(dlRes.statusCode, 200);
    assert.equal(dlRes.headers.get('content-type'), 'image/png');
    assert.ok(fs.existsSync(tempDest));
  });

  await t.test('4. WebP Optimization & Download', async () => {
    const sessionId = 'app_sess_webp_' + crypto.randomUUID().slice(0, 8);
    const webpPath = await createTestImageFile('test-orig.webp', 'webp', 800, 600);
    const webpStats = await fs.promises.stat(webpPath);

    const { fileId, storedName, storageKey } = temporaryStorageService.generateStorageKey(sessionId, 'webp');
    const tempDest = await temporaryStorageService.saveTemporaryFile(webpPath, sessionId, storedName);

    const fileRecord = await sessionFileRepository.saveFileRecord({
      id: fileId,
      sessionId,
      userId,
      originalName: 'banner.webp',
      storedName,
      mimeType: 'image/webp',
      extension: 'webp',
      fileSize: webpStats.size,
      storageKey,
      status: 'uploaded',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const optReq = {
      user: mockUser,
      params: { fileId: fileRecord.id },
      body: { mode: 'smart' },
    } as unknown as AuthenticatedRequest;

    const optRes = createMockResponse();
    await optimizeImage(optReq, optRes);

    assert.equal(optRes.statusCode, 200);
    assert.ok(optRes.body.data.outputFileId);

    const dlReq = {
      user: mockUser,
      params: { id: optRes.body.data.outputFileId },
      query: { type: 'result' },
    } as unknown as AuthenticatedRequest;

    const dlRes = createMockResponse();
    await downloadFile(dlReq, dlRes);
    assert.equal(dlRes.statusCode, 200);
    assert.equal(dlRes.headers.get('content-type'), 'image/webp');
    assert.ok(fs.existsSync(tempDest));
  });

  await cleanupTestDir();
});
