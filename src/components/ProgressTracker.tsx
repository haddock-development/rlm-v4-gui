'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { SessionProgress, SubcallEvent, IterationEvent } from '@/lib/types';

interface ProgressTrackerProps {
  progress: SessionProgress;
  className?: string;
}

export function ProgressTracker({ progress, className }: ProgressTrackerProps) {
  const statusColors = {
    idle: 'bg-gray-500',
    running: 'bg-yellow-500 animate-pulse',
    completed: 'bg-green-500',
    error: 'bg-red-500',
  };

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="py-3 px-4 bg-muted/30">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Progress</CardTitle>
          <div className="flex items-center gap-2">
            <div className={cn('w-2 h-2 rounded-full', statusColors[progress.status])} />
            <span className="text-xs font-medium capitalize">{progress.status}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Current State */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Depth</label>
            <div className="text-2xl font-mono font-bold text-primary">
              {progress.current_depth}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Iteration</label>
            <div className="text-2xl font-mono font-bold">
              {progress.current_iteration}
            </div>
          </div>
        </div>

        {/* Timing */}
        {progress.started_at && (
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Started</label>
            <div className="text-xs font-mono text-muted-foreground">
              {new Date(progress.started_at).toLocaleTimeString()}
            </div>
            {progress.completed_at && (
              <div className="text-xs font-mono text-green-500">
                Completed in{' '}
                {(
                  (new Date(progress.completed_at).getTime() -
                    new Date(progress.started_at).getTime()) /
                  1000
                ).toFixed(1)}
                s
              </div>
            )}
          </div>
        )}

        {/* Error display */}
        {progress.error && (
          <div className="p-2 rounded bg-destructive/10 text-destructive text-xs font-mono">
            {progress.error}
          </div>
        )}

        {/* Subcalls Timeline */}
        {progress.subcalls.length > 0 && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Subcalls</label>
            <div className="max-h-[150px] overflow-y-auto space-y-1">
              {progress.subcalls.map((call, i) => (
                <SubcallItem key={i} event={call} />
              ))}
            </div>
          </div>
        )}

        {/* Iterations Timeline */}
        {progress.iterations.length > 0 && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Iterations</label>
            <div className="max-h-[150px] overflow-y-auto space-y-1">
              {progress.iterations.map((iter, i) => (
                <IterationItem key={i} event={iter} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** Subcall event display */
function SubcallItem({ event }: { event: SubcallEvent }) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 p-1.5 rounded text-xs',
        event.type === 'start' ? 'bg-muted/30' : 'bg-green-500/10'
      )}
    >
      <div
        className={cn(
          'w-1.5 h-1.5 rounded-full',
          event.type === 'start' ? 'bg-yellow-500' : 'bg-green-500'
        )}
      />
      <span className="font-mono text-muted-foreground">D{event.depth}</span>
      {event.model && <span className="text-primary">{event.model}</span>}
      {event.duration && <span className="text-green-500">{event.duration.toFixed(1)}s</span>}
      {event.error && <span className="text-destructive truncate">{event.error}</span>}
    </div>
  );
}

/** Iteration event display */
function IterationItem({ event }: { event: IterationEvent }) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 p-1.5 rounded text-xs',
        event.type === 'start' ? 'bg-muted/30' : 'bg-green-500/10'
      )}
    >
      <div
        className={cn(
          'w-1.5 h-1.5 rounded-full',
          event.type === 'start' ? 'bg-yellow-500' : 'bg-green-500'
        )}
      />
      <span className="font-mono">
        D{event.depth}I{event.iteration}
      </span>
      {event.duration && <span className="text-green-500">{event.duration.toFixed(1)}s</span>}
    </div>
  );
}

/** Minimal progress indicator */
export function ProgressIndicator({ progress }: { progress: SessionProgress }) {
  if (progress.status === 'idle') return null;

  return (
    <div className="flex items-center gap-2 text-xs">
      <div
        className={cn(
          'w-2 h-2 rounded-full',
          progress.status === 'running' ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'
        )}
      />
      <span className="font-mono">
        D{progress.current_depth}I{progress.current_iteration}
      </span>
      {progress.status === 'running' && <span className="text-muted-foreground">Running...</span>}
    </div>
  );
}
