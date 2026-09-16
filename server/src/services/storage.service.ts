import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { env } from '../config/env.js';

export class TemporaryStorageService {
  private baseDir: string;

  constructor() {
    this.baseDir = path.resolve(process.cwd(), env.TEMPORARY_STORAGE_PATH || './storage/temporary');
  }

  /**
   * Sanitizes identifier to prevent path traversal attacks.
   */
  private sanitizeId(id: string): string {
    return id.replace(/[^a-zA-Z0-9_-]/g, '');
  }

  /**
   * Ensures the storage directory for a specific session exists.
   */
  async ensureSessionDir(sessionId: string): Promise<string> {
    const safeSessionId = this.sanitizeId(sessionId);
    const sessionDirPath = path.join(this.baseDir, safeSessionId);

    await fs.promises.mkdir(sessionDirPath, { recursive: true });
    return sessionDirPath;
  }

  /**
   * Generates a safe storage key and unique filename for a temporary file.
   */
  generateStorageKey(sessionId: string, extension: string): { fileId: string; storedName: string; storageKey: string } {
    const safeSessionId = this.sanitizeId(sessionId);
    const fileId = crypto.randomUUID();
    const safeExt = extension.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const storedName = `${fileId}.${safeExt}`;
    const storageKey = path.join(safeSessionId, storedName);

    return { fileId, storedName, storageKey };
  }

  /**
   * Resolves physical file path safely within the session storage directory.
   */
  getFilePath(sessionId: string, storedName: string): string {
    const safeSessionId = this.sanitizeId(sessionId);
    const safeStoredName = path.basename(storedName);
    return path.join(this.baseDir, safeSessionId, safeStoredName);
  }

  /**
   * Moves a temp upload to its session-isolated destination.
   */
  async saveTemporaryFile(sourcePath: string, sessionId: string, storedName: string): Promise<string> {
    const sessionDir = await this.ensureSessionDir(sessionId);
    const targetPath = path.join(sessionDir, storedName);

    await fs.promises.copyFile(sourcePath, targetPath);
    await fs.promises.unlink(sourcePath).catch(() => {});

    return targetPath;
  }

  /**
   * Deletes a temporary file from disk.
   */
  async deleteTemporaryFile(sessionId: string, storedName: string): Promise<boolean> {
    try {
      const safeSessionId = this.sanitizeId(sessionId);
      const safeStoredName = path.basename(storedName);
      const targetPath = path.join(this.baseDir, safeSessionId, safeStoredName);

      if (fs.existsSync(targetPath)) {
        await fs.promises.unlink(targetPath);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}

export const temporaryStorageService = new TemporaryStorageService();
