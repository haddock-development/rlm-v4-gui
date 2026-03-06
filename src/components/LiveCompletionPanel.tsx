'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCompletion } from '@/lib/hooks/useCompletion';
import { VerificationPanel, VerificationSummary } from './VerificationPanel';
import { ProgressTracker, ProgressIndicator } from './ProgressTracker';
import { ConfidenceDisplay } from './ConfidenceDisplay';
import { cn } from '@/lib/utils';
import type { RLMSession } from '@/lib/types';

interface LiveCompletionPanelProps {
  session: RLMSession | null;
  onSessionCreate?: () => void;
  className?: string;
}

export function LiveCompletionPanel({
  session,
  onSessionCreate,
  className,
}: LiveCompletionPanelProps) {
  const [prompt, setPrompt] = useState('');
  const [verify, setVerify] = useState(true);
  const [forceVerify, setForceVerify] = useState(false);

  const {
    response,
    verificationResult,
    isRunning,
    error,
    runCompletion,
    reset,
  } = useCompletion();

  const handleSubmit = useCallback(async () => {
    if (!session || !prompt.trim() || isRunning) return;

    await runCompletion(session.session_id, {
      prompt: prompt.trim(),
      verify,
      force_verify: forceVerify,
    });
  }, [session, prompt, isRunning, runCompletion, verify, forceVerify]);

  const handleReset = () => {
    reset();
    setPrompt('');
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Input Section */}
      <Card>
        <CardHeader className="py-3 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">
              {session ? `Session: ${session.session_id}` : 'No Session Selected'}
            </CardTitle>
            {session?.has_verifier && (
              <span className="text-xs text-green-500">Verification Enabled</span>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Prompt Input */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your prompt..."
              className="w-full h-32 px-3 py-2 text-sm rounded-md border bg-background resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              disabled={isRunning || !session}
            />
          </div>

          {/* Options */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={verify}
                onChange={(e) => setVerify(e.target.checked)}
                disabled={isRunning}
                className="rounded"
              />
              Enable Verification
            </label>

            {verify && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={forceVerify}
                  onChange={(e) => setForceVerify(e.target.checked)}
                  disabled={isRunning}
                  className="rounded"
                />
                Force Verify
              </label>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              onClick={handleSubmit}
              disabled={!session || !prompt.trim() || isRunning}
              className="flex-1"
            >
              {isRunning ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Running...
                </>
              ) : (
                'Run Completion'
              )}
            </Button>

            {(response || error) && (
              <Button variant="outline" onClick={handleReset}>
                Reset
              </Button>
            )}
          </div>

          {/* No session warning */}
          {!session && (
            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 text-sm">
              Create or select a session to run completions
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          <div className="font-medium mb-1">Error</div>
          {error}
        </div>
      )}

      {/* Progress Display */}
      {isRunning && session?.progress && (
        <ProgressTracker progress={session.progress} />
      )}

      {/* Response Display */}
      {response && !isRunning && (
        <Card>
          <CardHeader className="py-3 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Response</CardTitle>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{response.execution_time.toFixed(1)}s</span>
                <span className="font-mono text-primary">{response.root_model}</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Response text */}
            <div className="p-3 rounded-lg bg-muted/30 text-sm whitespace-pre-wrap font-mono">
              {response.response}
            </div>

            {/* Verification summary */}
            {verificationResult && (
              <div className="border-t pt-4">
                <VerificationSummary result={verificationResult} />
              </div>
            )}

            {/* Metadata */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>Context v{response.context_version}</span>
              {response.verified !== undefined && (
                <span className={response.verified ? 'text-green-500' : 'text-red-500'}>
                  {response.verified ? 'Verified' : 'Unverified'}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Verification Panel */}
      {verificationResult && !isRunning && (
        <VerificationPanel result={verificationResult} />
      )}
    </div>
  );
}

/** Compact completion widget for sidebar */
export function CompletionWidget({
  session,
  onRun,
}: {
  session: RLMSession | null;
  onRun?: (prompt: string, verify: boolean) => void;
}) {
  const [prompt, setPrompt] = useState('');
  const [verify, setVerify] = useState(true);
  const { isRunning } = useCompletion();

  return (
    <div className="space-y-2">
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Quick prompt..."
        className="w-full h-20 px-2 py-1.5 text-xs rounded border bg-background resize-none"
        disabled={isRunning || !session}
      />
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1 text-xs">
          <input
            type="checkbox"
            checked={verify}
            onChange={(e) => setVerify(e.target.checked)}
            className="rounded scale-75"
          />
          Verify
        </label>
        <Button
          size="sm"
          onClick={() => onRun?.(prompt, verify)}
          disabled={!session || !prompt.trim() || isRunning}
        >
          Run
        </Button>
      </div>
    </div>
  );
}
