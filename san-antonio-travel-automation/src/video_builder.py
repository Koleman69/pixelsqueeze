"""Assemble narration + stock media into scene clips, concatenate them, and
burn in captions from the TTS word timings. Everything is driven through
ffmpeg/ffprobe subprocess calls — no heavy Python video library needed."""

import subprocess
from dataclasses import dataclass
from pathlib import Path

from tts import SceneAudio

WIDTH, HEIGHT, FPS = 1920, 1080, 25


@dataclass
class Scene:
    audio: SceneAudio
    media_path: Path
    media_kind: str  # "video" or "image"
    narration: str


def _run(cmd: list[str]) -> None:
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg command failed:\n{' '.join(cmd)}\n{result.stderr[-4000:]}")


def _build_scene_clip(scene: Scene, out_path: Path) -> Path:
    duration = scene.audio.duration
    if scene.media_kind == "image":
        vf = (
            "scale=3840:2160,"
            "zoompan=z='min(zoom+0.0008,1.5)':d=1:"
            "x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':"
            f"s={WIDTH}x{HEIGHT}:fps={FPS}"
        )
        cmd = [
            "ffmpeg", "-y",
            "-loop", "1", "-i", str(scene.media_path),
            "-i", str(scene.audio.path),
            "-t", f"{duration:.3f}",
            "-vf", vf,
            "-map", "0:v:0", "-map", "1:a:0",
            "-c:v", "libx264", "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-shortest",
            str(out_path),
        ]
    else:
        vf = f"scale={WIDTH}:{HEIGHT}:force_original_aspect_ratio=increase,crop={WIDTH}:{HEIGHT},fps={FPS}"
        cmd = [
            "ffmpeg", "-y",
            "-stream_loop", "-1", "-i", str(scene.media_path),
            "-i", str(scene.audio.path),
            "-t", f"{duration:.3f}",
            "-vf", vf,
            "-map", "0:v:0", "-map", "1:a:0",
            "-c:v", "libx264", "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-shortest",
            str(out_path),
        ]
    _run(cmd)
    return out_path


def _srt_timestamp(seconds: float) -> str:
    ms = int(round(seconds * 1000))
    h, ms = divmod(ms, 3_600_000)
    m, ms = divmod(ms, 60_000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def _build_captions(scenes: list[Scene], out_path: Path, words_per_caption: int = 6) -> Path:
    lines = []
    index = 1
    offset = 0.0
    for scene in scenes:
        timings = scene.audio.word_timings
        for i in range(0, len(timings), words_per_caption):
            chunk = timings[i:i + words_per_caption]
            if not chunk:
                continue
            start = offset + chunk[0].start
            end = offset + chunk[-1].end
            text = " ".join(w.word for w in chunk)
            lines.append(f"{index}\n{_srt_timestamp(start)} --> {_srt_timestamp(end)}\n{text}\n")
            index += 1
        offset += scene.audio.duration

    out_path.write_text("\n".join(lines), encoding="utf-8")
    return out_path


def build_video(scenes: list[Scene], work_dir: Path, out_path: Path) -> Path:
    work_dir.mkdir(parents=True, exist_ok=True)

    clip_paths = []
    for i, scene in enumerate(scenes):
        clip_path = work_dir / f"clip_{i:02d}.mp4"
        _build_scene_clip(scene, clip_path)
        clip_paths.append(clip_path)

    concat_list = work_dir / "concat_list.txt"
    concat_list.write_text(
        "\n".join(f"file '{p.resolve()}'" for p in clip_paths), encoding="utf-8"
    )
    concatenated = work_dir / "concatenated.mp4"
    _run([
        "ffmpeg", "-y", "-f", "concat", "-safe", "0",
        "-i", str(concat_list), "-c", "copy", str(concatenated),
    ])

    srt_path = _build_captions(scenes, work_dir / "captions.srt")

    style = (
        "FontName=DejaVu Sans,FontSize=22,PrimaryColour=&H00FFFFFF,"
        "OutlineColour=&H00000000,BorderStyle=3,Outline=2,Shadow=0,"
        "Alignment=2,MarginV=70"
    )
    escaped_srt = str(srt_path).replace("\\", "\\\\").replace(":", "\\:")
    _run([
        "ffmpeg", "-y", "-i", str(concatenated),
        "-vf", f"subtitles={escaped_srt}:force_style='{style}'",
        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "copy",
        str(out_path),
    ])

    return out_path
