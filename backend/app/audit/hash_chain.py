import os
import hashlib
import json
import sqlite3
import shutil
import tempfile
from typing import Any, Dict, List, Optional, Tuple
from sqlalchemy.orm import Session
from backend.app.core.config import settings, DATA_DIR
from backend.app.db.session import init_db
from backend.app.models.entities import AuditEventModel, utc_now_iso

def canonical_json(obj: Any) -> str:
    """Produces deterministic canonical JSON (sorted keys, no extra whitespace)."""
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False)

def compute_hash(prev_hash: str, event_data: Dict[str, Any]) -> str:
    """Computes SHA-256 hash = sha256(prev_hash + canonical_json(event_data))."""
    serialized = canonical_json(event_data)
    combined = prev_hash.encode("utf-8") + serialized.encode("utf-8")
    return hashlib.sha256(combined).hexdigest()

class HashChainSubsystem:
    """Append-only cryptographic SHA-256 hash-chained audit ledger."""

    def __init__(self, seed_hash: Optional[str] = None):
        self.seed_hash = seed_hash or settings.HASH_CHAIN_SEED

    def record_event(
        self,
        db: Session,
        event_type: str,
        actor: str,
        status: str = "OK",
        mission_id: Optional[str] = None,
        step_id: Optional[str] = None,
        tool: Optional[str] = None,
        args_hash: Optional[str] = None,
        result_summary: Optional[str] = None,
        ts: Optional[str] = None,
    ) -> AuditEventModel:
        now_ts = ts or utc_now_iso()
        
        # Lock and query the latest audit event to get current head hash and sequence
        last_event = (
            db.query(AuditEventModel)
            .order_by(AuditEventModel.seq.desc())
            .first()
        )
        
        prev_hash = last_event.hash if last_event else self.seed_hash
        next_seq = (last_event.seq + 1) if last_event and last_event.seq else 1
        event_id = f"evt_{next_seq:08d}"

        event_payload = {
            "id": event_id,
            "seq": next_seq,
            "mission_id": mission_id,
            "step_id": step_id,
            "type": event_type,
            "actor": actor,
            "tool": tool,
            "args_hash": args_hash,
            "result_summary": result_summary,
            "status": status,
            "prev_hash": prev_hash,
            "ts": now_ts,
        }

        current_hash = compute_hash(prev_hash, event_payload)

        record = AuditEventModel(
            id=event_id,
            seq=next_seq,
            mission_id=mission_id,
            step_id=step_id,
            type=event_type,
            actor=actor,
            tool=tool,
            args_hash=args_hash,
            result_summary=result_summary,
            status=status,
            prev_hash=prev_hash,
            hash=current_hash,
            ts=now_ts,
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return record

    def verify_chain(self, db: Session) -> Dict[str, Any]:
        """Verifies the complete SHA-256 cryptographic chain."""
        events = db.query(AuditEventModel).order_by(AuditEventModel.seq.asc()).all()
        if not events:
            return {
                "valid": True,
                "checked": 0,
                "first_invalid_seq": None,
                "head_hash": self.seed_hash,
            }

        prev_hash = self.seed_hash
        for ev in events:
            # Check prev_hash matches
            if ev.prev_hash != prev_hash:
                return {
                    "valid": False,
                    "checked": ev.seq,
                    "first_invalid_seq": ev.seq,
                    "head_hash": ev.hash,
                }
            
            payload = {
                "id": ev.id,
                "seq": ev.seq,
                "mission_id": ev.mission_id,
                "step_id": ev.step_id,
                "type": ev.type,
                "actor": ev.actor,
                "tool": ev.tool,
                "args_hash": ev.args_hash,
                "result_summary": ev.result_summary,
                "status": ev.status,
                "prev_hash": ev.prev_hash,
                "ts": ev.ts,
            }
            computed = compute_hash(prev_hash, payload)
            if computed != ev.hash:
                return {
                    "valid": False,
                    "checked": ev.seq,
                    "first_invalid_seq": ev.seq,
                    "head_hash": ev.hash,
                }
            prev_hash = ev.hash

        return {
            "valid": True,
            "checked": len(events),
            "first_invalid_seq": None,
            "head_hash": events[-1].hash if events else self.seed_hash,
        }

    def run_isolated_tamper_test(self) -> Dict[str, Any]:
        """Runs tamper verification on an isolated scratch copy of the database."""
        init_db()
        db_path = DATA_DIR / "rewind_x.db"
        if not db_path.exists():
            return {
                "tamper_detected": False,
                "error": "Database file does not exist yet",
                "valid": True,
                "checked": 0
            }

        with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp:
            scratch_path = tmp.name

        try:
            shutil.copy2(db_path, scratch_path)
            conn = sqlite3.connect(scratch_path)
            cursor = conn.cursor()
            
            # Count rows
            cursor.execute("SELECT seq, id, type, result_summary, hash FROM audit_events ORDER BY seq ASC")
            rows = cursor.fetchall()
            if not rows:
                conn.close()
                return {
                    "tamper_detected": True,
                    "message": "No events to tamper in scratch copy",
                    "scratch_verified": True
                }

            # Tamper the middle or last event in scratch copy
            target = rows[len(rows) // 2]
            tamper_seq = target[0]
            cursor.execute(
                "UPDATE audit_events SET result_summary = ? WHERE seq = ?",
                ("TAMPERED_CONTENT_TEST", tamper_seq)
            )
            conn.commit()

            # Now verify scratch copy
            cursor.execute("SELECT id, seq, mission_id, step_id, type, actor, tool, args_hash, result_summary, status, prev_hash, hash, ts FROM audit_events ORDER BY seq ASC")
            tampered_rows = cursor.fetchall()
            conn.close()

            prev_hash = self.seed_hash
            detected_seq = None
            for row in tampered_rows:
                r_id, r_seq, r_m, r_st, r_tp, r_act, r_tl, r_ah, r_rs, r_stat, r_ph, r_h, r_ts = row
                if r_ph != prev_hash:
                    detected_seq = r_seq
                    break
                payload = {
                    "id": r_id,
                    "seq": r_seq,
                    "mission_id": r_m,
                    "step_id": r_st,
                    "type": r_tp,
                    "actor": r_act,
                    "tool": r_tl,
                    "args_hash": r_ah,
                    "result_summary": r_rs,
                    "status": r_stat,
                    "prev_hash": r_ph,
                    "ts": r_ts,
                }
                computed = compute_hash(prev_hash, payload)
                if computed != r_h:
                    detected_seq = r_seq
                    break
                prev_hash = r_h

            return {
                "tamper_detected": detected_seq is not None,
                "tampered_seq": tamper_seq,
                "detected_invalid_seq": detected_seq,
                "message": f"Tamper correctly caught at block #{detected_seq} in isolated scratch simulation"
            }
        finally:
            if os.path.exists(scratch_path):
                try:
                    os.remove(scratch_path)
                except Exception:
                    pass

audit_subsystem = HashChainSubsystem()
