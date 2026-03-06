'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Send,
  Loader2,
  Check,
  X,
  AlertTriangle,
  Shield,
  Sparkles,
  ChevronDown,
  Copy,
  RotateCcw,
  Clock,
  Zap,
  MessageSquare,
  Terminal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RLMSession } from '@/lib/types';

interface LiveCompletionPanelProps {
  session: RLMSession | null;
  className?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  verified?: boolean;
  verificationScore?: number;
}

interface VerificationResult {
  passed: boolean;
  score: number;
  feedback?: string;
}

export function LiveCompletionPanel({ session, className }: LiveCompletionPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when session changes
  useEffect(() => {
    if (session && inputRef.current) {
      inputRef.current.focus();
    }
  }, [session]);

  const handleSubmit = useCallback(async () => {
    if (!input.trim() || isLoading || !session) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setVerificationResult(null);

    try {
      // Call the RLM v4 API
      const response = await fetch(`${process.env.NEXT_PUBLIC_RLM_V4_URL || 'http://192.168.0.55:5006'}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: session.session_id,
          prompt: userMessage.content,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: `msg-${Date.now()}-response`,
        role: 'assistant',
        content: data.response || data.completion || 'No response received',
        timestamp: new Date(),
        verified: data.verified ?? false,
        verificationScore: data.verification_score,
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (data.verification_result) {
        setVerificationResult({
          passed: data.verified ?? false,
          score: data.verification_score ?? 0,
          feedback: data.verification_feedback,
        });
      }
    } catch (error) {
      console.error('Completion error:', error);
      const errorMessage: Message = {
        id: `msg-${Date.now()}-error`,
        role: 'system',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, session]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const clearConversation = () => {
    setMessages([]);
    setVerificationResult(null);
  };

  // No session selected state
  if (!session) {
    return (
      <Card className={cn('border-dashed', className)}>
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-1">No Session Selected</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Create or select a session from the sidebar to start interacting with RLM v4
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <Card className="rounded-b-none border-b-0">
        <CardHeader className="py-3 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Terminal className="w-4 h-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">Live Completion</CardTitle>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground font-mono">
                    {session.session_id}
                  </span>
                  {session.has_verifier && (
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 gap-0.5 border-green-500/30 text-green-600 dark:text-green-400">
                      <Shield className="w-2.5 h-2.5" />
                      Verified
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs font-mono">
                {session.model}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={clearConversation}
                title="Clear conversation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Messages Area */}
      <Card className="flex-1 rounded-none border-x">
        <CardContent className="p-0 h-full">
          <ScrollArea className="h-full" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center p-8">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4">
                  <Sparkles className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-base font-semibold mb-2">Start a conversation</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Type a prompt below to begin. Responses will be verified automatically if verification is enabled.
                </p>
              </div>
            ) : (
              <div className="space-y-4 p-4">
                {messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    onCopy={copyToClipboard}
                  />
                ))}
                {isLoading && (
                  <div className="flex items-center gap-2 text-muted-foreground p-3">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Processing...</span>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Verification Result Panel */}
      {verificationResult && (
        <Card className="rounded-none border-x border-t-0">
          <CardContent className="py-3 px-4">
            <VerificationPanel result={verificationResult} />
        </CardContent>
        </Card>
      )}

      {/* Input Area */}
      <Card className="rounded-t-none border-t">
        <CardContent className="p-3">
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter your prompt..."
                disabled={isLoading}
                className="w-full px-4 py-3 pr-12 text-sm rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none min-h-[48px] max-h-[120px]"
                rows={1}
              />
              <div className="absolute right-3 bottom-3 text-[10px] text-muted-foreground/50">
                Press Enter to send
              </div>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={!input.trim() || isLoading}
              className="h-12 px-4 rounded-xl"
              size="sm"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/** Message bubble component */
function MessageBubble({
  message,
  onCopy,
}: {
  message: Message;
  onCopy: (text: string) => void;
}) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  return (
    <div className={cn(
      'group flex gap-3',
      isUser && 'flex-row-reverse'
    )}>
      {/* Avatar */}
      <div className={cn(
        'w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center',
        isUser ? 'bg-primary/10' : isSystem ? 'bg-destructive/10' : 'bg-muted'
      )}>
        {isUser ? (
          <MessageSquare className="w-4 h-4 text-primary" />
        ) : isSystem ? (
          <AlertTriangle className="w-4 h-4 text-destructive" />
        ) : (
          <Sparkles className="w-4 h-4 text-muted-foreground" />
        )}
      </div>

      {/* Content */}
      <div className={cn(
        'flex-1 max-w-[85%]',
        isUser && 'flex flex-col items-end'
      )}>
        <div className={cn(
          'rounded-xl px-4 py-3 text-sm',
          isUser ? 'bg-primary text-primary-foreground' :
          isSystem ? 'bg-destructive/10 border border-destructive/20' :
          'bg-muted'
        )}>
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>

        {/* Message metadata */}
        <div className={cn(
          'flex items-center gap-2 mt-1 text-[10px] text-muted-foreground',
          isUser ? 'flex-row-reverse' : ''
        )}>
          <span>{message.timestamp.toLocaleTimeString()}</span>
          {message.verified !== undefined && (
            <>
              <span>•</span>
              <Badge
                variant={message.verified ? 'default' : 'destructive'}
                className="text-[9px] px-1.5 py-0 h-4"
              >
                {message.verified ? (
                  <>
                    <Check className="w-2.5 h-2.5 mr-0.5" />
                    Verified ({(message.verificationScore! * 100).toFixed(0)}%)
                  </>
                ) : (
                  <>
                    <X className="w-2.5 h-2.5 mr-0.5" />
                    Failed
                  </>
                )}
              </Badge>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onCopy(message.content)}
          >
            <Copy className="w-2.5 h-2.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Verification result panel */
function VerificationPanel({ result }: { result: VerificationResult }) {
  return (
    <div className={cn(
      'flex items-center gap-3 p-2 rounded-lg',
      result.passed ? 'bg-green-500/10' : 'bg-destructive/10'
    )}>
      <div className={cn(
        'w-8 h-8 rounded-lg flex items-center justify-center',
        result.passed ? 'bg-green-500/20' : 'bg-destructive/20'
      )}>
        {result.passed ? (
          <Check className="w-4 h-4 text-green-500" />
        ) : (
          <X className="w-4 h-4 text-destructive" />
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className={cn(
            'text-sm font-medium',
            result.passed ? 'text-green-600 dark:text-green-400' : 'text-destructive'
          )}>
            {result.passed ? 'Verification Passed' : 'Verification Failed'}
          </span>
          <Badge variant="outline" className="text-[10px] font-mono">
            {(result.score * 100).toFixed(0)}%
          </Badge>
        </div>
        {result.feedback && (
          <p className="text-xs text-muted-foreground mt-0.5">{result.feedback}</p>
        )}
      </div>
    </div>
  );
}

/** Export alias for backward compatibility */
export const CompletionWidget = LiveCompletionPanel;
