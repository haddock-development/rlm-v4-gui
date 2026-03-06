'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VerificationBadge } from './VerificationBadge';
import { ConfidenceDisplay } from './ConfidenceDisplay';
import { cn } from '@/lib/utils';
import type { VerificationResult, VerificationMethod } from '@/lib/types';

interface VerificationPanelProps {
  result: VerificationResult;
  showAttempts?: boolean;
  className?: string;
}

export function VerificationPanel({ result, showAttempts = true, className }: VerificationPanelProps) {
  const verificationStatus = result.verified
    ? 'verified'
    : result.verification_method === 'skipped_high_confidence'
    ? 'skipped'
    : result.verification_method === 'none'
    ? 'skipped'
    : 'unverified';

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="py-3 px-4 bg-muted/30">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Verification Result</CardTitle>
          <VerificationBadge status={verificationStatus} />
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Confidence Score */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Confidence</label>
          <ConfidenceDisplay score={result.confidence} size="lg" />
        </div>

        {/* Verification Method */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Method</label>
          <div className="text-sm font-mono">
            <MethodDisplay method={result.verification_method} />
          </div>
        </div>

        {/* Execution Time */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Execution Time</label>
          <div className="text-sm font-mono">{result.execution_time.toFixed(2)}s</div>
        </div>

        {/* Mismatch Details */}
        {result.mismatch_details && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Mismatch Details</label>
            <div className="p-2 rounded bg-destructive/10 text-destructive text-xs font-mono overflow-x-auto">
              {result.mismatch_details}
            </div>
          </div>
        )}

        {/* Attempts Timeline */}
        {showAttempts && result.attempts.length > 0 && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Attempts</label>
            <div className="space-y-2">
              {result.attempts.map((attempt, index) => (
                <AttemptCard
                  key={index}
                  attempt={attempt}
                  index={index}
                  isPrimary={index === 0}
                  isLast={index === result.attempts.length - 1}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** Display verification method with icon */
function MethodDisplay({ method }: { method: VerificationMethod }) {
  const methods: Record<VerificationMethod, { label: string; color: string }> = {
    dual_approach_match: {
      label: 'Dual Approach Match',
      color: 'text-green-500',
    },
    resolution_match_first: {
      label: 'Resolution → First',
      color: 'text-yellow-500',
    },
    resolution_match_second: {
      label: 'Resolution → Second',
      color: 'text-yellow-500',
    },
    unresolved_mismatch: {
      label: 'Unresolved Mismatch',
      color: 'text-red-500',
    },
    skipped_high_confidence: {
      label: 'Skipped (High Confidence)',
      color: 'text-gray-500',
    },
    none: {
      label: 'No Verification',
      color: 'text-gray-500',
    },
  };

  const info = methods[method] || { label: method, color: 'text-muted-foreground' };

  return <span className={info.color}>{info.label}</span>;
}

/** Individual attempt card */
function AttemptCard({
  attempt,
  index,
  isPrimary,
  isLast,
}: {
  attempt: string;
  index: number;
  isPrimary: boolean;
  isLast: boolean;
}) {
  const truncated = attempt.length > 200 ? attempt.slice(0, 200) + '...' : attempt;

  return (
    <div
      className={cn(
        'p-2 rounded border text-xs',
        isPrimary ? 'bg-primary/5 border-primary/20' : 'bg-muted/30 border-border',
        isLast && !isPrimary && 'bg-green-500/5 border-green-500/20'
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        <span
          className={cn(
            'font-medium',
            isPrimary ? 'text-primary' : isLast ? 'text-green-500' : 'text-muted-foreground'
          )}
        >
          Attempt {index + 1}
        </span>
        {isPrimary && (
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">
            INITIAL
          </span>
        )}
        {isLast && !isPrimary && (
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-500">
            FINAL
          </span>
        )}
      </div>
      <div className="font-mono text-muted-foreground whitespace-pre-wrap">{truncated}</div>
    </div>
  );
}

/** Compact verification summary */
export function VerificationSummary({ result }: { result: VerificationResult }) {
  return (
    <div className="flex items-center gap-3 text-xs">
      <VerificationBadge
        status={result.verified ? 'verified' : result.verification_method === 'skipped_high_confidence' ? 'skipped' : 'unverified'}
      />
      <span className="font-mono">{Math.round(result.confidence * 100)}%</span>
      <span className="text-muted-foreground">{result.execution_time.toFixed(1)}s</span>
    </div>
  );
}
