import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import os from 'os';
import { authMiddleware } from '../middleware/auth.js';
import { uploadFile, getFiles, getFileById, deleteFile, downloadFile } from '../controllers/file.controller.js';
import { env } from '../config/env.js';

// Configure temporary multer storage in OS temp directory before validation & session isolation
const maxSizeBytes = (env.MAX_UPLOAD_SIZE_MB || 100) * 1024 * 1024;
const upload = multer({
  dest: path.join(os.tmpdir(), 'optipress-uploads'),
  limits: {
    fileSize: maxSizeBytes,
  },
});

export const fileRouter = Router();

// Protect all file routes with authMiddleware
fileRouter.use(authMiddleware as any);

fileRouter.post('/upload', upload.single('file') as any, uploadFile as any);
fileRouter.get('/', getFiles as any);
fileRouter.get('/:id/download', downloadFile as any);
fileRouter.get('/:id', getFileById as any);
fileRouter.delete('/:id', deleteFile as any);

