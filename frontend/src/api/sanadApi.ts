import type { VerifyRequest, VerifyResponse } from "../types/verification";
import { MOCK_RESPONSES } from "../mock/mockData";

/**
 * Point this at Person 2's backend. Swap via .env or just this constant —
 * nothing else in the extension should ever know the base URL.
 */
const API_BASE_URL = "http://localhost:8000";
const VERIFY_ENDPOINT = `${API_BASE_URL}/api/v1/verify`;

/**
 * Flip to false once Person 2's real backend is live (Day 3) and
 * API_BASE_URL above points at it. Left ON by default so the side panel is
 * demoable standalone — without this, "Verify with Sanad" will show a
 * "Couldn't reach Sanad" error every time, since nothing is listening at
 * localhost:8000 yet.
 */
const USE_MOCK = true;

const REQUEST_TIMEOUT_MS = 15000;

export class SanadApiError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "SanadApiError";
  }
}

function pickMockResponse(payload: VerifyRequest): VerifyResponse {
  // Lightweight heuristic so manual mock testing can exercise every state
  // just by typing different trigger words into the selected text.
  const text = payload.text.toLowerCase();
  if (text.includes("dehydrat") || text.includes("coffee")) return MOCK_RESPONSES.refuted;
  if (text.includes("wall")) return MOCK_RESPONSES.supported;
  if (text.includes("unavailable")) return MOCK_RESPONSES.searchUnavailable;
  if (text.length < 12) return MOCK_RESPONSES.ambiguous;
  return MOCK_RESPONSES.noEvidence;
}

/**
 * The one place the extension talks to the backend. Person 1's UI code
 * should never call `fetch` directly for verification — always go through
 * this function so the contract stays in one place.
 */
export async function verifyClaim(payload: VerifyRequest): Promise<VerifyResponse> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 700)); // simulate latency
    return pickMockResponse(payload);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(VERIFY_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      // Per the contract, the backend should always return HTTP 200 with a
      // fallback shape on failure. A non-200 here means something is wrong
      // outside the contract (network, CORS, backend crash) — surface it
      // distinctly from an in-contract `error` field.
      throw new SanadApiError(`Unexpected HTTP ${response.status} from verify endpoint`);
    }

    const data = (await response.json()) as VerifyResponse;
    return data;
  } catch (err) {
    if (err instanceof SanadApiError) throw err;
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new SanadApiError("Request to Sanad timed out", err);
    }
    throw new SanadApiError("Could not reach Sanad backend", err);
  } finally {
    clearTimeout(timeout);
  }
}