'use client';

import { useState, useEffect, useCallback } from 'react';
import { SessionHistoryItem } from '@optipress/types';
import { useAuth } from '@/auth/hooks/use-auth';
import { historyService } from '../services/history.service';

export function useTemporaryHistory(sessionId?: string) {
  const [history, setHistory] = useState<SessionHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { session, isAuthenticated } = useAuth();

  const fetchHistory = useCallback(async () => {
    if (!session?.accessToken) return;
    setIsLoading(true);
    const data = await historyService.getHistory(session.accessToken, sessionId);
    setHistory(data);
    setIsLoading(false);
  }, [session?.accessToken, sessionId]);

  useEffect(() => {
    if (isAuthenticated && session?.accessToken) {
      fetchHistory();
    }
  }, [isAuthenticated, session?.accessToken, fetchHistory]);

  const removeItem = async (id: string) => {
    if (!session?.accessToken) return false;
    const ok = await historyService.deleteHistoryItem(id, session.accessToken);
    if (ok) {
      setHistory((prev) => prev.filter((item) => item.id !== id));
    }
    return ok;
  };

  const downloadResult = async (item: SessionHistoryItem) => {
    if (!session?.accessToken || !item.fileId) return false;
    const nameParts = item.originalName.split('.');
    const ext = nameParts.pop();
    const defaultName = `${nameParts.join('.')}-optimized.${ext || item.extension}`;
    return await historyService.downloadResultFile(item.fileId, session.accessToken, defaultName);
  };

  const clearLocalHistoryState = () => {
    setHistory([]);
  };

  return {
    history,
    isLoading,
    refetchHistory: fetchHistory,
    removeItem,
    downloadResult,
    clearLocalHistoryState,
  };
}
