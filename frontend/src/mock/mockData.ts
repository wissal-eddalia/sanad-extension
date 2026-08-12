import type { VerifyResponse } from "../types/verification";

/**
 * Hardcoded mock responses used to build every UI component before the real
 * backend pipeline exists (Day 2), and to keep Storybook-less manual testing
 * fast afterward. Each one matches the contract exactly.
 */

export const MOCK_SUPPORTED: VerifyResponse = {
  claim: "The Great Wall of China is not visible from the Moon with the naked eye.",
  verdict: "SUPPORTED",
  confidence: "High",
  summary:
    "Multiple astronauts and space agencies confirm the Great Wall is not visible from the Moon without aid — it's too narrow relative to the distance, a fact often confused with visibility from low Earth orbit under ideal conditions.",
  origin: {
    description: "Common claim repeated in trivia lists and social posts",
    url: null,
  },
  evidence: [
    {
      title: "Is the Great Wall of China Visible From Space?",
      url: "https://www.nasa.gov/vision/space/workinginspace/great_wall.html",
      domain: "nasa.gov",
      source_type: "government",
      snippet:
        "Astronauts report that, contrary to popular belief, the Great Wall is not visible from the Moon with the naked eye.",
    },
    {
      title: "Great Wall visibility myth, explained",
      url: "https://www.scientificamerican.com/article/great-wall-space/",
      domain: "scientificamerican.com",
      source_type: "media",
      snippet:
        "The wall is only a few meters wide, far too narrow to resolve at lunar distance regardless of lighting.",
    },
  ],
  reasoning:
    "Two independent, credible sources (a space agency and a science publication) agree, and no credible source was found contradicting them.",
  next_step:
    "If you see this claim again, check whether it's about visibility from the Moon (false) versus low Earth orbit under near-perfect conditions (disputed but more plausible).",
  mil_tip:
    "Claims about what's 'visible from space' are often exaggerated for effect — check the specific distance and conditions being claimed.",
  mil_skill: "evidence_evaluation",
  mil_challenge: {
    question: "Why is NASA a stronger source here than a random trivia post?",
    options: [
      "It has a longer article",
      "It's a primary source with direct expertise and no incentive to exaggerate",
      "It was published more recently",
      "It uses more scientific-sounding language",
    ],
    correct_index: 1,
    feedback_correct:
      "Right. Authority comes from direct expertise and accountability, not length or tone.",
    feedback_incorrect:
      "Not quite — think about who actually has first-hand knowledge here, and who has to answer for being wrong.",
  },
  error: null,
};

export const MOCK_REFUTED: VerifyResponse = {
  claim: "Drinking coffee causes dehydration.",
  verdict: "REFUTED",
  confidence: "Moderate",
  summary:
    "Research on moderate coffee consumption shows it does not cause net fluid loss in regular drinkers — the mild diuretic effect is offset by the water content of the drink itself.",
  origin: { description: "Widely repeated health claim", url: null },
  evidence: [
    {
      title: "Caffeine, fluid-electrolyte balance, and exercise performance",
      url: "https://pubmed.ncbi.nlm.nih.gov/example-coffee-hydration",
      domain: "pubmed.ncbi.nlm.nih.gov",
      source_type: "academic",
      snippet:
        "In habitual consumers, moderate caffeine intake does not produce a diuretic effect large enough to cause dehydration.",
    },
    {
      title: "Does coffee count toward your daily water intake?",
      url: "https://www.mayoclinic.org/example-coffee-hydration",
      domain: "mayoclinic.org",
      source_type: "media",
      snippet:
        "Coffee and tea can contribute to daily fluid needs; moderate intake is not associated with dehydration in regular drinkers.",
    },
  ],
  reasoning:
    "Peer-reviewed research and a reputable medical source both directly contradict the claim for typical, moderate intake.",
  next_step:
    "Watch for the difference between 'moderate, habitual' intake and very high, one-off doses — very large amounts of caffeine can still have a mild diuretic effect.",
  mil_tip:
    "Health claims that sound intuitive ('caffeine is a diuretic, so coffee dehydrates you') can skip a step — check whether the effect size is actually large enough to matter.",
  mil_skill: "context_checking",
  mil_challenge: {
    question:
      "The claim mixes up two things. What's the key distinction the evidence draws?",
    options: [
      "Between coffee and tea",
      "Between hot and cold drinks",
      "Between a mild diuretic effect and actual net dehydration",
      "Between caffeinated and decaffeinated coffee",
    ],
    correct_index: 2,
    feedback_correct:
      "Exactly — a small physiological effect doesn't automatically add up to a meaningful real-world outcome.",
    feedback_incorrect:
      "Look again at what the evidence actually measures versus what the claim asserts.",
  },
  error: null,
};

export const MOCK_UNVERIFIED_NO_EVIDENCE: VerifyResponse = {
  claim: "A new city ordinance bans reusable coffee cups starting next month.",
  verdict: "UNVERIFIED",
  confidence: "Low",
  summary:
    "No reliable source could be found confirming or denying this specific, hyper-local claim.",
  origin: { description: null, url: null },
  evidence: [],
  reasoning:
    "No credible evidence was retrieved for this claim within the available sources.",
  next_step:
    "Check your local city or county government website directly, since hyper-local ordinances often aren't well indexed by general search.",
  mil_tip:
    "Absence of evidence isn't evidence of absence — for very local or very new claims, official primary sources are often the only reliable check.",
  mil_skill: "source_evaluation",
  mil_challenge: null,
  error: "no_evidence",
};

export const MOCK_SEARCH_UNAVAILABLE: VerifyResponse = {
  claim: "Drinking coffee causes dehydration.",
  verdict: "UNVERIFIED",
  confidence: "Low",
  summary: "",
  origin: { description: null, url: null },
  evidence: [],
  reasoning: "",
  next_step: "",
  mil_tip: "",
  mil_skill: "",
  mil_challenge: null,
  error: "search_unavailable",
};

export const MOCK_AMBIGUOUS: VerifyResponse = {
  claim: "it's bad for you",
  verdict: "CONTEXT_NEEDED",
  confidence: "Low",
  summary: "",
  origin: { description: null, url: null },
  evidence: [],
  reasoning: "",
  next_step:
    "Try selecting the complete sentence or paragraph so the claim being made is clear.",
  mil_tip: "",
  mil_skill: "",
  mil_challenge: null,
  error: "ambiguous_claim",
};

export const MOCK_RESPONSES = {
  supported: MOCK_SUPPORTED,
  refuted: MOCK_REFUTED,
  noEvidence: MOCK_UNVERIFIED_NO_EVIDENCE,
  searchUnavailable: MOCK_SEARCH_UNAVAILABLE,
  ambiguous: MOCK_AMBIGUOUS,
};
