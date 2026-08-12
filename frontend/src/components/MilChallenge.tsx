import { useState } from "react";
import type { MilChallenge as MilChallengeType } from "../types/verification";

interface MilChallengeProps {
  challenge: MilChallengeType | null;
}

export default function MilChallenge({ challenge }: MilChallengeProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Per contract: mil_challenge may be null if generation failed or evidence
  // was too thin — render nothing rather than a broken/empty quiz.
  if (!challenge) return null;

  const answered = selectedIndex !== null;
  const isCorrect = answered && selectedIndex === challenge.correct_index;

  return (
    <div className="mil-challenge">
      <div className="mil-challenge__label">
        <span className="mil-challenge__mark" aria-hidden="true">
          ?
        </span>
        Quick check
      </div>
      <p className="mil-challenge__question">{challenge.question}</p>

      <div className="mil-challenge__options" role="radiogroup" aria-label={challenge.question}>
        {challenge.options.map((option, index) => {
          const isSelected = selectedIndex === index;
          const isThisCorrect = index === challenge.correct_index;

          let stateClass = "";
          if (answered) {
            if (isThisCorrect) stateClass = "mil-challenge__option--correct";
            else if (isSelected) stateClass = "mil-challenge__option--incorrect";
            else stateClass = "mil-challenge__option--disabled";
          }

          return (
            <button
              key={index}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={answered}
              className={`mil-challenge__option ${stateClass}`}
              onClick={() => setSelectedIndex(index)}
            >
              <span className="mil-challenge__option-marker" aria-hidden="true">
                {answered && isThisCorrect ? "✓" : answered && isSelected ? "✕" : String.fromCharCode(65 + index)}
              </span>
              <span>{option}</span>
            </button>
          );
        })}
      </div>

      {answered && (
        <div
          className={`mil-challenge__feedback ${
            isCorrect ? "mil-challenge__feedback--correct" : "mil-challenge__feedback--incorrect"
          }`}
          role="status"
        >
          {isCorrect ? challenge.feedback_correct : challenge.feedback_incorrect}
        </div>
      )}
    </div>
  );
}
