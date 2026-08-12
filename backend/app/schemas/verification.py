from typing import Optional, List
from pydantic import BaseModel, Field


# ---------- Request ----------

class VerifyRequest(BaseModel):
    text: str = Field(..., min_length=3, max_length=2000)
    url: Optional[str] = None
    title: Optional[str] = None
    surrounding_text: Optional[str] = Field(default=None, max_length=2000)
    language: Optional[str] = "en"


# ---------- Response sub-objects ----------

class Origin(BaseModel):
    description: Optional[str] = None
    url: Optional[str] = None


class Evidence(BaseModel):
    title: str
    url: str
    domain: str
    source_type: str  # academic | government | media | fact_check | general
    snippet: str


class MilChallenge(BaseModel):
    question: str
    options: List[str]
    correct_index: int
    feedback_correct: str
    feedback_incorrect: str


# ---------- Response ----------

class VerifyResponse(BaseModel):
    claim: str
    verdict: str  # SUPPORTED | REFUTED | MISLEADING | UNVERIFIED | CONTEXT_NEEDED
    confidence: str  # Low | Moderate | High
    summary: str
    origin: Origin
    evidence: List[Evidence] = []
    reasoning: str
    next_step: str
    mil_tip: str
    mil_skill: str
    mil_challenge: Optional[MilChallenge] = None
    error: Optional[str] = None
    # "search_unavailable" | "llm_unavailable" | "no_evidence" | "ambiguous_claim" | None
