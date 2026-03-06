/**
 * useSession Hook
 *
 * React hook for managing RLM v4 sessions
 */

import { useState, useCallback, useEffect } from 'react';
import { rlmClient } from '../api';
import type {
  RLMSession,
  CreateSessionOptions,
  SessionProgress,
  ConnectionStatus,
} from '../types';

interface UseSessionReturn {
  sessions: RLMSession[];
  currentSession: RLMSession | null;
  progress: SessionProgress | null;
  connectionStatus: ConnectionStatus;
  isLoading: boolean;
  error: string | null;
  createSession: (options?: CreateSessionOptions) => Promise<RLMSession | null>;
  selectSession: (sessionId: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<boolean>;
  refreshSessions: () => Promise<void>;
  refreshProgress: () => Promise<void>;
}

export function useSession(): UseSessionReturn {
  const [sessions, setSessions] = useState<RLMSession[]>([]);
  const [currentSession, setCurrentSession] = useState<RLMSession | null>(null);
  const [progress, setProgress] = useState<SessionProgress | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('checking');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Check connection and load sessions on mount */
  useEffect(() => {
    checkConnection();
    refreshSessions();
  }, []);

  /** Poll progress when session is running */
  useEffect(() => {
    if (!currentSession || progress?.status !== 'running') return;

    const interval = setInterval(refreshProgress, 500);
    return () => clearInterval(interval);
  }, [currentSession, progress?.status]);

  /** Check server connection */
  const checkConnection = async () => {
    const status = await rlmClient.checkConnection();
    setConnectionStatus(status);
  };

  /** Refresh session list */
  const refreshSessions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await rlmClient.listSessions();
      setSessions(result.sessions);
      setConnectionStatus('connected');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sessions');
      setConnectionStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  /** Create a new session */
  const createSession = async (options: CreateSessionOptions = {}): Promise<RLMSession | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const session = await rlmClient.createSession(options);
      setSessions(prev => [...prev, session]);
      setCurrentSession(session);
      setConnectionStatus('connected');
      return session;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /** Select and load a session */
  const selectSession = async (sessionId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const session = await rlmClient.getSession(sessionId);
      setCurrentSession(session);

      // Also fetch progress
      const progressData = await rlmClient.getProgress(sessionId);
      setProgress(progressData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load session');
    } finally {
      setIsLoading(false);
    }
  };

  /** Delete a session */
  const deleteSession = async (sessionId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      await rlmClient.deleteSession(sessionId);
      setSessions(prev => prev.filter(s => s.session_id !== sessionId));

      if (currentSession?.session_id === sessionId) {
        setCurrentSession(null);
        setProgress(null);
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete session');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /** Refresh progress for current session */
  const refreshProgress = async () => {
    if (!currentSession) return;

    try {
      const progressData = await rlmClient.getProgress(currentSession.session_id);
      setProgress(progressData);
    } catch (err) {
      console.error('Failed to refresh progress:', err);
    }
  };

  return {
    sessions,
    currentSession,
    progress,
    connectionStatus,
    isLoading,
    error,
    createSession,
    selectSession,
    deleteSession,
    refreshSessions,
    refreshProgress,
  };
}

export default useSession;
