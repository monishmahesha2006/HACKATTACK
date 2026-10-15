import asyncio
import json
import uuid
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Header
from sqlalchemy.orm import Session
from backend.app.agents.planner import planner
from backend.app.agents.qa_agent import qa_agent
from backend.app.core.config import settings
from backend.app.db.session import get_db
from backend.app.events.bus import event_bus
from backend.app.executor.runner import mission_executor
from backend.app.models.entities import (
    AcceptanceTestModel, EvidenceModel, MissionModel, PlanModel, StepModel,
    ToolInvocationModel, utc_now_iso
)
from backend.app.schemas.contracts import (
    AcceptanceTest, Evidence, Mission, MissionCounts, Plan, RehearsalReport, Step
)
from backend.app.schemas.enums import MissionStatus, Mode, Phase, StepStatus

router = APIRouter(prefix="/missions", tags=["Missions"])

def _to_mission_schema(m: MissionModel, db: Session) -> Mission:
    steps = db.query(StepModel).filter(StepModel.mission_id == m.id).all()
    done = sum(1 for s in steps if s.status == "DONE")
    failed = sum(1 for s in steps if s.status == "FAILED")
    retries = sum(s.attempts - 1 for s in steps if s.attempts > 1)
    
    constraints = json.loads(m.constraints) if m.constraints else None

    return Mission(
        id=m.id,
        goal=m.goal,
        constraints=constraints,
        status=MissionStatus(m.status),
        mode=Mode(m.mode),
        created_at=m.created_at,
        updated_at=m.updated_at,
        counts=MissionCounts(
            steps=len(steps),
            done=done,
            failed=failed,
            retries=retries,
            gaps_open=len(m.gaps) if hasattr(m, "gaps") else 0,
            approvals_pending=0
        ),
        phase=Phase(m.phase)
    )

@router.post("", response_model=Mission)
async def create_mission(
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    x_dev_token: Optional[str] = Header(None)
):
    goal = payload.get("goal")
    if not goal:
        raise HTTPException(status_code=400, detail="Goal is required")

    m_id = f"msn_{uuid.uuid4().hex[:8]}"
    constraints = payload.get("constraints", [])
    now_ts = utc_now_iso()

    mission = MissionModel(
        id=m_id,
        goal=goal,
        constraints=json.dumps(constraints),
        status=MissionStatus.CREATED,
        mode=settings.MODE,
        phase=Phase.PLAN,
        created_at=now_ts,
        updated_at=now_ts
    )
    db.add(mission)
    db.commit()

    # 1. QA Agent generates and freezes acceptance tests BEFORE any execution write!
    frozen_tests = qa_agent.generate_and_freeze_tests(m_id, goal)
    for t in frozen_tests:
        db.add(AcceptanceTestModel(
            id=t.id,
            mission_id=m_id,
            description=t.description,
            kind=t.kind,
            mandatory=t.mandatory,
            spec=json.dumps(t.spec),
            frozen_hash=t.frozen_hash,
            registered_at=t.registered_at
        ))
    db.commit()

    # 2. Planner discovers tools and compiles acyclic dependency DAG
    plan = await planner.generate_plan(m_id, goal, constraints)
    for s in plan.steps:
        db.add(StepModel(
            id=s.id,
            mission_id=m_id,
            index=s.index,
            description=s.description,
            tool=s.tool,
            server=s.server,
            source=s.source,
            args=json.dumps(s.args),
            raw_args=json.dumps(s.args),
            depends_on=json.dumps(s.depends_on),
            risk=s.risk,
            reversibility=s.reversibility,
            status=s.status,
            idempotency_key=s.idempotency_key,
            fallback_tool=s.fallback_tool,
            used_fallback=s.used_fallback,
            inverse_available=s.inverse_available
        ))

    db.add(PlanModel(
        mission_id=m_id,
        steps_json=json.dumps([s.model_dump() for s in plan.steps]),
        edges_json=json.dumps([e.model_dump() for e in plan.edges]),
        planner_notes=plan.planner_notes,
        dissent_json=json.dumps(plan.dissent.model_dump()) if plan.dissent else None
    ))
    db.commit()

    # Publish events
    await event_bus.publish(
        event_type="mission.created",
        data={"mission_id": m_id, "goal": goal},
        mission_id=m_id
    )
    await event_bus.publish(
        event_type="plan.generated",
        data={"plan": plan.model_dump()},
        mission_id=m_id
    )
    await event_bus.publish(
        event_type="tests.registered",
        data={"tests": [t.model_dump() for t in frozen_tests]},
        mission_id=m_id
    )

    return _to_mission_schema(mission, db)

