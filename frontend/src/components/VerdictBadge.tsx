import type { Verdict } from "../types/verification";

interface VerdictBadgeProps {
  verdict: Verdict;
  confidence?: string;
  /** Renders a muted/error variant regardless of verdict color, for error states. */
  muted?: boolean;
}

const VERDICT_LABEL: Record<Verdict, string> = {
  SUPPORTED: "Supported",
  REFUTED: "Refuted",
  MISLEADING: "Misleading",
  UNVERIFIED: "Unverified",
  CONTEXT_NEEDED: "Needs context",
};

const VERDICT_CLASS: Record<Verdict, string> = {
  SUPPORTED: "verdict-badge--supported",
  REFUTED: "verdict-badge--refuted",
  MISLEADING: "verdict-badge--misleading",
  UNVERIFIED: "verdict-badge--unverified",
  CONTEXT_NEEDED: "verdict-badge--context",
};

export default function VerdictBadge({ verdict, confidence, muted }: VerdictBadgeProps) {
  const cls = muted ? "verdict-badge--error" : VERDICT_CLASS[verdict];
  return (
    <span className={`verdict-badge ${cls}`}>
      <span className="verdict-badge__dot" aria-hidden="true" />
      <span className="verdict-badge__label">{VERDICT_LABEL[verdict]}</span>
      {confidence && <span className="verdict-badge__confidence">· {confidence} confidence</span>}
    </span>
  );
}
