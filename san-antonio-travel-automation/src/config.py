"""Central config: every external credential/setting the pipeline needs,
read from environment variables so GitHub Actions secrets map straight in."""

import os
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
STATE_DIR = ROOT / "state"
ASSETS_DIR = ROOT / "assets"
OUTPUT_DIR = ROOT / "output"


def _env(name: str, default: str | None = None, required: bool = False) -> str | None:
    value = os.environ.get(name, default)
    if required and not value:
        raise RuntimeError(
            f"Missing required environment variable: {name}. See SETUP.md."
        )
    return value


@dataclass(frozen=True)
class Settings:
    # LLM (script + title/description/tags generation)
    anthropic_api_key: str | None = _env("ANTHROPIC_API_KEY")
    llm_model: str = _env("LLM_MODEL", "claude-sonnet-5")

    # Stock media
    pexels_api_key: str | None = _env("PEXELS_API_KEY")
    pixabay_api_key: str | None = _env("PIXABAY_API_KEY")

    # TTS
    elevenlabs_api_key: str | None = _env("ELEVENLABS_API_KEY")
    elevenlabs_voice_id: str = _env("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")
    edge_tts_voice: str = _env("EDGE_TTS_VOICE", "en-US-GuyNeural")

    # YouTube upload (OAuth "installed app" / refresh-token flow)
    youtube_client_id: str | None = _env("YOUTUBE_CLIENT_ID")
    youtube_client_secret: str | None = _env("YOUTUBE_CLIENT_SECRET")
    youtube_refresh_token: str | None = _env("YOUTUBE_REFRESH_TOKEN")
    youtube_privacy_status: str = _env("YOUTUBE_PRIVACY_STATUS", "unlisted")
    youtube_category_id: str = _env("YOUTUBE_CATEGORY_ID", "19")  # Travel & Events

    # Behavior
    dry_run: bool = _env("DRY_RUN", "false").lower() == "true"
    video_target_seconds: int = int(_env("VIDEO_TARGET_SECONDS", "240"))
    channel_name: str = _env("CHANNEL_NAME", "San Antonio Travel")


settings = Settings()

for d in (STATE_DIR, OUTPUT_DIR):
    d.mkdir(parents=True, exist_ok=True)