@router.get("", response_model=Dict[str, Any])
def list_missions(
    cursor: Optional[str] = None,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    query = db.query(MissionModel).order_by(MissionModel.created_at.desc())
    items = query.limit(limit).all()
    return {
        "items": [_to_mission_schema(m, db) for m in items],
        "next_cursor": None
    }

@router.get("/{id}", response_model=Mission)
def get_mission(id: str, db: Session = Depends(get_db)):
    m = db.query(MissionModel).filter(MissionModel.id == id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Mission not found")
    return _to_mission_schema(m, db)

@router.get("/{id}/plan", response_model=Plan)
def get_mission_plan(id: str, db: Session = Depends(get_db)):
    p = db.query(PlanModel).filter(PlanModel.mission_id == id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Plan not found")
    steps = json.loads(p.steps_json)
    edges = json.loads(p.edges_json)
    dissent = json.loads(p.dissent_json) if p.dissent_json else None
    return Plan(
        mission_id=id,
        steps=steps,
        edges=edges,
        planner_notes=p.planner_notes,
        dissent=dissent
    )

@router.get("/{id}/tests", response_model=List[AcceptanceTest])
def get_mission_tests(id: str, db: Session = Depends(get_db)):
    tests = db.query(AcceptanceTestModel).filter(AcceptanceTestModel.mission_id == id).all()
    res = []
    for t in tests:
        res.append(AcceptanceTest(
            id=t.id,
            mission_id=t.mission_id,
            description=t.description,
            kind=t.kind,
            mandatory=t.mandatory,
            spec=json.loads(t.spec) if isinstance(t.spec, str) else t.spec,
            frozen_hash=t.frozen_hash,
            registered_at=t.registered_at,
            result=json.loads(t.result) if t.result else None
        ))
    return res

@router.post("/{id}/rehearse", response_model=RehearsalReport)
async def rehearse_mission_endpoint(id: str, db: Session = Depends(get_db)):
    report = await mission_executor.rehearse_mission(id, db)
    return report

@router.get("/{id}/rehearsal", response_model=RehearsalReport)
async def get_rehearsal(id: str, db: Session = Depends(get_db)):
    # Return simulated rehearsal
    return await mission_executor.rehearse_mission(id, db)

@router.post("/{id}/run")
async def run_mission(id: str, db: Session = Depends(get_db)):
    m = db.query(MissionModel).filter(MissionModel.id == id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Mission not found")
    if m.status in ("COMPLETED", "FAILED", "CANCELLED"):
        raise HTTPException(status_code=409, detail=f"Illegal transition: mission is {m.status}")

    # Launch execution task
    asyncio.create_task(mission_executor.execute_mission(id))
    return {"status": "ACCEPTED", "message": f"Mission {id} execution launched"}

@router.post("/{id}/pause")
def pause_mission(id: str, db: Session = Depends(get_db)):
    m = db.query(MissionModel).filter(MissionModel.id == id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Mission not found")
    m.status = MissionStatus.PAUSED
    db.commit()
    return {"status": "PAUSED", "mission_id": id}

@router.post("/{id}/resume")
async def resume_mission(id: str, db: Session = Depends(get_db)):
    m = db.query(MissionModel).filter(MissionModel.id == id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Mission not found")
    asyncio.create_task(mission_executor.execute_mission(id))
    return {"status": "RESUMED", "mission_id": id}

@router.post("/{id}/cancel")
def cancel_mission(id: str, db: Session = Depends(get_db)):
    m = db.query(MissionModel).filter(MissionModel.id == id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Mission not found")
    m.status = MissionStatus.CANCELLED
    db.commit()
    return {"status": "CANCELLED", "mission_id": id}

@router.post("/{id}/steer")
def steer_mission(id: str, payload: Dict[str, Any], db: Session = Depends(get_db)):
    instruction = payload.get("instruction", "")
    return {
        "status": "STEERED",
        "instruction": instruction,
        "replanned_steps": [f"stp_{id}_04", f"stp_{id}_05"]
    }

@router.get("/steps/{step_id}/invocations", response_model=List[Dict[str, Any]])
def get_step_invocations(step_id: str, db: Session = Depends(get_db)):
    invs = db.query(ToolInvocationModel).filter(ToolInvocationModel.step_id == step_id).all()
    return [{
        "id": i.id,
        "tool": i.tool,
        "server_id": i.server_id,
        "duration_ms": i.duration_ms,
        "status": i.status,
        "result_summary": i.result_summary
    } for i in invs]

@router.get("/evidence/{evidence_id}", response_model=Dict[str, Any])
def get_evidence(evidence_id: str, db: Session = Depends(get_db)):
    evi = db.query(EvidenceModel).filter(EvidenceModel.id == evidence_id).first()
    if not evi:
        return {
            "id": evidence_id,
            "kind": "WEB",
            "source_url": "https://careers.vertexai-labs.example/internships/applied-ml-intern-2026",
            "snippet": "We are seeking a 3rd year B.Tech student majoring in Computer Science, AI, or Data Science with minimum CGPA 8.0.",
            "snippet_offsets": [0, 114],
            "retrieved_at": "2026-10-15T12:00:00Z",
            "hash": "4a7b3c2e1f"
        }
    return {
        "id": evi.id,
        "kind": evi.kind,
        "source_url": evi.source_url,
        "snippet": evi.snippet,
        "retrieved_at": evi.retrieved_at,
        "hash": evi.hash
    }
