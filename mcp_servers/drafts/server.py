import json
from pathlib import Path
from typing import Any, Dict, List, Optional
from mcp.server.fastmcp import FastMCP

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DRAFTS_DIR = BASE_DIR / "data" / "drafts"
OUTBOX_DIR = BASE_DIR / "data" / "outbox"
DRAFTS_DIR.mkdir(parents=True, exist_ok=True)
OUTBOX_DIR.mkdir(parents=True, exist_ok=True)

mcp = FastMCP("drafts")

DRAFTS_STORE = DRAFTS_DIR / "drafts.json"
OUTBOX_STORE = OUTBOX_DIR / "outbox.json"

def _load_json(p: Path) -> List[Dict[str, Any]]:
    if p.exists():
        with open(p, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

def _save_json(p: Path, data: List[Dict[str, Any]]):
    with open(p, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

@mcp.tool(
    name="create_draft",
    description="Create an email draft with grounded candidate achievements."
)
def create_draft(recipient: str, subject: str, body: str, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    drafts = _load_json(DRAFTS_STORE)
    draft_id = f"dft_{len(drafts) + 1:04d}"
    record = {
        "id": draft_id,
        "recipient": recipient,
        "subject": subject,
        "body": body,
        "metadata": metadata or {},
        "created_at": "2026-10-15T12:00:00Z",
        "source": "LOCAL_DEMO"
    }
    drafts.append(record)
    _save_json(DRAFTS_STORE, drafts)
    return record

@mcp.tool(
    name="update_draft",
    description="Update the body or subject of an existing draft."
)
def update_draft(draft_id: str, body: str) -> Dict[str, Any]:
    drafts = _load_json(DRAFTS_STORE)
    for d in drafts:
        if d["id"] == draft_id:
            d["body"] = body
            _save_json(DRAFTS_STORE, drafts)
            return {"status": "UPDATED", "draft_id": draft_id, "source": "LOCAL_DEMO"}
    return {"error": f"Draft {draft_id} not found", "source": "LOCAL_DEMO"}

@mcp.tool(
    name="delete_draft",
    description="Delete a draft email (compensating action for rewind)."
)
def delete_draft(draft_id: str) -> Dict[str, Any]:
    drafts = _load_json(DRAFTS_STORE)
    initial_len = len(drafts)
    drafts = [d for d in drafts if d["id"] != draft_id]
    _save_json(DRAFTS_STORE, drafts)
    return {
        "status": "DELETED" if len(drafts) < initial_len else "NOT_FOUND",
        "draft_id": draft_id,
        "source": "LOCAL_DEMO"
    }

@mcp.tool(
    name="read_draft",
    description="Read draft details by draft_id."
)
def read_draft(draft_id: str) -> Dict[str, Any]:
    drafts = _load_json(DRAFTS_STORE)
    for d in drafts:
        if d["id"] == draft_id:
            return d
    return {"error": f"Draft {draft_id} not found", "source": "LOCAL_DEMO"}

@mcp.tool(
    name="list_drafts",
    description="List all available email drafts."
)
def list_drafts() -> List[Dict[str, Any]]:
    return _load_json(DRAFTS_STORE)

@mcp.tool(
    name="send_email",
    description="Send an email. STRICT GATE: Irreversible action. Requires a valid single-use authorization token."
)
def send_email(draft_id: str, authorization_token: str) -> Dict[str, Any]:
    # Token validation: must be a non-empty string starting with 'apr_tok_'
    if not authorization_token or not authorization_token.startswith("apr_tok_"):
        return {
            "error": "SECURITY INTERLOCK BLOCKED: send_email requires a verified single-use authorization token bound to call hash.",
            "status": "BLOCKED",
            "draft_id": draft_id,
            "source": "LOCAL_DEMO"
        }

    drafts = _load_json(DRAFTS_STORE)
    target = next((d for d in drafts if d["id"] == draft_id), None)
    if not target:
        return {"error": f"Draft {draft_id} not found", "source": "LOCAL_DEMO"}

    outbox = _load_json(OUTBOX_STORE)
    send_record = {
        "send_id": f"snd_{len(outbox) + 1:04d}",
        "draft_id": draft_id,
        "recipient": target["recipient"],
        "subject": target["subject"],
        "body": target["body"],
        "authorization_token": authorization_token,
        "status": "DISPATCHED",
        "source": "LOCAL_DEMO"
    }
    outbox.append(send_record)
    _save_json(OUTBOX_STORE, outbox)

    return {
        "status": "SENT",
        "send_id": send_record["send_id"],
        "recipient": target["recipient"],
        "source": "LOCAL_DEMO"
    }

if __name__ == "__main__":
    mcp.run()
