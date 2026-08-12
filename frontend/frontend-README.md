# Sanad — Browser Extension (Frontend)

> Highlight any claim on the web. Get a sourced verdict in seconds.

Sanad is a browser extension that lets you select a sentence anywhere online — a news article, a social post, an AI chatbot answer — and instantly see whether it's supported by evidence, refuted, misleading, or unverifiable, along with the sources behind that assessment and a short media-literacy tip.

This repository is the **frontend**: the Manifest V3 extension itself (content script, background service worker, and the React side panel UI). It talks to a separate verification backend over a single documented API contract.

---

## How it works

1. Select text on any page
2. Right-click → **"Verify with Sanad"**
3. The side panel opens and shows:
   - The claim, restated
   - A verdict (Supported / Refuted / Misleading / Unverified / Needs context) with a confidence level
   - A plain-language summary and the reasoning behind it
   - The evidence sources that were checked, with links out
   - A concrete next step you can take yourself
   - A short media-literacy tip, plus a one-question quiz grounded in that specific claim

The extension is source-agnostic by design — it works identically on articles, social media, chatbot responses, and web-based messaging apps, with no special-casing per site.

## Tech stack

- **Manifest V3** (Chrome extensions platform)
- **React 18 + TypeScript** for the side panel UI
- **Vite** + [`@crxjs/vite-plugin`](https://crxjs.dev/vite-plugin) for the build pipeline
- No UI framework dependency beyond React — styling is hand-built CSS using design tokens (see `src/sidepanel/theme.css`)

## Project structure

```
manifest.json                   Manifest V3 configuration
src/
  types/verification.ts         Shared API contract (request/response types)
  api/sanadApi.ts               Single fetch wrapper to the backend
  mock/mockData.ts              Fixture responses covering every UI state
  content/content.ts            Text-selection capture (universal, no per-site logic)
  background/service-worker.ts  Context menu, side panel lifecycle, message relay
  sidepanel/                    Side panel entry point, root component, styles
  components/                   VerdictBadge, SourceCard, MilTip, MilChallenge,
                                 VerificationChain, ShareCard
public/icons/                   Extension icons
```

## Getting started

**Requirements:** Node 18+

```bash
npm install
npm run dev     # Vite dev server with HMR
```

Load it in Chrome:

1. `chrome://extensions`
2. Enable **Developer mode**
3. **Load unpacked** → select the `dist/` folder
4. Highlight text on any page → right-click → **"Verify with Sanad"**

For a production build: `npm run build`.

> **Note:** After any code change, reload the extension from `chrome://extensions`, then refresh any tab you're testing on — Chrome doesn't re-inject content scripts into tabs that were already open.

## Working without a backend

Set `USE_MOCK = true` in `src/api/sanadApi.ts` (on by default) to exercise every UI state — all five verdicts, all four backend error states, the quiz, and the loading/empty states — without a running backend. See the comment in that file for the keyword-based routing used to select mock responses during manual testing.

## API contract

The extension communicates with the backend through a single endpoint:

```
POST /api/v1/verify
```

The full request/response shape is defined once, in `src/types/verification.ts`, and mirrors the backend's schema exactly. Any change to this contract requires updating both sides in lockstep.

## Status

| Milestone | Status |
|---|---|
| Extension shell, content script, side panel skeleton | ✅ |
| All UI components built against mock data | ✅ |
| Real backend integration | ⏳ pending backend |
| Error state handling (4 failure modes) | ✅ |
| MIL quiz interaction | ✅ |
| Share card | ✅ (minimal, on-screen only) |

## License

TBD.
