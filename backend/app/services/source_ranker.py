"""
Simple, explainable ranking: source_type authority + search-rank position
(as a proxy for relevance, since Tavily already returns relevance-ordered
results) + a small freshness bonus if a published_date is present.
Weights are intentionally simple for MVP — tune later.
"""
from typing import List, Dict

AUTHORITY_WEIGHT = {
    "government": 1.0,
    "academic": 1.0,
    "fact_check": 0.9,
    "media": 0.6,
    "general": 0.3,
}


def rank(evidence: List[Dict], top_n: int = 6) -> List[Dict]:
    scored = []
    for i, item in enumerate(evidence):
        authority = AUTHORITY_WEIGHT.get(item["source_type"], 0.3)
        relevance = 1.0 - (i * 0.05)  # earlier search results score higher
        freshness = 0.1 if item.get("published_date") else 0.0

        score = (0.5 * authority) + (0.4 * relevance) + (0.1 * freshness)
        scored.append((score, item))

    scored.sort(key=lambda pair: pair[0], reverse=True)
    return [item for _, item in scored[:top_n]]
