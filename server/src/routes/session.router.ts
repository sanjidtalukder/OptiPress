import { Router } from 'express';
import { authMiddleware, beaconAuthMiddleware } from '../middleware/auth.js';
import { getMe, getSession, createSession, deleteSession, clearWorkspaceSession } from '../controllers/session.controller.js';

export const sessionRouter = Router();

// Specialized clear-beacon route using flexible beaconAuthMiddleware
sessionRouter.post('/sessions/clear-beacon', beaconAuthMiddleware as any, clearWorkspaceSession as any);

// Protect all standard session routes with strict header authMiddleware
sessionRouter.use(authMiddleware as any);

sessionRouter.get('/me', getMe as any);
sessionRouter.get('/auth/me', getMe as any);
sessionRouter.get('/session', getSession as any);
sessionRouter.post('/session', createSession as any);
sessionRouter.delete('/session', deleteSession as any);
sessionRouter.post('/sessions/clear', clearWorkspaceSession as any);
