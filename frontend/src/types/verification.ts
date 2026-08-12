/**
 * Shared contract with Person 2 (backend).
 * DO NOT change these shapes without a sync — see plan docs §"Shared Contract".
 * This file should be the single source of truth for the request/response
 * shape on the frontend side.
 */

export type Verdict =
  | "SUPPORTED"
  | "REFUTED"
  | "MISLEADING"
  | "UNVERIFIED"
  | "CONTEXT_NEEDED";

export type Confidence = "Low" | "Moderate" | "High";

export type SourceType =
  | "academic"
  | "government"
  | "media"
  | "fact_check"
  | "general";

export type BackendErrorCode =
  | "search_unavailable"
  | "llm_unavailable"
  | "no_evidence"
  | "ambiguous_claim";

export interface VerifyRequest {
  text: string;
  url: string;
  title: string;
  surrounding_text: string;
  language: string;
}

export interface Origin {
  description: string | null;
  url: string | null;
}

export interface EvidenceItem {
  title: string;
  url: string;
  domain: string;
  source_type: SourceType;
  snippet: string;
}

export interface MilChallenge {
  question: string;
  options: string[];
  correct_index: number;
  feedback_correct: string;
  feedback_incorrect: string;
}

export interface VerifyResponse {
  claim: string;
  verdict: Verdict;
  confidence: Confidence;
  summary: string;
  origin: Origin;
  evidence: EvidenceItem[];
  reasoning: string;
  next_step: string;
  mil_tip: string;
  mil_skill: string;
  mil_challenge: MilChallenge | null;
  error: BackendErrorCode | null;
}

/** Message passed from the content script / background worker into the side panel. */
export interface SelectionPayload {
  text: string;
  url: string;
  title: string;
  surrounding_text: string;
  language: string;
}

export const SANAD_MESSAGE = {
  OPEN_WITH_SELECTION: "SANAD_OPEN_WITH_SELECTION",
  SELECTION_CAPTURED: "SANAD_SELECTION_CAPTURED",
} as const;
