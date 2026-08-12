import type { ReactNode } from "react";
import type { BackendErrorCode, VerifyResponse } from "../types/verification";
import VerdictBadge from "./VerdictBadge";
import SourceCard from "./SourceCard";
import MilTip from "./MilTip";
import MilChallenge from "./MilChallenge";

interface VerificationChainProps {
  result: VerifyResponse;
}

const ERROR_COPY: Record<BackendErrorCode, { title: string; body: string }> = {
  search_unavailable: {
    title: "Couldn't retrieve evidence",
    body: "Unable to retrieve external evidence. Please try again.",
  },
  llm_unavailable: {
    title: "Assessment didn't complete",
    body: "Sanad couldn't complete the assessment. Please try again later.",
  },
  no_evidence: {
    title: "No sufficient evidence found",
    body: "No sufficient reliable evidence was found for this claim.",
  },
  ambiguous_claim: {
    title: "This claim needs more context",
    body: "Try selecting the complete sentence or paragraph.",
  },
};

/** A single labeled link in the chain rail. */
function ChainLink({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="chain-link">
      <div className="chain-link__rail" aria-hidden="true">
        <span className="chain-link__node" />
        <span className="chain-link__line" />
      </div>
      <div className="chain-link__content">
        <div className="chain-link__label">{label}</div>
        {children}
      </div>
    </div>
  );
}

export default function VerificationChain({ result }: VerificationChainProps) {
  const {
    claim,
    verdict,
    confidence,
    summary,
    origin,
    evidence,
    reasoning,
    next_step,
    mil_tip,
    mil_skill,
    mil_challenge,
    error,
  } = result;

  // search_unavailable / llm_unavailable: the pipeline couldn't produce a
  // real assessment at all — show a focused error state instead of a chain
  // full of empty sections.
  const isHardFailure = error === "search_unavailable" || error === "llm_unavailable";

  return (
    <div className="verification-chain">
      <ChainLink label="Claim">
        <p className="claim-text">{claim}</p>
      </ChainLink>

      {isHardFailure && error ? (
        <ChainLink label="Status">
          <div className="error-state">
            <div className="error-state__title">{ERROR_COPY[error].title}</div>
            <p className="error-state__body">{ERROR_COPY[error].body}</p>
          </div>
        </ChainLink>
      ) : (
        <>
          {origin?.description && (
            <ChainLink label="Origin">
              <p className="origin-text">
                {origin.description}
                {origin.url && (
                  <>
                    {" — "}
                    <a href={origin.url} target="_blank" rel="noreferrer noopener">
                      view
                    </a>
                  </>
                )}
              </p>
            </ChainLink>
          )}

          {evidence.length > 0 && (
            <ChainLink label={`Evidence (${evidence.length})`}>
              <div className="evidence-list">
                {evidence.map((item, i) => (
                  <SourceCard key={`${item.url}-${i}`} evidence={item} />
                ))}
              </div>
            </ChainLink>
          )}

          <ChainLink label="Verdict">
            <VerdictBadge verdict={verdict} confidence={confidence} />
            {summary && <p className="summary-text">{summary}</p>}
            {error === "no_evidence" && (
              <p className="error-state__inline">{ERROR_COPY.no_evidence.body}</p>
            )}
            {error === "ambiguous_claim" && (
              <p className="error-state__inline">{ERROR_COPY.ambiguous_claim.body}</p>
            )}
            {reasoning && <p className="reasoning-text">{reasoning}</p>}
          </ChainLink>

          {next_step && (
            <ChainLink label="Next step">
              <p className="next-step-text">{next_step}</p>
            </ChainLink>
          )}

          {mil_tip && (
            <ChainLink label="Learn">
              <MilTip tip={mil_tip} skill={mil_skill} />
              <MilChallenge challenge={mil_challenge} />
            </ChainLink>
          )}
        </>
      )}
    </div>
  );
}
