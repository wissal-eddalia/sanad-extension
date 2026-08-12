"""
Orchestrates the full pipeline: preprocess -> retrieve (parallel) -> normalize
-> rank -> LLM verify -> assemble response. Every failure path still returns
a valid VerifyResponse (HTTP 200) with `error` set — callers never see a
raw exception.
"""
import asyncio
from typing import Optional
from app.schemas.verification import (
    VerifyRequest, VerifyResponse, Origin, Evidence, MilChallenge,
)
from app.services import search_service, evidence_service, source_ranker, llm_service

CONFIDENCE_LOW = "Low"
CONFIDENCE_MODERATE = "Moderate"
CONFIDENCE_HIGH = "High"


def _bucket_confidence(score: float) -> str:
    if score < 0.40:
        return CONFIDENCE_LOW
    if score < 0.70:
        return CONFIDENCE_MODERATE
    return CONFIDENCE_HIGH


def _is_ambiguous(text: str) -> bool:
    # Simple heuristic for MVP: too short to contain an evaluable claim.
    return len(text.strip().split()) < 4


def _fallback_response(claim: str, verdict: str, error: str, message: str) -> VerifyResponse:
    return VerifyResponse(
        claim=claim,
        verdict=verdict,
        confidence=CONFIDENCE_LOW,
        summary=message,
        origin=Origin(description=None, url=None),
        evidence=[],
        reasoning=message,
        next_step="Try selecting a more complete sentence, or try again shortly.",
        mil_tip="When a tool can't verify something, that's not the same as it being false — always keep checking.",
        mil_skill="context_checking",
        mil_challenge=None,
        error=error,
    )


async def verify_claim(request: VerifyRequest) -> VerifyResponse:
    claim = request.text.strip()

    if _is_ambiguous(claim):
        return _fallback_response(
            claim, "CONTEXT_NEEDED", "ambiguous_claim",
            "This claim needs more context. Try selecting the complete sentence or paragraph.",
        )

    # --- Retrieval (parallel) ---
    try:
        raw_results = await search_service.search(claim)
    except search_service.SearchUnavailableError:
        return _fallback_response(
            claim, "UNVERIFIED", "search_unavailable",
            "Unable to retrieve external evidence right now. Please try again.",
        )

    normalized = evidence_service.normalize_and_dedupe(raw_results)
    ranked = source_ranker.rank(normalized, top_n=6)

    if not ranked:
        return _fallback_response(
            claim, "UNVERIFIED", "no_evidence",
            "No sufficient reliable evidence was found for this claim.",
        )

    # --- LLM verification ---
    try:
        llm_out = await llm_service.verify_with_llm(claim, ranked)
    except llm_service.LLMUnavailableError:
        return _fallback_response(
            claim, "UNVERIFIED", "llm_unavailable",
            "Sanad couldn't complete the assessment. Please try again later.",
        )

    # --- Assemble final response ---
    evidence_out = [
        Evidence(
            title=e["title"], url=e["url"], domain=e["domain"],
            source_type=e["source_type"], snippet=e["snippet"],
        )
        for e in ranked
    ]

    mil_challenge_out: Optional[MilChallenge] = None
    if llm_out.mil_challenge:
        mil_challenge_out = MilChallenge(**llm_out.mil_challenge.model_dump())

    return VerifyResponse(
        claim=claim,
        verdict=llm_out.verdict,
        confidence=_bucket_confidence(llm_out.confidence_score),
        summary=llm_out.summary,
        origin=Origin(description=llm_out.origin_description, url=None),
        evidence=evidence_out,
        reasoning=llm_out.reasoning,
        next_step=llm_out.next_step,
        mil_tip=llm_out.mil_tip,
        mil_skill=llm_out.mil_skill,
        mil_challenge=mil_challenge_out,
        error=None,
    )
