'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Zap,
  BarChart3,
  Settings,
  Bot,
  Target,
  TrendingUp,
  RefreshCw,
  Upload,
  FolderOpen,
  Check,
  AlertCircle,
  Clock,
  ChevronRight,
  Activity,
  Moon,
  Sun
} from 'lucide-react';
import { FileUploader } from './FileUploader';
import { LogViewer } from './LogViewer';
import { AsciiRLM } from './AsciiGlobe';
import { ThemeToggle } from './ThemeToggle';
import { SessionManager } from './SessionManager';
import { LiveCompletionPanel } from './LiveCompletionPanel';
import { StatsDashboard } from './StatsDashboard';
import { ConfigDashboard } from './ConfigDashboard';
import { AgentsOverview } from './AgentsOverview';
import { SkillsLibrary } from './SkillsLibrary';
import { ImprovementDashboard } from './ImprovementDashboard';
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
  const [activeTab, setActiveTab] = useState<'logs' | 'sessions' | 'stats' | 'config' | 'agents' | 'skills' | 'improvements'>('sessions');

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
      <div className="absolute inset-0 grid-pattern opacity-40 dark:opacity-20" />
      <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/3 rounded-full blur-3xl" />

      <div className="relative z-10">
        {/* Professional Header */}
        <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Logo & Title */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20">
                    <Activity className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-green-500 border-2 border-background status-pulse" />
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
                    <span className="text-primary">RLM</span>
                    <Badge variant="secondary" className="font-mono text-[10px]">v4.0</Badge>
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    Self-Verification • Session Management • Multi-Agent
                  </p>
                </div>
              </div>

              {/* Status & Actions */}
              <div className="flex items-center gap-3">
                <ConnectionBadge status={connectionStatus} />
                <div className="h-6 w-px bg-border" />
                <ThemeToggle />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content with Professional Tabs */}
        <main className="max-w-7xl mx-auto px-6 py-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <div className="flex items-center justify-between mb-6">
              <TabsList className="bg-muted/50 p-1 h-auto">
                <TabsTrigger value="sessions" className="gap-2 px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <Zap className="w-4 h-4" />
                  <span className="hidden sm:inline">Live Sessions</span>
                </TabsTrigger>
                <TabsTrigger value="logs" className="gap-2 px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline">Log Files</span>
                </TabsTrigger>
                <TabsTrigger value="stats" className="gap-2 px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <BarChart3 className="w-4 h-4" />
                  <span className="hidden sm:inline">Stats</span>
                </TabsTrigger>
                <TabsTrigger value="agents" className="gap-2 px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <Bot className="w-4 h-4" />
                  <span className="hidden sm:inline">Agents</span>
                </TabsTrigger>
                <TabsTrigger value="skills" className="gap-2 px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <Target className="w-4 h-4" />
                  <span className="hidden sm:inline">Skills</span>
                </TabsTrigger>
                <TabsTrigger value="improvements" className="gap-2 px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <TrendingUp className="w-4 h-4" />
                  <span className="hidden sm:inline">Improvements</span>
                </TabsTrigger>
                <TabsTrigger value="config" className="gap-2 px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">Config</span>
                </TabsTrigger>
              </TabsList>

              {/* Quick Actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 text-xs"
                  onClick={() => {/* refresh logic */}}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Tab: Live Sessions (Default) */}
            <TabsContent value="sessions" className="mt-0">
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

            {/* Tab: Log Files */}
            <TabsContent value="logs" className="mt-0">
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Left Column - Upload & ASCII Art */}
                <div className="space-y-6">
                  <div>
                    <h2 className="text-sm font-semibold mb-3 flex items-center gap-2 text-foreground">
                      <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
                        <Upload className="w-3.5 h-3.5 text-primary" />
                      </div>
                      Upload Log File
                    </h2>
                    <FileUploader onFileLoaded={handleFileLoaded} />
                  </div>

                  <div className="hidden lg:block">
                    <h2 className="text-sm font-semibold mb-3 flex items-center gap-2 text-foreground">
                      <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
                        <Activity className="w-3.5 h-3.5 text-primary" />
                      </div>
                      RLM Architecture
                    </h2>
                    <div className="bg-muted/30 border border-border rounded-xl p-4 overflow-x-auto">
                      <AsciiRLM />
                    </div>
                  </div>
                </div>

                {/* Right Column - Demo Logs & Loaded Files */}
                <div className="space-y-6">
                  <div>
                    <h2 className="text-sm font-semibold mb-3 flex items-center gap-2 text-foreground">
                      <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
                        <FolderOpen className="w-3.5 h-3.5 text-primary" />
                      </div>
                      Recent Traces
                      <Badge variant="outline" className="text-[10px] ml-auto">Latest 10</Badge>
                    </h2>

                    {loadingDemos ? (
                      <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="h-16 skeleton rounded-lg" />
                        ))}
                      </div>
                    ) : demoLogs.length === 0 ? (
                      <Card className="border-dashed border-2">
                        <CardContent className="p-8 text-center">
                          <FileText className="w-8 h-8 text-muted-foreground/50 mx-auto mb-3" />
                          <p className="text-sm text-muted-foreground">No log files found</p>
                          <p className="text-xs text-muted-foreground/60 mt-1">Add logs to /public/logs/</p>
                        </CardContent>
                      </Card>
                    ) : (
                      <ScrollArea className="h-[340px] pr-4">
                        <div className="space-y-2">
                          {demoLogs.map((demo) => (
                            <Card
                              key={demo.fileName}
                              onClick={() => loadDemoLog(demo.fileName)}
                              className={cn(
                                'cursor-pointer group card-hover',
                                'hover:border-primary/40 hover:bg-primary/5'
                              )}
                            >
                              <CardContent className="p-3">
                                <div className="flex items-center gap-3">
                                  <div className={cn(
                                    'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                                    demo.hasFinalAnswer
                                      ? 'bg-green-500/10 text-green-500'
                                      : 'bg-muted text-muted-foreground'
                                  )}>
                                    {demo.hasFinalAnswer ? (
                                      <Check className="w-4 h-4" />
                                    ) : (
                                      <Clock className="w-4 h-4" />
                                    )}
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                      <span className="font-mono text-xs text-foreground/90 truncate">
                                        {demo.fileName}
                                      </span>
                                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 font-mono">
                                        {demo.iterations} iter
                                      </Badge>
                                    </div>
                                    {demo.contextPreview && (
                                      <p className="text-[11px] font-mono text-muted-foreground truncate">
                                        {demo.contextPreview.length > 60
                                          ? demo.contextPreview.slice(0, 60) + '...'
                                          : demo.contextPreview}
                                      </p>
                                    )}
                                  </div>

                                  <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
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
                      <h2 className="text-sm font-semibold mb-3 flex items-center gap-2 text-foreground">
                        <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
                          <FileText className="w-3.5 h-3.5 text-primary" />
                        </div>
                        Loaded Files
                      </h2>
                      <ScrollArea className="h-[180px] pr-4">
                        <div className="space-y-2">
                          {logFiles.map((log) => (
                            <Card
                              key={log.fileName}
                              className={cn(
                                'cursor-pointer group card-hover',
                                'hover:border-primary/40 hover:bg-primary/5'
                              )}
                              onClick={() => setSelectedLog(log)}
                            >
                              <CardContent className="p-3">
                                <div className="flex items-center gap-3">
                                  <div className={cn(
                                    'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                                    log.metadata.finalAnswer
                                      ? 'bg-green-500/10 text-green-500'
                                      : 'bg-muted text-muted-foreground'
                                  )}>
                                    <Check className="w-4 h-4" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                      <span className="font-mono text-xs truncate text-foreground/90">
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
                                  <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
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

            {/* Tab: Stats */}
            <TabsContent value="stats" className="mt-0">
              <StatsDashboard />
            </TabsContent>

            {/* Tab: Config */}
            <TabsContent value="config" className="mt-0">
              <ConfigDashboard />
            </TabsContent>

            {/* Tab: Agents */}
            <TabsContent value="agents" className="mt-0">
              <AgentsOverview />
            </TabsContent>

            {/* Tab: Skills */}
            <TabsContent value="skills" className="mt-0">
              <SkillsLibrary />
            </TabsContent>

            {/* Tab: Improvements */}
            <TabsContent value="improvements" className="mt-0">
              <ImprovementDashboard />
            </TabsContent>
          </Tabs>
        </main>

        {/* Professional Footer */}
        <footer className="border-t border-border mt-8 bg-muted/20">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span className="font-mono">RLM v4 GUI</span>
                <span className="text-border">|</span>
                <span>Self-Verification & Session Management</span>
              </div>
              <div className="flex items-center gap-2 font-mono text-[10px]">
                <span className="text-primary">Prompt</span>
                <span>→</span>
                <span className="text-muted-foreground">[LM ↔ REPL]</span>
                <span>→</span>
                <span className="text-green-500">Verified Answer</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

/** Professional connection status badge */
function ConnectionBadge({ status }: { status: ConnectionStatus }) {
  const config = {
    connected: {
      bg: 'bg-green-500/10 border-green-500/20',
      text: 'text-green-600 dark:text-green-400',
      dot: 'bg-green-500',
      label: 'Connected',
      icon: Check,
    },
    disconnected: {
      bg: 'bg-red-500/10 border-red-500/20',
      text: 'text-red-600 dark:text-red-400',
      dot: 'bg-red-500',
      label: 'Disconnected',
      icon: AlertCircle,
    },
    checking: {
      bg: 'bg-yellow-500/10 border-yellow-500/20',
      text: 'text-yellow-600 dark:text-yellow-400',
      dot: 'bg-yellow-500 animate-pulse',
      label: 'Checking',
      icon: RefreshCw,
    },
    error: {
      bg: 'bg-red-500/10 border-red-500/20',
      text: 'text-red-600 dark:text-red-400',
      dot: 'bg-red-500',
      label: 'Error',
      icon: AlertCircle,
    },
  };

  const { bg, text, dot, label, icon: Icon } = config[status];
  const isAnimating = status === 'checking' || status === 'connected';

  return (
    <div className={cn(
      'flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium',
      bg, text
    )}>
      <span className="relative flex h-2 w-2">
        {isAnimating && (
          <span className={cn('absolute inline-flex h-full w-full rounded-full opacity-75', dot, 'animate-ping')} />
        )}
        <span className={cn('relative inline-flex rounded-full h-2 w-2', dot)} />
      </span>
      <Icon className="w-3.5 h-3.5" />
      <span>{label}</span>
    </div>
  );
}
