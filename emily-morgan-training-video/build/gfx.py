# -*- coding: utf-8 -*-
"""Render the 1920x1080 graphics pack for "The Emily Morgan Way"."""
import os, sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import script_data as S

PH = os.path.join(ROOT, "assets", "photos")
OUT = os.path.join(ROOT, "graphics")
os.makedirs(OUT, exist_ok=True)
W, H = 1920, 1080

# Palette drawn from the hotel: charcoal canopy, cream terra-cotta, room accent orange, brass
CHAR = (38, 33, 30)
CHAR2 = (58, 50, 45)
CREAM = (244, 236, 222)
ORANGE = (196, 86, 46)
BRASS = (201, 163, 91)
INK = (40, 34, 30)
MUTED = (120, 108, 98)
GOOD = (63, 122, 84)
BAD = (168, 52, 44)

F = "/usr/share/fonts/truetype/"
SERIF_B = F + "crosextra/Caladea-Bold.ttf"
SERIF = F + "crosextra/Caladea-Regular.ttf"
SERIF_I = F + "crosextra/Caladea-Italic.ttf"
SANS = F + "crosextra/Carlito-Regular.ttf"
SANS_B = F + "crosextra/Carlito-Bold.ttf"


def font(path, size):
    return ImageFont.truetype(path, size)


def photo(key):
    return Image.open(os.path.join(PH, S.PHOTOS[key][0])).convert("RGB")


def cover(img, w, h, focus=(0.5, 0.5)):
    r = max(w / img.width, h / img.height)
    img = img.resize((int(img.width * r + 1), int(img.height * r + 1)), Image.LANCZOS)
    x = int((img.width - w) * focus[0]); y = int((img.height - h) * focus[1])
    return img.crop((x, y, x + w, y + h))


def darken(img, amt):
    return Image.blend(img, Image.new("RGB", img.size, CHAR), amt)


def gradient_left(img, color=CHAR, start=0.95, end=0.15, frac=0.75):
    g = Image.new("L", (img.width, 1))
    for x in range(img.width):
        t = min(1, x / (img.width * frac))
        g.putpixel((x, 0), int(255 * (start + (end - start) * t)))
    g = g.resize(img.size)
    return Image.composite(Image.new("RGB", img.size, color), img, g)


_LOGO = None
def logo(color, height):
    global _LOGO
    if _LOGO is None:
        src = photo("P10").convert("L")
        src = ImageOps.autocontrast(src)
        alpha = src.point(lambda v: 0 if v > 200 else min(255, int((200 - v) * 1.6)))
        _LOGO = alpha.crop(alpha.getbbox())
    a = _LOGO.resize((int(_LOGO.width * height / _LOGO.height), height), Image.LANCZOS)
    im = Image.new("RGBA", a.size, color + (255,)); im.putalpha(a)
    return im


def wrap(draw, text, fnt, maxw):
    words, lines, cur = text.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if draw.textlength(t, font=fnt) <= maxw:
            cur = t
        else:
            lines.append(cur); cur = w
    if cur: lines.append(cur)
    return lines


def text_block(draw, xy, text, fnt, fill, maxw, spacing=1.18):
    x, y = xy
    for line in wrap(draw, text, fnt, maxw):
        draw.text((x, y), line, font=fnt, fill=fill)
        y += int(fnt.size * spacing)
    return y


def kicker(draw, xy, text, color=BRASS, size=30):
    f = font(SANS_B, size)
    draw.text(xy, " ".join(text.upper()), font=f, fill=color)


def rule(draw, x, y, w=120, color=BRASS, t=4):
    draw.rectangle([x, y, x + w, y + t], fill=color)


def save(img, name):
    if img.mode == "RGB":
        p = os.path.join(OUT, name + ".jpg"); img.save(p, quality=92, subsampling=0)
    else:
        p = os.path.join(OUT, name + ".png"); img.save(p, optimize=True)
    return p


def stamp_logo(img, color=CREAM, h=70, pos="br"):
    lg = logo(color, h)
    x = W - lg.width - 60 if pos == "br" else 60
    img.paste(lg, (x, H - lg.height - 50), lg)


