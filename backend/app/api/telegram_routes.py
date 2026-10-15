"""
Telegram API routes — configure, test, and send internship reports via Telegram Bot.
Endpoints:
  POST /telegram/config        — save bot_token + chat_id
  GET  /telegram/config        — read current config (token masked)
  POST /telegram/test          — send a test ping
  POST /telegram/send-report   — manually trigger report for a completed mission
"""
import logging
from typing import Optional, List, Dict, Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.app.services.telegram_service import (
    get_config,
    update_config,
    test_connection,
    send_internship_report,
    is_configured,
)

router = APIRouter(prefix="/telegram", tags=["Telegram"])
logger = logging.getLogger(__name__)


class TelegramConfigRequest(BaseModel):
    bot_token: str
    chat_id: str
    enabled: bool = True


class SendReportRequest(BaseModel):
    mission_id: str
    opportunities: List[Dict[str, Any]] = []
    drafts: List[Dict[str, Any]] = []
    candidate_name: str = "Candidate"


# ── POST /telegram/config ────────────────────────────────────────────────────

@router.post("/config")
async def save_config(body: TelegramConfigRequest):
    """Save Telegram bot token and chat ID. Returns masked confirmation."""
    update_config(
        bot_token=body.bot_token,
        chat_id=body.chat_id,
        enabled=body.enabled,
    )
    cfg = get_config()
    masked = cfg.bot_token[:8] + "…" if len(cfg.bot_token) > 8 else cfg.bot_token
    return {
        "ok": True,
        "configured": True,
        "bot_token_preview": masked,
        "chat_id": cfg.chat_id,
        "enabled": cfg.enabled,
    }


# ── GET /telegram/config ─────────────────────────────────────────────────────

@router.get("/config")
async def read_config():
    """Return current Telegram config state (token masked for security)."""
    cfg = get_config()
    has_token = bool(cfg.bot_token)
    masked = (cfg.bot_token[:8] + "…") if len(cfg.bot_token) > 8 else ("" if not cfg.bot_token else cfg.bot_token)
    return {
        "configured": has_token and bool(cfg.chat_id),
        "enabled": cfg.enabled,
        "bot_token_preview": masked if has_token else None,
        "chat_id": cfg.chat_id or None,
    }


# ── POST /telegram/test ──────────────────────────────────────────────────────

@router.post("/test")
async def ping_test():
    """Send a test message to verify connection."""
    cfg = get_config()
    if not cfg.bot_token or not cfg.chat_id:
        raise HTTPException(status_code=400, detail="Telegram not configured. Call POST /telegram/config first.")
    result = await test_connection()
    if not result.get("ok"):
        raise HTTPException(status_code=502, detail=f"Telegram API error: {result.get('error')}")
    return result


# ── POST /telegram/send-report ───────────────────────────────────────────────

@router.post("/send-report")
async def manual_send_report(body: SendReportRequest):
    """Manually send an internship report for any mission ID."""
    if not is_configured():
        raise HTTPException(
            status_code=400,
            detail="Telegram not configured or disabled. Call POST /telegram/config first."
        )
    result = await send_internship_report(
        mission_id=body.mission_id,
        opportunities=body.opportunities,
        drafts=body.drafts,
        candidate_name=body.candidate_name,
    )
    if not result.get("ok") and not result.get("skipped"):
        raise HTTPException(status_code=502, detail=f"Telegram delivery failed: {result}")
    return result
