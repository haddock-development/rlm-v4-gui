'use client';

import { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  BarChart3,
  Activity,
  Users,
  Shield,
  AlertTriangle,
  Check,
  Clock,
  TrendingUp,
  Zap,
  Gauge,
  Layers,
  RefreshCw,
  ChevronRight
} from 'lucide-react';
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
      <div className={cn('p-8', className)}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-24 rounded-xl" />
          ))}
        </div>
        <div className="skeleton h-32 rounded-xl mt-4 max-w-md" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            <span>Error: {error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!globalStats) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-8 text-center">
          <BarChart3 className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground">No statistics available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Overview Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Total Sessions"
              value={globalStats.total_sessions}
              subtitle="All time"
              icon={<Activity className="w-5 h-5 text-blue-500" />}
              trend={globalStats.total_sessions > 10 ? 'up' : 'neutral'}
            />
            <StatsCard
              title="With Verification"
              value={globalStats.sessions_with_verification}
              subtitle={`${((globalStats.sessions_with_verification / Math.max(globalStats.total_sessions, 1)) * 100).toFixed(0)}% verified`}
              icon={<Shield className="w-5 h-5 text-green-500" />}
              trend="up"
            />
            <StatsCard
              title="Total Verifications"
              value={globalStats.total_verifications}
              subtitle="Runs"
              icon={<Check className="w-5 h-5 text-primary" />}
            />
            <StatsCard
              title="Threshold"
              value={`${(globalStats.verification_config.threshold * 100).toFixed(0)}%`}
              subtitle="Confidence"
              icon={<Gauge className="w-5 h-5 text-purple-500" />}
            />
          </div>

          {/* Configuration Panel */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <Layers className="w-5 h-5 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Configuration</h3>
              </div>

              <div className="grid grid-cols-3 gap-4">
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
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                    <h3 className="text-sm font-semibold">Recent Failures</h3>
                  </div>
                  <Badge variant="destructive" className="text-[10px]">
                    {globalStats.recent_failures.length}
                  </Badge>
                </div>

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

/** Professional stats card */
function StatsCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  className,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}) {
  const trendColors = {
    up: 'text-green-500',
    down: 'text-red-500',
    neutral: 'text-muted-foreground',
  };

  return (
    <Card className={cn(
      'stats-card group cursor-pointer transition-all hover:shadow-md',
      className
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold font-mono mt-1">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          {icon && (
            <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
                {icon}
              </div>
          )}
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
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn('text-sm font-medium', colors[status])}>{value}</p>
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
          {((stats.sessions_with_verification / Math.max(stats.total_sessions, 1)) * 100).toFixed(1)}%
        </span>
      </div>
    </div>
  );
}
