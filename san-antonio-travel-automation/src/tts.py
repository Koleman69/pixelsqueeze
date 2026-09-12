"""Text-to-speech for scene narration.

Default: edge-tts (Microsoft, free, no API key) — also gives word-boundary
timestamps for free, which we use to time captions.

Optional: ElevenLabs, if ELEVENLABS_API_KEY is set, for a higher-quality
voice. ElevenLabs doesn't hand us word timestamps here, so captions for
those scenes are evenly spaced across the measured audio duration instead.
"""

import asyncio
import subprocess
from dataclasses import dataclass
from pathlib import Path

import edge_tts
import requests

from config import settings


@dataclass
class WordTiming:
    word: str
    start: float  # seconds
    end: float  # seconds


@dataclass
class SceneAudio:
    path: Path
    duration: float
    word_timings: list[WordTiming]


def _ffprobe_duration(path: Path) -> float:
    result = subprocess.run(
        [
            "ffprobe", "-v", "error", "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1", str(path),
        ],
        capture_output=True, text=True, check=True,
    )
    return float(result.stdout.strip())


def _even_word_timings(text: str, duration: float) -> list[WordTiming]:
    words = text.split()
    if not words:
        return []
    per_word = duration / len(words)
    timings = []
    t = 0.0
    for w in words:
        timings.append(WordTiming(w, t, t + per_word))
        t += per_word
    return timings


async def _edge_tts_synthesize(text: str, out_path: Path) -> list[WordTiming]:
    communicate = edge_tts.Communicate(text, settings.edge_tts_voice)
    word_timings: list[WordTiming] = []
    with open(out_path, "wb") as audio_file:
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_file.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                start = chunk["offset"] / 10_000_000  # 100ns units -> seconds
                dur = chunk["duration"] / 10_000_000
                word_timings.append(WordTiming(chunk["text"], start, start + dur))
    return word_timings


def _elevenlabs_synthesize(text: str, out_path: Path) -> None:
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{settings.elevenlabs_voice_id}"
    response = requests.post(
        url,
        headers={
            "xi-api-key": settings.elevenlabs_api_key,
            "Content-Type": "application/json",
        },
        json={
            "text": text,
            "model_id": "eleven_multilingual_v2",
            "voice_settings": {"stability": 0.45, "similarity_boost": 0.75},
        },
        timeout=120,
    )
    response.raise_for_status()
    out_path.write_bytes(response.content)


def synthesize_scene(text: str, out_dir: Path, scene_index: int) -> SceneAudio:
    out_dir.mkdir(parents=True, exist_ok=True)
    mp3_path = out_dir / f"scene_{scene_index:02d}.mp3"

    if settings.elevenlabs_api_key:
        _elevenlabs_synthesize(text, mp3_path)
        duration = _ffprobe_duration(mp3_path)
        word_timings = _even_word_timings(text, duration)
    else:
        word_timings = asyncio.run(_edge_tts_synthesize(text, mp3_path))
        duration = _ffprobe_duration(mp3_path)
        if not word_timings:
            word_timings = _even_word_timings(text, duration)

    return SceneAudio(path=mp3_path, duration=duration, word_timings=word_timings)
