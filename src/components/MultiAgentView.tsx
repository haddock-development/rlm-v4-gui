'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { TaskDecomposition, AgentResult, AggregationResult } from '@/lib/types';
import { cn } from '@/lib/utils';

const AGENT_COLORS: Record<string, string> = {
  math: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  code: 'bg-green-500/10 text-green-500 border-green-500/20',
  search: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  reason: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
};

const AGENT_ICONS: Record<string, string> = {
  math: '∑',
  code: '{ }',
  search: '🔍',
  reason: '💭',
};

interface MultiAgentViewProps {
  decomposition?: TaskDecomposition | null;
  aggregation?: AggregationResult | null;
  isLoading?: boolean;
}

export function MultiAgentView({ decomposition, aggregation, isLoading }: MultiAgentViewProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <span className="text-primary animate-pulse">◈</span>
            Multi-Agent Execution
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4 mx-auto" />
            <div className="h-4 bg-muted rounded w-1/2 mx-auto" />
            <div className="h-4 bg-muted rounded w-2/3 mx-auto" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!decomposition && !aggregation) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <span className="text-primary">◈</span>
          Multi-Agent Execution
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Task Info */}
        {decomposition && (
          <div>
            <div className="text-xs text-muted-foreground mb-2">Original Task</div>
            <div className="text-sm bg-muted/30 p-2 rounded">{decomposition.original_task}</div>
          </div>
        )}

        {/* Task Decomposition */}
        {decomposition?.subtasks && decomposition.subtasks.length > 0 && (
          <div>
            <div className="text-xs text-muted-foreground mb-2">Task Decomposition</div>
            <div className="space-y-2">
              {decomposition.subtasks.map((subtask) => (
                <div
                  key={subtask.id}
                  className="flex items-center gap-2 text-xs bg-muted/20 p-2 rounded"
                >
                  <div
                    className={cn(
                      'w-6 h-6 rounded flex items-center justify-center font-mono',
                      AGENT_COLORS[subtask.agent || ''] || 'bg-gray-500/10 text-gray-500'
                    )}
                  >
                    {AGENT_ICONS[subtask.agent || ''] || '?'}
                  </div>
                  <div className="flex-1">
                    <span className="font-mono text-muted-foreground">{subtask.id}:</span>{' '}
                    {subtask.task}
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[9px]',
                      AGENT_COLORS[subtask.agent || ''] || 'bg-gray-500/10 text-gray-500'
                    )}
                  >
                    {subtask.agent}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Agent Results */}
        {aggregation?.agent_results && Object.keys(aggregation.agent_results).length > 0 && (
          <div>
            <div className="text-xs text-muted-foreground mb-2">Agent Results</div>
            <div className="space-y-2">
              {Object.entries(aggregation.agent_results).map(([agentName, result]) => (
                <Card key={agentName} className="bg-muted/20">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            'w-6 h-6 rounded flex items-center justify-center font-mono',
                            AGENT_COLORS[agentName.toLowerCase()] || 'bg-gray-500/10 text-gray-500'
                          )}
                        >
                          {AGENT_ICONS[agentName.toLowerCase()] || '?'}
                        </div>
                        <span className="font-mono text-xs">{agentName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {result.success ? (
                          <Badge className="bg-green-500/10 text-green-500 text-[9px]">
                            Success
                          </Badge>
                        ) : (
                          <Badge className="bg-red-500/10 text-red-500 text-[9px]">
                            Failed
                          </Badge>
                        )}
                        <span className="text-[10px] text-muted-foreground">
                          {result.execution_time.toFixed(1)}s
                        </span>
                      </div>
                    </div>
                    <div className="text-xs bg-background/50 p-2 rounded max-h-[100px] overflow-y-auto">
                      {result.response.slice(0, 300)}
                      {result.response.length > 300 && '...'}
                    </div>
                    {result.error && (
                      <div className="text-xs text-destructive mt-2">{result.error}</div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Aggregation Result */}
        {aggregation && (
          <div>
            <div className="text-xs text-muted-foreground mb-2">Aggregated Result</div>
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    {aggregation.verification_passed ? (
                      <Badge className="bg-green-500/10 text-green-500 text-[9px]">
                        Verified
                      </Badge>
                    ) : (
                      <Badge className="bg-yellow-500/10 text-yellow-500 text-[9px]">
                        Unverified
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-[9px]">
                      {(aggregation.confidence * 100).toFixed(0)}% confidence
                    </Badge>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    Total: {aggregation.total_time.toFixed(1)}s
                  </span>
                </div>
                <div className="text-sm">{aggregation.final_response}</div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
