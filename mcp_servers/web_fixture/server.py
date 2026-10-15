import json
from pathlib import Path
from typing import Any, Dict, List, Optional
from mcp.server.fastmcp import FastMCP

BASE_DIR = Path(__file__).resolve().parent.parent.parent
PAGES_FILE = BASE_DIR / "fixtures" / "web" / "pages.json"

mcp = FastMCP("web_fixture")

def _load_pages() -> List[Dict[str, Any]]:
    if PAGES_FILE.exists():
        with open(PAGES_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

@mcp.tool(
    name="search",
    description="Search internship and recruitment listings across web fixtures."
)
def search(query: str, limit: int = 10) -> List[Dict[str, Any]]:
    pages = _load_pages()
    query_tokens = [t.lower() for t in query.split() if len(t) > 2]
    results = []

    for p in pages:
        text = f"{p.get('title', '')} {p.get('snippet', '')} {p.get('role', '')} {p.get('company', '')}".lower()
        score = sum(1 for t in query_tokens if t in text)
        if score > 0 or not query_tokens:
            # Return full opportunity fields so eligibility/ranking can evaluate real criteria
            results.append((score, {
                **p,
                "tainted": True,
                "source": "LOCAL_DEMO"
            }))

    results.sort(key=lambda x: x[0], reverse=True)
    return [r[1] for r in results[:limit]]

@mcp.tool(
    name="fetch",
    description="Fetch full content and metadata for a specific webpage URL or ID."
)
def fetch(url: str) -> Dict[str, Any]:
    pages = _load_pages()
    for p in pages:
        if p.get("url") == url or p.get("id") == url:
            return {
                **p,
                "tainted": True,
                "source": "LOCAL_DEMO"
            }
    return {
        "error": f"Page not found for URL: {url}",
        "url": url,
        "tainted": True,
        "source": "LOCAL_DEMO"
    }

@mcp.resource("fixture://pages/{id}")
def get_fixture_page(id: str) -> str:
    pages = _load_pages()
    for p in pages:
        if p.get("id") == id:
            return json.dumps(p, indent=2)
    return json.dumps({"error": "Page not found"})

if __name__ == "__main__":
    mcp.run()
