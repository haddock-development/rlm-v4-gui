// Types matching the RLM log format

export interface RLMChatCompletion {
  prompt: string | Record<string, unknown>;
  response: string;
  prompt_tokens: number;
  completion_tokens: number;
  execution_time: number;
}

export interface REPLResult {
  stdout: string;
  stderr: string;
  locals: Record<string, unknown>;
  execution_time: number;
  rlm_calls: RLMChatCompletion[];
}

export interface CodeBlock {
  code: string;
  result: REPLResult;
}

export interface RLMIteration {
  type?: string;
  iteration: number;
  timestamp: string;
  prompt: Array<{ role: string; content: string }>;
  response: string;
  code_blocks: CodeBlock[];
  final_answer: string | [string, string] | null;
  iteration_time: number | null;
}

// Metadata saved at the start of a log file about RLM configuration
export interface RLMConfigMetadata {
  root_model: string | null;
  max_depth: number | null;
  max_iterations: number | null;
  backend: string | null;
  backend_kwargs: Record<string, unknown> | null;
  environment_type: string | null;
  environment_kwargs: Record<string, unknown> | null;
  other_backends: string[] | null;
}

export interface RLMLogFile {
  fileName: string;
  filePath: string;
  iterations: RLMIteration[];
  metadata: LogMetadata;
  config: RLMConfigMetadata;
}

export interface LogMetadata {
  totalIterations: number;
  totalCodeBlocks: number;
  totalSubLMCalls: number;
  contextQuestion: string;
  finalAnswer: string | null;
  totalExecutionTime: number;
  hasErrors: boolean;
}

export function extractFinalAnswer(answer: string | [string, string] | null): string | null {
  if (!answer) return null;
  if (Array.isArray(answer)) {
    return answer[1];
  }
  return answer;
}

// ============================================================================
// RLM v4 Types - Self-Verification & Session Management
// ============================================================================

/** Confidence levels for verification */
export type ConfidenceLevel = 'high' | 'medium' | 'low';

/** Verification status */
export type VerificationStatus = 'verified' | 'unverified' | 'pending' | 'skipped';

/** Verification method used */
export type VerificationMethod =
  | 'dual_approach_match'
  | 'resolution_match_first'
  | 'resolution_match_second'
  | 'unresolved_mismatch'
  | 'skipped_high_confidence'
  | 'none';

/** Result of a self-verification process */
export interface VerificationResult {
  response: string;
  verified: boolean;
  confidence: number;
  attempts: string[];
  verification_method: VerificationMethod;
  mismatch_details?: string;
  execution_time: number;
  metadata?: Record<string, unknown>;
}

/** Context version for session history */
export interface ContextVersion {
  version: number;
  message_count: number;
  created_at: string;
  token_count: number;
  summary?: string;
}

/** Progress status for running completions */
export type ProgressStatus = 'idle' | 'running' | 'completed' | 'error';

/** Real-time progress tracking */
export interface SessionProgress {
  session_id: string;
  status: ProgressStatus;
  current_depth: number;
  current_iteration: number;
  subcalls: SubcallEvent[];
  iterations: IterationEvent[];
  started_at?: string;
  completed_at?: string;
  error?: string;
}

/** Subcall event for progress tracking */
export interface SubcallEvent {
  type: 'start' | 'complete';
  depth: number;
  model?: string;
  prompt_preview?: string;
  duration?: number;
  error?: string;
  timestamp: string;
}

/** Iteration event for progress tracking */
export interface IterationEvent {
  type: 'start' | 'complete';
  depth: number;
  iteration: number;
  duration?: number;
  timestamp: string;
}

/** RLM v4 Session with persistent REPL */
export interface RLMSession {
  session_id: string;
  created_at: string;
  last_used_at: string;
  model: string;
  context_versions: ContextVersion[];
  progress?: SessionProgress;
  metadata?: Record<string, unknown>;
  has_verifier: boolean;
}

/** Session creation options */
export interface CreateSessionOptions {
  model?: string;
  enable_verification?: boolean;
}

/** Completion options */
export interface CompletionOptions {
  prompt: string;
  root_prompt?: string;
  verify?: boolean;
  force_verify?: boolean;
}

/** Global verification statistics */
export interface VerificationStats {
  total_sessions: number;
  sessions_with_verification: number;
  total_verifications: number;
  verification_config: {
    enabled: boolean;
    threshold: number;
    store_failures: boolean;
  };
  recent_failures?: VerificationFailure[];
}

/** Verification failure record */
export interface VerificationFailure {
  type: 'verification_mismatch';
  prompt: string;
  attempts: string[];
  timestamp: string;
  resolved?: boolean;
}

/** Session-specific verification stats */
export interface SessionVerificationStats {
  session_id: string;
  verification_enabled: boolean;
  total?: number;
  verified?: number;
  unresolved?: number;
  recent_failures?: VerificationFailure[];
  message?: string;
}

/** API Health check response */
export interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  version: string;
  sessions: number;
  verification_enabled: boolean;
}

/** API Server info */
export interface ServerInfo {
  name: string;
  version: string;
  rlm_sdk_version: string;
  features: string[];
  config: {
    max_depth: number;
    max_iterations: number;
    model: string;
    verification_enabled: boolean;
    verification_threshold: number;
    compaction_enabled: boolean;
    compaction_threshold: number;
    session_timeout: number;
    max_sessions: number;
  };
}

/** Completion response from session */
export interface SessionCompletionResponse {
  response: string;
  root_model: string;
  execution_time: number;
  metadata?: Record<string, unknown>;
  context_version: number;
  verified: boolean;
  verification_method: VerificationMethod;
  progress?: SessionProgress;
}

/** Connection status for GUI */
export type ConnectionStatus = 'connected' | 'disconnected' | 'error' | 'checking';

/** Helper to get confidence level from score */
export function getConfidenceLevel(score: number): ConfidenceLevel {
  if (score >= 0.8) return 'high';
  if (score >= 0.5) return 'medium';
  return 'low';
}

/** Helper to get verification status color */
export function getVerificationColor(status: VerificationStatus): string {
  switch (status) {
    case 'verified':
      return 'text-green-500';
    case 'unverified':
      return 'text-red-500';
    case 'pending':
      return 'text-yellow-500';
    case 'skipped':
      return 'text-gray-500';
    default:
      return 'text-gray-400';
  }
}

/** Helper to get confidence color */
export function getConfidenceColor(level: ConfidenceLevel): string {
  switch (level) {
    case 'high':
      return 'text-green-500 bg-green-500/10';
    case 'medium':
      return 'text-yellow-500 bg-yellow-500/10';
    case 'low':
      return 'text-red-500 bg-red-500/10';
    default:
      return 'text-gray-400 bg-gray-400/10';
  }
}

