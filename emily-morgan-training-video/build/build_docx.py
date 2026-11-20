# -*- coding: utf-8 -*-
"""Build the production script DOCX for "The Emily Morgan Way"."""
import os, sys
from docx import Document
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK, WD_COLOR_INDEX
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import script_data as S

WPM = 140          # speaking pace
DIR_SEC = 8        # average length of a staged/visual beat
SCENE_PAD = 4      # transitions between scenes
CARD_SEC = 5       # chapter title card

CHAR = RGBColor(0x26, 0x21, 0x1E); ORANGE = RGBColor(0xC4, 0x56, 0x2E)
BRASS = RGBColor(0xA8, 0x84, 0x3E); MUTED = RGBColor(0x78, 0x6C, 0x62)
SPEAKER_COLOR = {"KOLE": RGBColor(0x9C, 0x6B, 0x1E), "ANA": RGBColor(0xC4, 0x56, 0x2E),
                 "MARCUS": RGBColor(0x2F, 0x5D, 0x7C), "ROSA": RGBColor(0x8A, 0x3B, 0x6B),
                 "JAKE": RGBColor(0x3F, 0x7A, 0x54), "LUIS": RGBColor(0xA0, 0x40, 0x30),
                 "HANNAH": RGBColor(0x5B, 0x4B, 0x9A), "NARRATOR": MUTED}


def scene_seconds(sc):
    s = SCENE_PAD
    for sp, t, _ in sc["lines"]:
        s += DIR_SEC if sp == "DIR" else len(t.split()) / WPM * 60
    return s


def tc(sec):
    sec = int(round(sec)); return f"{sec // 60:02d}:{sec % 60:02d}"


def shade(cell, hexcolor):
    tcPr = cell._tc.get_or_add_tcPr(); shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear"); shd.set(qn("w:color"), "auto"); shd.set(qn("w:fill"), hexcolor)
    tcPr.append(shd)


def set_cell_width(table, widths):
    table.autofit = False
    grid = table._tbl.tblGrid
    for i, gc in enumerate(grid.findall(qn("w:gridCol"))):
        gc.set(qn("w:w"), str(int(widths[i].inches * 1440)))
    for row in table.rows:
        for i, w in enumerate(widths):
            row.cells[i].width = w


def para(doc, text="", size=11, bold=False, italic=False, color=None, align=None, space_after=6, font_name=None):
    p = doc.add_paragraph(); r = p.add_run(text)
    r.font.size = Pt(size); r.bold = bold; r.italic = italic
    if color: r.font.color.rgb = color
    if font_name: r.font.name = font_name
    if align: p.alignment = align
    p.paragraph_format.space_after = Pt(space_after)
    return p


def heading(doc, text, level):
    h = doc.add_heading(text, level=level)
    for r in h.runs:
        r.font.color.rgb = CHAR if level == 1 else ORANGE
        r.font.name = "Georgia"
    return h


def kicker(doc, text):
    return para(doc, " ".join(text.upper()), size=9, bold=True, color=BRASS, space_after=2)


def add_runs_with_highlight(p, text, size=10.5):
    """Highlight [CONFIRM ...] / [####] placeholders in yellow."""
    import re
    for part in re.split(r"(\[[^\]]*\])", text):
        if not part: continue
        r = p.add_run(part); r.font.size = Pt(size)
        if part.startswith("[") and ("CONFIRM" in part or "#" in part or "Fill" in part):
            r.font.highlight_color = WD_COLOR_INDEX.YELLOW; r.bold = True
    return p


