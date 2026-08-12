"""
Web search provider. Keep the public function signature (search) stable so the
provider can be swapped later (Serper, Bing, etc.) without touching callers.
"""
import httpx
from typing import List, Dict, Optional
from app.config import settings

TAVILY_URL = "https://api.tavily.com/search"


class SearchUnavailableError(Exception):
    pass


async def search(query: str, max_results: int = 6) -> List[Dict]:
    """
    Returns a list of raw results:
    [{"title": str, "url": str, "content": str, "published_date": Optional[str]}, ...]
    Raises SearchUnavailableError on failure — callers must catch this.
    """
    if not settings.tavily_api_key:
        raise SearchUnavailableError("TAVILY_API_KEY not configured")

    payload = {
        "api_key": settings.tavily_api_key,
        "query": query,
        "search_depth": "basic",
        "max_results": max_results,
        "include_answer": False,
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(TAVILY_URL, json=payload)
            resp.raise_for_status()
            data = resp.json()
    except (httpx.HTTPError, httpx.TimeoutException) as e:
        raise SearchUnavailableError(str(e)) from e

    results = data.get("results", [])
    return [
        {
            "title": r.get("title", ""),
            "url": r.get("url", ""),
            "content": r.get("content", ""),
            "published_date": r.get("published_date"),
        }
        for r in results
        if r.get("url")
    ]


async def search_factcheck(query: str) -> List[Dict]:
    """
    Day 3 stub: Google Fact Check Tools API integration goes here.
    Returns same shape as search() so it can be merged into the same evidence list.
    For now, returns empty — wire this up on Day 3.
    """
    return []
