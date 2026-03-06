/**
 * RLM v4 API Client
 *
 * Client for communicating with the RLM v4 MCP Server
 * Default URL: http://localhost:5006
 */

import type {
  HealthResponse,
  ServerInfo,
  RLMSession,
  CreateSessionOptions,
  CompletionOptions,
  SessionCompletionResponse,
  SessionProgress,
  ContextVersion,
  VerificationStats,
  SessionVerificationStats,
  VerificationResult,
  ConnectionStatus,
} from './types';

const DEFAULT_BASE_URL = 'http://localhost:5006';

export class RLMv4Client {
  private baseUrl: string;
  private abortController: AbortController | null = null;

  constructor(baseUrl: string = DEFAULT_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /** Set base URL for API calls */
  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  /** Get current base URL */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /** Cancel any ongoing request */
  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  /** Make a fetch request with error handling */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    this.abortController = new AbortController();

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        signal: this.abortController.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } finally {
      this.abortController = null;
    }
  }

  // ===========================================================================
  // Health & Info
  // ===========================================================================

  /** Check server health */
  async health(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/health');
  }

  /** Get server info */
  async info(): Promise<ServerInfo> {
    return this.request<ServerInfo>('/info');
  }

  /** Check connection status */
  async checkConnection(): Promise<ConnectionStatus> {
    try {
      const health = await this.health();
      return health.status === 'healthy' ? 'connected' : 'error';
    } catch {
      return 'disconnected';
    }
  }

  // ===========================================================================
  // Sessions
  // ===========================================================================

  /** List all sessions */
  async listSessions(): Promise<{ sessions: RLMSession[]; count: number }> {
    return this.request('/sessions');
  }

  /** Create a new session */
  async createSession(options: CreateSessionOptions = {}): Promise<RLMSession> {
    const response = await this.request<{ session_id: string; created_at: string; model: string; verification_enabled: boolean }>('/sessions', {
      method: 'POST',
      body: JSON.stringify(options),
    });

    // Fetch full session details
    return this.getSession(response.session_id);
  }

  /** Get session details */
  async getSession(sessionId: string): Promise<RLMSession> {
    return this.request<RLMSession>(`/sessions/${sessionId}`);
  }

  /** Delete a session */
  async deleteSession(sessionId: string): Promise<{ deleted: boolean }> {
    return this.request(`/sessions/${sessionId}`, { method: 'DELETE' });
  }

  /** Get session progress */
  async getProgress(sessionId: string): Promise<SessionProgress> {
    return this.request<SessionProgress>(`/sessions/${sessionId}/progress`);
  }

  /** Get context versions for a session */
  async getContexts(sessionId: string): Promise<{ contexts: ContextVersion[]; current_version: number }> {
    return this.request(`/sessions/${sessionId}/contexts`);
  }

  /** Get specific context version */
  async getContext(sessionId: string, version: number): Promise<ContextVersion & { messages: Array<{ role: string; content: string }> }> {
    return this.request(`/sessions/${sessionId}/contexts/${version}`);
  }

  // ===========================================================================
  // Completions
  // ===========================================================================

  /** Run completion in a session */
  async complete(sessionId: string, options: CompletionOptions): Promise<SessionCompletionResponse> {
    return this.request<SessionCompletionResponse>(`/sessions/${sessionId}/complete`, {
      method: 'POST',
      body: JSON.stringify(options),
    });
  }

  /** Stateless verified completion */
  async verifiedCompletion(options: CompletionOptions): Promise<VerificationResult> {
    return this.request<VerificationResult>('/tools/rlm_completion_verified', {
      method: 'POST',
      body: JSON.stringify(options),
    });
  }

  /** Stateless completion without verification */
  async completion(prompt: string, model?: string): Promise<{
    response: string;
    root_model: string;
    execution_time: number;
    metadata?: Record<string, unknown>;
  }> {
    return this.request('/tools/rlm_completion', {
      method: 'POST',
      body: JSON.stringify({ prompt, model }),
    });
  }

  // ===========================================================================
  // Verification Stats
  // ===========================================================================

  /** Get global verification stats */
  async getVerificationStats(): Promise<VerificationStats> {
    return this.request<VerificationStats>('/verification/stats');
  }

  /** Get session-specific verification stats */
  async getSessionVerificationStats(sessionId: string): Promise<SessionVerificationStats> {
    return this.request<SessionVerificationStats>(`/sessions/${sessionId}/verification/stats`);
  }

  /** Score confidence for a response */
  async scoreConfidence(response: string, prompt?: string): Promise<{
    confidence: number;
    level: 'high' | 'medium' | 'low';
  }> {
    return this.request('/confidence/score', {
      method: 'POST',
      body: JSON.stringify({ response, prompt }),
    });
  }

  // ===========================================================================
  // Knowledge Graph & Vector Store
  // ===========================================================================

  /** Search Graphiti knowledge graph */
  async graphitiSearch(query: string): Promise<{ results: unknown[] }> {
    return this.request('/tools/graphiti_search', {
      method: 'POST',
      body: JSON.stringify({ query }),
    });
  }

  /** Search memclawz vector store */
  async memclawzQuery(query: string): Promise<{ results: unknown[] }> {
    return this.request('/tools/memclawz_query', {
      method: 'POST',
      body: JSON.stringify({ query }),
    });
  }
}

// Singleton instance with default URL
export const rlmClient = new RLMv4Client(
  process.env.NEXT_PUBLIC_RLM_V4_URL || DEFAULT_BASE_URL
);

// Export for custom instances
export default RLMv4Client;
