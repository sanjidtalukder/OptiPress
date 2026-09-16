import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { optimizeImage } from '../controllers/image.controller.js';

export const imageRouter = Router();

// Protect image optimization routes with authMiddleware
imageRouter.use(authMiddleware as any);

imageRouter.post('/:fileId/optimize', optimizeImage as any);
