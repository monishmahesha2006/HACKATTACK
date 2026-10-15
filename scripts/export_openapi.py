import json
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from backend.app.main import app

def export_openapi():
    openapi_schema = app.openapi()
    out_path = BASE_DIR / "docs" / "openapi.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(openapi_schema, f, indent=2)
    print(f"Exported OpenAPI schema to {out_path}")

if __name__ == "__main__":
    export_openapi()
