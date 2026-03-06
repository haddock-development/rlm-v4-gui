/**
 * useCompletion Hook
 *
 * React hook for running RLM v4 completions with verification
 */

import { useState, useCallback } from 'react';
import { rlmClient } from '../api';
import type {
  SessionCompletionResponse,
  VerificationResult,
  CompletionOptions,
} from '../types';

interface UseCompletionReturn {
  response: SessionCompletionResponse | null;
  verificationResult: VerificationResult | null;
  isRunning: boolean;
  error: string | null;
  runCompletion: (sessionId: string, options: CompletionOptions) => Promise<SessionCompletionResponse | null>;
  runVerifiedCompletion: (options: CompletionOptions) => Promise<VerificationResult | null>;
  reset: () => void;
}

export function useCompletion(): UseCompletionReturn {
  const [response, setResponse] = useState<SessionCompletionResponse | null>(null);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Run completion in a session */
  const runCompletion = async (
    sessionId: string,
    options: CompletionOptions
  ): Promise<SessionCompletionResponse | null> => {
    setIsRunning(true);
    setError(null);
    setResponse(null);
    setVerificationResult(null);

    try {
      const result = await rlmClient.complete(sessionId, options);
      setResponse(result);

      // Extract verification info if present
      if (result.verified !== undefined) {
        setVerificationResult({
          response: result.response,
          verified: result.verified,
          confidence: result.verified ? 0.95 : 0.5,
          attempts: [result.response],
          verification_method: result.verification_method,
          execution_time: result.execution_time,
          metadata: result.metadata,
        });
      }

      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Completion failed';
      setError(errorMsg);
      return null;
    } finally {
      setIsRunning(false);
    }
  };

  /** Run verified completion (stateless) */
  const runVerifiedCompletion = async (
    options: CompletionOptions
  ): Promise<VerificationResult | null> => {
    setIsRunning(true);
    setError(null);
    setResponse(null);
    setVerificationResult(null);

    try {
      const result = await rlmClient.verifiedCompletion(options);
      setVerificationResult(result);
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Verification failed';
      setError(errorMsg);
      return null;
    } finally {
      setIsRunning(false);
    }
  };

  /** Reset state */
  const reset = () => {
    setResponse(null);
    setVerificationResult(null);
    setError(null);
    setIsRunning(false);
  };

  return {
    response,
    verificationResult,
    isRunning,
    error,
    runCompletion,
    runVerifiedCompletion,
    reset,
  };
}

export default useCompletion;
