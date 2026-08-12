import type { VerifyResponse } from "../types/verification";
import VerdictBadge from "./VerdictBadge";

interface ShareCardProps {
  result: VerifyResponse;
}

/**
 * Intentionally minimal per plan (quiz took priority over this on Day 4).
 * On-screen only — no export/download integration. First thing to cut
 * further if time is tight; safe to delete this file entirely without
 * touching anything else.
 */
export default function ShareCard({ result }: ShareCardProps) {
  if (result.error) return null;

  return (
    <div className="share-card">
      <div className="share-card__brand">Sanad</div>
      <VerdictBadge verdict={result.verdict} />
      <p className="share-card__claim">“{result.claim}”</p>
      {result.summary && <p className="share-card__summary">{result.summary}</p>}
      <div className="share-card__footer">
        {result.evidence.length} source{result.evidence.length === 1 ? "" : "s"} checked
      </div>
    </div>
  );
}
