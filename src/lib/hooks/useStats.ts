/**
 * useStats Hook
 *
 * React hook for fetching RLM v4 verification statistics
 */

import { useState, useCallback, useEffect } from 'react';
import { rlmClient } from '../api';
import type { VerificationStats, SessionVerificationStats } from '../types';

interface UseStatsReturn {
  globalStats: VerificationStats | null;
  sessionStats: Map<string, SessionVerificationStats>;
  isLoading: boolean;
  error: string | null;
  refreshGlobalStats: () => Promise<void>;
  refreshSessionStats: (sessionId: string) => Promise<void>;
}

export function useStats(): UseStatsReturn {
  const [globalStats, setGlobalStats] = useState<VerificationStats | null>(null);
  const [sessionStats, setSessionStats] = useState<Map<string, SessionVerificationStats>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Load global stats on mount */
  useEffect(() => {
    refreshGlobalStats();
  }, []);

  /** Refresh global verification stats */
  const refreshGlobalStats = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const stats = await rlmClient.getVerificationStats();
      setGlobalStats(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
    } finally {
      setIsLoading(false);
    }
  };

  /** Refresh stats for a specific session */
  const refreshSessionStats = async (sessionId: string) => {
    try {
      const stats = await rlmClient.getSessionVerificationStats(sessionId);
      setSessionStats(prev => {
        const next = new Map(prev);
        next.set(sessionId, stats);
        return next;
      });
    } catch (err) {
      console.error(`Failed to fetch stats for session ${sessionId}:`, err);
    }
  };

  return {
    globalStats,
    sessionStats,
    isLoading,
    error,
    refreshGlobalStats,
    refreshSessionStats,
  };
}

export default useStats;
