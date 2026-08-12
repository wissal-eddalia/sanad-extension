import { SANAD_MESSAGE, type SelectionPayload } from "../types/verification";

const MENU_ID = "sanad-verify-selection";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: MENU_ID,
    title: "Verify with Sanad",
    contexts: ["selection"],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== MENU_ID || !tab?.id) return;
  await handleVerifyRequest(tab.id, tab.windowId);
});

// Also allow clicking the toolbar icon as a fallback entry point.
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab?.id) return;
  await handleVerifyRequest(tab.id, tab.windowId);
});

async function handleVerifyRequest(tabId: number, windowId: number | undefined) {
  // IMPORTANT: chrome.sidePanel.open() must be the first async call made
  // in this handler. It requires an active user-gesture context, and that
  // context expires once we `await` something else first (e.g. a
  // tabs.sendMessage round-trip). Calling anything else before this causes
  // Chrome to silently reject the open() call — the side panel never
  // appears and the only trace is a rejected promise in the service
  // worker's own console (chrome://extensions -> "service worker" link).
  if (windowId !== undefined) {
    try {
      await chrome.sidePanel.open({ windowId });
    } catch (err) {
      console.warn("[Sanad] sidePanel.open() rejected:", err);
    }
  }

  try {
    const selection = await chrome.tabs.sendMessage<
      { type: string },
      SelectionPayload | null
    >(tabId, { type: "SANAD_GET_SELECTION" });

    if (selection) {
      // Session storage survives the side panel opening but not a browser
      // restart — that's the right lifetime for "what did the user just
      // highlight."
      await chrome.storage.session.set({ [SANAD_MESSAGE.OPEN_WITH_SELECTION]: selection });
    }

    // Also broadcast in case the side panel is already open and listening.
    // If it's not listening yet (still mounting), this rejects with
    // "Receiving end does not exist" — harmless, since the panel picks up
    // the same selection from session storage on mount instead.
    chrome.runtime.sendMessage({ type: SANAD_MESSAGE.SELECTION_CAPTURED, payload: selection }).catch(() => {});
  } catch (err) {
    // Most common cause: content script not injected on this page (e.g.
    // chrome:// pages, the Chrome Web Store, or a page that loaded before
    // install). Nothing useful to recover here — the side panel will show
    // its own empty state if it opens without a selection.
    console.warn("[Sanad] Could not capture selection:", err);
  }
}