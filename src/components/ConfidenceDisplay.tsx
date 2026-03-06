'use client';

import { cn } from '@/lib/utils';
import type { ConfidenceLevel } from '@/lib/types';

interface ConfidenceDisplayProps {
  score: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ConfidenceDisplay({
  score,
  showLabel = true,
  size = 'md',
  className,
}: ConfidenceDisplayProps) {
  // Determine level
  const level: ConfidenceLevel = score >= 0.8 ? 'high' : score >= 0.5 ? 'medium' : 'low';

  // Size variants
  const sizes = {
    sm: { bar: 'h-1.5', text: 'text-xs', gap: 'gap-1.5' },
    md: { bar: 'h-2', text: 'text-sm', gap: 'gap-2' },
    lg: { bar: 'h-3', text: 'text-base', gap: 'gap-3' },
  };

  // Color variants
  const colors = {
    high: { bg: 'bg-green-500', track: 'bg-green-500/20', text: 'text-green-500' },
    medium: { bg: 'bg-yellow-500', track: 'bg-yellow-500/20', text: 'text-yellow-500' },
    low: { bg: 'bg-red-500', track: 'bg-red-500/20', text: 'text-red-500' },
  };

  const sizeStyle = sizes[size];
  const colorStyle = colors[level];
  const percentage = Math.round(score * 100);

  return (
    <div className={cn('flex items-center', sizeStyle.gap, className)}>
      {/* Progress bar */}
      <div className={cn('flex-1 rounded-full overflow-hidden', sizeStyle.bar, colorStyle.track)}>
        <div
          className={cn('h-full rounded-full transition-all duration-500', colorStyle.bg)}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Score and label */}
      <div className={cn('flex items-center gap-1', sizeStyle.text)}>
        <span className={cn('font-mono font-medium', colorStyle.text)}>{percentage}%</span>
        {showLabel && (
          <span className="text-muted-foreground capitalize">{level}</span>
        )}
      </div>
    </div>
  );
}

/** Compact confidence badge */
export function ConfidenceBadge({
  score,
  className,
}: {
  score: number;
  className?: string;
}) {
  const level: ConfidenceLevel = score >= 0.8 ? 'high' : score >= 0.5 ? 'medium' : 'low';

  const styles = {
    high: 'bg-green-500/15 text-green-500 border-green-500/30',
    medium: 'bg-yellow-500/15 text-yellow-500 border-yellow-500/30',
    low: 'bg-red-500/15 text-red-500 border-red-500/30',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border',
        styles[level],
        className
      )}
    >
      <span className="font-mono">{Math.round(score * 100)}%</span>
      <span className="capitalize">{level}</span>
    </span>
  );
}
