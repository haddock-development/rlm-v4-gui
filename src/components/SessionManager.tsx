'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Plus,
  RefreshCw,
  Trash2,
  Check,
  Clock,
  Zap,
  Shield,
  ChevronRight,
  Sparkles
} from 'lucide-react';
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
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-primary" />
          </div>
          Sessions
        </h3>
        <div className="flex items-center gap-2">
          <ConnectionIndicator status={connectionStatus} />
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={refreshSessions}
            disabled={isLoading}
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2">
          <div className="w-4 h-4 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-[10px]">!</span>
          </div>
          <span>{error}</span>
        </div>
      )}

      {/* Create new session */}
      <Card className="border-dashed">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" />
            New Session
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Model Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Model</label>
            <select
              value={newSessionModel}
              onChange={(e) => setNewSessionModel(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            >
              <option value="glm-5">GLM-5</option>
              <option value="glm-5-plus">GLM-5 Plus</option>
              <option value="qwen3-235b">Qwen3 235B</option>
              <option value="kimi-k2.5">Kimi K2.5</option>
            </select>
          </div>

          {/* Verification Toggle */}
          <label className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm">Enable Verification</span>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={enableVerification}
                onChange={(e) => setEnableVerification(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-muted rounded-full peer peer-checked:bg-primary transition-colors" />
              <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-background rounded-full shadow-sm transition-transform peer-checked:translate-x-4" />
            </div>
          </label>

          {/* Create Button */}
          <Button
            onClick={handleCreateSession}
            disabled={isLoading || connectionStatus !== 'connected'}
            className="w-full gap-2"
            size="sm"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Create Session
              </>
            )}
          </Button>

          {connectionStatus !== 'connected' && (
            <p className="text-[10px] text-muted-foreground text-center">
              Connect to server to create sessions
            </p>
          )}
        </CardContent>
      </Card>

      {/* Session list */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Active Sessions
          </h4>
          <Badge variant="outline" className="text-[10px] font-mono">
            {sessions.length}
          </Badge>
        </div>

        {sessions.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-6 text-center">
              <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                <Clock className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">No active sessions</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Create a session to get started
              </p>
            </CardContent>
          </Card>
        ) : (
          <ScrollArea className="h-[280px] pr-2">
            <div className="space-y-2">
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
  const timeAgo = getTimeAgo(new Date(session.last_used_at));

  return (
    <Card
      className={cn(
        'cursor-pointer group transition-all duration-200',
        'hover:border-primary/40 hover:bg-primary/5',
        isSelected && 'border-primary ring-1 ring-primary/20 bg-primary/5'
      )}
      onClick={onSelect}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs text-primary font-medium">
                {session.session_id}
              </span>
              {session.has_verifier && (
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 gap-0.5 border-green-500/30 text-green-600 dark:text-green-400">
                  <Shield className="w-2.5 h-2.5" />
                  V
                </Badge>
              )}
              {isSelected && (
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-primary/30 text-primary">
                  Active
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-mono">{session.model}</span>
              <span className="text-border">•</span>
              <span>{session.context_versions?.length || 0} contexts</span>
            </div>
            <div className="text-[10px] text-muted-foreground/60 mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {timeAgo}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('Delete this session?')) {
                  onDelete();
                }
              }}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/** Connection status indicator */
function ConnectionIndicator({ status }: { status: string }) {
  const config = {
    connected: { color: 'bg-green-500', label: 'Connected' },
    disconnected: { color: 'bg-red-500', label: 'Offline' },
    checking: { color: 'bg-yellow-500 animate-pulse', label: 'Checking' },
    error: { color: 'bg-red-500', label: 'Error' },
  };

  const { color, label } = config[status as keyof typeof config] || config.error;

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted/50">
      <div className={cn('w-1.5 h-1.5 rounded-full', color)} />
      <span className="text-[10px] text-muted-foreground font-medium">{label}</span>
    </div>
  );
}

/** Helper to format time ago */
function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
