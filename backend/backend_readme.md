# Sanad — Backend

FastAPI backend for the Sanad MVP: takes a highlighted claim + page context, retrieves web evidence, ranks it, and asks an LLM (Gemini) to produce a structured, evidence-grounded verdict — including a media-literacy mini-quiz tied to the specific claim.

This is the Person 2 (Backend/AI) side of the project. See the frontend repo for the extension that calls this API.

---

## Status

**Working and verified live**, tested end-to-end from the real browser extension:
- Claim in → parallel web search (Tavily) → dedupe/rank evidence → Gemini structured verdict → response out
- Confirmed producing a correct, well-grounded `REFUTED` verdict with real evidence and a good MIL quiz on multiple real test claims

**Built but not deliberately tested:**
- The `SUPPORTED`, `MISLEADING`, and `UNVERIFIED` verdicts — only `REFUTED` has been observed so far
- The 4 structured error paths (`ambiguous_claim`, `search_unavailable`, `no_evidence`, `llm_unavailable`) — the code handles all four and returns a clean fallback response for each, but only `llm_unavailable` has actually been triggered (accidentally, via an invalid API key) and confirmed working
- The `mil_challenge: null` case for thin-evidence claims — never observed, but the LLM is explicitly instructed to return `null` rather than fabricate a weak question

**Not implemented — scoped out for this MVP:**
- `search_factcheck()` in `search_service.py` is a stub that returns `[]`. Google Fact Check Tools API was planned as a second evidence source but was descoped to keep the project simple. Evidence currently comes from Tavily web search only.
- No caching layer (in-memory or otherwise) — every request re-runs the full pipeline, including duplicate claims
- No database — nothing persists between requests; no verification history
- No rate limiting beyond basic input length caps
- No automated test suite — all verification so far has been manual, via curl and the live extension

If you pick this project back up later, the honest next steps in priority order are: (1) deliberately trigger and confirm all 4 error paths, (2) test a spread of claims to see all 5 verdicts, (3) decide if Fact Check API / caching are worth adding.

---

## Architecture

```
Request (claim + page context)
        │
        ▼
  sanad_service.py  (orchestrator)
        │
        ├── ambiguous claim? → short-circuit to CONTEXT_NEEDED
        │
        ├── search_service.py → Tavily web search
        │        │
        │        ▼
        ├── evidence_service.py → normalize + dedupe by domain, classify source_type
        │        │
        │        ▼
        ├── source_ranker.py → score by authority + relevance + freshness, take top 6
        │        │
        │        ▼
        └── llm_service.py → Gemini, forced structured JSON output
                 │
                 ▼
         VerifyResponse (verdict, evidence, reasoning, MIL tip, MIL quiz)
```

Every failure point (search down, no evidence found, LLM fails/returns bad JSON) is caught in `sanad_service.py` and turned into a valid `VerifyResponse` with `error` set — the API always returns HTTP 200 with the full contract shape. The frontend should never need to handle a raw 4xx/5xx from `/api/v1/verify` under normal operation.

---

## Project structure

```
app/
├── main.py                    FastAPI app, CORS, health check
├── config.py                  Settings (reads .env)
├── api/
│   └── verify.py              POST /api/v1/verify endpoint
├── schemas/
│   └── verification.py        Pydantic request/response models (the API contract)
└── services/
    ├── search_service.py      Tavily web search wrapper; search_factcheck() is a stub
    ├── evidence_service.py    Normalize, dedupe, classify source_type
    ├── source_ranker.py       Score and rank evidence
    ├── llm_service.py         Gemini call, structured output, validation
    └── sanad_service.py       Orchestrates the full pipeline, handles all error paths
```

---

## Setup

Requires Python 3.10+.

```bash
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

Fill in `.env`:

```
TAVILY_API_KEY=your_key_here
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.5-flash
```

- Tavily key: [app.tavily.com](https://app.tavily.com) (free tier)
- Gemini key: [aistudio.google.com/apikey](https://aistudio.google.com/apikey)

If `GEMINI_MODEL` returns a 404, list the models actually available to your key:

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models?key=YOUR_KEY"
```

and set `GEMINI_MODEL` to one of the returned names (without the `models/` prefix).

Run it:

```bash
uvicorn app.main:app --reload --port 8000
```

---

## API

### `POST /api/v1/verify`

**Request:**

```json
{
  "text": "Drinking coffee causes dehydration.",
  "url": "https://example.com/article",
  "title": "Example article",
  "surrounding_text": "optional, up to ~2000 chars of page context",
  "language": "en"
}
```

Only `text` is required.

**Response:**

```json
{
  "claim": "...",
  "verdict": "SUPPORTED | REFUTED | MISLEADING | UNVERIFIED | CONTEXT_NEEDED",
  "confidence": "Low | Moderate | High",
  "summary": "...",
  "origin": { "description": "...", "url": null },
  "evidence": [
    { "title": "...", "url": "...", "domain": "...", "source_type": "academic | government | media | fact_check | general", "snippet": "..." }
  ],
  "reasoning": "...",
  "next_step": "...",
  "mil_tip": "...",
  "mil_skill": "...",
  "mil_challenge": {
    "question": "...", "options": ["...", "...", "...", "..."],
    "correct_index": 0, "feedback_correct": "...", "feedback_incorrect": "..."
  },
  "error": null
}
```

`mil_challenge` is `null` when the LLM judges the evidence too thin to write a good question. `error` is `null` on success, or one of `"search_unavailable"`, `"llm_unavailable"`, `"no_evidence"`, `"ambiguous_claim"` on a handled failure — in all failure cases the response still has valid values in every field (empty strings/arrays where there's nothing to say), so the frontend can render it without special-casing.

### `GET /health`

Returns `{"status": "ok"}` — useful for confirming the server is up before debugging anything else.

---

## Known limitations / things to know if debugging

- **`origin.url` is always `null`.** The LLM is only asked to describe where a claim seems to originate, not to find a specific origin URL — this was a deliberate scope cut, not a bug.
- **CORS is wide open (`allow_origins=["*"]`).** Fine for local dev with the extension, but should be tightened to the specific `chrome-extension://<id>` origin before any public demo or deployment.
- **No retry/backoff beyond one retry on the LLM call.** If Gemini is slow or flaky, requests can occasionally take the full 20s timeout before falling back to `llm_unavailable`.
- **Source classification is heuristic and domain-list-based** (`evidence_service.py`) — it's a small hardcoded set of known government/academic/media/fact-check domains. Anything not on the list defaults to `general`, which is safe but not exhaustive (e.g. Wikipedia and Facebook both land as `general`, which is reasonable but arguable).
- **Logging is enabled** (`app/main.py` sets `logging.basicConfig(level=logging.INFO)`) — if something fails silently, check the terminal running `uvicorn` for the actual Gemini/Tavily error before assuming the code is broken.
