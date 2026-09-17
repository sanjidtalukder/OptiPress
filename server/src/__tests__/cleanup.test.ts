import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { cleanupService } from '../modules/cleanup/cleanup.service.js';
import { temporaryStorageService } from '../services/storage.service.js';
import { historyService } from '../services/history.service.js';

const TEST_STORAGE_DIR = path.join(__dirname, '../../test-cleanup-tmp-' + crypto.randomUUID().slice(0, 8));

async function setupTestDir() {
  await fs.promises.mkdir(TEST_STORAGE_DIR, { recursive: true });
}

async function cleanupTestDir() {
  await fs.promises.rm(TEST_STORAGE_DIR, { recursive: true, force: true }).catch(() => {});
}

test('OptiPress Cleanup Service & Idempotency', async (t) => {
  await setupTestDir();

  await t.test('cleanSessionWorkspace removes physical files and directory idempotently', async () => {
    const sessionId = `test_sess_${crypto.randomUUID().slice(0, 8)}`;
    const sessionDir = await temporaryStorageService.ensureSessionDir(sessionId);

    const sampleFile = path.join(sessionDir, 'sample-doc.pdf');
    await fs.promises.writeFile(sampleFile, 'Dummy PDF content for cleanup test');

    assert.ok(fs.existsSync(sampleFile));

    // First run - deletes physical files
    const result1 = await cleanupService.cleanSessionWorkspace('test_user_id', sessionId);
    assert.equal(result1, true);
    assert.equal(fs.existsSync(sessionDir), false);

    // Second run - idempotency check (safely does nothing, returns true without throwing)
    const result2 = await cleanupService.cleanSessionWorkspace('test_user_id', sessionId);
    assert.equal(result2, true);
  });

  await t.test('cleanOrphanFiles removes disk folders older than TTL', async () => {
    const orphanSessionId = `orphan_sess_${crypto.randomUUID().slice(0, 8)}`;
    const sessionDir = await temporaryStorageService.ensureSessionDir(orphanSessionId);
    const dummyFile = path.join(sessionDir, 'orphan.png');
    await fs.promises.writeFile(dummyFile, 'Dummy PNG');

    // Run orphan cleanup with 0 minutes TTL (forces immediate cleanup of non-DB session)
    const deletedCount = await cleanupService.cleanOrphanFiles(0);
    assert.ok(deletedCount >= 1);
    assert.equal(fs.existsSync(sessionDir), false);
  });

  await t.test('historyService records and clears session history correctly', async () => {
    const sessionId = `hist_sess_${crypto.randomUUID().slice(0, 8)}`;
    const userId = `user_${crypto.randomUUID().slice(0, 8)}`;

    const recorded = await historyService.recordHistory({
      sessionId,
      userId,
      originalName: 'test-document.pdf',
      extension: 'pdf',
      originalSize: 1048576,
      outputSize: 524288,
      operation: 'PDF Optimization',
      mode: 'smart',
      status: 'completed',
      reductionPercentage: 50,
    });

    assert.equal(recorded.originalName, 'test-document.pdf');
    assert.equal(recorded.reductionPercentage, 50);

    const historyItems = await historyService.getSessionHistory(userId, sessionId);
    assert.equal(historyItems.length, 1);
    assert.equal(historyItems[0].id, recorded.id);

    // Delete single record
    await historyService.deleteHistoryRecord(recorded.id, userId);
    const afterDelete = await historyService.getSessionHistory(userId, sessionId);
    assert.equal(afterDelete.length, 0);
  });

  await cleanupTestDir();
});
