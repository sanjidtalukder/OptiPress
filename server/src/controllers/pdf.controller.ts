import { Response } from 'express';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { temporaryStorageService } from '../services/storage.service.js';
import { pdfOptimizer } from '../services/pdf-optimizer.service.js';
import { pdfValidator } from '../services/pdf-validator.service.js';
import { validateFileBytes } from '../utils/file-validation.js';
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
    // Fallback if DB fetch fails
  }

  if (!isAuthorized) {
    return res.status(404).json({
      success: false,
      error: { code: 'FILE_NOT_FOUND', message: 'Requested PDF file not found or unauthorized.' },
    });
  }

  if (extension !== 'pdf') {
    return res.status(400).json({
      success: false,
      error: { code: 'NOT_A_PDF', message: `File format .${extension} cannot be processed by the PDF optimization engine.` },
    });
  }

  const inputPath = temporaryStorageService.getFilePath(sessionId, storedName);
  const outputPath = temporaryStorageService.getFilePath(sessionId, `${fileId}-optimized.pdf`);

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
      await supabase
        .from('session_files')
        .update({
          file_size: result.optimizedSize,
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
        code: 'PDF_OPTIMIZATION_FAILED',
        message: err instanceof Error ? err.message : 'PDF optimization processing failed.',
      },
    });
  }
};
