import { Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
const supabase = createClient(supabaseUrl, supabaseKey);

// Fallback in-memory session store when DB is unreachable
const memorySessions = new Map<string, { id: string; userId: string; createdAt: string; lastActivityAt: string; expiresAt: string }>();

export const getMe = (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
  }

  return res.status(200).json({
    success: true,
    data: {
      user: req.user,
    },
  });
};

export const getSession = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
  }

  try {
    const { data, error } = await supabase
      .from('app_sessions')
      .select('id, user_id, created_at, last_activity_at, expires_at')
      .eq('user_id', req.user.id)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      if (data.user_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Unauthorized session access.' },
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          session: {
            id: data.id,
            userId: data.user_id,
            createdAt: data.created_at,
            lastActivityAt: data.last_activity_at,
            expiresAt: data.expires_at,
          },
        },
      });
    }
  } catch {
    // Fallback to memory
  }

  const memorySession = Array.from(memorySessions.values()).find((s) => s.userId === req.user?.id);
  if (memorySession) {
    return res.status(200).json({
      success: true,
      data: { session: memorySession },
    });
  }

  return res.status(404).json({
    success: false,
    error: { code: 'SESSION_NOT_FOUND', message: 'No active OptiPress application session found for user.' },
  });
};

export const createSession = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
  }

  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  try {
    const { data, error } = await supabase
      .from('app_sessions')
      .insert({
        user_id: req.user.id,
        last_activity_at: now,
        expires_at: expiresAt,
      })
      .select('id, user_id, created_at, last_activity_at, expires_at')
      .single();

    if (!error && data) {
      const session = {
        id: data.id,
        userId: data.user_id,
        createdAt: data.created_at,
        lastActivityAt: data.last_activity_at,
        expiresAt: data.expires_at,
      };
      memorySessions.set(session.id, session);
      return res.status(201).json({
        success: true,
        data: { session },
      });
    }
  } catch {
    // Fallback to memory
  }

  const sessionId = `app_sess_${Math.random().toString(36).substring(2, 11)}`;
  const memorySession = {
    id: sessionId,
    userId: req.user.id,
    createdAt: now,
    lastActivityAt: now,
    expiresAt,
  };
  memorySessions.set(sessionId, memorySession);

  return res.status(201).json({
    success: true,
    data: { session: memorySession },
  });
};

export const deleteSession = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
  }

  try {
    await supabase
      .from('app_sessions')
      .delete()
      .eq('user_id', req.user.id);
  } catch {
    // Ignore DB errors during deletion
  }

  for (const [id, s] of memorySessions.entries()) {
    if (s.userId === req.user.id) {
      memorySessions.delete(id);
    }
  }

  return res.status(200).json({
    success: true,
    message: 'Application session terminated.',
  });
};
