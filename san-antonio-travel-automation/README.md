# San Antonio Travel — YouTube Automation

Automates the faceless "San Antonio Travel" YouTube channel end to end:
picks a content topic, writes the script + title + description + tags,
generates a voiceover, pulls matching stock footage/photos, assembles a
captioned video, builds a thumbnail, and uploads it — all on a GitHub
Actions schedule.

**Read [`SETUP.md`](SETUP.md) first** — the pipeline needs a few API keys
before it can run for real (a free-tier LLM key, a stock-media key, and a
one-time YouTube OAuth setup). Until those are in place, runs will fail
loudly and tell you what's missing rather than silently doing nothing.

## How it works

```
topics.yaml + used_topics.json   →  pick an unused subject (topics.py)
                                  ↓
Claude (script_writer.py)        →  title, description, tags, thumbnail text,
                                     and 8-14 narration scenes w/ footage keywords
                                  ↓
edge-tts / ElevenLabs (tts.py)   →  voiceover per scene + word-level timings
Pexels / Pixabay (media.py)      →  matching stock video/photo per scene
                                  ↓
ffmpeg (video_builder.py)        →  Ken-Burns/clip per scene, concatenated,
                                     captions burned in from the word timings
Pillow (thumbnail.py)            →  1280x720 thumbnail from scene 1's footage
                                  ↓
YouTube Data API (youtube_upload.py) → upload + title/description/tags/thumbnail
```

`state/used_topics.json` is committed back to the repo after each run so
the rotation doesn't repeat a subject until the whole bank in
`data/topics.yaml` has been used once.

## Content pillars

Defined in `data/topics.yaml`: Top 10 Tips, Best Of, Top 5 Lists, Travel
Like a Local, Budget Guide, Mistakes to Avoid, Seasonal Guide. Add more
pillars or subjects any time by editing that file — no code changes needed.

## Schedule

Runs automatically Mondays and Thursdays at 15:00 UTC via
`.github/workflows/san-antonio-travel-publish.yml` (repo root). Trigger it
manually from the Actions tab any time, optionally forcing a specific topic
or a dry run (builds everything, skips the real upload).

## Local development

See "Running locally" in `SETUP.md`. Requires `ffmpeg` on PATH.
