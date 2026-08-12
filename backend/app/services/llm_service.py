"""
Sends claim + ranked evidence to Gemini, forces structured JSON output,
validates it. Never lets the LLM invent evidence — it's explicitly instructed
to only reason over what's provided and to say so when evidence is thin.
"""
import json
import httpx
from typing import List, Dict, Optional
from pydantic import BaseModel, ValidationError, Field
from app.config import settings

GEMINI_URL_TEMPLATE = (
    "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
)


class LLMUnavailableError(Exception):
    pass


class MilChallengeLLM(BaseModel):
    question: str
    options: List[str]
    correct_index: int
    feedback_correct: str
    feedback_incorrect: str


class LLMVerificationOutput(BaseModel):
    verdict: str  # SUPPORTED | REFUTED | MISLEADING | UNVERIFIED | CONTEXT_NEEDED
    confidence_score: float = Field(ge=0.0, le=1.0)
    summary: str
    reasoning: str
    origin_description: Optional[str] = None
    next_step: str
    mil_skill: str
    mil_tip: str
    mil_challenge: Optional[MilChallengeLLM] = None


SYSTEM_INSTRUCTIONS = """You are Sanad, a Media and Information Literacy verification assistant.

RULES YOU MUST FOLLOW:
1. Only use the evidence provided below. NEVER invent, assume, or recall outside facts not present in the evidence.
2. If the evidence is insufficient to assess the claim, you MUST use verdict "UNVERIFIED" — do not guess.
3. Do not say a claim is definitively false unless the evidence strongly and directly contradicts it — prefer "REFUTED" only with strong contradicting evidence, otherwise use "MISLEADING" or "UNVERIFIED".
4. confidence_score reflects how confident YOU are in this assessment given the evidence quality — not how true the claim is.
5. mil_challenge: write ONE multiple-choice question (4 options, 1 correct) that teaches a TRANSFERABLE media-literacy habit related to this specific claim (e.g. why to check sourcing, why popularity isn't proof, why to check dates) — not a trivia question about the article's content. Write a short feedback line for both correct and incorrect answers. If the evidence is too thin to write a meaningful, well-grounded question, set mil_challenge to null. Do not force a weak question.
6. Output ONLY valid JSON matching the schema below. No markdown, no code fences, no commentary.

JSON SCHEMA:
{
  "verdict": "SUPPORTED | REFUTED | MISLEADING | UNVERIFIED | CONTEXT_NEEDED",
  "confidence_score": 0.0-1.0,
  "summary": "one paragraph, plain language",
  "reasoning": "short explanation of how the evidence was weighed",
  "origin_description": "where the claim seems to originate, or null",
  "next_step": "one concrete thing the user should personally check next",
  "mil_skill": "source_evaluation | evidence_evaluation | cross_source_verification | context_checking | date_checking | emotional_language | AI_literacy",
  "mil_tip": "one short, concrete MIL learning tip tied to this specific claim",
  "mil_challenge": {
    "question": "...",
    "options": ["...", "...", "...", "..."],
    "correct_index": 0,
    "feedback_correct": "...",
    "feedback_incorrect": "..."
  } | null
}
"""


def _build_prompt(claim: str, evidence: List[Dict]) -> str:
    if not evidence:
        evidence_block = "NO EVIDENCE WAS RETRIEVED."
    else:
        parts = []
        for i, e in enumerate(evidence, start=1):
            parts.append(
                f"SOURCE {i}:\n"
                f"Title: {e['title']}\n"
                f"Domain: {e['domain']} (type: {e['source_type']})\n"
                f"Evidence: {e['snippet']}\n"
            )
        evidence_block = "\n".join(parts)

    return f"CLAIM:\n{claim}\n\n{evidence_block}"


async def verify_with_llm(claim: str, evidence: List[Dict]) -> LLMVerificationOutput:
    if not settings.gemini_api_key:
        raise LLMUnavailableError("GEMINI_API_KEY not configured")

    url = GEMINI_URL_TEMPLATE.format(model=settings.gemini_model)
    prompt = _build_prompt(claim, evidence)

    payload = {
        "system_instruction": {"parts": [{"text": SYSTEM_INSTRUCTIONS}]},
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "response_mime_type": "application/json",
            "temperature": 0.2,
        },
    }

    last_error: Optional[Exception] = None

    for attempt in range(2):  # one retry on parse/validation failure
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                resp = await client.post(
                    url,
                    params={"key": settings.gemini_api_key},
                    json=payload,
                )
                resp.raise_for_status()
                data = resp.json()

            raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
            parsed = json.loads(raw_text)
            return LLMVerificationOutput(**parsed)

        except (httpx.HTTPError, httpx.TimeoutException, KeyError, IndexError) as e:
            last_error = e
            continue
        except (json.JSONDecodeError, ValidationError) as e:
            last_error = e
            continue

    raise LLMUnavailableError(f"Gemini call failed after retries: {last_error}")
