"""
Turns raw search-provider results into the clean {title, url, domain, source_type,
snippet} shape used everywhere downstream (ranking, LLM prompt, API response).
"""
from typing import List, Dict
from urllib.parse import urlparse

GOV_SUFFIXES = (".gov",)
EDU_SUFFIXES = (".edu",)

INTL_ORGS = {"who.int", "un.org", "unesco.org", "worldbank.org", "unicef.org"}

ACADEMIC_DOMAINS = {
    "pubmed.ncbi.nlm.nih.gov", "ncbi.nlm.nih.gov", "scholar.google.com",
    "nature.com", "sciencedirect.com", "springer.com", "thelancet.com",
    "nejm.org", "bmj.com",
}

FACTCHECK_DOMAINS = {
    "snopes.com", "politifact.com", "factcheck.org", "fullfact.org",
    "apnews.com", "reuters.com",
}

ESTABLISHED_MEDIA = {
    "reuters.com", "apnews.com", "bbc.com", "nytimes.com",
    "theguardian.com", "npr.org", "washingtonpost.com", "wsj.com",
}


def _domain_of(url: str) -> str:
    try:
        netloc = urlparse(url).netloc
        return netloc.replace("www.", "")
    except Exception:
        return ""


def classify_source_type(domain: str) -> str:
    if domain in INTL_ORGS or domain.endswith(GOV_SUFFIXES):
        return "government"
    if domain in ACADEMIC_DOMAINS or domain.endswith(EDU_SUFFIXES):
        return "academic"
    if domain in FACTCHECK_DOMAINS:
        return "fact_check"
    if domain in ESTABLISHED_MEDIA:
        return "media"
    return "general"


def normalize_and_dedupe(raw_results: List[Dict], max_snippet_len: int = 400) -> List[Dict]:
    """
    raw_results: list of {"title", "url", "content", "published_date"}
    Returns: deduped list of {"title", "url", "domain", "source_type", "snippet", "published_date"}
    Dedupes by domain — keeps the first (highest-relevance, since search results
    arrive pre-ranked) result per domain.
    """
    seen_domains = set()
    evidence = []

    for r in raw_results:
        domain = _domain_of(r["url"])
        if not domain or domain in seen_domains:
            continue
        seen_domains.add(domain)

        snippet = (r.get("content") or "").strip()
        if len(snippet) > max_snippet_len:
            snippet = snippet[:max_snippet_len].rsplit(" ", 1)[0] + "..."

        evidence.append({
            "title": r.get("title") or domain,
            "url": r["url"],
            "domain": domain,
            "source_type": classify_source_type(domain),
            "snippet": snippet,
            "published_date": r.get("published_date"),
        })

    return evidence
