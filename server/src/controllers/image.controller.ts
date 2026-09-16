import { Response } from 'express';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { temporaryStorageService } from '../services/storage.service.js';
import { imageOptimizationService } from '../services/image.service.js';
import { ImageOptimizationMode } from '@optipress/types';

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
  const parseResult = optimizeSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_MODE', message: 'Invalid optimization mode. Allowed: smart, quality, maximum.' },
    });
  }

  const mode = parseResult.data.mode as ImageOptimizationMode;

  let sessionId = '';
  let storedName = '';
  let extension = '';
  let isAuthorized = false;

  // Attempt retrieving metadata from Supabase DB `session_files`
  try {
    const { data } = await supabase
      .from('session_files')
      .select('id, session_id, user_id, stored_name, extension, status')
      .eq('id', fileId)
      .eq('user_id', req.user.id)
      .single();

    if (data && data.user_id === req.user.id) {
      sessionId = data.session_id;
      storedName = data.stored_name;
      extension = data.extension.toLowerCase();
      isAuthorized = true;
    }
  } catch {
    // Fallback to memory
  }

  if (!isAuthorized) {
    return res.status(404).json({
      success: false,
      error: { code: 'FILE_NOT_FOUND', message: 'Requested image file not found or unauthorized.' },
    });
  }

  if (!IMAGE_EXTENSIONS.has(extension)) {
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
      extension,
      mode,
    });

    // Optionally update status in database
    try {
      await supabase
        .from('session_files')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('id', fileId);
    } catch {
      // Ignore DB status update errors
    }

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

  let sessionId = '';
  let storedName = '';
  let extension = '';
  let isAuthorized = false;

  try {
    const { data } = await supabase
      .from('session_files')
      .select('id, session_id, user_id, stored_name, extension, status')
      .eq('id', fileId)
      .eq('user_id', req.user.id)
      .single();

    if (data && data.user_id === req.user.id) {
      sessionId = data.session_id;
      storedName = data.stored_name;
      extension = data.extension.toLowerCase();
      isAuthorized = true;
    }
  } catch {
    // Fallback to memory
  }

  if (!isAuthorized) {
    return res.status(404).json({
      success: false,
      error: { code: 'FILE_NOT_FOUND', message: 'Requested image file not found or unauthorized.' },
    });
  }

  if (!IMAGE_EXTENSIONS.has(extension)) {
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
      extension,
      request: { targetSize, unit, forceTarget },
    });

    try {
      await supabase
        .from('session_files')
        .update({
          file_size: result.outputSize,
          status: result.status === 'failed' ? 'failed' : 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', fileId);
    } catch {
      // Ignore DB status update errors
    }

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

