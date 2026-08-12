import type { EvidenceItem, SourceType } from "../types/verification";

interface SourceCardProps {
  evidence: EvidenceItem;
}

const SOURCE_TYPE_ICON: Record<SourceType, string> = {
  academic: "🎓",
  government: "🏛",
  media: "📰",
  fact_check: "✅",
  general: "🔗",
};

const SOURCE_TYPE_LABEL: Record<SourceType, string> = {
  academic: "Academic",
  government: "Government",
  media: "News / media",
  fact_check: "Fact-check org",
  general: "General web",
};

export default function SourceCard({ evidence }: SourceCardProps) {
  return (
    <a
      className="source-card"
      href={evidence.url}
      target="_blank"
      rel="noreferrer noopener"
    >
      <div className="source-card__meta">
        <span className="source-card__icon" aria-hidden="true">
          {SOURCE_TYPE_ICON[evidence.source_type]}
        </span>
        <span className="source-card__domain">{evidence.domain}</span>
        <span className="source-card__type">{SOURCE_TYPE_LABEL[evidence.source_type]}</span>
      </div>
      <div className="source-card__title">{evidence.title}</div>
      <p className="source-card__snippet">{evidence.snippet}</p>
      <span className="source-card__link-out" aria-hidden="true">
        Open source ↗
      </span>
    </a>
  );
}
