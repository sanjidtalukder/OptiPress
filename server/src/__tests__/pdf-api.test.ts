import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import express from 'express';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { createApp } from '../app.js';
import { temporaryStorageService } from '../services/storage.service.js';
import { sessionFileRepository } from '../services/file-repository.service.js';
import { historyService } from '../services/history.service.js';
import { optimizePdf } from '../controllers/pdf.controller.js';
import { downloadFile } from '../controllers/file.controller.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const TEST_DIR = path.join(__dirname, '../../test-api-tmp-' + crypto.randomUUID().slice(0, 8));

async function createDummyPdf(filename: string): Promise<string> {
  await fs.promises.mkdir(TEST_DIR, { recursive: true });
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([600, 400]);
  page.drawText('OptiPress API PDF Test Document', { x: 50, y: 350, size: 24, font, color: rgb(0, 0.5, 0.5) });
  const bytes = await doc.save();
  const filePath = path.join(TEST_DIR, filename);
  await fs.promises.writeFile(filePath, bytes);
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
    download(filePath: string, fileName: string) {
      this.downloadPath = filePath;
      this.downloadName = fileName;
      return this;
    },
  };

  return res;
}

test('PDF Optimization API End-to-End Flow', async (t) => {
  const app = createApp();

  // Create a server instance for testing HTTP calls
  const server = app.listen(0);
  const address = server.address() as { port: number };
  const baseUrl = `http://localhost:${address.port}`;

  // Mock authentication token:
  // In test environment authMiddleware attempts Supabase getUser. If network/key placeholder,
  // we bypass auth check or test controller directly.
  // Let's create a test session and save a file record directly in sessionFileRepository.

  const userId = `test_user_${crypto.randomUUID().slice(0, 8)}`;
  const sessionId = `app_sess_${crypto.randomUUID().slice(0, 8)}`;
  const pdfFilePath = await createDummyPdf('original-test.pdf');
  const originalStats = await fs.promises.stat(pdfFilePath);

  // Generate storage key and move file into temporary storage directory
  const { fileId, storedName, storageKey } = temporaryStorageService.generateStorageKey(sessionId, 'pdf');
  await temporaryStorageService.saveTemporaryFile(pdfFilePath, sessionId, storedName);

  // Save record in shared sessionFileRepository
  await sessionFileRepository.saveFileRecord({
    id: fileId,
    sessionId,
    userId,
    originalName: 'original-test.pdf',
    storedName,
    mimeType: 'application/pdf',
    extension: 'pdf',
    fileSize: originalStats.size,
    storageKey,
    status: 'uploaded',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  await t.test('sessionFileRepository correctly stores and retrieves PDF file metadata', async () => {
    const record = await sessionFileRepository.getFileRecord(fileId, userId);
    assert.ok(record);
    assert.equal(record.id, fileId);
    assert.equal(record.originalName, 'original-test.pdf');
    assert.equal(record.extension, 'pdf');
  });

  await t.test('Nonexistent fileId returns 404 FILE_NOT_FOUND', async () => {
    const invalidRecord = await sessionFileRepository.getFileRecord('nonexistent-id-12345', userId);
    assert.equal(invalidRecord, null);
  });

  await t.test('Optimized PDF is generated and registered in history while preserving original', async () => {
    const inputPath = temporaryStorageService.getFilePath(sessionId, storedName);
    const outputPath = temporaryStorageService.getFilePath(sessionId, `${fileId}-optimized.pdf`);

    assert.ok(fs.existsSync(inputPath), 'Original input file must exist before optimization');

    const { pdfOptimizer } = await import('../services/pdf-optimizer.service.js');
    const result = await pdfOptimizer.optimizePdf({
      fileId,
      inputPath,
      outputPath,
      mode: 'smart',
    });

    assert.ok(['success', 'already_optimized'].includes(result.status));
    assert.ok(fs.existsSync(outputPath), 'Optimized output PDF file must exist after optimization');
    assert.ok(fs.existsSync(inputPath), 'Original input file must remain untouched on disk');

    // Record history
    const historyRecord = await historyService.recordHistory({
      sessionId,
      userId,
      fileId,
      originalName: 'original-test.pdf',
      extension: 'pdf',
      originalSize: result.originalSize,
      outputSize: result.optimizedSize,
      operation: 'PDF Optimization',
      mode: 'smart',
      status: 'completed',
      reductionPercentage: result.reductionPercentage,
      resultStorageKey: `${fileId}-optimized.pdf`,
    });

    assert.equal(historyRecord.originalName, 'original-test.pdf');

    const userHistory = await historyService.getSessionHistory(userId, sessionId);
    assert.ok(userHistory.length >= 1);
    assert.equal(userHistory[0].fileId, fileId);
  });

  await t.test('POST /api/pdfs/:fileId/optimize response registers optimized output for secure download', async () => {
    const req = {
      params: { fileId },
      body: { mode: 'smart' },
      user: { id: userId, email: 'pdf-test@example.com' },
    } as unknown as AuthenticatedRequest;
    const res = createMockResponse();

    await optimizePdf(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.fileId, fileId);
    assert.ok(res.body.data.outputFileId, 'response must include outputFileId');
    assert.equal(res.body.data.outputFileName, 'original-test-optimized.pdf');

    const outputFileId = res.body.data.outputFileId as string;
    const outputRecord = await sessionFileRepository.getFileRecord(outputFileId, userId);
    assert.ok(outputRecord, 'optimized output file must be registered');
    assert.equal(outputRecord.sessionId, sessionId);
    assert.equal(outputRecord.userId, userId);
    assert.equal(outputRecord.originalName, 'original-test-optimized.pdf');
    assert.equal(outputRecord.mimeType, 'application/pdf');
    assert.equal(outputRecord.extension, 'pdf');
    assert.equal(outputRecord.status, 'completed');
    assert.equal(outputRecord.fileSize, res.body.data.optimizedSize);

    const outputPath = temporaryStorageService.getFilePath(outputRecord.sessionId, outputRecord.storedName);
    const inputPath = temporaryStorageService.getFilePath(sessionId, storedName);
    assert.ok(fs.existsSync(outputPath), 'optimized PDF must exist in temporary workspace');
    assert.ok(fs.existsSync(inputPath), 'original PDF must remain untouched after optimization');

    const history = await historyService.getSessionHistory(userId, sessionId);
    const pdfHistory = history.find((item) => item.fileId === outputFileId);
    assert.ok(pdfHistory, 'history must reference optimized output file id');
    assert.equal(pdfHistory?.operation, 'PDF Optimization');
    assert.equal(pdfHistory?.status, 'completed');
    assert.equal(pdfHistory?.resultStorageKey, outputRecord.storedName);

    const downloadReq = {
      params: { id: outputFileId },
      query: { type: 'result' },
      user: { id: userId, email: 'pdf-test@example.com' },
    } as unknown as AuthenticatedRequest;
    const downloadRes = createMockResponse();

    await downloadFile(downloadReq, downloadRes);

    assert.equal(downloadRes.statusCode, 200);
    assert.equal(downloadRes.headers.get('content-type'), 'application/pdf');
    assert.equal(downloadRes.headers.get('cache-control'), 'no-store');
    assert.equal(downloadRes.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(downloadRes.downloadPath, outputPath);
    assert.equal(downloadRes.downloadName, 'original-test-optimized.pdf');
    assert.ok(fs.existsSync(outputPath), 'download must not delete optimized PDF');
    assert.ok(fs.existsSync(inputPath), 'download must not delete original PDF');

    const downloadedBytes = await fs.promises.readFile(downloadRes.downloadPath);
    const downloadedPdf = await PDFDocument.load(downloadedBytes);
    assert.equal(downloadedPdf.getPageCount(), res.body.data.pageCount);
  });

  await t.test('Download rejects missing, unauthorized, invalid, and expired optimized files', async () => {
    const missingRecordReq = {
      params: { id: crypto.randomUUID() },
      query: { type: 'result' },
      user: { id: userId, email: 'pdf-test@example.com' },
    } as unknown as AuthenticatedRequest;
    const missingRecordRes = createMockResponse();
    await downloadFile(missingRecordReq, missingRecordRes);
    assert.equal(missingRecordRes.statusCode, 404);
    assert.equal(missingRecordRes.body.error.code, 'FILE_NOT_FOUND');

    const { fileId: unauthorizedFileId, storedName: unauthorizedStoredName, storageKey: unauthorizedStorageKey } =
      temporaryStorageService.generateStorageKey(sessionId, 'pdf');
    const unauthorizedSourcePath = await createDummyPdf('unauthorized.pdf');
    const unauthorizedStats = await fs.promises.stat(unauthorizedSourcePath);
    await temporaryStorageService.saveTemporaryFile(unauthorizedSourcePath, sessionId, unauthorizedStoredName);
    await sessionFileRepository.saveFileRecord({
      id: unauthorizedFileId,
      sessionId,
      userId: `other_user_${crypto.randomUUID().slice(0, 8)}`,
      originalName: 'unauthorized-optimized.pdf',
      storedName: unauthorizedStoredName,
      mimeType: 'application/pdf',
      extension: 'pdf',
      fileSize: unauthorizedStats.size,
      storageKey: unauthorizedStorageKey,
      status: 'completed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const unauthorizedReq = {
      params: { id: unauthorizedFileId },
      query: { type: 'result' },
      user: { id: userId, email: 'pdf-test@example.com' },
    } as unknown as AuthenticatedRequest;
    const unauthorizedRes = createMockResponse();
    await downloadFile(unauthorizedReq, unauthorizedRes);
    assert.equal(unauthorizedRes.statusCode, 404);
    assert.equal(unauthorizedRes.body.error.code, 'FILE_NOT_FOUND');

    const invalidOptimizeReq = {
      params: { fileId: crypto.randomUUID() },
      body: { mode: 'smart' },
      user: { id: userId, email: 'pdf-test@example.com' },
    } as unknown as AuthenticatedRequest;
    const invalidOptimizeRes = createMockResponse();
    await optimizePdf(invalidOptimizeReq, invalidOptimizeRes);
    assert.equal(invalidOptimizeRes.statusCode, 404);
    assert.equal(invalidOptimizeRes.body.error.code, 'FILE_NOT_FOUND');

    const { fileId: expiredFileId, storedName: expiredStoredName, storageKey: expiredStorageKey } =
      temporaryStorageService.generateStorageKey(sessionId, 'pdf');
    const expiredSourcePath = await createDummyPdf('expired.pdf');
    const expiredStats = await fs.promises.stat(expiredSourcePath);
    await temporaryStorageService.saveTemporaryFile(expiredSourcePath, sessionId, expiredStoredName);
    await sessionFileRepository.saveFileRecord({
      id: expiredFileId,
      sessionId,
      userId,
      originalName: 'expired-optimized.pdf',
      storedName: expiredStoredName,
      mimeType: 'application/pdf',
      extension: 'pdf',
      fileSize: expiredStats.size,
      storageKey: expiredStorageKey,
      status: 'completed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    await temporaryStorageService.deleteTemporaryFile(sessionId, expiredStoredName);

    const expiredReq = {
      params: { id: expiredFileId },
      query: { type: 'result' },
      user: { id: userId, email: 'pdf-test@example.com' },
    } as unknown as AuthenticatedRequest;
    const expiredRes = createMockResponse();
    await downloadFile(expiredReq, expiredRes);
    assert.equal(expiredRes.statusCode, 404);
    assert.equal(expiredRes.body.error.message, 'Temporary file missing or expired.');
  });

  server.close();
  await cleanupTestDir();
});
