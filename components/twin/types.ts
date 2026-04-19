export type TwinMessageRole = "user" | "twin" | "system";

export type TwinMessageTone = "default" | "scope" | "error";

export type TwinScopeCategory =
  | "mootez_context"
  | "project_context"
  | "career_context"
  | "opinion_context"
  | "prompt_injection"
  | "coding_request"
  | "general_knowledge"
  | "realtime_external"
  | "unknown";

export interface TwinUiMessage {
  id: string;
  role: TwinMessageRole;
  content: string;
  tone: TwinMessageTone;
  streaming: boolean;
}

export interface TwinScopeNoticeState {
  category: TwinScopeCategory;
  reason: string;
}

export interface TwinTurnMeta {
  providerId: string;
  providerModel: string;
  latencyMs: number;
  cached: boolean;
  validatorPassed: boolean;
}