def build():
    doc = Document()
    st = doc.styles["Normal"]; st.font.name = "Calibri"; st.font.size = Pt(11)
    for s in doc.sections:
        s.left_margin = s.right_margin = Inches(0.8); s.top_margin = s.bottom_margin = Inches(0.7)

    # ---------------------------------------------------------- cover
    doc.add_picture(os.path.join(ROOT, "graphics", "title_card.jpg"), width=Inches(6.9))
    para(doc, "")
    kicker(doc, "45-minute service training video  ·  production script")
    para(doc, "The Emily Morgan Way", size=34, bold=True, color=CHAR, font_name="Georgia", space_after=2)
    para(doc, "Service Training for Every Department", size=16, italic=True, color=ORANGE, font_name="Georgia")
    para(doc, "Presented by Kole Siefken, General Manager", size=12, bold=True)
    para(doc, "The Emily Morgan Hotel  ·  A DoubleTree by Hilton  ·  San Antonio, Texas", size=11, color=MUTED)
    para(doc, "Adapted from the 90-Minute Interactive Workshop facilitator guide. Proposed training content, "
              "not an official Hilton policy document. Every item highlighted in yellow must be confirmed from "
              "current hotel policy before the final render.", size=9.5, italic=True, color=MUTED)
    doc.add_page_break()

    # ---------------------------------------------------------- run of show
    heading(doc, "Run of Show", 1)
    rows, t = [], 0.0
    for ch in S.CHAPTERS:
        dur = (CARD_SEC if ch["num"] else 0) + sum(scene_seconds(sc) for sc in ch["scenes"])
        if ch["key"] == "ch00": dur += 20  # music-only montage time
        rows.append((ch, t, dur)); t += dur
    total = t
    tbl = doc.add_table(rows=1, cols=4); tbl.style = "Light Grid Accent 2"; tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    for c, h in zip(tbl.rows[0].cells, ["Timecode", "Chapter", "Focus", "Length"]):
        c.text = h; c.paragraphs[0].runs[0].bold = True
    for ch, start, dur in rows:
        r = tbl.add_row().cells
        r[0].text = tc(start); r[1].text = (f"{ch['num']}. " if ch["num"] else "") + ch["title"]
        r[2].text = ch["subtitle"]; r[3].text = f"{dur / 60:.1f} min"
    r = tbl.add_row().cells; r[1].text = "TOTAL RUNTIME"; r[3].text = f"{total / 60:.1f} min"
    r[1].paragraphs[0].runs[0].bold = True; r[3].paragraphs[0].runs[0].bold = True
    set_cell_width(tbl, [Inches(0.9), Inches(2.4), Inches(2.7), Inches(0.9)])
    para(doc, "")
    para(doc, f"Timecodes are estimated at {WPM} words per minute of dialogue plus about {DIR_SEC} seconds per staged "
              "beat (freeze frames, timers, cut-aways). The final edit will vary by about ±2 minutes depending on avatar "
              "voice speed and how long the quiz and challenge pauses are held.", size=9.5, italic=True, color=MUTED)

    # ---------------------------------------------------------- production guide
    heading(doc, "How to Produce This Video", 1)
    steps = [
        ("Pick an AI avatar video platform.", "HeyGen, Synthesia, or Colossyan all support custom avatars, multiple "
         "on-screen characters, scene-by-scene scripts, background images, and Spanish voices and subtitles."),
        ("Create Kole's avatar from Kole's own footage.", "Record the platform's consent statement plus 2-5 minutes of "
         "talking to camera in good light (tan blazer, light-blue shirt matches the reference photo). Clone the voice "
         "from the same recording. Only Kole can authorize this avatar."),
        ("Cast the team.", "Use the platform's stock or licensed avatars for Ana, Marcus, Rosa, Jake, Luis, Hannah and the "
         "guests, matching the cast descriptions (mix of Mexican-American and Caucasian). Do not use real employees' "
         "faces without their written consent. Give the bilingual characters a native Spanish/English voice."),
        ("Build the scenes.", "Create one platform scene per scene heading in this script. Use the hotel photos in "
         "assets/photos and the 1920x1080 cards in graphics/ as backgrounds and overlays, as listed under VISUALS."),
        ("Spanish.", "Spanish lines are written in natural Mexican Spanish. Show the English subtitle (given in the "
         "SUBTITLE column) on screen whenever Spanish is spoken. Turn on closed captions for the full video."),
        ("Interactive moments.", "Hold freeze frames, the Spot the Problem timer (15 s) and each quiz question (5 s) on "
         "screen, with a 'pause the video' prompt. Employees watching as a group can call out answers."),
        ("Music and sound.", "Light Texas/acoustic or Tex-Mex guitar bed under the intro and transitions, game-show "
         "stingers for Phrase Makeover and the Alamo City Quiz, record-scratch sounds for the blooper reel. Use "
         "royalty-free/licensed tracks only."),
        ("Fill in every yellow item, then review.", "Have HR and the leadership team confirm the policy boxes and the "
         "building history before the final render."),
    ]
    for i, (a, b) in enumerate(steps, 1):
        p = doc.add_paragraph(style="List Number"); r = p.add_run(a + " "); r.bold = True; p.add_run(b)

    heading(doc, "Policy Details to Confirm Before Final Render", 2)
    para(doc, "The original guide says not to teach a blank field as a rule. These appear in on-screen policy boxes "
              "(graphics/policy_box_template.png).", size=10, italic=True, color=MUTED)
    tbl = doc.add_table(rows=1, cols=2); tbl.style = "Light Grid Accent 2"
    tbl.rows[0].cells[0].text = "Item"; tbl.rows[0].cells[1].text = "Confirmed detail"
    for item in S.POLICY_BLANKS:
        r = tbl.add_row().cells; r[0].text = item; shade(r[1], "FFF59D")
    set_cell_width(tbl, [Inches(3.4), Inches(3.5)])

    heading(doc, "Cast", 2)
    tbl = doc.add_table(rows=1, cols=3); tbl.style = "Light Grid Accent 2"
    for c, h in zip(tbl.rows[0].cells, ["Character", "Role", "Look and personality"]): c.text = h
    for n, role, desc in S.CAST:
        r = tbl.add_row().cells; r[0].text = n; r[1].text = role; r[2].text = desc
    set_cell_width(tbl, [Inches(1.5), Inches(1.7), Inches(3.7)])
    para(doc, "All characters, guests and situations are fictional. No real employee or guest is portrayed.", size=9.5, italic=True, color=MUTED)

    heading(doc, "Hotel Photo Library", 2)
    for k, (fn, desc) in S.PHOTOS.items():
        p = doc.add_paragraph(style="List Bullet"); r = p.add_run(f"{k}  "); r.bold = True
        p.add_run(f"{desc}  ({fn})")
    doc.add_page_break()

    # ---------------------------------------------------------- the script
    for ch, start, dur in rows:
        t = start + (CARD_SEC if ch["num"] else 0)
        card = os.path.join(ROOT, "graphics", ch["key"] + "_card.jpg")
        if os.path.exists(card):
            doc.add_picture(card, width=Inches(6.9))
        kicker(doc, f"{tc(start)} – {tc(start + dur)}  ·  {dur / 60:.1f} minutes")
        heading(doc, (f"Chapter {ch['num']}: " if ch["num"] else "") + ch["title"], 1)
        para(doc, ch["subtitle"], size=13, italic=True, color=ORANGE, font_name="Georgia")
        for sc in ch["scenes"]:
            heading(doc, f"[{tc(t)}]  {sc['heading']}", 2)
            p = doc.add_paragraph(); r = p.add_run("SETTING  "); r.bold = True; r.font.size = Pt(9); r.font.color.rgb = BRASS
            add_runs_with_highlight(p, sc["setting"], 10)
            p = doc.add_paragraph(); r = p.add_run("VISUALS  "); r.bold = True; r.font.size = Pt(9); r.font.color.rgb = BRASS
            rr = p.add_run("  •  ".join(sc["visuals"])); rr.font.size = Pt(10); rr.font.color.rgb = MUTED
            tbl = doc.add_table(rows=0, cols=3); tbl.style = "Table Grid"
            for sp, text, sub in sc["lines"]:
                cells = tbl.add_row().cells
                if sp == "DIR":
                    m = cells[0].merge(cells[2]); shade(m, "F3ECDD")
                    m.paragraphs[0].text = ""
                    r = m.paragraphs[0].add_run("ACTION / GRAPHIC:  "); r.bold = True; r.font.size = Pt(9); r.font.color.rgb = ORANGE
                    add_runs_with_highlight(m.paragraphs[0], text, 10).runs[-1].italic = True
                    continue
                r = cells[0].paragraphs[0].add_run(sp); r.bold = True; r.font.size = Pt(9.5)
                r.font.color.rgb = SPEAKER_COLOR.get(sp.split()[0], CHAR)
                add_runs_with_highlight(cells[1].paragraphs[0], text, 10.5)
                if sub:
                    r = cells[2].paragraphs[0].add_run(sub); r.italic = True; r.font.size = Pt(9); r.font.color.rgb = MUTED
            set_cell_width(tbl, [Inches(1.25), Inches(4.0), Inches(1.65)])
            para(doc, "", space_after=2)
            t += scene_seconds(sc)
        doc.add_page_break()

    # ---------------------------------------------------------- handout
    heading(doc, "Employee Takeaway: The Emily Morgan Way", 1)
    para(doc, "Print one per employee. Hand out after the video.", size=10, italic=True, color=MUTED)
    heading(doc, "Every shift", 2)
    for i in ["Be dependable. Follow the schedule and call-in procedure. Use the employee entrance, time clock and staff route.",
              "Be presentable. Correct clean uniform, badge and footwear. Grooming and hygiene for your role.",
              "Be welcoming. A natural smile and a warm greeting, matched to the moment. Devices away.",
              "Be respectful. Patience and dignity for guests and coworkers. Disagreements stay private.",
              "Be observant. Notice who needs help. Ask, don't assume. Respect a “no.”",
              "Be helpful. Accurate information. Connect the guest and confirm the handoff.",
              "Be responsible. Pick up ordinary trash safely, protect hazards, report defects, confirm an owner."]:
        doc.add_paragraph(i, style="List Bullet")
    heading(doc, "Words to keep ready", 2)
    for w in ["“Welcome. How may I help you?”", "“Let me find out for you.”",
              "“I'm sorry this happened. Let me check the options.”",
              "“I'll update you by ______, even if I'm still checking.”",
              "“Has this taken care of what you needed?”", "“¿Prefiere inglés o español?”"]:
        doc.add_paragraph(w, style="List Bullet")
    heading(doc, "Knowledge check", 2)
    for i, (q, a) in enumerate(S.KNOWLEDGE_CHECK, 1):
        para(doc, f"{i}. {q}", bold=True, space_after=1); para(doc, "_" * 90, color=MUTED, space_after=4)
    heading(doc, "My next-shift commitment", 2)
    for l in ["One behavior I will practice: ____________________________________________",
              "A specific opportunity to use it: __________________________________________",
              "Name: ______________________________   Date: _______________"]:
        para(doc, l, space_after=10)
    heading(doc, "Answer key (for supervisors)", 3)
    for i, (q, a) in enumerate(S.KNOWLEDGE_CHECK, 1):
        para(doc, f"{i}. {a}", size=10, space_after=2)
    heading(doc, "Supervisor follow-up", 3)
    para(doc, "Over the next seven days, observe one greeting and one request or handoff per employee where practical. "
              "Recognize a specific success and coach one improvement privately. Revisit one scenario in a five-minute stand-up.", size=10)

    out = os.path.join(ROOT, "Emily_Morgan_Way_45min_Video_Script.docx")
    doc.save(out)
    print(out, f"total {total/60:.1f} min")


if __name__ == "__main__":
    build()
