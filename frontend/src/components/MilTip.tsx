interface MilTipProps {
  tip: string;
  skill: string;
}

const SKILL_LABEL: Record<string, string> = {
  source_evaluation: "Source evaluation",
  evidence_evaluation: "Evidence evaluation",
  cross_source_verification: "Cross-source verification",
  context_checking: "Context checking",
};

export default function MilTip({ tip, skill }: MilTipProps) {
  if (!tip) return null;
  const label = SKILL_LABEL[skill] ?? skill.replace(/_/g, " ");

  return (
    <div className="mil-tip">
      <div className="mil-tip__label">
        <span className="mil-tip__mark" aria-hidden="true">
          ✎
        </span>
        Media literacy tip
        {label && <span className="mil-tip__skill">{label}</span>}
      </div>
      <p className="mil-tip__text">{tip}</p>
    </div>
  );
}
