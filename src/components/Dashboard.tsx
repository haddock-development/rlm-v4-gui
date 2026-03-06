'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileUploader } from './FileUploader';
import { LogViewer } from './LogViewer';
import { AsciiRLM } from './AsciiGlobe';
import { ThemeToggle } from './ThemeToggle';
import { SessionManager } from './SessionManager';
import { LiveCompletionPanel } from './LiveCompletionPanel';
import { StatsDashboard } from './StatsDashboard';
import { parseLogFile, extractContextVariable } from '@/lib/parse-logs';
import { rlmClient } from '@/lib/api';
import { RLMLogFile, RLMSession, ConnectionStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

interface DemoLogInfo {
  fileName: string;
  contextPreview: string | null;
  hasFinalAnswer: boolean;
  iterations: number;
}

export function Dashboard() {
  // Tab state
  const [activeTab, setActiveTab] = useState<'logs' | 'sessions' | 'stats'>('logs');

  // Log file state
  const [logFiles, setLogFiles] = useState<RLMLogFile[]>([]);
  const [selectedLog, setSelectedLog] = useState<RLMLogFile | null>(null);
  const [demoLogs, setDemoLogs] = useState<DemoLogInfo[]>([]);
  const [loadingDemos, setLoadingDemos] = useState(true);

  // v4 Session state
  const [currentSession, setCurrentSession] = useState<RLMSession | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('checking');

  // Check server connection on mount
  useEffect(() => {
    async function checkConnection() {
      const status = await rlmClient.checkConnection();
      setConnectionStatus(status);
    }
    checkConnection();
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  // Load demo log previews on mount
  useEffect(() => {
    async function loadDemoPreviews() {
      try {
        const listResponse = await fetch('/api/logs');
        if (!listResponse.ok) {
          throw new Error('Failed to fetch log list');
        }
        const { files } = await listResponse.json();

        const previews: DemoLogInfo[] = [];

        for (const fileName of files) {
          try {
            const response = await fetch(`/logs/${fileName}`);
            if (!response.ok) continue;
            const content = await response.text();
            const parsed = parseLogFile(fileName, content);
            const contextVar = extractContextVariable(parsed.iterations);

            previews.push({
              fileName,
              contextPreview: contextVar,
              hasFinalAnswer: !!parsed.metadata.finalAnswer,
              iterations: parsed.metadata.totalIterations,
            });
          } catch (e) {
            console.error('Failed to load demo preview:', fileName, e);
          }
        }

        setDemoLogs(previews);
      } catch (e) {
        console.error('Failed to load demo logs:', e);
      } finally {
        setLoadingDemos(false);
      }
    }

    loadDemoPreviews();
  }, []);

  const handleFileLoaded = useCallback((fileName: string, content: string) => {
    const parsed = parseLogFile(fileName, content);
    setLogFiles(prev => {
      if (prev.some(f => f.fileName === fileName)) {
        return prev.map(f => f.fileName === fileName ? parsed : f);
      }
      return [...prev, parsed];
    });
    setSelectedLog(parsed);
  }, []);

  const loadDemoLog = useCallback(async (fileName: string) => {
    try {
      const response = await fetch(`/logs/${fileName}`);
      if (!response.ok) throw new Error('Failed to load demo log');
      const content = await response.text();
      handleFileLoaded(fileName, content);
    } catch (error) {
      console.error('Error loading demo log:', error);
      alert('Failed to load demo log. Make sure the log files are in the public/logs folder.');
    }
  }, [handleFileLoaded]);

  const handleSessionSelect = useCallback((session: RLMSession) => {
    setCurrentSession(session);
    setActiveTab('sessions');
  }, []);

  // Log viewer mode
  if (selectedLog) {
    return (
      <LogViewer
        logFile={selectedLog}
        onBack={() => setSelectedLog(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 grid-pattern opacity-30 dark:opacity-15" />
      <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/3 rounded-full blur-3xl" />

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-border">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  <span className="text-primary">RLM</span>
                  <span className="text-muted-foreground ml-2 font-normal">v4 GUI</span>
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Self-Verification • Session Management • Real-time Progress
                </p>
              </div>
              <div className="flex items-center gap-4">
                <ThemeToggle />
                <ConnectionIndicator status={connectionStatus} />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content with Tabs */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'logs' | 'sessions' | 'stats')}>
            <TabsList className="mb-6">
              <TabsTrigger value="logs" className="gap-2">
                <span>📁</span> Log Files
              </TabsTrigger>
              <TabsTrigger value="sessions" className="gap-2">
                <span>⚡</span> Live Sessions
              </TabsTrigger>
              <TabsTrigger value="stats" className="gap-2">
                <span>📊</span> Stats
              </TabsTrigger>
            </TabsList>

            {/* Tab: Log Files */}
            <TabsContent value="logs">
              <div className="grid lg:grid-cols-2 gap-10">
                {/* Left Column - Upload & ASCII Art */}
                <div className="space-y-8">
                  <div>
                    <h2 className="text-sm font-medium mb-3 flex items-center gap-2 text-muted-foreground">
                      <span className="text-primary font-mono">01</span>
                      Upload Log File
                    </h2>
                    <FileUploader onFileLoaded={handleFileLoaded} />
                  </div>

                  <div className="hidden lg:block">
                    <h2 className="text-sm font-medium mb-3 flex items-center gap-2 text-muted-foreground">
                      <span className="text-primary font-mono">◈</span>
                      RLM Architecture
                    </h2>
                    <div className="bg-muted/50 border border-border rounded-lg p-4 overflow-x-auto">
                      <AsciiRLM />
                    </div>
                  </div>
                </div>

                {/* Right Column - Demo Logs & Loaded Files */}
                <div className="space-y-8">
                  <div>
                    <h2 className="text-sm font-medium mb-3 flex items-center gap-2 text-muted-foreground">
                      <span className="text-primary font-mono">02</span>
                      Recent Traces
                      <span className="text-[10px] text-muted-foreground/60 ml-1">(latest 10)</span>
                    </h2>

                    {loadingDemos ? (
                      <Card>
                        <CardContent className="p-6 text-center">
                          <div className="animate-pulse flex items-center justify-center gap-2 text-muted-foreground text-sm">
                            Loading traces...
                          </div>
                        </CardContent>
                      </Card>
                    ) : demoLogs.length === 0 ? (
                      <Card className="border-dashed">
                        <CardContent className="p-6 text-center text-muted-foreground text-sm">
                          No log files found in /public/logs/
                        </CardContent>
                      </Card>
                    ) : (
                      <ScrollArea className="h-[320px]">
                        <div className="space-y-2 pr-4">
                          {demoLogs.map((demo) => (
                            <Card
                              key={demo.fileName}
                              onClick={() => loadDemoLog(demo.fileName)}
                              className={cn(
                                'cursor-pointer transition-all hover:scale-[1.01]',
                                'hover:border-primary/50 hover:bg-primary/5'
                              )}
                            >
                              <CardContent className="p-3">
                                <div className="flex items-center gap-3">
                                  <div className="relative flex-shrink-0">
                                    <div className={cn(
                                      'w-2.5 h-2.5 rounded-full',
                                      demo.hasFinalAnswer
                                        ? 'bg-primary'
                                        : 'bg-muted-foreground/30'
                                    )} />
                                    {demo.hasFinalAnswer && (
                                      <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-primary animate-ping opacity-50" />
                                    )}
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-mono text-xs text-foreground/80">
                                        {demo.fileName}
                                      </span>
                                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">
                                        {demo.iterations} iter
                                      </Badge>
                                    </div>
                                    {demo.contextPreview && (
                                      <p className="text-[11px] font-mono text-muted-foreground truncate">
                                        {demo.contextPreview.length > 80
                                          ? demo.contextPreview.slice(0, 80) + '...'
                                          : demo.contextPreview}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </div>

                  {logFiles.length > 0 && (
                    <div>
                      <h2 className="text-sm font-medium mb-3 flex items-center gap-2 text-muted-foreground">
                        <span className="text-primary font-mono">03</span>
                        Loaded Files
                      </h2>
                      <ScrollArea className="h-[200px]">
                        <div className="space-y-2 pr-4">
                          {logFiles.map((log) => (
                            <Card
                              key={log.fileName}
                              className={cn(
                                'cursor-pointer transition-all hover:scale-[1.01]',
                                'hover:border-primary/50 hover:bg-primary/5'
                              )}
                              onClick={() => setSelectedLog(log)}
                            >
                              <CardContent className="p-3">
                                <div className="flex items-center gap-3">
                                  <div className="relative flex-shrink-0">
                                    <div className={cn(
                                      'w-2.5 h-2.5 rounded-full',
                                      log.metadata.finalAnswer
                                        ? 'bg-primary'
                                        : 'bg-muted-foreground/30'
                                    )} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-mono text-xs truncate text-foreground/80">
                                        {log.fileName}
                                      </span>
                                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">
                                        {log.metadata.totalIterations} iter
                                      </Badge>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground truncate">
                                      {log.metadata.contextQuestion}
                                    </p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Tab: Live Sessions */}
            <TabsContent value="sessions">
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Left: Session Manager */}
                <div className="lg:col-span-1">
                  <SessionManager onSelectSession={handleSessionSelect} />
                </div>

                {/* Right: Completion Panel */}
                <div className="lg:col-span-2">
                  <LiveCompletionPanel session={currentSession} />
                </div>
              </div>
            </TabsContent>

            {/* Tab: Stats */}
            <TabsContent value="stats">
              <StatsDashboard />
            </TabsContent>
          </Tabs>
        </main>

        {/* Footer */}
        <footer className="border-t border-border mt-8">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <p className="text-[10px] text-muted-foreground font-mono">
              RLM v4 GUI • Self-Verification & Session Management
            </p>
            <p className="text-[10px] text-muted-foreground font-mono">
              Prompt → [LM ↔ REPL] → Verified Answer
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

/** Connection status indicator */
function ConnectionIndicator({ status }: { status: ConnectionStatus }) {
  const colors = {
    connected: 'bg-green-500',
    disconnected: 'bg-red-500',
    checking: 'bg-yellow-500 animate-pulse',
    error: 'bg-red-500',
  };

  const labels = {
    connected: 'CONNECTED',
    disconnected: 'DISCONNECTED',
    checking: 'CHECKING',
    error: 'ERROR',
  };

  return (
    <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
      <span className="flex items-center gap-1.5">
        <span className={cn('w-1.5 h-1.5 rounded-full', colors[status])} />
        {labels[status]}
      </span>
    </div>
  );
}
