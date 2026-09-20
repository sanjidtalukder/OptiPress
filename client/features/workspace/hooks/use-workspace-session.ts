'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/auth/hooks/use-auth';

export function useWorkspaceSession() {
  const { session, isAuthenticated } = useAuth();
  const [appSessionId, setAppSessionId] = useState<string>('');
  const [isClearing, setIsClearing] = useState(false);
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  const hasInitialized = useRef(false);

  // Initialize or generate appSessionId on workspace mount
  useEffect(() => {
    if (!isAuthenticated || !session?.user?.id) return;

    if (!hasInitialized.current) {
      hasInitialized.current = true;
      const newSessionId = `app_sess_${session.user.id.substring(0, 8)}_${Date.now().toString(36)}`;

      // Check if there was a previous session ID stored before refresh
      const previousSessionId = sessionStorage.getItem('optipress_session_id');

      if (previousSessionId && session.accessToken) {
        // Clear previous session files/history on server after refresh
        fetch(`${baseUrl}/api/sessions/clear`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.accessToken}`,
          },
          body: JSON.stringify({ sessionId: previousSessionId }),
        }).catch(() => {});
      }

      sessionStorage.setItem('optipress_session_id', newSessionId);
      setAppSessionId(newSessionId);
    }
  }, [isAuthenticated, session?.user?.id, session?.accessToken, baseUrl]);

  // Attach unload/pagehide best-effort beacon cleanup listener
  useEffect(() => {
    if (!session?.accessToken || !appSessionId) return;

    const handlePageHide = () => {
      const endpoint = `${baseUrl}/api/sessions/clear-beacon?token=${encodeURIComponent(session.accessToken)}`;
      const payload = JSON.stringify({ sessionId: appSessionId, token: session.accessToken });

      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon(endpoint, blob);
      } else {
        fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.accessToken}`,
          },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    };

    window.addEventListener('pagehide', handlePageHide);
    return () => {
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [session?.accessToken, appSessionId, baseUrl]);

  // Manual Clear Workspace trigger
  const clearWorkspace = useCallback(async (): Promise<boolean> => {
    if (!session?.accessToken) return false;

    setIsClearing(true);
    try {
      const response = await fetch(`${baseUrl}/api/sessions/clear`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ sessionId: appSessionId }),
      });

      if (response.ok) {
        // Generate new session ID after clearing workspace
        const freshSessionId = `app_sess_${session.user.id.substring(0, 8)}_${Date.now().toString(36)}`;
        sessionStorage.setItem('optipress_session_id', freshSessionId);
        setAppSessionId(freshSessionId);
        setIsClearing(false);
        return true;
      }
    } catch {
      // Ignore network error
    }

    setIsClearing(false);
    return false;
  }, [session?.accessToken, session?.user?.id, appSessionId, baseUrl]);

  return {
    appSessionId,
    isClearing,
    clearWorkspace,
  };
}
