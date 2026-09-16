import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { optimizePdf } from '../controllers/pdf.controller.js';

export const pdfRouter = Router();

// Protect all PDF optimization routes with authMiddleware
pdfRouter.use(authMiddleware as any);

pdfRouter.post('/:fileId/optimize', optimizePdf as any);
