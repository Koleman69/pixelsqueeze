# -*- coding: utf-8 -*-
"""Export the script as plain text, easy to copy and paste into an avatar video platform."""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import script_data as S
from build_docx import scene_seconds, tc, CARD_SEC

out = ["THE EMILY MORGAN WAY - 45-MINUTE SERVICE TRAINING VIDEO",
       "Presented by Kole Siefken, General Manager",
       "",
       "HOW TO READ THIS FILE",
       "  [NAME]          = the character who speaks. Paste the line below it into that avatar's scene.",
       "  ON SCREEN:      = a graphic, photo or action beat (no one speaks).",
       "  SUBTITLE:       = English subtitle to show while the Spanish line plays.",
       "  [CONFIRM ...]   = fill in from current hotel policy before recording.",
       "  Graphics are in graphics/, photos in assets/photos/ (P01-P12 listed at the end).",
       ""]
t = 0.0
for ch in S.CHAPTERS:
    dur = (CARD_SEC if ch["num"] else 0) + sum(scene_seconds(s) for s in ch["scenes"]) + (20 if ch["key"] == "ch00" else 0)
    name = (f"CHAPTER {ch['num']}: " if ch["num"] else "") + ch["title"].upper()
    out += ["", "=" * 70, f"{name}  -  {ch['subtitle']}", f"Time {tc(t)} to {tc(t + dur)}  ({dur/60:.1f} min)", "=" * 70]
    if ch["num"]:
        out += ["", f"ON SCREEN: Chapter card  ->  graphics/{ch['key']}_card.jpg  (5 seconds)"]
    for sc in ch["scenes"]:
        out += ["", "-" * 70, f"SCENE: {sc['heading']}", "-" * 70,
                f"Setting: {sc['setting']}", f"Visuals: {' | '.join(sc['visuals'])}", ""]
        for sp, text, sub in sc["lines"]:
            if sp == "DIR":
                out += [f"ON SCREEN: {text}", ""]
            else:
                out += [f"[{sp}]", text]
                if sub:
                    out.append(f"SUBTITLE: {sub}")
                out.append("")
    t += dur
out += ["", "=" * 70, "PHOTO KEY", "=" * 70]
out += [f"{k}  {fn}  -  {d}" for k, (fn, d) in S.PHOTOS.items()]
out += ["", f"Estimated total runtime: {t/60:.1f} minutes"]
p = os.path.join(ROOT, "Emily_Morgan_Way_Script_COPY_PASTE.txt")
open(p, "w", encoding="utf-8").write("\n".join(out) + "\n")
print(p, len(out), "lines")
