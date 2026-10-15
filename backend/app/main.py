import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from backend.app.core.config import settings
from backend.app.db.session import engine, Base, SessionLocal
from backend.app.audit.hash_chain import audit_subsystem
from backend.app.api.health import router as health_router
from backend.app.api.missions import router as missions_router
from backend.app.api.verification import router as verification_router
from backend.app.api.approvals import router as approvals_router
from backend.app.api.rewind import router as rewind_router
from backend.app.api.audit import router as audit_router
from backend.app.api.mcp_routes import router as mcp_router
from backend.app.api.ml_routes import router as ml_router
from backend.app.api.chaos import router as chaos_router
from backend.app.api.security_routes import router as security_router
from backend.app.api.events_routes import router as events_router
from backend.app.api.compare_routes import router as compare_router
from backend.app.api.receipt_routes import router as receipt_router
from backend.app.api.timeline_routes import router as timeline_router
from backend.app.api.telegram_routes import router as telegram_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables
    Base.metadata.create_all(bind=engine)
    
    # Initialize audit genesis event if empty
    db = SessionLocal()
    try:
        ver = audit_subsystem.verify_chain(db)
        if ver["checked"] == 0:
            audit_subsystem.record_event(
                db=db,
                event_type="system.boot",
                actor="kernel",
                status="OK",
                result_summary="REWIND X Kernel Boot & Cryptographic Hash Chain Genesis"
            )
    finally:
        db.close()
    yield

app = FastAPI(
    title="REWIND X: Autonomous AI Operator API",
    description="Single source of truth API contract for REWIND X autonomous operator.",
    version="4.2.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# CORS setup for frontend dev origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN, "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth Middleware: X-Dev-Token on state-changing routes
@app.middleware("http")
async def dev_token_auth_middleware(request: Request, call_next):
    # Check if state-changing request under /api/v1
    if request.method in ("POST", "PUT", "DELETE", "PATCH") and request.url.path.startswith("/api/v1"):
        # Allow demo reset and mock tests if token matches or dev mode
        dev_token = request.headers.get("x-dev-token")
        if settings.DEV_TOKEN and dev_token and dev_token != settings.DEV_TOKEN:
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"error": {"code": "AUTH_FAILED", "message": "Invalid X-Dev-Token header"}}
            )
    response = await call_next(request)
    return response

# Mount all routers under /api/v1
api_prefix = "/api/v1"
app.include_router(health_router, prefix=api_prefix)
app.include_router(missions_router, prefix=api_prefix)
app.include_router(verification_router, prefix=api_prefix)
app.include_router(approvals_router, prefix=api_prefix)
app.include_router(rewind_router, prefix=api_prefix)
app.include_router(audit_router, prefix=api_prefix)
app.include_router(mcp_router, prefix=api_prefix)
app.include_router(ml_router, prefix=api_prefix)
app.include_router(chaos_router, prefix=api_prefix)
app.include_router(security_router, prefix=api_prefix)
app.include_router(events_router, prefix=api_prefix)
app.include_router(compare_router, prefix=api_prefix)
app.include_router(receipt_router, prefix=api_prefix)
app.include_router(timeline_router, prefix=api_prefix)
app.include_router(telegram_router, prefix=api_prefix)

# Root redirect to health
@app.get("/")
def root():
    return {"name": "REWIND X", "version": "4.2.0", "docs": "/docs"}
