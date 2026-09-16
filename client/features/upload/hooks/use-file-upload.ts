'use client';

import { useState, useEffect, useCallback } from 'react';
import { SessionFileMetadata } from '@optipress/types';
import { useAuth } from '@/auth/hooks/use-auth';
import { fileService } from '../services/file.service';
import { siteConfig } from '@/config/site';

export function useFileUpload(sessionId?: string) {
  const [files, setFiles] = useState<SessionFileMetadata[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { session, isAuthenticated } = useAuth();

  const fetchSessionFiles = useCallback(async () => {
    if (!session?.accessToken) return;
    const sessionFiles = await fileService.getFiles(session.accessToken);
    setFiles(sessionFiles);
  }, [session?.accessToken]);

  useEffect(() => {
    if (isAuthenticated && session?.accessToken) {
      fetchSessionFiles();
    }
  }, [isAuthenticated, session?.accessToken, fetchSessionFiles]);

  const uploadLocalFile = async (file: File) => {
    setError(null);

    // Client-side size pre-check
    if (file.size > siteConfig.maxFileSizeBytes) {
      const err = `File size exceeds the 100 MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`;
      setError(err);
      return { success: false, error: err };
    }

    // Client-side extension pre-check
    const allowedExts = ['pdf', 'jpg', 'jpeg', 'png', 'webp'];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!allowedExts.includes(ext)) {
      const err = `Unsupported format (.${ext || 'unknown'}). Allowed: PDF, JPG, JPEG, PNG, WEBP.`;
      setError(err);
      return { success: false, error: err };
    }

    if (!session?.accessToken) {
      const err = 'Authentication session required for file upload.';
      setError(err);
      return { success: false, error: err };
    }

    setIsUploading(true);
    try {
      const result = await fileService.uploadFile(file, session.accessToken, sessionId);
      if (result.success && result.data) {
        setFiles((prev) => [result.data!, ...prev.filter((f) => f.id !== result.data!.id)]);
        setIsUploading(false);
        return { success: true, data: result.data };
      } else {
        const err = result.error || 'Upload failed.';
        setError(err);
        setIsUploading(false);
        return { success: false, error: err };
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unexpected upload error.';
      setError(msg);
      setIsUploading(false);
      return { success: false, error: msg };
    }
  };

  const removeFile = async (fileId: string) => {
    if (!session?.accessToken) return false;
    const ok = await fileService.deleteFile(fileId, session.accessToken);
    if (ok) {
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
    }
    return ok;
  };

  return {
    files,
    isUploading,
    error,
    clearError: () => setError(null),
    uploadLocalFile,
    removeFile,
    refetchFiles: fetchSessionFiles,
  };
}
