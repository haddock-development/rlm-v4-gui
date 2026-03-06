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
  // v4.1 Multi-Agent
  TaskDecomposition,
  AgentResult,
  AggregationResult,
  MultiAgentOptions,
  AgentType,
  // v4.2 Self-Improvement
  Improvement,
  ImprovementStats,
  SelfImproveResult,
  // v4.3 Config
  RLMConfig,
  AgentConfig,
  Skill,
  ConfigResponse,
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

  // ===========================================================================
  // v4.1 Multi-Agent
  // ===========================================================================

  /** Run multi-agent completion */
  async multiAgentCompletion(options: MultiAgentOptions): Promise<AggregationResult> {
    return this.request<AggregationResult>('/tools/rlm_multi_agent', {
      method: 'POST',
      body: JSON.stringify(options),
    });
  }

  /** Get task decomposition */
  async getTaskDecomposition(task: string, agents?: AgentType[]): Promise<TaskDecomposition> {
    return this.request<TaskDecomposition>('/multi-agent/decompose', {
      method: 'POST',
      body: JSON.stringify({ task, agents }),
    });
  }

  /** Get available agent types */
  async listAgentTypes(): Promise<{ agents: AgentType[] }> {
    return this.request('/multi-agent/agents');
  }

  // ===========================================================================
  // v4.2 Self-Improvement
  // ===========================================================================

  /** Run self-improvement completion */
  async selfImproveCompletion(prompt: string): Promise<SelfImproveResult> {
    return this.request<SelfImproveResult>('/tools/rlm_self_improve', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    });
  }

  /** Get improvement statistics */
  async getImprovementStats(): Promise<ImprovementStats> {
    return this.request<ImprovementStats>('/improvements/stats');
  }

  /** List all improvements */
  async listImprovements(): Promise<{ improvements: Improvement[] }> {
    return this.request('/improvements/list');
  }

  /** Get specific improvement */
  async getImprovement(improvementId: string): Promise<Improvement> {
    return this.request<Improvement>(`/improvements/${improvementId}`);
  }

  /** Delete improvement */
  async deleteImprovement(improvementId: string): Promise<{ deleted: boolean }> {
    return this.request(`/improvements/${improvementId}`, { method: 'DELETE' });
  }

  // ===========================================================================
  // v4.3 Configuration
  // ===========================================================================

  /** Get full configuration */
  async getConfig(): Promise<ConfigResponse> {
    return this.request<ConfigResponse>('/config');
  }

  /** Update configuration */
  async updateConfig(config: Partial<RLMConfig>): Promise<{ updated: boolean; config: RLMConfig }> {
    return this.request('/config', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  /** Reload configuration from files */
  async reloadConfig(): Promise<{ reloaded: boolean; config: RLMConfig }> {
    return this.request('/config/reload', { method: 'POST' });
  }

  /** Export configuration as YAML */
  async exportConfig(): Promise<{ yaml: string }> {
    return this.request('/config/export');
  }

  // ===========================================================================
  // v4.3 Agents
  // ===========================================================================

  /** Get all agents */
  async getAgents(): Promise<{ agents: Record<string, AgentConfig> }> {
    return this.request('/config/agents');
  }

  /** Get specific agent */
  async getAgent(name: string): Promise<AgentConfig> {
    return this.request<AgentConfig>(`/config/agents/${name}`);
  }

  /** Update agent configuration */
  async updateAgent(name: string, config: Partial<AgentConfig>): Promise<{ updated: boolean; agent: AgentConfig }> {
    return this.request(`/config/agents/${name}`, {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  /** Get agent skills */
  async getAgentSkills(name: string): Promise<{ skills: Skill[] }> {
    return this.request(`/config/agents/${name}/skills`);
  }

  /** Add skill to agent */
  async addAgentSkill(name: string, skillId: string): Promise<{ added: boolean }> {
    return this.request(`/config/agents/${name}/skills`, {
      method: 'POST',
      body: JSON.stringify({ skill_id: skillId }),
    });
  }

  /** Remove skill from agent */
  async removeAgentSkill(name: string, skillId: string): Promise<{ removed: boolean }> {
    return this.request(`/config/agents/${name}/skills/${skillId}`, { method: 'DELETE' });
  }

  // ===========================================================================
  // v4.3 Skills
  // ===========================================================================

  /** Get all skills */
  async getSkills(): Promise<{ skills: Record<string, Skill> }> {
    return this.request('/config/skills');
  }

  /** Get specific skill */
  async getSkill(skillId: string): Promise<Skill> {
    return this.request<Skill>(`/config/skills/${skillId}`);
  }

  /** Create new skill */
  async createSkill(skill: Partial<Skill> & { id: string }): Promise<{ created: boolean; skill: Skill }> {
    return this.request('/config/skills', {
      method: 'POST',
      body: JSON.stringify(skill),
    });
  }

  /** Update skill */
  async updateSkill(skillId: string, skill: Partial<Skill>): Promise<{ updated: boolean; skill: Skill }> {
    return this.request(`/config/skills/${skillId}`, {
      method: 'PUT',
      body: JSON.stringify(skill),
    });
  }

  /** Delete skill */
  async deleteSkill(skillId: string): Promise<{ deleted: boolean }> {
    return this.request(`/config/skills/${skillId}`, { method: 'DELETE' });
  }
}

// Singleton instance with default URL
export const rlmClient = new RLMv4Client(
  process.env.NEXT_PUBLIC_RLM_V4_URL || DEFAULT_BASE_URL
);

// Export for custom instances
export default RLMv4Client;
