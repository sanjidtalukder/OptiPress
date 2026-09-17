import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getHistory, deleteHistoryItem } from '../controllers/history.controller.js';

export const historyRouter = Router();

historyRouter.use(authMiddleware as any);

historyRouter.get('/', getHistory as any);
historyRouter.delete('/:id', deleteHistoryItem as any);
