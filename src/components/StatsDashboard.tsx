'use client';

import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStats } from '@/lib/hooks/useStats';
import { cn } from '@/lib/utils';
import type { VerificationStats } from '@/lib/types';

interface StatsDashboardProps {
  className?: string;
}

export function StatsDashboard({ className }: StatsDashboardProps) {
  const { globalStats, isLoading, error, refreshGlobalStats } = useStats();

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(refreshGlobalStats, 30000);
    return () => clearInterval(interval);
  }, [refreshGlobalStats]);

  if (isLoading && !globalStats) {
    return (
      <div className={cn('p-8 text-center text-muted-foreground', className)}>
        Loading stats...
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('p-8 text-center text-destructive', className)}>
        Error: {error}
      </div>
    );
  }

  if (!globalStats) {
    return (
      <div className={cn('p-8 text-center text-muted-foreground', className)}>
        No stats available
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Sessions"
          value={globalStats.total_sessions}
          icon="📊"
        />
        <StatsCard
          title="With Verification"
          value={globalStats.sessions_with_verification}
          subtitle={`${((globalStats.sessions_with_verification / Math.max(globalStats.total_sessions, 1)) * 100).toFixed(0)}%`}
          icon="✓"
        />
        <StatsCard
          title="Total Verifications"
          value={globalStats.total_verifications}
          icon="🔍"
        />
        <StatsCard
          title="Verification Rate"
          value={`${globalStats.verification_config.threshold * 100}%`}
          subtitle="Threshold"
          icon="⚡"
        />
      </div>

      {/* Configuration */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-medium">Verification Config</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-xs">
            <ConfigItem
              label="Enabled"
              value={globalStats.verification_config.enabled ? 'Yes' : 'No'}
              status={globalStats.verification_config.enabled ? 'success' : 'muted'}
            />
            <ConfigItem
              label="Threshold"
              value={`${(globalStats.verification_config.threshold * 100).toFixed(0)}%`}
            />
            <ConfigItem
              label="Store Failures"
              value={globalStats.verification_config.store_failures ? 'Yes' : 'No'}
              status={globalStats.verification_config.store_failures ? 'success' : 'muted'}
            />
          </div>
        </CardContent>
      </Card>

      {/* Recent Failures */}
      {globalStats.recent_failures && globalStats.recent_failures.length > 0 && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium">
              Recent Failures ({globalStats.recent_failures.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {globalStats.recent_failures.map((failure, i) => (
                <FailureCard key={i} failure={failure} index={i} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/** Individual stats card */
function StatsCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold font-mono mt-1">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          {icon && <span className="text-2xl">{icon}</span>}
        </div>
      </CardContent>
    </Card>
  );
}

/** Config item display */
function ConfigItem({
  label,
  value,
  status = 'default',
}: {
  label: string;
  value: string;
  status?: 'success' | 'warning' | 'error' | 'muted' | 'default';
}) {
  const colors = {
    success: 'text-green-500',
    warning: 'text-yellow-500',
    error: 'text-red-500',
    muted: 'text-muted-foreground',
    default: 'text-foreground',
  };

  return (
    <div className="space-y-1">
      <p className="text-muted-foreground">{label}</p>
      <p className={cn('font-medium', colors[status])}>{value}</p>
    </div>
  );
}

/** Failure card */
function FailureCard({ failure, index }: { failure: { type: string; prompt: string; attempts?: string[]; timestamp: string }; index: number }) {
  const truncatedPrompt = failure.prompt.length > 100 ? failure.prompt.slice(0, 100) + '...' : failure.prompt;

  return (
    <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-destructive">
          Failure #{index + 1}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {new Date(failure.timestamp).toLocaleString()}
        </span>
      </div>
      <p className="text-xs font-mono text-muted-foreground truncate">
        {truncatedPrompt}
      </p>
      {failure.attempts && failure.attempts.length > 0 && (
        <div className="mt-2 text-[10px] text-muted-foreground">
          {failure.attempts.length} attempts
        </div>
      )}
    </div>
  );
}

/** Minimal stats overview */
export function StatsOverview({ stats }: { stats: VerificationStats | null }) {
  if (!stats) return null;

  return (
    <div className="flex items-center gap-4 text-xs">
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground">Sessions:</span>
        <span className="font-mono font-medium">{stats.total_sessions}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground">Verifications:</span>
        <span className="font-mono font-medium">{stats.total_verifications}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground">Rate:</span>
        <span className="font-mono font-medium">
          {((stats.sessions_with_verification / Math.max(stats.total_sessions, 1)) * 100).toFixed(0)}%
        </span>
      </div>
    </div>
  );
}
