import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { env } from '../../config/env.js';
import { temporaryStorageService } from '../../services/storage.service.js';
import { CleanupOptions, CleanupResultStats } from './cleanup.types.js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
const supabase = createClient(supabaseUrl, supabaseKey);

export class CleanupService {
  private baseStorageDir: string;

  constructor() {
    this.baseStorageDir = path.resolve(process.cwd(), env.TEMPORARY_STORAGE_PATH || './storage/temporary');
  }

  /**
   * Safely deletes a directory and all its contents idempotently.
   */
  async deleteDirectorySafely(dirPath: string): Promise<boolean> {
    try {
      const resolvedPath = path.resolve(dirPath);
      const relative = path.relative(this.baseStorageDir, resolvedPath);
      if (relative.startsWith('..') || path.isAbsolute(relative) || resolvedPath === this.baseStorageDir) {
        console.error('Cleanup refused to delete path outside temporary storage root.');
        return false;
      }

      if (fs.existsSync(resolvedPath)) {
        await fs.promises.rm(resolvedPath, { recursive: true, force: true });
        return true;
      }
      return false;
    } catch (err) {
      console.error('Directory deletion warning:', err instanceof Error ? err.message : err);
      return false;
    }
  }

  /**
   * Cleans up all temporary files, metadata, and history for a specific application session.
   * If createNewSession is true, creates a fresh session for the user so they remain active.
   */
  async cleanSessionWorkspace(userId: string, sessionId: string): Promise<boolean> {
    try {
      // 1. Delete physical storage folder for session
      const safeSessionDir = temporaryStorageService.getFilePath(sessionId, '');
      await this.deleteDirectorySafely(safeSessionDir);

      // 2. Delete database records (session_files, session_history, app_sessions)
      try {
        await supabase.from('session_files').delete().eq('session_id', sessionId).eq('user_id', userId);
        await supabase.from('session_history').delete().eq('session_id', sessionId).eq('user_id', userId);
        await supabase.from('app_sessions').delete().eq('id', sessionId).eq('user_id', userId);
      } catch {
        // Ignore DB error if fallback memory store is active
      }

      return true;
    } catch (err) {
      console.error('Failed to clean session workspace:', {
        userId,
        sessionId,
        message: err instanceof Error ? err.message : 'Unknown cleanup error',
      });
      return false;
    }
  }

  /**
   * Runs expired sessions cleanup based on TTL rules.
   */
  async cleanExpiredSessions(options: CleanupOptions = {}): Promise<CleanupResultStats> {
    const startTime = Date.now();
    const stats: CleanupResultStats = {
      sessionsCleaned: 0,
      filesDeleted: 0,
      historyRecordsDeleted: 0,
      orphanDirsDeleted: 0,
      durationMs: 0,
      errorsCount: 0,
    };

    const sessionTtlMinutes = options.sessionTtlMinutes || env.SESSION_TTL_MINUTES || 1440;
    const batchSize = options.batchSize || env.CLEANUP_BATCH_SIZE || 100;
    const expirationCutoff = new Date(Date.now() - sessionTtlMinutes * 60 * 1000).toISOString();

    try {
      // Find expired app_sessions by expires_at OR last_activity_at older than TTL
      const { data: expiredSessions, error } = await supabase
        .from('app_sessions')
        .select('id, user_id')
        .or(`expires_at.lt.${new Date().toISOString()},last_activity_at.lt.${expirationCutoff}`)
        .limit(batchSize);

      if (!error && expiredSessions && expiredSessions.length > 0) {
        for (const session of expiredSessions) {
          try {
            // Count files & history before deletion
            const { data: files } = await supabase
              .from('session_files')
              .select('id')
              .eq('session_id', session.id);

            const { data: history } = await supabase
              .from('session_history')
              .select('id')
              .eq('session_id', session.id);

            if (files) stats.filesDeleted += files.length;
            if (history) stats.historyRecordsDeleted += history.length;

            await this.cleanSessionWorkspace(session.user_id, session.id);
            stats.sessionsCleaned++;
          } catch {
            stats.errorsCount++;
          }
        }
      }
    } catch {
      // Ignore DB query errors
    }

    // Run orphan physical file cleanup
    try {
      const orphanCount = await this.cleanOrphanFiles(options.tempFileTtlMinutes || env.TEMP_FILE_TTL_MINUTES || 60);
      stats.orphanDirsDeleted = orphanCount;
    } catch {
      stats.errorsCount++;
    }

    stats.durationMs = Date.now() - startTime;
    return stats;
  }

  /**
   * Scans disk storage under TEMPORARY_STORAGE_PATH and removes directories/files
   * that do not belong to active sessions or exceed TTL.
   */
  async cleanOrphanFiles(tempFileTtlMinutes: number = 60): Promise<number> {
    let orphanCount = 0;
    try {
      if (!fs.existsSync(this.baseStorageDir)) {
        return 0;
      }

      const entries = await fs.promises.readdir(this.baseStorageDir, { withFileTypes: true });
      const now = Date.now();
      const ttlMs = tempFileTtlMinutes * 60 * 1000;

      for (const entry of entries) {
        if (!entry.isDirectory()) continue;

        const sessionDirName = entry.name;
        const dirPath = path.resolve(this.baseStorageDir, sessionDirName);
        const relative = path.relative(this.baseStorageDir, dirPath);
        if (relative.startsWith('..') || path.isAbsolute(relative)) continue;

        try {
          const stat = await fs.promises.stat(dirPath);
          const dirAgeMs = now - stat.mtimeMs;

          // Check if directory age exceeds temp file TTL
          let isOrphan = dirAgeMs > ttlMs;

          if (!isOrphan) {
            // Verify if session exists in DB
            try {
              const { data } = await supabase
                .from('app_sessions')
                .select('id')
                .eq('id', sessionDirName)
                .maybeSingle();

              if (!data) {
                isOrphan = true;
              }
            } catch {
              // If DB lookup fails, keep directory if within age threshold
            }
          }

          if (isOrphan) {
            const deleted = await this.deleteDirectorySafely(dirPath);
            if (deleted) orphanCount++;
          }
        } catch {
          // Ignore individual file stat error
        }
      }
    } catch (err) {
      console.error('⚠️ Error during orphan files cleanup scan:', err);
    }

    return orphanCount;
  }
}

export const cleanupService = new CleanupService();
