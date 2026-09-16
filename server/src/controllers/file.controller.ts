import { Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { validateFileBytes } from '../utils/file-validation.js';
import { temporaryStorageService } from '../services/storage.service.js';
import { env } from '../config/env.js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
const supabase = createClient(supabaseUrl, supabaseKey);

// In-memory fallback file metadata store when DB is unreachable
const memoryFiles = new Map<string, {
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
}>();

export const uploadFile = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } });
  }

  const uploadedFile = req.file;
  if (!uploadedFile) {
    return res.status(400).json({ success: false, error: { code: 'NO_FILE', message: 'No file uploaded.' } });
  }

  // Enforce server-side file size limit
  const maxSizeBytes = (env.MAX_UPLOAD_SIZE_MB || 100) * 1024 * 1024;
  if (uploadedFile.size > maxSizeBytes) {
    return res.status(400).json({
      success: false,
      error: { code: 'FILE_TOO_LARGE', message: `File size exceeds maximum upload limit of ${env.MAX_UPLOAD_SIZE_MB} MB.` },
    });
  }

  // Validate magic bytes & file signature
  const validation = await validateFileBytes(
    uploadedFile.path,
    uploadedFile.originalname,
    uploadedFile.mimetype
  );

  if (!validation.isValid || !validation.detectedExtension || !validation.mimeType) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_FILE_TYPE', message: validation.error || 'Invalid or corrupted file header.' },
    });
  }

  // Determine active session ID
  let sessionId = (req.body.sessionId || req.headers['x-session-id'] || '').toString();
  if (!sessionId) {
    // Generate deterministic session ID based on user ID if none provided
    sessionId = `app_sess_${req.user.id.substring(0, 8)}`;
  }

  // Generate secure storage key and save file
  const { fileId, storedName, storageKey } = temporaryStorageService.generateStorageKey(
    sessionId,
    validation.detectedExtension
  );

  const now = new Date().toISOString();

  try {
    await temporaryStorageService.saveTemporaryFile(uploadedFile.path, sessionId, storedName);

    // Save metadata to Supabase DB `session_files` table
    const { data, error } = await supabase
      .from('session_files')
      .insert({
        id: fileId,
        session_id: sessionId,
        user_id: req.user.id,
        original_name: uploadedFile.originalname,
        stored_name: storedName,
        mime_type: validation.mimeType,
        extension: validation.detectedExtension,
        file_size: uploadedFile.size,
        storage_key: storageKey,
        status: 'uploaded',
        created_at: now,
        updated_at: now,
      })
      .select('id, session_id, user_id, original_name, stored_name, mime_type, extension, file_size, status, created_at, updated_at')
      .single();

    if (!error && data) {
      const fileRecord = {
        id: data.id,
        sessionId: data.session_id,
        userId: data.user_id,
        originalName: data.original_name,
        storedName: data.stored_name,
        mimeType: data.mime_type,
        extension: data.extension,
        fileSize: Number(data.file_size),
        storageKey,
        status: data.status,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      memoryFiles.set(fileId, fileRecord);

      return res.status(201).json({
        success: true,
        data: {
          id: fileRecord.id,
          originalName: fileRecord.originalName,
          mimeType: fileRecord.mimeType,
          extension: fileRecord.extension,
          size: fileRecord.fileSize,
          status: fileRecord.status,
          createdAt: fileRecord.createdAt,
        },
      });
    }
  } catch {
    // Proceed to fallback memory store
  }

  // Memory fallback insertion
  const memoryRecord = {
    id: fileId,
    sessionId,
    userId: req.user.id,
    originalName: uploadedFile.originalname,
    storedName,
    mimeType: validation.mimeType,
    extension: validation.detectedExtension,
    fileSize: uploadedFile.size,
    storageKey,
    status: 'uploaded',
    createdAt: now,
    updatedAt: now,
  };

  memoryFiles.set(fileId, memoryRecord);

  return res.status(201).json({
    success: true,
    data: {
      id: memoryRecord.id,
      originalName: memoryRecord.originalName,
      mimeType: memoryRecord.mimeType,
      extension: memoryRecord.extension,
      size: memoryRecord.fileSize,
      status: memoryRecord.status,
      createdAt: memoryRecord.createdAt,
    },
  });
};