# ------------------------------------------------------------------ layouts
CH_PHOTO = {"ch01": ("P05", (0.5, 0.4)), "ch02": ("P03", (0.5, 0.5)), "ch03": ("P03", (0.5, 0.6)),
            "ch04": ("P04", (0.4, 0.5)), "ch05": ("P02", (0.3, 0.3)), "ch06": ("P03", (0.5, 0.9)),
            "ch07": ("P07", (0.5, 0.5)), "ch08": ("P11", (0.5, 0.5)), "ch09": ("P01", (0.6, 0.4))}


def chapter_card(ch):
    key, (pk, focus) = ch["key"], CH_PHOTO[ch["key"]]
    img = gradient_left(cover(photo(pk), W, H, focus), start=0.96, end=0.25)
    d = ImageDraw.Draw(img)
    kicker(d, (140, 330), "Chapter " + ch["num"])
    rule(d, 140, 385)
    y = text_block(d, (140, 420), ch["title"], font(SERIF_B, 128), CREAM, 1100, 1.05)
    text_block(d, (140, y + 20), ch["subtitle"], font(SERIF_I, 52), BRASS, 1100)
    stamp_logo(img)
    save(img, key + "_card")


def title_card():
    img = darken(cover(photo("P01"), W, H, (0.5, 0.35)), 0.45)
    img = gradient_left(img, start=0.9, end=0.0, frac=0.9)
    d = ImageDraw.Draw(img)
    lg = logo(CREAM, 190); img.paste(lg, (140, 150), lg)
    kicker(d, (140, 430), "Service training for every department")
    rule(d, 140, 485, 160)
    d.text((136, 510), "The Emily", font=font(SERIF_B, 150), fill=CREAM)
    d.text((136, 660), "Morgan Way", font=font(SERIF_B, 150), fill=CREAM)
    d.text((140, 860), "Presented by Kole Siefken, General Manager", font=font(SERIF_I, 44), fill=BRASS)
    save(img, "title_card")


