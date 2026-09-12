"""Fetch stock video clips (preferred) or photos (fallback) for a scene's
search keywords, via Pexels first, then Pixabay if Pexels has nothing or no
key is set. Everything gets cached to disk under output/media/ by a hash of
the search query so re-runs of the same topic don't re-download."""

import hashlib
from pathlib import Path

import requests

from config import settings

PEXELS_VIDEO_URL = "https://api.pexels.com/videos/search"
PEXELS_PHOTO_URL = "https://api.pexels.com/v1/search"
PIXABAY_URL = "https://pixabay.com/api/"
PIXABAY_VIDEO_URL = "https://pixabay.com/api/videos/"


def _cache_path(query: str, media_dir: Path, suffix: str) -> Path:
    key = hashlib.sha1(query.lower().encode()).hexdigest()[:16]
    return media_dir / f"{key}{suffix}"


def _download(url: str, dest: Path) -> Path:
    response = requests.get(url, timeout=60, stream=True)
    response.raise_for_status()
    with open(dest, "wb") as f:
        for chunk in response.iter_content(chunk_size=1 << 16):
            f.write(chunk)
    return dest


def _pexels_video(query: str) -> str | None:
    if not settings.pexels_api_key:
        return None
    resp = requests.get(
        PEXELS_VIDEO_URL,
        headers={"Authorization": settings.pexels_api_key},
        params={"query": f"San Antonio Texas {query}", "orientation": "landscape", "per_page": 5},
        timeout=30,
    )
    if resp.status_code != 200:
        return None
    videos = resp.json().get("videos", [])
    if not videos:
        return None
    # Prefer an HD file around 1080p, smallest that qualifies, to keep downloads light.
    files = sorted(
        (f for f in videos[0]["video_files"] if f.get("width", 0) >= 1280),
        key=lambda f: f.get("width", 0),
    )
    chosen = files[0] if files else videos[0]["video_files"][0]
    return chosen["link"]


def _pexels_photo(query: str) -> str | None:
    if not settings.pexels_api_key:
        return None
    resp = requests.get(
        PEXELS_PHOTO_URL,
        headers={"Authorization": settings.pexels_api_key},
        params={"query": f"San Antonio Texas {query}", "orientation": "landscape", "per_page": 5},
        timeout=30,
    )
    if resp.status_code != 200:
        return None
    photos = resp.json().get("photos", [])
    if not photos:
        return None
    return photos[0]["src"]["large2x"]


def _pixabay_video(query: str) -> str | None:
    if not settings.pixabay_api_key:
        return None
    resp = requests.get(
        PIXABAY_VIDEO_URL,
        params={
            "key": settings.pixabay_api_key,
            "q": f"San Antonio {query}",
            "orientation": "horizontal",
            "per_page": 5,
        },
        timeout=30,
    )
    if resp.status_code != 200:
        return None
    hits = resp.json().get("hits", [])
    if not hits:
        return None
    videos = hits[0]["videos"]
    return (videos.get("medium") or videos.get("small") or {}).get("url")


def _pixabay_photo(query: str) -> str | None:
    if not settings.pixabay_api_key:
        return None
    resp = requests.get(
        PIXABAY_URL,
        params={
            "key": settings.pixabay_api_key,
            "q": f"San Antonio {query}",
            "orientation": "horizontal",
            "image_type": "photo",
            "per_page": 5,
        },
        timeout=30,
    )
    if resp.status_code != 200:
        return None
    hits = resp.json().get("hits", [])
    if not hits:
        return None
    return hits[0]["largeImageURL"]


def fetch_scene_media(query: str, media_dir: Path) -> tuple[Path, str]:
    """Returns (file_path, kind) where kind is 'video' or 'image'."""
    media_dir.mkdir(parents=True, exist_ok=True)

    for finder, suffix, kind in (
        (_pexels_video, ".mp4", "video"),
        (_pixabay_video, ".mp4", "video"),
        (_pexels_photo, ".jpg", "image"),
        (_pixabay_photo, ".jpg", "image"),
    ):
        cache_path = _cache_path(query, media_dir, suffix)
        if cache_path.exists():
            return cache_path, kind
        url = finder(query)
        if url:
            return _download(url, cache_path), kind

    raise RuntimeError(
        f"No stock media found for query '{query}'. Set PEXELS_API_KEY and/or "
        "PIXABAY_API_KEY (see SETUP.md)."
    )
