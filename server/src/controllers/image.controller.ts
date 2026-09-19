import { Response } from 'express';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { temporaryStorageService } from '../services/storage.service.js';
import { imageOptimizationService } from '../services/image.service.js';
import { historyService } from '../services/history.service.js';
import { sessionFileRepository } from '../services/file-repository.service.js';
import { ImageOptimizationMode } from '@optipress/types';
import { isValidUuid } from '../utils/request-validation.js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
const supabase = createClient(supabaseUrl, supabaseKey);

const optimizeSchema = z.object({
  mode: z.enum(['smart', 'quality', 'maximum']).default('smart'),
});

const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp']);

export const optimizeImage = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } });
  }

  const fileId = req.params.fileId;
  if (!isValidUuid(fileId)) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_FILE_ID', message: 'Invalid file identifier.' },
    });
  }

  const parseResult = optimizeSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_MODE', message: 'Invalid optimization mode. Allowed: smart, quality, maximum.' },
    });
  }

  const mode = parseResult.data.mode as ImageOptimizationMode;

  const fileRecord = await sessionFileRepository.getFileRecord(fileId, req.user.id);
  if (!fileRecord) {
    return res.status(404).json({
      success: false,
      error: { code: 'FILE_NOT_FOUND', message: 'Requested image file not found or unauthorized.' },
    });
  }

  const { sessionId, storedName, originalName, extension } = fileRecord;

  if (!IMAGE_EXTENSIONS.has(extension.toLowerCase())) {
    return res.status(400).json({
      success: false,
      error: { code: 'NOT_AN_IMAGE', message: `File format .${extension} cannot be processed by the image optimization engine.` },
    });
  }

  const inputPath = temporaryStorageService.getFilePath(sessionId, storedName);
  const outputPath = temporaryStorageService.getFilePath(sessionId, `${fileId}-optimized.${extension}`);

  try {
    const result = await imageOptimizationService.optimizeImage({
      fileId,
      inputPath,
      outputPath,
      extension: extension.toLowerCase(),
      mode,
    });

    try {
      await sessionFileRepository.updateFileStatus(fileId, 'completed', result.optimizedSize);

      await supabase
        .from('app_sessions')
        .update({ last_activity_at: new Date().toISOString() })
        .eq('id', sessionId);
    } catch {
      // Ignore DB status update errors
    }

    // Record temporary workspace history
    await historyService.recordHistory({
      sessionId,
      userId: req.user.id,
      fileId,
      originalName: originalName || storedName,
      extension: extension.toLowerCase(),
      originalSize: result.originalSize,
      outputSize: result.optimizedSize,
      operation: 'Image Optimization',
      mode,
      status: 'completed',
      reductionPercentage: result.reductionPercentage,
      resultStorageKey: `${fileId}-optimized.${extension}`,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'OPTIMIZATION_FAILED',
        message: err instanceof Error ? err.message : 'Image optimization processing failed.',
      },
    });
  }
};

const targetSizeSchema = z.object({
  targetSize: z.number().positive('targetSize must be greater than zero'),
  unit: z.enum(['KB', 'MB']),
  forceTarget: z.boolean().optional().default(false),
});

export const optimizeTargetSize = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } });
  }

  const fileId = req.params.fileId;
  if (!isValidUuid(fileId)) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_FILE_ID', message: 'Invalid file identifier.' },
    });
  }

  const parseResult = targetSizeSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_TARGET_SIZE',
        message: 'Invalid target size request.',
        details: parseResult.error.flatten(),
      },
    });
  }

  const { targetSize, unit, forceTarget } = parseResult.data;

  const fileRecord = await sessionFileRepository.getFileRecord(fileId, req.user.id);
  if (!fileRecord) {
    return res.status(404).json({
      success: false,
      error: { code: 'FILE_NOT_FOUND', message: 'Requested image file not found or unauthorized.' },
    });
  }

  const { sessionId, storedName, originalName, extension } = fileRecord;

  if (!IMAGE_EXTENSIONS.has(extension.toLowerCase())) {
    return res.status(400).json({
      success: false,
      error: { code: 'NOT_AN_IMAGE', message: `File format .${extension} cannot be processed by the target size optimization engine.` },
    });
  }

  const originalPath = temporaryStorageService.getFilePath(sessionId, storedName);
  const outputPath = temporaryStorageService.getFilePath(sessionId, `${fileId}-target.${extension}`);

  try {
    const { targetSizeService } = await import('../services/target-size.service.js');
    const result = await targetSizeService.optimizeTargetSize({
      fileId,
      originalPath,
      outputPath,
      extension: extension.toLowerCase(),
      request: { targetSize, unit, forceTarget },
    });

    try {
      await sessionFileRepository.updateFileStatus(
        fileId,
        result.status === 'failed' ? 'failed' : 'completed',
        result.outputSize
      );

      await supabase
        .from('app_sessions')
        .update({ last_activity_at: new Date().toISOString() })
        .eq('id', sessionId);
    } catch {
      // Ignore DB status update errors
    }

    // Record temporary workspace history
    await historyService.recordHistory({
      sessionId,
      userId: req.user.id,
      fileId,
      originalName: originalName || storedName,
      extension: extension.toLowerCase(),
      originalSize: result.originalSize,
      outputSize: result.outputSize,
      operation: 'Target Size Compression',
      mode: `${targetSize}${unit}`,
      status: result.status === 'failed' ? 'failed' : 'completed',
      reductionPercentage: result.reductionPercentage,
      resultStorageKey: `${fileId}-target.${extension}`,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'TARGET_OPTIMIZATION_FAILED',
        message: err instanceof Error ? err.message : 'Target size optimization failed.',
      },
    });
  }
};
