import { createClient } from '@supabase/supabase-js';

export interface SessionFileRecord {
  id: string;
  sessionId: string;
  userId: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  extension: string;
  fileSize: number;
  storageKey: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
const supabase = createClient(supabaseUrl, supabaseKey);

export class SessionFileRepository {
  // Shared in-memory fallback store for session file metadata when DB is unreachable
  private memoryFiles = new Map<string, SessionFileRecord>();

  async saveFileRecord(record: SessionFileRecord): Promise<SessionFileRecord> {
    try {
      const { data, error } = await supabase
        .from('session_files')
        .insert({
          id: record.id,
          session_id: record.sessionId,
          user_id: record.userId,
          original_name: record.originalName,
          stored_name: record.storedName,
          mime_type: record.mimeType,
          extension: record.extension,
          file_size: record.fileSize,
          storage_key: record.storageKey,
          status: record.status,
          created_at: record.createdAt,
          updated_at: record.updatedAt,
        })
        .select('id, session_id, user_id, original_name, stored_name, mime_type, extension, file_size, storage_key, status, created_at, updated_at')
        .single();

      if (!error && data) {
        const dbRecord: SessionFileRecord = {
          id: data.id,
          sessionId: data.session_id,
          userId: data.user_id,
          originalName: data.original_name,
          storedName: data.stored_name,
          mimeType: data.mime_type,
          extension: data.extension,
          fileSize: Number(data.file_size),
          storageKey: data.storage_key || record.storageKey,
          status: data.status,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
        this.memoryFiles.set(dbRecord.id, dbRecord);
        return dbRecord;
      }
    } catch {
      // Proceed to memory fallback
    }

    this.memoryFiles.set(record.id, record);
    return record;
  }

  async getFileRecord(fileId: string, userId: string): Promise<SessionFileRecord | null> {
    try {
      const { data, error } = await supabase
        .from('session_files')
        .select('id, session_id, user_id, original_name, stored_name, mime_type, extension, file_size, storage_key, status, created_at, updated_at')
        .eq('id', fileId)
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data) {
        const dbRecord: SessionFileRecord = {
          id: data.id,
          sessionId: data.session_id,
          userId: data.user_id,
          originalName: data.original_name,
          storedName: data.stored_name,
          mimeType: data.mime_type,
          extension: data.extension,
          fileSize: Number(data.file_size),
          storageKey: data.storage_key,
          status: data.status,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
        this.memoryFiles.set(dbRecord.id, dbRecord);
        return dbRecord;
      }
    } catch {
      // Memory fallback
    }

    const memRecord = this.memoryFiles.get(fileId);
    if (memRecord && memRecord.userId === userId && memRecord.status !== 'deleted') {
      return memRecord;
    }

    return null;
  }

  async getUserFiles(userId: string): Promise<SessionFileRecord[]> {
    try {
      const { data, error } = await supabase
        .from('session_files')
        .select('id, session_id, user_id, original_name, stored_name, mime_type, extension, file_size, storage_key, status, created_at, updated_at')
        .eq('user_id', userId)
        .neq('status', 'deleted')
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data.map((f) => ({
          id: f.id,
          sessionId: f.session_id,
          userId: f.user_id,
          originalName: f.original_name,
          storedName: f.stored_name,
          mimeType: f.mime_type,
          extension: f.extension,
          fileSize: Number(f.file_size),
          storageKey: f.storage_key,
          status: f.status,
          createdAt: f.created_at,
          updatedAt: f.updated_at,
        }));
      }
    } catch {
      // Memory fallback
    }

    return Array.from(this.memoryFiles.values()).filter(
      (f) => f.userId === userId && f.status !== 'deleted'
    );
  }

  async updateFileStatus(fileId: string, status: string, fileSize?: number): Promise<void> {
    const now = new Date().toISOString();
    try {
      const updates: Record<string, unknown> = { status, updated_at: now };
      if (fileSize !== undefined) {
        updates.file_size = fileSize;
      }
      await supabase.from('session_files').update(updates).eq('id', fileId);
    } catch {
      // Ignore DB error
    }

    const memRecord = this.memoryFiles.get(fileId);
    if (memRecord) {
      memRecord.status = status;
      memRecord.updatedAt = now;
      if (fileSize !== undefined) {
        memRecord.fileSize = fileSize;
      }
    }
  }

  async deleteFileRecord(fileId: string, userId: string): Promise<SessionFileRecord | null> {
    const record = await this.getFileRecord(fileId, userId);
    if (!record) return null;

    try {
      await supabase.from('session_files').delete().eq('id', fileId).eq('user_id', userId);
    } catch {
      // Ignore DB error
    }

    this.memoryFiles.delete(fileId);
    return record;
  }
}

export const sessionFileRepository = new SessionFileRepository();
