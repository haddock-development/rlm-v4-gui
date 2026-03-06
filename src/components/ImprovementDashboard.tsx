'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { rlmClient } from '@/lib/api';
import type { Improvement, ImprovementStats } from '@/lib/types';
import { cn } from '@/lib/utils';

const IMPROVEMENT_COLORS: Record<string, string> = {
  prompt_template: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  tool_code: 'bg-green-500/10 text-green-500 border-green-500/20',
  strategy_change: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
};

const IMPROVEMENT_ICONS: Record<string, string> = {
  prompt_template: '📝',
  tool_code: '{ }',
  strategy_change: '⚡',
};

export function ImprovementDashboard() {
  const [stats, setStats] = useState<ImprovementStats | null>(null);
  const [improvements, setImprovements] = useState<Improvement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, improvementsRes] = await Promise.all([
        rlmClient.getImprovementStats(),
        rlmClient.listImprovements(),
      ]);
      setStats(statsRes);
      setImprovements(improvementsRes.improvements);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load improvements');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (improvementId: string) => {
    if (!confirm(`Delete improvement "${improvementId}"?`)) return;

    try {
      await rlmClient.deleteImprovement(improvementId);
      setImprovements((prev) => prev.filter((i) => i.timestamp !== improvementId));
      loadData(); // Reload stats
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete improvement');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-pulse">Loading self-improvement data...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-destructive">
          {error}
          <Button variant="link" onClick={loadData} className="ml-2">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Total Improvements</div>
            <div className="text-2xl font-bold">{stats?.total_improvements || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Successful Applications</div>
            <div className="text-2xl font-bold text-green-500">{stats?.successful_applications || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Failed Applications</div>
            <div className="text-2xl font-bold text-destructive">{stats?.failed_applications || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Success Rate</div>
            <div className="text-2xl font-bold">
              {stats?.avg_success_rate ? `${(stats.avg_success_rate * 100).toFixed(1)}%` : 'N/A'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Type Breakdown */}
      {stats?.improvement_types && Object.keys(stats.improvement_types).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <span className="text-primary">◈</span>
              Improvement Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {Object.entries(stats.improvement_types).map(([type, count]) => (
                <div
                  key={type}
                  className={cn(
                    'px-3 py-2 rounded-lg border',
                    IMPROVEMENT_COLORS[type] || 'bg-gray-500/10 text-gray-500'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span>{IMPROVEMENT_ICONS[type] || '?'}</span>
                    <span className="font-mono text-sm">{type}</span>
                    <Badge variant="outline" className="text-[9px]">
                      {count}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Improvements List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <span className="text-primary">◈</span>
            Learned Improvements
          </CardTitle>
        </CardHeader>
        <CardContent>
          {improvements.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No improvements learned yet. Run self-improvement completions to generate improvements.
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {improvements.map((improvement, index) => {
                  const total = improvement.success_count + improvement.failure_count;
                  const successRate = total > 0 ? parseInt((improvement.success_count / total * 100).toFixed(0)) : 0;

                  return (
                    <Card key={improvement.timestamp || index} className="bg-muted/30">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge
                                variant="outline"
                                className={cn(
                                  IMPROVEMENT_COLORS[improvement.improvement_type] || 'bg-gray-500/10 text-gray-500'
                                )}
                              >
                                {IMPROVEMENT_ICONS[improvement.improvement_type]} {improvement.improvement_type}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground">
                                {improvement.timestamp ? new Date(improvement.timestamp).toLocaleString() : 'Unknown date'}
                              </span>
                            </div>

                            {improvement.prompt_template && (
                              <pre className="text-xs font-mono bg-background/50 p-2 rounded mb-2 overflow-x-auto max-h-[100px]">
                                {improvement.prompt_template.slice(0, 300)}
                                {improvement.prompt_template.length > 300 && '...'}
                              </pre>
                            )}

                            {improvement.tool_code && (
                              <pre className="text-xs font-mono bg-background/50 p-2 rounded mb-2 overflow-x-auto max-h-[100px]">
                                {improvement.tool_code.slice(0, 300)}
                                {improvement.tool_code.length > 300 && '...'}
                              </pre>
                            )}

                            {improvement.strategy_change && (
                              <div className="text-xs bg-background/50 p-2 rounded mb-2">
                                {improvement.strategy_change}
                              </div>
                            )}

                            <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <span className="text-green-500">✓</span> {improvement.success_count} success
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="text-red-500">✗</span> {improvement.failure_count} failures
                              </span>
                              <span
                                className={cn(
                                  'px-1.5 py-0.5 rounded',
                                  successRate >= 80
                                    ? 'bg-green-500/10 text-green-500'
                                    : successRate >= 50
                                    ? 'bg-yellow-500/10 text-yellow-500'
                                    : 'bg-red-500/10 text-red-500'
                                )}
                              >
                                {successRate}% success
                              </span>
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(improvement.timestamp || '')}
                          >
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
