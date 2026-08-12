# Sanad — Verify Any Claim, Anywhere Online

**Sanad** (سند, Arabic for "chain of transmission" or "something to lean on") is a browser extension that lets anyone highlight a claim on the web and instantly see whether it holds up — backed by real, cited evidence, not just a confidence score.

The name comes from classical scholarship, where a *sanad* is the documented chain of narrators behind a reported saying: a claim is only as trustworthy as the chain that carries it back to a credible source. That's the whole idea of this project in one word.

---

## The problem

Misinformation spreads fastest in the exact moment someone is reading it — a headline, a social post, a chatbot answer — and fact-checking it usually means leaving the page, opening a search engine, and doing the work yourself. Most people don't. Sanad closes that gap: verification happens right where the claim was found, in seconds, without breaking reading flow.

It's also not just a checker. Every verification includes a short, claim-specific media-literacy lesson, so the tool builds the user's own judgment over time instead of just handing down a verdict to trust blindly.

## How it works

1. **Select** any sentence on any page — an article, a social post, an AI chatbot response, a WhatsApp Web message.
2. **Right-click → "Verify with Sanad."**
3. A side panel opens with:
   - **Verdict** — Supported, Refuted, Misleading, Unverified, or Needs Context — with a confidence level
   - **Evidence** — the actual sources checked, ranked by authority, each linking out
   - **Reasoning** — a plain-language explanation of how the evidence was weighed
   - **Next step** — something concrete the user can personally check further
   - **A media-literacy tip + mini-quiz** — grounded in that specific claim and its evidence, not generic trivia

The system never fabricates evidence. If nothing reliable can be found, it says so — an unverifiable claim is reported as unverifiable, not guessed at.

## Architecture

```
┌─────────────────────────┐         POST /api/v1/verify        ┌──────────────────────────┐
│   Browser Extension      │ ───────────────────────────────▶  │   Verification Backend    │
│   (this repo's frontend) │ ◀───────────────────────────────  │                            │
│                          │        JSON verdict + evidence     │  Search → Rank → LLM       │
│  content script          │                                     │  verify → MIL generation  │
│  side panel (React)      │                                     │  (FastAPI)                │
└─────────────────────────┘                                     └──────────────────────────┘
```

The two halves communicate through a single, versioned contract (request/response shape), so either side can be developed and tested independently — the frontend ships with mock data covering every state, and the backend can be exercised with `curl` before any UI exists.

### Frontend
Manifest V3 extension (content script + background service worker + React side panel). Owns everything the user sees and interacts with. Never calls any external search or LLM API directly — only ever talks to the backend's single `/api/v1/verify` endpoint.

### Backend
FastAPI service owning retrieval, ranking, LLM-based verification, and media-literacy content generation. Given a single claim plus its page context, it searches for evidence, ranks sources by authority and relevance, and produces a structured, evidence-grounded verdict — including a generated quiz question testing a transferable literacy skill, not just reading comprehension of one article.

## Repository structure

```
/extension          Frontend — Manifest V3 extension + React side panel
/backend             Backend — FastAPI service, retrieval, LLM verification, MIL generation
```

Each half has its own README with setup instructions specific to that part of the stack.

## Design principles

- **Single claim, single source of truth.** One highlighted claim per request; no multi-claim splitting, no per-site branching logic. The same interaction works identically everywhere text can be selected.
- **Never fabricate.** The system is instructed to say "unverified" rather than invent evidence or reasoning it can't support.
- **Always degrade gracefully.** Every failure mode — search unavailable, model unavailable, no evidence found, ambiguous claim — returns a clean, contract-shaped fallback response. The UI never shows a blank or broken panel.
- **Teach, don't just judge.** Every successful verification includes a literacy tip and quiz tied to that specific claim, aimed at building the skill of evaluating claims independently over time.

## Status

Early-stage MVP, built as a scoped 4-day build across two workstreams (frontend / backend). See each subdirectory's README for a detailed feature checklist.

## License

TBD.
