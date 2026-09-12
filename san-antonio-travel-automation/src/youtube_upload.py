"""Upload the finished video to YouTube with title/description/tags/category
and set a custom thumbnail, using a pre-authorized OAuth refresh token (see
SETUP.md for the one-time steps to obtain it — this module never runs an
interactive login itself)."""

from pathlib import Path

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

from config import settings

SCOPES = [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube",
]

TITLE_MAX = 100
TAGS_MAX_CHARS = 460  # YouTube's real limit is 500; leave margin for commas/encoding.


def _clip_title(title: str) -> str:
    return title if len(title) <= TITLE_MAX else title[: TITLE_MAX - 1].rstrip() + "…"


def _clip_tags(tags: list[str]) -> list[str]:
    kept, total = [], 0
    for tag in tags:
        total += len(tag) + 1
        if total > TAGS_MAX_CHARS:
            break
        kept.append(tag)
    return kept


def _get_client():
    missing = [
        name for name, value in (
            ("YOUTUBE_CLIENT_ID", settings.youtube_client_id),
            ("YOUTUBE_CLIENT_SECRET", settings.youtube_client_secret),
            ("YOUTUBE_REFRESH_TOKEN", settings.youtube_refresh_token),
        ) if not value
    ]
    if missing:
        raise RuntimeError(
            f"Missing YouTube OAuth credentials: {', '.join(missing)}. See SETUP.md."
        )

    creds = Credentials(
        token=None,
        refresh_token=settings.youtube_refresh_token,
        client_id=settings.youtube_client_id,
        client_secret=settings.youtube_client_secret,
        token_uri="https://oauth2.googleapis.com/token",
        scopes=SCOPES,
    )
    return build("youtube", "v3", credentials=creds)


def upload_video(
    video_path: Path,
    title: str,
    description: str,
    tags: list[str],
    thumbnail_path: Path | None = None,
) -> str:
    if settings.dry_run:
        print(f"[DRY_RUN] Would upload {video_path} titled '{title}' with thumbnail {thumbnail_path}")
        return "DRY_RUN_VIDEO_ID"

    youtube = _get_client()

    body = {
        "snippet": {
            "title": _clip_title(title),
            "description": description,
            "tags": _clip_tags(tags),
            "categoryId": settings.youtube_category_id,
        },
        "status": {
            "privacyStatus": settings.youtube_privacy_status,
            "selfDeclaredMadeForKids": False,
        },
    }

    media = MediaFileUpload(str(video_path), chunksize=-1, resumable=True, mimetype="video/mp4")
    request = youtube.videos().insert(part="snippet,status", body=body, media_body=media)

    response = None
    while response is None:
        _, response = request.next_chunk()

    video_id = response["id"]

    if thumbnail_path:
        youtube.thumbnails().set(
            videoId=video_id,
            media_body=MediaFileUpload(str(thumbnail_path)),
        ).execute()

    return video_id
