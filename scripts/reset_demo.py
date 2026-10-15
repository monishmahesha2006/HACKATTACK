"""Reset REWIND X demo state via API (or direct wipe if API is down)."""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

import httpx

BASE = "http://127.0.0.1:8000/api/v1"
TOKEN = "rx_dev_token_secret_key_2026"
HEADERS = {"X-Dev-Token": TOKEN}


def reset_via_api() -> dict:
    with httpx.Client(timeout=30.0) as client:
        r = client.post(f"{BASE}/demo/reset", headers=HEADERS)
        r.raise_for_status()
        return r.json()


def reset_local_files() -> None:
    import shutil
    from backend.app.core.config import DATA_DIR

    for name in ("sheets", "drafts", "outbox"):
        d = DATA_DIR / name
        if d.exists():
            shutil.rmtree(d, ignore_errors=True)
        d.mkdir(parents=True, exist_ok=True)


def main() -> int:
    try:
        result = reset_via_api()
        print("RESET:", result)
        return 0
    except Exception as exc:
        print(f"API reset failed ({exc}); wiping local demo files only.")
        reset_local_files()
        print("RESET: local sheets/drafts/outbox cleared")
        return 0


if __name__ == "__main__":
    raise SystemExit(main())