def end_card():
    img = darken(cover(photo("P01"), W, H, (0.5, 0.3)), 0.7)
    d = ImageDraw.Draw(img)
    lg = logo(CREAM, 300); img.paste(lg, ((W - lg.width) // 2, 230), lg)
    t = "Thank you for making every guest feel welcome."
    f = font(SERIF_I, 56); d.text(((W - d.textlength(t, font=f)) / 2, 640), t, font=f, fill=BRASS)
    t2 = "Muchas gracias, equipo."
    f2 = font(SERIF, 44); d.text(((W - d.textlength(t2, font=f2)) / 2, 730), t2, font=f2, fill=CREAM)
    save(img, "end_card")


def panel_card(name, kick, title, items, pk=None, focus=(0.5, 0.5), numbered=False, note=None, dark=False):
    """Cream content card with optional photo panel on the right."""
    bgc, fg, sub = (CHAR, CREAM, BRASS) if dark else (CREAM, INK, ORANGE)
    img = Image.new("RGB", (W, H), bgc)
    textw = 1700
    if pk:
        pw = 700
        img.paste(cover(photo(pk), pw, H, focus), (W - pw, 0))
        ImageDraw.Draw(img).rectangle([W - pw - 10, 0, W - pw, H], fill=BRASS)
        textw = W - pw - 260
    d = ImageDraw.Draw(img)
    kicker(d, (120, 110), kick, color=sub)
    rule(d, 120, 160, color=sub)
    y = text_block(d, (120, 190), title, font(SERIF_B, 76), fg, textw, 1.08) + 40
    n = len(items)
    fs = 46 if n <= 4 else 40 if n <= 6 else 34
    for i, it in enumerate(items, 1):
        if numbered:
            d.ellipse([120, y + 2, 120 + fs + 14, y + fs + 16], fill=sub)
            num = str(i); nf = font(SANS_B, int(fs * 0.8))
            d.text((120 + (fs + 14 - d.textlength(num, font=nf)) / 2, y + 6), num, font=nf, fill=bgc)
        else:
            d.rectangle([124, y + fs // 2 - 2, 124 + 22, y + fs // 2 + 6], fill=sub)
        head, _, rest = it.partition("|")
        yy = text_block(d, (120 + fs + 40, y), head, font(SANS_B, fs), fg, textw - fs - 40)
        if rest:
            yy = text_block(d, (120 + fs + 40, yy), rest, font(SANS, int(fs * 0.8)), MUTED if not dark else (200, 190, 175), textw - fs - 40)
        y = yy + int(fs * 0.55)
    if note:
        d.text((120, H - 110), note, font=font(SANS, 30), fill=MUTED if not dark else BRASS)
    if not pk:
        stamp_logo(img, color=INK if not dark else CREAM, h=60)
    return save(img, name)


def three_up(name, kick, title, items, dark=True):
    img = Image.new("RGB", (W, H), CHAR if dark else CREAM)
    d = ImageDraw.Draw(img)
    fg = CREAM if dark else INK
    kicker(d, (120, 110), kick)
    rule(d, 120, 160)
    text_block(d, (120, 190), title, font(SERIF_B, 76), fg, 1680)
    n = len(items); gap = 40; cw = (W - 240 - gap * (n - 1)) // n
    for i, (big, small) in enumerate(items):
        x = 120 + i * (cw + gap); y = 430
        d.rectangle([x, y, x + cw, y + 470], fill=CHAR2 if dark else (234, 222, 202), outline=BRASS, width=3)
        d.rectangle([x, y, x + cw, y + 10], fill=ORANGE)
        nf = font(SERIF_B, 90); d.text((x + 40, y + 40), f"{i+1:02d}", font=nf, fill=BRASS)
        yy = text_block(d, (x + 40, y + 160), big, font(SANS_B, 46 if n <= 3 else 40), fg, cw - 80, 1.1)
        text_block(d, (x + 40, yy + 10), small, font(SANS, 30), (205, 195, 180) if dark else MUTED, cw - 80)
    stamp_logo(img, color=CREAM if dark else INK, h=55)
    return save(img, name)


def phrase_card(i, bad, good):
    img = Image.new("RGB", (W, H), CREAM)
    d = ImageDraw.Draw(img)
    kicker(d, (120, 110), f"Phrase makeover  {i} / 7", color=ORANGE)
    rule(d, 120, 160, color=ORANGE)
    d.text((120, 240), "INSTEAD OF", font=font(SANS_B, 34), fill=BAD)
    f = font(SERIF_I, 92)
    y = text_block(d, (120, 290), "“" + bad + "”", f, MUTED, 1680)
    for k, line in enumerate(wrap(d, "“" + bad + "”", f, 1680)):
        ly = 290 + k * int(92 * 1.18) + 62
        d.line([120, ly, 120 + d.textlength(line, font=f), ly], fill=BAD, width=6)
    y += 40
    d.text((120, y), "TRY", font=font(SANS_B, 34), fill=GOOD)
    d.rectangle([120, y + 60, 132, y + 60 + 260], fill=BRASS)
    text_block(d, (170, y + 55), "“" + good + "”", font(SERIF_B, 78), INK, 1600, 1.12)
    stamp_logo(img, color=INK, h=55)
    save(img, f"makeover_{i}")


def makeover_grid():
    img = Image.new("RGB", (W, H), CHAR)
    d = ImageDraw.Draw(img)
    kicker(d, (120, 70), "Words to keep ready")
    d.text((120, 115), "Instead of...", font=font(SERIF_B, 54), fill=(190, 170, 160))
    d.text((760, 115), "Try...", font=font(SERIF_B, 54), fill=BRASS)
    y = 210
    for bad, good in S.PHRASES:
        d.line([120, y - 12, W - 120, y - 12], fill=CHAR2, width=2)
        d.text((120, y), bad, font=font(SANS, 34), fill=(190, 170, 160))
        yy = text_block(d, (760, y), good, font(SANS_B, 34), CREAM, 1040, 1.12)
        y = max(y + 50, yy) + 30
    save(img, "makeover_grid")


def five_steps():
    img = Image.new("RGB", (W, H), CHAR)
    d = ImageDraw.Draw(img)
    kicker(d, (120, 90), "When things go wrong")
    rule(d, 120, 140)
    d.text((120, 165), "The 5 Steps of Ownership", font=font(SERIF_B, 84), fill=CREAM)
    steps = [("Listen", "Let them finish. Understand the impact."),
             ("Acknowledge", "“I'm sorry this happened.”"),
             ("Act", "Realistic options, within your authority."),
             ("Hand off", "Clear handoff. Guest never starts over."),
             ("Follow through", "Log it. Update on time. Confirm it worked.")]
    sw = 300; base = 960
    for i, (t, s) in enumerate(steps):
        x = 120 + i * (sw + 30); top = base - 290 - i * 80
        d.rectangle([x, top, x + sw, base], fill=CHAR2)
        d.rectangle([x, top, x + sw, top + 10], fill=ORANGE if i < 4 else BRASS)
        d.text((x + 24, top + 24), str(i + 1), font=font(SERIF_B, 72), fill=BRASS)
        d.text((x + 24, top + 115), t, font=font(SANS_B, 42), fill=CREAM)
        text_block(d, (x + 24, top + 170), s, font(SANS, 28), (205, 195, 180), sw - 48)
    save(img, "five_steps")


def quiz(i, q, a):
    for reveal in (False, True):
        img = Image.new("RGB", (W, H), CHAR)
        d = ImageDraw.Draw(img)
        d.rectangle([0, 0, W, 16], fill=ORANGE)
        kicker(d, (120, 110), f"The Alamo City Quiz  ·  Question {i} of 5")
        rule(d, 120, 160)
        y = text_block(d, (120, 210), q, font(SERIF_B, 80), CREAM, 1680, 1.1)
        if reveal:
            y += 60
            d.rectangle([120, y, W - 120, y + 300], fill=CHAR2, outline=BRASS, width=3)
            d.text((160, y + 30), "ANSWER", font=font(SANS_B, 32), fill=BRASS)
            text_block(d, (160, y + 85), a, font(SANS_B, 50), CREAM, W - 360)
        else:
            d.text((120, 900), "Pause the video if you need more time.", font=font(SANS, 34), fill=BRASS)
        stamp_logo(img, h=55)
        save(img, f"quiz_{i}" + ("_answer" if reveal else ""))


def lower_third(name, person, role, accent=ORANGE):
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    nf, rf = font(SERIF_B, 54), font(SANS, 32)
    w = int(max(d.textlength(person, font=nf), d.textlength(role.upper(), font=rf) * 1.15)) + 120
    d.rectangle([100, 820, 100 + w, 960], fill=CHAR + (235,))
    d.rectangle([100, 820, 112, 960], fill=accent + (255,))
    d.text((145, 836), person, font=nf, fill=CREAM)
    d.text((147, 905), " ".join(role.upper()) if len(role) < 22 else role.upper(), font=rf, fill=BRASS)
    save(img, name)


def policy_box():
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rectangle([1160, 90, 1840, 470], fill=CREAM + (245,), outline=BRASS, width=4)
    d.rectangle([1160, 90, 1840, 150], fill=ORANGE + (255,))
    d.text((1190, 100), "OUR HOTEL POLICY", font=font(SANS_B, 36), fill=CREAM)
    d.text((1190, 180), "[Policy name]", font=font(SANS_B, 40), fill=INK)
    text_block(d, (1190, 240), "[Fill in the confirmed hotel policy detail here before final render.]", font(SANS, 34), MUTED, 620)
    save(img, "policy_box_template")


def spot_title():
    img = darken(cover(photo("P03"), W, H), 0.55)
    d = ImageDraw.Draw(img)
    t = "SPOT THE PROBLEM"; f = font(SERIF_B, 150)
    d.text(((W - d.textlength(t, font=f)) / 2, 360), t, font=f, fill=CREAM)
    t = "You have 15 seconds. How many can you find?"; f2 = font(SERIF_I, 56)
    d.text(((W - d.textlength(t, font=f2)) / 2, 560), t, font=f2, fill=BRASS)
    save(img, "spot_the_problem_title")


def quiz_title():
    img = darken(cover(photo("P02"), W, H, (0.5, 0.3)), 0.6)
    d = ImageDraw.Draw(img)
    for t, f, c, y in [("THE ALAMO CITY", font(SERIF_B, 120), CREAM, 340), ("QUIZ", font(SERIF_B, 200), BRASS, 470),
                       ("5 questions  ·  ¿Listos?", font(SERIF_I, 54), CREAM, 720)]:
        d.text(((W - d.textlength(t, font=f)) / 2, y), t, font=f, fill=c)
    save(img, "quiz_title")


def makeover_title():
    img = Image.new("RGB", (W, H), ORANGE)
    d = ImageDraw.Draw(img)
    for t, f, c, y in [("PHRASE", font(SERIF_B, 200), CREAM, 270), ("MAKEOVER", font(SERIF_B, 200), CHAR, 470),
                       ("where bad phrases get a glow-up", font(SERIF_I, 56), CREAM, 730)]:
        d.text(((W - d.textlength(t, font=f)) / 2, y), t, font=f, fill=c)
    save(img, "makeover_title")


def red_x():
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.line([1500, 120, 1780, 400], fill=BAD + (255,), width=40)
    d.line([1780, 120, 1500, 400], fill=BAD + (255,), width=40)
    d.rectangle([1380, 430, 1900, 520], fill=BAD + (255,))
    d.text((1410, 445), "[MISTAKE LABEL]", font=font(SANS_B, 52), fill=CREAM)
    save(img, "red_x_template")


def roleplay(i, title, line, pk, focus):
    img = gradient_left(cover(photo(pk), W, H, focus), start=0.95, end=0.35)
    d = ImageDraw.Draw(img)
    kicker(d, (140, 300), f"Role play {i} of 3")
    rule(d, 140, 355)
    y = text_block(d, (140, 390), title, font(SERIF_B, 110), CREAM, 1100, 1.05)
    text_block(d, (140, y + 30), "“" + line + "”", font(SERIF_I, 46), BRASS, 1000)
    d.text((140, 930), "Watch first. Then ask yourself: what would I say?", font=font(SANS, 32), fill=CREAM)
    save(img, f"roleplay_{i}")


def build():
    title_card(); end_card(); policy_box(); red_x()
    for ch in S.CHAPTERS:
        if ch["num"]:
            chapter_card(ch)
    for name, role, _ in S.CAST:
        if name.startswith("Guests"): continue
        slug = name.split()[0].lower()
        lower_third(f"lower_third_{slug}", name, role.replace(" - host", ""), accent=BRASS if slug == "kole" else ORANGE)

    three_up("four_welcomes", "What makes people feel welcome", "They noticed. They listened. They followed through. They made it easy.",
             [("Noticed me", "Saw me before I had to ask."), ("Listened", "Let me finish. Heard what I needed."),
              ("Followed through", "Did what they said they'd do."), ("Made it easy", "Clear, simple, no runaround.")])
    panel_card("minimum_vs_beyond", "Two ideas for this training", "Minimum Standard vs. Above & Beyond",
               ["Minimum standard, every guest, every time|Clean surroundings, a courteous welcome, accurate information, respectful treatment, ownership of requests.",
                "Above & beyond: a thoughtful extra|Based on this guest's needs. Within our authority. Never ignores safety or promises what we can't deliver.",
                "Basics first. Always.|An extra never makes up for a missed basic."], pk="P09", focus=(0.3, 0.5))
    panel_card("history_timeline", "Our house has a story", "From Medical Arts Building to the Emily Morgan",
               ["1924|Opens as the Medical Arts Building, Gothic Revival, across the plaza from the Alamo. (Verify before final render.)",
                "Today|The Emily Morgan Hotel, a DoubleTree by Hilton. Member of Historic Hotels of America.",
                "For our guests|Often a once-in-a-lifetime trip. We're part of the memory."], pk="P11", focus=(0.5, 0.5))
    panel_card("ready_checklist", "Ready for work", "Show up ready",
               ["On time, every scheduled shift|Follow the timekeeping policy.",
                "Late or absent? Call your supervisor|A text to a coworker is not a call-in.",
                "Employee entrance, time clock, staff route|Never prop a secured door or let an unknown person in.",
                "All required work is on the clock|Including handoffs. Always."], pk="P03", focus=(0.5, 0.5))
    panel_card("uniform_standard", "Look the part", "The uniform standard",
               ["Clean, pressed, well-fitting uniform", "Name badge and approved footwear", "Hair, hands and nails clean and maintained",
                "Food safety rules where they apply", "Easy on fragrance", "Stained or damaged? Tell your supervisor"], pk="P05", focus=(0.75, 0.6))
    panel_card("respect_rules", "Respect on the team", "How we treat each other",
               ["No insults, gossip, eye-rolling or public blame", "No discriminatory remarks, ever", "Offer help. Make clear handoffs.",
                "Concerns go privately to a supervisor"], dark=True)
    three_up("greeting_three_moves", "First impressions", "The three moves of a great greeting",
             [("Notice", "Pause a non-essential task, when it's safe."), ("Face", "Open posture, natural eye contact."),
              ("Greet", "Friendly words and a clear next step.")])
    panel_card("greeting_phrases", "Keep these ready", "Greetings for every department",
               ["“Good morning. Enjoy your day.”", "“Hello. May I help you find something?”",
                "“I'll be with you as soon as I finish helping this guest.”", "“¿Prefiere inglés o español?”|Ask. Never assume a language from appearance or accent."],
               pk="P04", focus=(0.6, 0.5))
    makeover_title()
    for i, (b, g) in enumerate(S.PHRASES, 1):
        phrase_card(i, b, g)
    makeover_grid()
    panel_card("phone_script", "Phone & radio", "Answer like the Emily Morgan",
               ["“Thank you for calling the Emily Morgan. This is [name]. How may I help you?”",
                "Ask permission before placing on hold", "Tell them where you're transferring them",
                "Radio: brief and professional|Sensitive details move to an approved private channel."], dark=True)
    three_up("notice_ask_offer_confirm", "Read the guest", "Cues are clues, not proof",
             [("Notice", "Spot a cue."), ("Ask", "A respectful, useful question."), ("Offer", "A relevant action."),
              ("Confirm", "Did it help? Respect a “no.”")])
    panel_card("fun_dos_donts", "Having fun with guests", "Follow the guest's lead",
               ["Do: chat about their trip, the food, the city|Wrap it up when replies get shorter.",
                "Don't joke about appearance, identity, politics, religion, money or a service problem",
                "Never flirt, tease, or pressure anyone to join in"], pk="P02", focus=(0.2, 0.3))
    panel_card("legends_card", "Our building's stories", "Share history. Tell legends as legends.",
               ["Use approved talking points", "Don't invent history", "Never frighten children",
                "Quiet guest? Keep it brief"], pk="P11", focus=(0.6, 0.5))
    three_up("personal_three_checks", "What made it personal?", "A great extra step passes three checks",
             [("Matched their need", "Based on what the guest told us."), ("Respected their preference", "Quick for the busy, warm for the chatty."),
              ("Within our authority", "No promises we can't keep.")])
    panel_card("spot_answers", "Spot the problem: answers", "Fix it in the right order",
               ["Safety first: water by the door, cart blocking the exit|Protect the area, get help, keep routes clear.",
                "Cup and fingerprints|Make sure the cup isn't in use. Clean or notify.",
                "Bag and wallet|Belongings are never trash. Security process and lost & found.",
                "Waiting guest and arguing employees|Help the guest. Take the disagreement private."], numbered=True, pk="P03", focus=(0.5, 0.8))
    spot_title()
    five_steps()
    roleplay(1, "The Cold Room", "My room is freezing. I already called once.", "P07", (0.5, 0.5))
    roleplay(2, "Late for Dinner", "Our reservation is in fifteen minutes.", "P05", (0.5, 0.7))
    roleplay(3, "Towels & a Birthday", "We asked for towels an hour ago.", "P09", (0.6, 0.5))
    quiz_title()
    for i, (q, a) in enumerate(S.KNOWLEDGE_CHECK, 1):
        quiz(i, q, a)
    panel_card("seven_standards", "Every shift", "The Emily Morgan Way",
               ["Be dependable", "Be presentable", "Be welcoming", "Be respectful", "Be observant", "Be helpful", "Be responsible"],
               numbered=True, pk="P01", focus=(0.45, 0.4))
    panel_card("commitment_card", "Before your next shift", "My one commitment",
               ["Pick ONE behavior you'll practice", "Write it on your handout", "Tell a teammate",
                "Use it on your very next shift"], numbered=True, dark=True)
    for ch in S.CHAPTERS:
        if ch["key"] in S.RECAPS:
            three_up("recap_" + ch["key"], f"Chapter {ch['num']} recap", ch["title"],
                     [(t, "") for t in S.RECAPS[ch["key"]]], dark=False)


if __name__ == "__main__":
    build()
    print(len(os.listdir(OUT)), "graphics")