export const getFiles = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } });
  }

  try {
    const { data, error } = await supabase
      .from('session_files')
      .select('id, session_id, user_id, original_name, stored_name, mime_type, extension, file_size, status, created_at, updated_at')
      .eq('user_id', req.user.id)
      .neq('status', 'deleted')
      .order('created_at', { ascending: false });

    if (!error && data) {
      const files = data.map((f) => ({
        id: f.id,
        sessionId: f.session_id,
        userId: f.user_id,
        originalName: f.original_name,
        storedName: f.stored_name,
        mimeType: f.mime_type,
        extension: f.extension,
        size: Number(f.file_size),
        status: f.status,
        createdAt: f.created_at,
        updatedAt: f.updated_at,
      }));

      return res.status(200).json({
        success: true,
        data: { files },
      });
    }
  } catch {
    // Memory fallback
  }

  const userMemoryFiles = Array.from(memoryFiles.values())
    .filter((f) => f.userId === req.user?.id && f.status !== 'deleted')
    .map((f) => ({
      id: f.id,
      sessionId: f.sessionId,
      userId: f.userId,
      originalName: f.originalName,
      storedName: f.storedName,
      mimeType: f.mimeType,
      extension: f.extension,
      size: f.fileSize,
      status: f.status,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
    }));

  return res.status(200).json({
    success: true,
    data: { files: userMemoryFiles },
  });
};

export const getFileById = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } });
  }

  const fileId = req.params.id;

  try {
    const { data, error } = await supabase
      .from('session_files')
      .select('id, session_id, user_id, original_name, stored_name, mime_type, extension, file_size, status, created_at, updated_at')
      .eq('id', fileId)
      .eq('user_id', req.user.id)
      .single();

    if (!error && data) {
      return res.status(200).json({
        success: true,
        data: {
          file: {
            id: data.id,
            sessionId: data.session_id,
            userId: data.user_id,
            originalName: data.original_name,
            storedName: data.stored_name,
            mimeType: data.mime_type,
            extension: data.extension,
            size: Number(data.file_size),
            status: data.status,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          },
        },
      });
    }
  } catch {
    // Memory fallback
  }

  const memoryFile = memoryFiles.get(fileId);
  if (memoryFile && memoryFile.userId === req.user.id && memoryFile.status !== 'deleted') {
    return res.status(200).json({
      success: true,
      data: {
        file: {
          id: memoryFile.id,
          sessionId: memoryFile.sessionId,
          userId: memoryFile.userId,
          originalName: memoryFile.originalName,
          storedName: memoryFile.storedName,
          mimeType: memoryFile.mimeType,
          extension: memoryFile.extension,
          size: memoryFile.fileSize,
          status: memoryFile.status,
          createdAt: memoryFile.createdAt,
          updatedAt: memoryFile.updatedAt,
        },
      },
    });
  }

  return res.status(404).json({
    success: false,
    error: { code: 'FILE_NOT_FOUND', message: 'Requested file not found or unauthorized.' },
  });
};

export const deleteFile = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } });
  }

  const fileId = req.params.id;
  let targetSessionId = '';
  let targetStoredName = '';
  let isAuthorized = false;

  try {
    const { data } = await supabase
      .from('session_files')
      .select('session_id, user_id, stored_name')
      .eq('id', fileId)
      .single();

    if (data && data.user_id === req.user.id) {
      targetSessionId = data.session_id;
      targetStoredName = data.stored_name;
      isAuthorized = true;
    }
  } catch {
    // Check memory fallback
  }

  if (!isAuthorized) {
    const memoryRecord = memoryFiles.get(fileId);
    if (memoryRecord && memoryRecord.userId === req.user.id) {
      targetSessionId = memoryRecord.sessionId;
      targetStoredName = memoryRecord.storedName;
      isAuthorized = true;
    }
  }

  if (!isAuthorized) {
    return res.status(404).json({
      success: false,
      error: { code: 'FILE_NOT_FOUND', message: 'Requested file not found or unauthorized.' },
    });
  }

  // Delete physical file from disk
  if (targetSessionId && targetStoredName) {
    await temporaryStorageService.deleteTemporaryFile(targetSessionId, targetStoredName);
  }

  // Delete/update database metadata record
  try {
    await supabase.from('session_files').delete().eq('id', fileId).eq('user_id', req.user.id);
  } catch {
    // Ignore DB errors
  }

  memoryFiles.delete(fileId);

  return res.status(200).json({
    success: true,
    message: 'Temporary file deleted successfully.',
  });
};
