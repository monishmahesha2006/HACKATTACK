import json
from pathlib import Path
from typing import Any, Dict, List, Optional
from mcp.server.fastmcp import FastMCP

BASE_DIR = Path(__file__).resolve().parent.parent.parent
SHEETS_DIR = BASE_DIR / "data" / "sheets"
SHEETS_DIR.mkdir(parents=True, exist_ok=True)

mcp = FastMCP("sheets")

def _sheet_path(sheet_id: str) -> Path:
    # Confine to sheets dir (prevent path traversal)
    safe_name = "".join(c for c in sheet_id if c.isalnum() or c in ("-", "_"))
    return SHEETS_DIR / f"{safe_name}.json"

def _read_sheet_data(sheet_id: str) -> Dict[str, Any]:
    p = _sheet_path(sheet_id)
    if p.exists():
        with open(p, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"sheet_id": sheet_id, "title": sheet_id, "rows": [], "keys": {}}

def _save_sheet_data(sheet_id: str, data: Dict[str, Any]):
    p = _sheet_path(sheet_id)
    with open(p, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

@mcp.tool(
    name="create_sheet",
    description="Create a new spreadsheet table for tracking opportunities."
)
def create_sheet(title: str) -> Dict[str, Any]:
    sheet_id = "".join(c if c.isalnum() else "_" for c in title.lower()).strip("_")
    data = {"sheet_id": sheet_id, "title": title, "rows": [], "keys": {}}
    _save_sheet_data(sheet_id, data)
    return {"sheet_id": sheet_id, "title": title, "source": "LOCAL_DEMO"}

@mcp.tool(
    name="append_row",
    description="Append a new row to the spreadsheet idempotently using idempotency_key."
)
def append_row(sheet_id: str, row: Dict[str, Any], idempotency_key: str) -> Dict[str, Any]:
    data = _read_sheet_data(sheet_id)
    
    # Check idempotency key: if existing, return row_id without adding duplicate
    if idempotency_key in data.get("keys", {}):
        existing_row_id = data["keys"][idempotency_key]
        return {
            "status": "EXISTING",
            "sheet_id": sheet_id,
            "row_id": existing_row_id,
            "idempotency_key": idempotency_key,
            "duplicate_prevented": True,
            "source": "LOCAL_DEMO"
        }

    row_id = f"row_{len(data['rows']) + 1:04d}"
    record = {
        "row_id": row_id,
        "idempotency_key": idempotency_key,
        "data": row
    }
    data["rows"].append(record)
    if "keys" not in data:
        data["keys"] = {}
    data["keys"][idempotency_key] = row_id
    _save_sheet_data(sheet_id, data)

    return {
        "status": "CREATED",
        "sheet_id": sheet_id,
        "row_id": row_id,
        "idempotency_key": idempotency_key,
        "source": "LOCAL_DEMO"
    }

@mcp.tool(
    name="update_row",
    description="Update an existing row by row_id."
)
def update_row(sheet_id: str, row_id: str, row: Dict[str, Any]) -> Dict[str, Any]:
    data = _read_sheet_data(sheet_id)
    for r in data["rows"]:
        if r["row_id"] == row_id:
            r["data"].update(row)
            _save_sheet_data(sheet_id, data)
            return {"status": "UPDATED", "row_id": row_id, "source": "LOCAL_DEMO"}
    return {"error": f"Row {row_id} not found in sheet {sheet_id}", "source": "LOCAL_DEMO"}

@mcp.tool(
    name="delete_row",
    description="Delete a row by row_id (inverse compensating action for rewind)."
)
def delete_row(sheet_id: str, row_id: str) -> Dict[str, Any]:
    data = _read_sheet_data(sheet_id)
    initial_len = len(data["rows"])
    data["rows"] = [r for r in data["rows"] if r["row_id"] != row_id]
    
    # Clean keys
    data["keys"] = {k: v for k, v in data.get("keys", {}).items() if v != row_id}
    _save_sheet_data(sheet_id, data)

    return {
        "status": "DELETED" if len(data["rows"]) < initial_len else "NOT_FOUND",
        "sheet_id": sheet_id,
        "row_id": row_id,
        "source": "LOCAL_DEMO"
    }

@mcp.tool(
    name="read_rows",
    description="Read all rows currently stored in the spreadsheet."
)
def read_rows(sheet_id: str) -> List[Dict[str, Any]]:
    data = _read_sheet_data(sheet_id)
    return data.get("rows", [])

@mcp.resource("sheet://{id}")
def get_sheet_resource(id: str) -> str:
    data = _read_sheet_data(id)
    return json.dumps(data, indent=2)

if __name__ == "__main__":
    mcp.run()
