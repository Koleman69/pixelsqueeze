"""End-to-end run: pick a topic, write the script/metadata, synthesize
narration, fetch stock media, assemble the video, build a thumbnail, and
upload to YouTube. Run directly: `python pipeline.py [--topic "..."] [--dry-run]`."""

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from config import OUTPUT_DIR, settings  # noqa: E402
import config as config_module  # noqa: E402
from media import fetch_scene_media  # noqa: E402
from script_writer import write_video_package  # noqa: E402
from thumbnail import build_thumbnail  # noqa: E402
from topics import mark_used, pick_next_topic  # noqa: E402
from tts import synthesize_scene  # noqa: E402
from video_builder import Scene, build_video  # noqa: E402
from youtube_upload import upload_video  # noqa: E402


def run(topic_override: str | None = None) -> dict:
    topic = pick_next_topic(topic_override)
    print(f"[pipeline] Topic: {topic.subject} (pillar: {topic.pillar_id})")

    package = write_video_package(topic)
    print(f"[pipeline] Title: {package['title']}")
    print(f"[pipeline] {len(package['scenes'])} scenes")

    run_dir = OUTPUT_DIR / "current_run"
    audio_dir = run_dir / "audio"
    media_dir = run_dir / "media"
    run_dir.mkdir(parents=True, exist_ok=True)

    scenes = []
    for i, raw_scene in enumerate(package["scenes"]):
        print(f"[pipeline] Scene {i}: {raw_scene['keywords']}")
        audio = synthesize_scene(raw_scene["narration"], audio_dir, i)
        media_path, media_kind = fetch_scene_media(raw_scene["keywords"], media_dir)
        scenes.append(Scene(audio=audio, media_path=media_path, media_kind=media_kind, narration=raw_scene["narration"]))

    video_path = run_dir / "final_video.mp4"
    build_video(scenes, run_dir / "work", video_path)
    print(f"[pipeline] Video assembled: {video_path}")

    thumbnail_path = run_dir / "thumbnail.jpg"
    build_thumbnail(scenes[0].media_path, package["thumbnail_text"], thumbnail_path, settings.channel_name)
    print(f"[pipeline] Thumbnail built: {thumbnail_path}")

    video_id = upload_video(
        video_path=video_path,
        title=package["title"],
        description=package["description"],
        tags=package["tags"],
        thumbnail_path=thumbnail_path,
    )
    print(f"[pipeline] Uploaded video ID: {video_id}")

    mark_used(topic.subject)

    result = {
        "topic": topic.subject,
        "pillar": topic.pillar_id,
        "title": package["title"],
        "video_id": video_id,
        "video_url": f"https://youtu.be/{video_id}" if video_id != "DRY_RUN_VIDEO_ID" else None,
        "privacy_status": settings.youtube_privacy_status,
    }
    (OUTPUT_DIR / "last_run.json").write_text(json.dumps(result, indent=2), encoding="utf-8")
    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--topic", default=None, help="Force a specific subject instead of auto-rotating.")
    parser.add_argument("--dry-run", action="store_true", help="Build the video but skip the real YouTube upload.")
    args = parser.parse_args()

    if args.dry_run:
        object.__setattr__(config_module.settings, "dry_run", True)

    result = run(topic_override=args.topic)
    print(json.dumps(result, indent=2))
