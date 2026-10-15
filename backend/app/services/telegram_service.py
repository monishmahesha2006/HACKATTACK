"""
Telegram Bot API integration for REWIND X.
Sends internship reports and personalized email drafts to candidates via Telegram.
"""
import logging
from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any

import httpx

logger = logging.getLogger(__name__)

TELEGRAM_API = "https://api.telegram.org/bot{token}/{method}"


@dataclass
class TelegramConfig:
    bot_token: str = ""
    chat_id: str = ""
    enabled: bool = False


# In-memory singleton config (persisted across requests within a server lifetime)
_config = TelegramConfig()


def get_config() -> TelegramConfig:
    return _config


def update_config(bot_token: str, chat_id: str, enabled: bool = True) -> None:
    _config.bot_token = bot_token.strip()
    _config.chat_id = chat_id.strip()
    _config.enabled = enabled


def is_configured() -> bool:
    return bool(_config.bot_token and _config.chat_id and _config.enabled)


async def _send_message(text: str, parse_mode: str = "HTML") -> Dict[str, Any]:
    """Raw Telegram sendMessage call."""
    url = TELEGRAM_API.format(token=_config.bot_token, method="sendMessage")
    payload = {
        "chat_id": _config.chat_id,
        "text": text,
        "parse_mode": parse_mode,
        "disable_web_page_preview": True,
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.post(url, json=payload)
        resp.raise_for_status()
        return resp.json()


async def test_connection() -> Dict[str, Any]:
    """Send a test ping to verify bot token and chat ID are valid."""
    if not _config.bot_token or not _config.chat_id:
        return {"ok": False, "error": "Bot token or chat ID not configured"}
    try:
        result = await _send_message(
            "✅ <b>REWIND X Telegram Integration Active</b>\n\n"
            "Your Telegram channel is now connected to the REWIND X autonomous operator. "
            "Internship reports and personalized email drafts will be delivered here automatically."
        )
        return {"ok": True, "message_id": result.get("result", {}).get("message_id")}
    except httpx.HTTPStatusError as e:
        logger.error("Telegram test failed: %s", e.response.text)
        return {"ok": False, "error": e.response.text}
    except Exception as e:
        logger.error("Telegram test error: %s", e)
        return {"ok": False, "error": str(e)}


async def send_internship_report(
    mission_id: str,
    opportunities: List[Dict[str, Any]],
    drafts: List[Dict[str, Any]],
    candidate_name: str = "Candidate",
) -> Dict[str, Any]:
    """
    Send full internship report + email drafts to candidate via Telegram.
    opportunities: list of ranked internship dicts (rank, company, role, stipend, deadline, url)
    drafts: list of email draft dicts (recipient, subject, body)
    """
    if not is_configured():
        return {"ok": False, "skipped": True, "reason": "Telegram not configured or disabled"}

    lines: List[str] = []

    # ── Header ──────────────────────────────────────────────────────────────
    lines.append("🎯 <b>REWIND X — Internship Research Report</b>")
    lines.append(f"<i>Mission ID: <code>{mission_id}</code></i>")
    lines.append("")
    lines.append(
        "Hi there! Your autonomous REWIND X agent has completed Scenario A — "
        "internship research and application preparation. Here are the results:"
    )
    lines.append("")

    # ── Ranked Internship Opportunities ─────────────────────────────────────
    lines.append("━━━━━━━━━━━━━━━━━━━━━━━━")
    lines.append("📊 <b>Top Internship Opportunities Found</b>")
    lines.append("━━━━━━━━━━━━━━━━━━━━━━━━")

    for i, opp in enumerate(opportunities[:3], start=1):
        medal = ["🥇", "🥈", "🥉"][i - 1]
        company = opp.get("company", f"Company {i}")
        role = opp.get("role", "AI/ML Intern")
        stipend = opp.get("stipend", "N/A")
        deadline = opp.get("deadline", "N/A")
        url = opp.get("url", "")
        match_score = opp.get("match_score") or opp.get("score", "")

        lines.append("")
        lines.append(f"{medal} <b>Rank #{i} — {company}</b>")
        lines.append(f"   💼 Role: {role}")
        if isinstance(stipend, (int, float)):
            lines.append(f"   💰 Stipend: ₹{stipend:,}/month")
        else:
            lines.append(f"   💰 Stipend: {stipend}")
        lines.append(f"   📅 Deadline: {deadline}")
        if match_score:
            lines.append(f"   🤖 ML Match Score: {match_score}")
        if url:
            lines.append(f"   🔗 <a href=\"{url}\">View Listing</a>")

    lines.append("")
    lines.append(f"✅ <b>{len(opportunities[:3])} opportunities saved to spreadsheet with zero duplicates.</b>")
    lines.append("")

    # ── Personalized Email Drafts ────────────────────────────────────────────
    lines.append("━━━━━━━━━━━━━━━━━━━━━━━━")
    lines.append("✉️ <b>Personalized Email Drafts</b>")
    lines.append("━━━━━━━━━━━━━━━━━━━━━━━━")

    for i, draft in enumerate(drafts[:3], start=1):
        recipient = draft.get("recipient", f"recruiting@company{i}.example")
        subject = draft.get("subject", f"Application for Internship — Draft {i}")
        body = draft.get("body", "")

        lines.append("")
        lines.append(f"📧 <b>Draft #{i}</b>")
        lines.append(f"   <b>To:</b> {recipient}")
        lines.append(f"   <b>Subject:</b> {subject}")
        lines.append("")
        # Indent body for readability; truncate if very long
        body_preview = body[:800] + ("…" if len(body) > 800 else "")
        for body_line in body_preview.split("\n"):
            lines.append(f"   {body_line}" if body_line.strip() else "")

    lines.append("")

    # ── Footer ───────────────────────────────────────────────────────────────
    lines.append("━━━━━━━━━━━━━━━━━━━━━━━━")
    lines.append(
        "⚡ <b>Powered by REWIND X</b> — Autonomous AI Operator with "
        "idempotent recovery, zero-duplicate guarantees, and human approval gates."
    )
    lines.append("")
    lines.append(
        "🔒 All applications are pending your Human Approval Gate before any email is dispatched."
    )

    full_message = "\n".join(lines)

    # Telegram has a 4096-char limit per message — split if needed
    chunks = _chunk_message(full_message, limit=4000)
    results = []
    for chunk in chunks:
        try:
            result = await _send_message(chunk)
            results.append({"ok": True, "message_id": result.get("result", {}).get("message_id")})
        except httpx.HTTPStatusError as e:
            logger.error("Telegram send failed (chunk): %s", e.response.text)
            results.append({"ok": False, "error": e.response.text})
        except Exception as e:
            logger.error("Telegram send error: %s", e)
            results.append({"ok": False, "error": str(e)})

    all_ok = all(r.get("ok") for r in results)
    return {
        "ok": all_ok,
        "chunks_sent": len(chunks),
        "results": results,
    }


def _chunk_message(text: str, limit: int = 4000) -> List[str]:
    """Split a long message into telegram-safe chunks, splitting on newlines."""
    if len(text) <= limit:
        return [text]
    chunks = []
    while text:
        if len(text) <= limit:
            chunks.append(text)
            break
        split_at = text.rfind("\n", 0, limit)
        if split_at == -1:
            split_at = limit
        chunks.append(text[:split_at])
        text = text[split_at:].lstrip("\n")
    return chunks
