import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getMe, getSession, createSession, deleteSession, clearWorkspaceSession } from '../controllers/session.controller.js';

export const sessionRouter = Router();

// Protect all session routes with authMiddleware
sessionRouter.use(authMiddleware as any);

sessionRouter.get('/me', getMe as any);
sessionRouter.get('/auth/me', getMe as any);
sessionRouter.get('/session', getSession as any);
sessionRouter.post('/session', createSession as any);
sessionRouter.delete('/session', deleteSession as any);
sessionRouter.post('/sessions/clear', clearWorkspaceSession as any);
sessionRouter.post('/sessions/clear-beacon', clearWorkspaceSession as any);

