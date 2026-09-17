import { createClient } from '@supabase/supabase-js';
import { SessionHistoryItem } from '@optipress/types';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
const supabase = createClient(supabaseUrl, supabaseKey);

// In-memory fallback history store when DB is unreachable
const memoryHistory = new Map<string, SessionHistoryItem>();

export class HistoryService {
  /**
   * Records a temporary history item for an active workspace session.
   */
  async recordHistory(item: Omit<SessionHistoryItem, 'id' | 'createdAt'>): Promise<SessionHistoryItem> {
    const id = `hist_${Math.random().toString(36).substring(2, 11)}`;
    const createdAt = new Date().toISOString();

    const newRecord: SessionHistoryItem = {
      id,
      ...item,
      createdAt,
    };

    try {
      const { data, error } = await supabase
        .from('session_history')
        .insert({
          session_id: item.sessionId,
          user_id: item.userId,
          file_id: item.fileId || null,
          original_name: item.originalName,
          extension: item.extension,
          original_size: item.originalSize,
          output_size: item.outputSize,
          operation: item.operation,
          mode: item.mode,
          status: item.status,
          reduction_percentage: item.reductionPercentage,
          result_storage_key: item.resultStorageKey || null,
          created_at: createdAt,
        })
        .select('id, session_id, user_id, file_id, original_name, extension, original_size, output_size, operation, mode, status, reduction_percentage, result_storage_key, created_at')
        .single();

      if (!error && data) {
        const dbItem: SessionHistoryItem = {
          id: data.id,
          sessionId: data.session_id,
          userId: data.user_id,
          fileId: data.file_id || undefined,
          originalName: data.original_name,
          extension: data.extension,
          originalSize: Number(data.original_size),
          outputSize: Number(data.output_size),
          operation: data.operation,
          mode: data.mode,
          status: data.status as 'completed' | 'failed',
          reductionPercentage: Number(data.reduction_percentage),
          resultStorageKey: data.result_storage_key || undefined,
          createdAt: data.created_at,
        };
        memoryHistory.set(dbItem.id, dbItem);
        return dbItem;
      }
    } catch {
      // Memory fallback
    }

    memoryHistory.set(id, newRecord);
    return newRecord;
  }

  /**
   * Retrieves temporary history items for a user's active session.
   */
  async getSessionHistory(userId: string, sessionId?: string): Promise<SessionHistoryItem[]> {
    try {
      let query = supabase
        .from('session_history')
        .select('id, session_id, user_id, file_id, original_name, extension, original_size, output_size, operation, mode, status, reduction_percentage, result_storage_key, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (sessionId) {
        query = query.eq('session_id', sessionId);
      }

      const { data, error } = await query;

      if (!error && data) {
        return data.map((d) => ({
          id: d.id,
          sessionId: d.session_id,
          userId: d.user_id,
          fileId: d.file_id || undefined,
          originalName: d.original_name,
          extension: d.extension,
          originalSize: Number(d.original_size),
          outputSize: Number(d.output_size),
          operation: d.operation,
          mode: d.mode,
          status: d.status as 'completed' | 'failed',
          reductionPercentage: Number(d.reduction_percentage),
          resultStorageKey: d.result_storage_key || undefined,
          createdAt: d.created_at,
        }));
      }
    } catch {
      // Memory fallback
    }

    return Array.from(memoryHistory.values())
      .filter((h) => h.userId === userId && (!sessionId || h.sessionId === sessionId))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Deletes a single history record.
   */
  async deleteHistoryRecord(id: string, userId: string): Promise<boolean> {
    try {
      await supabase.from('session_history').delete().eq('id', id).eq('user_id', userId);
    } catch {
      // Ignore DB error
    }

    const item = memoryHistory.get(id);
    if (item && item.userId === userId) {
      memoryHistory.delete(id);
    }

    return true;
  }

  /**
   * Clears all history records for a session.
   */
  async clearSessionHistory(sessionId: string, userId: string): Promise<boolean> {
    try {
      await supabase.from('session_history').delete().eq('session_id', sessionId).eq('user_id', userId);
    } catch {
      // Ignore DB error
    }

    for (const [id, item] of memoryHistory.entries()) {
      if (item.sessionId === sessionId && item.userId === userId) {
        memoryHistory.delete(id);
      }
    }

    return true;
  }
}

export const historyService = new HistoryService();
