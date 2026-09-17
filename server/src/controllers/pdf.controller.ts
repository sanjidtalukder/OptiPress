import { Response } from 'express';
import path from 'path';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { temporaryStorageService } from '../services/storage.service.js';
import { pdfOptimizer } from '../services/pdf-optimizer.service.js';
import { pdfValidator } from '../services/pdf-validator.service.js';
import { validateFileBytes } from '../utils/file-validation.js';
import { historyService } from '../services/history.service.js';
import { sessionFileRepository } from '../services/file-repository.service.js';
import { PdfOptimizationMode } from '@optipress/types';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
const supabase = createClient(supabaseUrl, supabaseKey);

const pdfOptimizeSchema = z.object({
  mode: z.enum(['smart', 'quality', 'maximum']).default('smart'),
});

export const optimizePdf = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } });
  }

  const fileId = req.params.fileId;
  const parseResult = pdfOptimizeSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_MODE', message: 'Invalid PDF optimization mode. Allowed: smart, quality, maximum.' },
    });
  }

  const mode = parseResult.data.mode as PdfOptimizationMode;

  const fileRecord = await sessionFileRepository.getFileRecord(fileId, req.user.id);
  if (!fileRecord) {
    return res.status(404).json({
      success: false,
      error: { code: 'FILE_NOT_FOUND', message: 'Requested PDF file not found or unauthorized.' },
    });
  }

  const { sessionId, storedName, originalName, extension } = fileRecord;

  if (extension.toLowerCase() !== 'pdf') {
    return res.status(400).json({
      success: false,
      error: { code: 'NOT_A_PDF', message: `File format .${extension} cannot be processed by the PDF optimization engine.` },
    });
  }

  const inputPath = temporaryStorageService.getFilePath(sessionId, storedName);
  const outputFile = temporaryStorageService.generateStorageKey(sessionId, 'pdf');
  const outputPath = temporaryStorageService.getFilePath(sessionId, outputFile.storedName);
  const parsedName = path.parse(originalName || storedName);
  const outputFileName = `${parsedName.name || fileId}-optimized.pdf`;

  // Magic-byte check
  const headerCheck = await validateFileBytes(inputPath, storedName, 'application/pdf');
  if (!headerCheck.isValid) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_PDF_HEADER', message: 'File is not a valid PDF document.' },
    });
  }

  try {
    const result = await pdfOptimizer.optimizePdf({
      fileId,
      inputPath,
      outputPath,
      mode,
    });

    // Validate generated output
    const validation = await pdfValidator.validatePdf(outputPath, result.pageCount);
    if (!validation.isValid) {
      return res.status(500).json({
        success: false,
        error: { code: 'PDF_VALIDATION_FAILED', message: validation.error || 'Optimized PDF output validation failed.' },
      });
    }

    try {
      await sessionFileRepository.updateFileStatus(
        fileId,
        result.status === 'failed' ? 'failed' : 'completed',
        result.originalSize
      );

      await sessionFileRepository.saveFileRecord({
        id: outputFile.fileId,
        sessionId,
        userId: req.user.id,
        originalName: outputFileName,
        storedName: outputFile.storedName,
        mimeType: 'application/pdf',
        extension: 'pdf',
        fileSize: result.optimizedSize,
        storageKey: outputFile.storageKey,
        status: result.status === 'failed' ? 'failed' : 'completed',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

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
      fileId: outputFile.fileId,
      originalName: originalName || storedName,
      extension: 'pdf',
      originalSize: result.originalSize,
      outputSize: result.optimizedSize,
      operation: 'PDF Optimization',
      mode,
      status: result.status === 'failed' ? 'failed' : 'completed',
      reductionPercentage: result.reductionPercentage,
      resultStorageKey: outputFile.storedName,
    });

    return res.status(200).json({
      success: true,
      data: {
        ...result,
        outputFileId: outputFile.fileId,
        outputFileName,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'PDF_OPTIMIZATION_FAILED',
        message: err instanceof Error ? err.message : 'PDF optimization processing failed.',
      },
    });
  }
};
