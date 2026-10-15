import os
from pathlib import Path
from pydantic import ConfigDict
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

class Settings(BaseSettings):
    model_config = ConfigDict(env_file=str(BASE_DIR / ".env"), extra="allow")

    HOST: str = "127.0.0.1"
    PORT: int = 8000
    FRONTEND_ORIGIN: str = "http://localhost:5173"
    DEV_TOKEN: str = "rx_dev_token_secret_key_2026"
    MODE: str = "LOCAL_DEMO"  # LOCAL_DEMO | REAL | DEGRADED
    DATABASE_URL: str = f"sqlite+aiosqlite:///{DATA_DIR / 'rewind_x.db'}"
    SYNC_DATABASE_URL: str = f"sqlite:///{DATA_DIR / 'rewind_x.db'}"
    LLM_PROVIDER: str = "gemini"  # gemini | fake | anthropic | ollama
    GEMINI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    CAPABILITY_TOKEN_SECRET: str = "rx_capability_hmac_secret_42"
    HASH_CHAIN_SEED: str = "0" * 64
    LIVE_WEB: bool = False

settings = Settings()
