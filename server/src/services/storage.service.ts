import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { env } from '../config/env.js';

export class TemporaryStorageService {
  private baseDir: string;

  constructor() {
    this.baseDir = path.resolve(process.cwd(), env.TEMPORARY_STORAGE_PATH || './storage/temporary');
  }

  getBaseDir(): string {
    return this.baseDir;
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
    const sessionDirPath = this.resolveWithinBase(safeSessionId);

    await fs.promises.mkdir(sessionDirPath, { recursive: true, mode: 0o700 });
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
    const storageKey = path.posix.join(safeSessionId, storedName);

    return { fileId, storedName, storageKey };
  }

  private resolveWithinBase(...segments: string[]): string {
    const resolved = path.resolve(this.baseDir, ...segments);
    const relative = path.relative(this.baseDir, resolved);

    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new Error('Resolved temporary storage path escaped storage root.');
    }

    return resolved;
  }

  /**
   * Resolves physical file path safely within the session storage directory.
   */
  getFilePath(sessionId: string, storedName: string): string {
    const safeSessionId = this.sanitizeId(sessionId);
    const safeStoredName = path.basename(storedName);
    return this.resolveWithinBase(safeSessionId, safeStoredName);
  }

  /**
   * Moves a temp upload to its session-isolated destination.
   */
  async saveTemporaryFile(sourcePath: string, sessionId: string, storedName: string): Promise<string> {
    const sessionDir = await this.ensureSessionDir(sessionId);
    const targetPath = this.resolveWithinBase(path.basename(sessionDir), path.basename(storedName));

    await fs.promises.copyFile(sourcePath, targetPath);
    await fs.promises.chmod(targetPath, 0o600).catch(() => {});
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
      const targetPath = this.resolveWithinBase(safeSessionId, safeStoredName);

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
