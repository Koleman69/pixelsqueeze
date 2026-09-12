"""Pick the next content topic, rotating through data/topics.yaml and
skipping anything already recorded in state/used_topics.json until the
whole pool has been used, then starting over."""

import json
import random
from dataclasses import dataclass

import yaml

from config import DATA_DIR, STATE_DIR

TOPICS_FILE = DATA_DIR / "topics.yaml"
STATE_FILE = STATE_DIR / "used_topics.json"


@dataclass
class Topic:
    pillar_id: str
    format: str
    prompt_style: str
    subject: str


def _load_pillars() -> list[dict]:
    with open(TOPICS_FILE, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)["pillars"]


def _load_used() -> set[str]:
    if not STATE_FILE.exists():
        return set()
    with open(STATE_FILE, "r", encoding="utf-8") as f:
        return set(json.load(f).get("used", []))


def mark_used(subject: str) -> None:
    used = _load_used()
    used.add(subject)
    with open(STATE_FILE, "w", encoding="utf-8") as f:
        json.dump({"used": sorted(used)}, f, indent=2)


def pick_next_topic(override_subject: str | None = None) -> Topic:
    pillars = _load_pillars()
    all_subjects = [
        (p, subject) for p in pillars for subject in p["subjects"]
    ]

    if override_subject:
        for pillar, subject in all_subjects:
            if subject.strip().lower() == override_subject.strip().lower():
                return Topic(pillar["id"], pillar["format"], pillar["prompt_style"], subject)
        # Manual topic not in the bank: treat it as a one-off "best of" style video.
        return Topic("manual", "Custom", "A helpful, specific travel video.", override_subject)

    used = _load_used()
    unused = [(p, s) for p, s in all_subjects if s not in used]
    if not unused:
        # Exhausted the pool: reset and start the rotation over.
        unused = all_subjects

    pillar, subject = random.choice(unused)
    return Topic(pillar["id"], pillar["format"], pillar["prompt_style"], subject)
