import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { historyService } from '../services/history.service.js';

export const getHistory = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } });
  }

  const sessionId = (req.query.sessionId || req.headers['x-session-id'] || '').toString();

  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');

  try {
    const history = await historyService.getSessionHistory(req.user.id, sessionId || undefined);
    return res.status(200).json({
      success: true,
      data: { history },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: { code: 'HISTORY_FETCH_FAILED', message: 'Failed to retrieve temporary history.' },
    });
  }
};

export const deleteHistoryItem = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } });
  }

  const historyId = req.params.id;

  try {
    await historyService.deleteHistoryRecord(historyId, req.user.id);
    return res.status(200).json({
      success: true,
      message: 'Temporary history record removed.',
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: { code: 'HISTORY_DELETE_FAILED', message: 'Failed to delete history record.' },
    });
  }
};
