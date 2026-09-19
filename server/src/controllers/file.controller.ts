import { Response } from 'express';
import fs from 'fs';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { validateFileBytes } from '../utils/file-validation.js';
import { temporaryStorageService } from '../services/storage.service.js';
import { sessionFileRepository } from '../services/file-repository.service.js';
import { env } from '../config/env.js';
import { downloadTypeSchema, isValidSessionId, isValidUuid } from '../utils/request-validation.js';

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
  if (sessionId && !isValidSessionId(sessionId)) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_SESSION_ID', message: 'Invalid session identifier.' },
    });
  }
  if (!sessionId) {
    sessionId = `app_sess_${req.user.id.substring(0, 8)}`;
  }

  // Generate secure storage key and save file
  const { fileId, storedName, storageKey } = temporaryStorageService.generateStorageKey(
    sessionId,
    validation.detectedExtension
  );

  const now = new Date().toISOString();

  await temporaryStorageService.saveTemporaryFile(uploadedFile.path, sessionId, storedName);

  const fileRecord = await sessionFileRepository.saveFileRecord({
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
  });

  return res.status(201).json({
    success: true,
    data: {
      id: fileRecord.id,
      originalName: fileRecord.originalName,
      mimeType: fileRecord.mimeType,
      extension: fileRecord.extension,
      size: fileRecord.fileSize,
      fileSize: fileRecord.fileSize,
      status: fileRecord.status,
      createdAt: fileRecord.createdAt,
    },
  });
};

export const getFiles = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } });
  }

  const files = await sessionFileRepository.getUserFiles(req.user.id);
  return res.status(200).json({
    success: true,
    data: {
      files: files.map((f) => ({
        id: f.id,
        sessionId: f.sessionId,
        userId: f.userId,
        originalName: f.originalName,
        storedName: f.storedName,
        mimeType: f.mimeType,
        extension: f.extension,
        size: f.fileSize,
        fileSize: f.fileSize,
        status: f.status,
        createdAt: f.createdAt,
        updatedAt: f.updatedAt,
      })),
    },
  });
};

export const getFileById = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } });
  }

  const fileId = req.params.id;
  if (!isValidUuid(fileId)) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_FILE_ID', message: 'Invalid file identifier.' },
    });
  }
  const file = await sessionFileRepository.getFileRecord(fileId, req.user.id);

  if (!file) {
    return res.status(404).json({
      success: false,
      error: { code: 'FILE_NOT_FOUND', message: 'Requested file not found or unauthorized.' },
    });
  }

  return res.status(200).json({
    success: true,
    data: {
      file: {
        id: file.id,
        sessionId: file.sessionId,
        userId: file.userId,
        originalName: file.originalName,
        storedName: file.storedName,
        mimeType: file.mimeType,
        extension: file.extension,
        size: file.fileSize,
        fileSize: file.fileSize,
        status: file.status,
        createdAt: file.createdAt,
        updatedAt: file.updatedAt,
      },
    },
  });
};

export const deleteFile = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } });
  }

  const fileId = req.params.id;
  if (!isValidUuid(fileId)) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_FILE_ID', message: 'Invalid file identifier.' },
    });
  }
  const deletedRecord = await sessionFileRepository.deleteFileRecord(fileId, req.user.id);

  if (!deletedRecord) {
    return res.status(404).json({
      success: false,
      error: { code: 'FILE_NOT_FOUND', message: 'Requested file not found or unauthorized.' },
    });
  }

  // Delete physical file from disk
  if (deletedRecord.sessionId && deletedRecord.storedName) {
    await temporaryStorageService.deleteTemporaryFile(deletedRecord.sessionId, deletedRecord.storedName);
  }

  return res.status(200).json({
    success: true,
    message: 'Temporary file deleted successfully.',
  });
};

export const downloadFile = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } });
  }

  const fileId = req.params.id;
  if (!isValidUuid(fileId)) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_FILE_ID', message: 'Invalid file identifier.' },
    });
  }

  const typeParse = downloadTypeSchema.safeParse((req.query.type || 'result').toString());
  if (!typeParse.success) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_DOWNLOAD_TYPE', message: 'Invalid download type.' },
    });
  }

  const type = typeParse.data;

  const fileRecord = await sessionFileRepository.getFileRecord(fileId, req.user.id);
  if (!fileRecord) {
    return res.status(404).json({
      success: false,
      error: { code: 'FILE_NOT_FOUND', message: 'Requested file not found or unauthorized.' },
    });
  }

  const { sessionId, storedName, originalName, extension, mimeType } = fileRecord;

  let downloadFileName = originalName;
  let targetStoredName = storedName;

  if (type === 'result') {
    const candidates = [
      `${fileId}-optimized.${extension.toLowerCase()}`,
      `${fileId}-target.${extension.toLowerCase()}`,
      storedName,
    ];

    for (const candidate of candidates) {
      const p = temporaryStorageService.getFilePath(sessionId, candidate);
      if (fs.existsSync(p)) {
        targetStoredName = candidate;
        if (candidate !== storedName) {
          const nameParts = originalName.split('.');
          const ext = nameParts.pop();
          downloadFileName = `${nameParts.join('.')}-optimized.${ext}`;
        }
        break;
      }
    }
  }

  const physicalPath = temporaryStorageService.getFilePath(sessionId, targetStoredName);
  if (!fs.existsSync(physicalPath)) {
    return res.status(404).json({
      success: false,
      error: { code: 'FILE_NOT_FOUND', message: 'Temporary file missing or expired.' },
    });
  }

  const safeMimeType = mimeType === 'application/pdf' || mimeType.startsWith('image/')
    ? mimeType
    : 'application/octet-stream';

  res.setHeader('Content-Type', safeMimeType);
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  return res.download(physicalPath, downloadFileName);
};
