import { env } from '../../config/env.js';
import { cleanupService } from './cleanup.service.js';

let cleanupTimer: NodeJS.Timeout | null = null;
let isCleaningUp = false;

/**
 * Executes a full cleanup pass (expired sessions, orphan disk folders).
 * Uses an in-memory lock (isCleaningUp) to prevent overlapping execution.
 */
export async function runScheduledCleanup(): Promise<void> {
  if (isCleaningUp) {
    console.log('ℹ️ Scheduled cleanup skipped: previous run is still in progress.');
    return;
  }

  isCleaningUp = true;
  const startTime = Date.now();
  console.log('🧹 Starting scheduled OptiPress temporary workspace cleanup...');

  try {
    const stats = await cleanupService.cleanExpiredSessions();
    console.log(
      `✅ Cleanup completed in ${stats.durationMs}ms: ` +
        `${stats.sessionsCleaned} sessions cleaned, ` +
        `${stats.filesDeleted} files deleted, ` +
        `${stats.historyRecordsDeleted} history records removed, ` +
        `${stats.orphanDirsDeleted} orphan dirs removed.`
    );
  } catch (err) {
    console.error('❌ Scheduled cleanup encountered an error:', err instanceof Error ? err.message : err);
  } finally {
    isCleaningUp = false;
  }
}

/**
 * Initializes the background cleanup scheduler.
 */
export function startCleanupScheduler(): void {
  if (cleanupTimer) {
    console.log('ℹ️ Cleanup scheduler already active.');
    return;
  }

  const intervalMinutes = env.CLEANUP_INTERVAL_MINUTES || 15;
  const intervalMs = intervalMinutes * 60 * 1000;

  console.log(`⏰ Initializing OptiPress Cleanup Scheduler (Interval: every ${intervalMinutes} minutes).`);

  // Run an initial lightweight cleanup pass on startup
  runScheduledCleanup().catch(() => {});

  // Schedule recurring interval
  cleanupTimer = setInterval(() => {
    runScheduledCleanup().catch(() => {});
  }, intervalMs);
}

/**
 * Gracefully stops the background cleanup scheduler.
 */
export function stopCleanupScheduler(): void {
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
    console.log('🛑 OptiPress Cleanup Scheduler stopped.');
  }
}
