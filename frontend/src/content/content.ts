import type { SelectionPayload } from "../types/verification";

/**
 * This content script is intentionally "dumb": it captures selected text +
 * page context the same way on every page (article, social post, chatbot
 * answer, WhatsApp Web, etc.) and never branches on what kind of site it's
 * on. See PERSON_1_EXTENSION_PLAN.md §"what counts as the source" — do not
 * add per-site detection here.
 */

const SURROUNDING_TEXT_MAX_CHARS = 1000;

let lastSelectionText = "";

function getSurroundingText(selection: Selection): string {
  try {
    const anchorNode = selection.anchorNode;
    const container =
      anchorNode?.nodeType === Node.ELEMENT_NODE
        ? (anchorNode as Element)
        : anchorNode?.parentElement;

    const parent = container?.closest("article, main, section, p") ?? container;
    const raw = (parent as HTMLElement | null)?.innerText ?? document.body.innerText ?? "";

    if (raw.length <= SURROUNDING_TEXT_MAX_CHARS) return raw.trim();

    // Center the window on the selection when the container text is long.
    const selectedText = selection.toString();
    const idx = raw.indexOf(selectedText);
    if (idx === -1) return raw.slice(0, SURROUNDING_TEXT_MAX_CHARS).trim();

    const half = Math.floor(SURROUNDING_TEXT_MAX_CHARS / 2);
    const start = Math.max(0, idx - half);
    const end = Math.min(raw.length, idx + selectedText.length + half);
    return raw.slice(start, end).trim();
  } catch {
    return "";
  }
}

function captureSelectionPayload(): SelectionPayload | null {
  const selection = window.getSelection();
  const text = selection?.toString().trim() ?? "";
  if (!selection || !text) return null;

  return {
    text,
    url: location.href,
    title: document.title,
    surrounding_text: getSurroundingText(selection),
    language: document.documentElement.lang || "en",
  };
}

document.addEventListener("selectionchange", () => {
  const selection = window.getSelection();
  lastSelectionText = selection?.toString().trim() ?? "";
});

// The background service worker asks for the current selection right
// before opening the context menu action / side panel.
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "SANAD_GET_SELECTION") {
    const payload = captureSelectionPayload();
    sendResponse(payload);
    return true;
  }
  return false;
});

// Guard against an empty payload if selection collapsed between the
// contextmenu event firing and the message arriving.
export function hasActiveSelection(): boolean {
  return lastSelectionText.length > 0;
}
