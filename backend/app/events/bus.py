import asyncio
import json
from typing import AsyncGenerator, Dict, Any, List, Optional
from sqlalchemy.orm import Session
from backend.app.db.session import SessionLocal
from backend.app.models.entities import EventRecordModel, utc_now_iso

class EventBus:
    def __init__(self):
        self._subscribers: List[asyncio.Queue] = []
        self._lock = asyncio.Lock()

    async def subscribe(self) -> asyncio.Queue:
        q: asyncio.Queue = asyncio.Queue(maxsize=1000)
        async with self._lock:
            self._subscribers.append(q)
        return q

    async def unsubscribe(self, q: asyncio.Queue):
        async with self._lock:
            if q in self._subscribers:
                self._subscribers.remove(q)

    def publish_sync(
        self,
        event_type: str,
        data: Dict[str, Any],
        mission_id: Optional[str] = None,
        step_id: Optional[str] = None,
        correlation_id: Optional[str] = None,
    ) -> EventRecordModel:
        """Persists the event to the DB first, then schedules broadcast."""
        db = SessionLocal()
        try:
            corr_id = correlation_id or f"corr_{int(asyncio.get_event_loop().time() * 1000)}"
        except RuntimeError:
            corr_id = correlation_id or "corr_init"

        try:
            record = EventRecordModel(
                type=event_type,
                mission_id=mission_id,
                step_id=step_id,
                correlation_id=corr_id,
                ts=utc_now_iso(),
                data=json.dumps(data),
            )
            db.add(record)
            db.commit()
            db.refresh(record)

            envelope = {
                "id": record.id,
                "type": record.type,
                "mission_id": record.mission_id,
                "step_id": record.step_id,
                "correlation_id": record.correlation_id,
                "ts": record.ts,
                "data": data,
            }

            # Broadcast to in-memory queues if event loop is running
            try:
                loop = asyncio.get_running_loop()
                loop.create_task(self._broadcast(envelope))
            except RuntimeError:
                pass

            return record
        finally:
            db.close()

    async def publish(
        self,
        event_type: str,
        data: Dict[str, Any],
        mission_id: Optional[str] = None,
        step_id: Optional[str] = None,
        correlation_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Async variant of publish."""
        record = self.publish_sync(
            event_type=event_type,
            data=data,
            mission_id=mission_id,
            step_id=step_id,
            correlation_id=correlation_id
        )
        return {
            "id": record.id,
            "type": record.type,
            "mission_id": record.mission_id,
            "step_id": record.step_id,
            "correlation_id": record.correlation_id,
            "ts": record.ts,
            "data": data,
        }

    async def _broadcast(self, envelope: Dict[str, Any]):
        async with self._lock:
            for q in list(self._subscribers):
                try:
                    q.put_nowait(envelope)
                except asyncio.QueueFull:
                    # Drop oldest or skip
                    pass

    async def event_generator(
        self,
        mission_id: Optional[str] = None,
        last_event_id: Optional[int] = None
    ) -> AsyncGenerator[str, None]:
        # First send historical catch-up events if last_event_id provided
        if last_event_id is not None:
            db = SessionLocal()
            try:
                query = db.query(EventRecordModel).filter(EventRecordModel.id > last_event_id)
                if mission_id:
                    query = query.filter(
                        (EventRecordModel.mission_id == mission_id) | (EventRecordModel.mission_id == None)
                    )
                catchup = query.order_by(EventRecordModel.id.asc()).limit(500).all()
                for rec in catchup:
                    env = {
                        "id": rec.id,
                        "type": rec.type,
                        "mission_id": rec.mission_id,
                        "step_id": rec.step_id,
                        "correlation_id": rec.correlation_id,
                        "ts": rec.ts,
                        "data": json.loads(rec.data),
                    }
                    yield f"id: {rec.id}\nevent: {rec.type}\ndata: {json.dumps(env)}\n\n"
            finally:
                db.close()

        # Subscribe for live events
        q = await self.subscribe()
        try:
            while True:
                try:
                    # Wait for next event or send ping every 15s
                    envelope = await asyncio.wait_for(q.get(), timeout=15.0)
                    if mission_id and envelope.get("mission_id") and envelope["mission_id"] != mission_id:
                        continue
                    yield f"id: {envelope['id']}\nevent: {envelope['type']}\ndata: {json.dumps(envelope)}\n\n"
                except asyncio.TimeoutError:
                    yield ": ping\n\n"
        finally:
            await self.unsubscribe(q)

event_bus = EventBus()
