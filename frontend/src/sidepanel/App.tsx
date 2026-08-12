import { useCallback, useEffect, useState } from "react";
import "./App.css";
import { verifyClaim, SanadApiError } from "../api/sanadApi";
import { SANAD_MESSAGE, type SelectionPayload, type VerifyResponse } from "../types/verification";
import VerificationChain from "../components/VerificationChain";
import ShareCard from "../components/ShareCard";

type LoadState =
  | { status: "empty" }
  | { status: "loading"; claimPreview: string }
  | { status: "result"; result: VerifyResponse }
  | { status: "network_error"; message: string; retry: SelectionPayload };

export default function App() {
  const [state, setState] = useState<LoadState>({ status: "empty" });
  const [showShareCard, setShowShareCard] = useState(false);

  const runVerification = useCallback(async (selection: SelectionPayload) => {
    setState({ status: "loading", claimPreview: selection.text });
    setShowShareCard(false);
    try {
      const result = await verifyClaim(selection);
      setState({ status: "result", result });
    } catch (err) {
      const message =
        err instanceof SanadApiError ? err.message : "Something went wrong reaching Sanad.";
      setState({ status: "network_error", message, retry: selection });
    }
  }, []);

  // On mount: pick up whatever selection the background worker just stored,
  // then keep listening for new ones without requiring a re-open.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const stored = await chrome.storage.session.get(SANAD_MESSAGE.OPEN_WITH_SELECTION);
      const selection = stored[SANAD_MESSAGE.OPEN_WITH_SELECTION] as
        | SelectionPayload
        | undefined;
      if (selection && !cancelled) {
        void runVerification(selection);
        await chrome.storage.session.remove(SANAD_MESSAGE.OPEN_WITH_SELECTION);
      }
    })();

    const listener = (message: { type: string; payload?: SelectionPayload | null }) => {
      if (message?.type === SANAD_MESSAGE.SELECTION_CAPTURED && message.payload) {
        void runVerification(message.payload);
      }
    };
    chrome.runtime.onMessage.addListener(listener);

    return () => {
      cancelled = true;
      chrome.runtime.onMessage.removeListener(listener);
    };
  }, [runVerification]);

  return (
    <div className="app">
      <header className="app__header">
        <div className="app__brand">
          <span className="app__brand-mark" aria-hidden="true">
            ⛓
          </span>
          Sanad
        </div>
        {state.status === "result" && !state.result.error && (
          <button
            type="button"
            className="app__share-toggle"
            onClick={() => setShowShareCard((v) => !v)}
          >
            {showShareCard ? "Back to details" : "Share card"}
          </button>
        )}
      </header>

      <main className="app__body">
        {state.status === "empty" && (
          <div className="empty-state">
            <p className="empty-state__title">Highlight a claim to get started</p>
            <p className="empty-state__body">
              Select any text on a page, right-click, and choose{" "}
              <strong>“Verify with Sanad.”</strong>
            </p>
          </div>
        )}

        {state.status === "loading" && (
          <div className="loading-state">
            <div className="loading-state__skeleton" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <p className="loading-state__text">Verifying claim…</p>
            <p className="loading-state__claim">“{state.claimPreview}”</p>
          </div>
        )}

        {state.status === "network_error" && (
          <div className="error-state">
            <div className="error-state__title">Couldn't reach Sanad</div>
            <p className="error-state__body">{state.message}</p>
            <button
              type="button"
              className="error-state__retry"
              onClick={() => void runVerification(state.retry)}
            >
              Try again
            </button>
          </div>
        )}

        {state.status === "result" &&
          (showShareCard ? (
            <ShareCard result={state.result} />
          ) : (
            <VerificationChain result={state.result} />
          ))}
      </main>
    </div>
  );
}
