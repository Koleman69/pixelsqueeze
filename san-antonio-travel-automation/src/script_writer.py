"""Turn a Topic into a full video package: narration broken into scenes
(each with stock-footage search keywords), title, description, tags, and
thumbnail text. One Claude call, structured as JSON."""

import json
import re

import anthropic

from config import settings
from topics import Topic

SYSTEM_PROMPT = """You write scripts for a faceless YouTube travel channel called
"San Antonio Travel". The audience is people planning a trip to San Antonio,
Texas. Videos are narrated over stock footage/photos with on-screen captions —
there is no host on camera, so the narration must stand entirely on its own and
never reference visuals directly (no "as you can see here").

Style: warm, energetic, concrete. Prefer specific names of places, streets, and
neighborhoods over vague description. Avoid clickbait that the content can't
back up. Every claim should be plausible/generic travel-guide knowledge (do not
invent prices, hours, or addresses you're not confident about — speak in
general terms like "budget-friendly" or "a short walk from the River Walk"
rather than exact figures if unsure).

Break the narration into 8-14 scenes. Each scene is 2-4 sentences of narration
(roughly 10-20 seconds spoken) plus a short "keywords" field: 2-5 words
describing the stock footage/photo that should play behind that scene (e.g.
"San Antonio River Walk boats", "Tex-Mex tacos plate", "Alamo mission facade").

Respond with ONLY a JSON object, no prose before or after, matching exactly:
{
  "title": "YouTube title, under 70 characters, no clickbait ALL CAPS spam",
  "description": "3-5 sentence YouTube description ending with a short call to action to subscribe, followed by 5-8 relevant hashtags",
  "tags": ["12-18 lowercase YouTube tags/keywords, no # symbol"],
  "thumbnail_text": "3-6 word punchy thumbnail overlay, title case",
  "scenes": [
    {"narration": "...", "keywords": "..."}
  ]
}
"""


def _extract_json(text: str) -> dict:
    text = text.strip()
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        raise ValueError(f"No JSON object found in LLM response: {text[:200]}")
    return json.loads(match.group(0))


def write_video_package(topic: Topic) -> dict:
    if not settings.anthropic_api_key:
        raise RuntimeError(
            "ANTHROPIC_API_KEY is not set. Add it as a GitHub Actions secret "
            "(see SETUP.md) before running the pipeline for real."
        )

    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    user_prompt = (
        f"Video format: {topic.format}\n"
        f"Format guidance: {topic.prompt_style}\n"
        f"Exact subject for this video: {topic.subject}\n\n"
        "Write the full JSON video package now."
    )

    response = client.messages.create(
        model=settings.llm_model,
        max_tokens=4096,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_prompt}],
    )

    text = "".join(block.text for block in response.content if block.type == "text")
    package = _extract_json(text)

    required_keys = {"title", "description", "tags", "thumbnail_text", "scenes"}
    missing = required_keys - package.keys()
    if missing:
        raise ValueError(f"LLM response missing keys: {missing}")

    return package
