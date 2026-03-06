'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useSession } from '@/lib/hooks/useSession';
import type { RLMSession } from '@/lib/types';

interface SessionManagerProps {
  onSelectSession?: (session: RLMSession) => void;
  className?: string;
}

export function SessionManager({ onSelectSession, className }: SessionManagerProps) {
  const {
    sessions,
    currentSession,
    connectionStatus,
    isLoading,
    error,
    createSession,
    selectSession,
    deleteSession,
    refreshSessions,
  } = useSession();

  const [newSessionModel, setNewSessionModel] = useState('glm-5');
  const [enableVerification, setEnableVerification] = useState(true);

  const handleCreateSession = async () => {
    const session = await createSession({
      model: newSessionModel,
      enable_verification: enableVerification,
    });
    if (session && onSelectSession) {
      onSelectSession(session);
    }
  };

  const handleSelectSession = async (sessionId: string) => {
    await selectSession(sessionId);
    const session = sessions.find(s => s.session_id === sessionId);
    if (session && onSelectSession) {
      onSelectSession(session);
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">Sessions</h3>
          <ConnectionIndicator status={connectionStatus} />
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={refreshSessions}
          disabled={isLoading}
        >
          Refresh
        </Button>
      </div>

      {/* Error display */}
      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Create new session */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-medium">New Session</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <select
              value={newSessionModel}
              onChange={(e) => setNewSessionModel(e.target.value)}
              className="flex-1 px-3 py-1.5 text-sm rounded-md border bg-background"
            >
              <option value="glm-5">GLM-5</option>
              <option value="glm-5-plus">GLM-5 Plus</option>
              <option value="qwen3-235b">Qwen3 235B</option>
              <option value="kimi-k2.5">Kimi K2.5</option>
            </select>

            <label className="flex items-center gap-1.5 text-sm">
              <input
                type="checkbox"
                checked={enableVerification}
                onChange={(e) => setEnableVerification(e.target.checked)}
                className="rounded"
              />
              Verify
            </label>
          </div>

          <Button
            onClick={handleCreateSession}
            disabled={isLoading || connectionStatus !== 'connected'}
            className="w-full"
            size="sm"
          >
            {isLoading ? 'Creating...' : 'Create Session'}
          </Button>
        </CardContent>
      </Card>

      {/* Session list */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Active Sessions ({sessions.length})
        </h4>

        {sessions.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-4">
            No active sessions
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="space-y-2 pr-4">
              {sessions.map((session) => (
                <SessionCard
                  key={session.session_id}
                  session={session}
                  isSelected={currentSession?.session_id === session.session_id}
                  onSelect={() => handleSelectSession(session.session_id)}
                  onDelete={() => deleteSession(session.session_id)}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}

/** Individual session card */
function SessionCard({
  session,
  isSelected,
  onSelect,
  onDelete,
}: {
  session: RLMSession;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:scale-[1.01]',
        isSelected && 'border-primary ring-1 ring-primary/20'
      )}
      onClick={onSelect}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs text-primary">
                {session.session_id}
              </span>
              {session.has_verifier && (
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">
                  V
                </Badge>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {session.model} • {session.context_versions?.length || 0} contexts
            </div>
            <div className="text-[10px] text-muted-foreground/60 mt-1">
              Last used: {new Date(session.last_used_at).toLocaleTimeString()}
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            ×
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/** Connection status indicator */
function ConnectionIndicator({ status }: { status: string }) {
  const colors = {
    connected: 'bg-green-500',
    disconnected: 'bg-red-500',
    checking: 'bg-yellow-500 animate-pulse',
    error: 'bg-red-500',
  };

  return (
    <div className="flex items-center gap-1.5">
      <div className={cn('w-2 h-2 rounded-full', colors[status as keyof typeof colors] || 'bg-gray-500')} />
      <span className="text-[10px] text-muted-foreground uppercase">{status}</span>
    </div>
  );
}
