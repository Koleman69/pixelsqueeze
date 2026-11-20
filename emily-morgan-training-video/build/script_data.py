# -*- coding: utf-8 -*-
"""
"The Emily Morgan Way" - 45 minute service training video.
Single source of truth for the production script (DOCX) and the graphics pack.

Speakers:
  KOLE   - Kole Siefken, General Manager (AI avatar host)
  ANA    - Ana Gutierrez, Front Desk Agent (bilingual)
  MARCUS - Marcus Whitfield, Bell & Valet Captain
  ROSA   - Rosa Delgado, Housekeeping Supervisor (bilingual)
  JAKE   - Jake Brennan, Engineering Technician
  LUIS   - Luis Ramirez, Bartender at Oro (bilingual)
  HANNAH - Hannah Price, Banquet Server
  NARRATOR - off-screen voice (use Kole's cloned voice or a second voice)
  Guests are fictional and identified by role.

Line tuple: (speaker, text, subtitle_or_note)
  - For Spanish lines the third field is the English on-screen subtitle.
  - For direction lines use speaker "DIR".
Photo keys refer to PHOTOS below. Graphic keys refer to files in graphics/.
"""

PHOTOS = {
    "P01": ("01_exterior_drone_sunset.jpg", "Aerial: tower and Texas flag at sunset"),
    "P02": ("02_alamo_with_hotel_tower.jpg", "The Alamo facade with the hotel tower behind it"),
    "P03": ("03_lobby_entry_doors.jpg", "Lobby entry doors, brass, red welcome mats"),
    "P04": ("04_lobby_business_center.jpg", "Lobby lounge and business center"),
    "P05": ("05_main_entrance_valet.jpg", "Main entrance canopy, 705, valet podium"),
    "P06": ("06_kole_siefken_headshot.jpg", "Kole Siefken - GM (avatar reference only)"),
    "P07": ("07_king_room_arched_windows.jpg", "King room with arched windows"),
    "P08": ("08_double_room_tower_view.jpg", "Room with desk and tower view"),
    "P09": ("09_suite_bedroom.jpg", "Suite bedroom with chaise"),
    "P10": ("10_logo.jpg", "The Emily Morgan Hotel logo"),
    "P11": ("11_gothic_facade_detail.jpg", "Gothic terra-cotta facade detail"),
    "P12": ("12_meeting_room_detail.jpg", "Meeting room table set"),
}

CAST = [
    ("Kole Siefken", "General Manager - host", "Custom AI avatar built from Kole's own consent recording. Tan blazer, light-blue shirt, warm and direct."),
    ("Ana Gutierrez", "Front Desk Agent", "Mexican-American, late 20s, bilingual English/Spanish. Upbeat, quick, a natural with guests."),
    ("Marcus Whitfield", "Bell & Valet Captain", "Caucasian, 40s. Calm, dry sense of humor, 15 years in hospitality."),
    ("Rosa Delgado", "Housekeeping Supervisor", "Mexican-American, 50s, bilingual. The hotel's unofficial mom; high standards, big heart."),
    ("Jake Brennan", "Engineering Technician", "Caucasian, 30s. Practical, a little shy, very reliable."),
    ("Luis Ramirez", "Bartender, Oro Restaurant & Bar", "Mexican-American, 30s, bilingual. Storyteller, knows every legend of the building."),
    ("Hannah Price", "Banquet Server", "Caucasian, early 20s. Newer team member; the audience learns alongside her."),
    ("Guests (various)", "Fictional", "A family from Monterrey, a business traveler, a tired guest in a cold room, a birthday family, a couple late for dinner."),
]

# Each chapter: key, number, title, subtitle, start (min), end (min), scenes
# Each scene: heading, setting, visuals (list of photo/graphic keys + free text), lines
CHAPTERS = [
# ---------------------------------------------------------------- 0
dict(key="ch00", num="", title="Cold Open", subtitle="Welcome to the Emily Morgan", start=0.0, end=2.0, scenes=[
  dict(heading="Montage", setting="Exterior and lobby. Upbeat Tex-Mex acoustic guitar track, builds.",
       visuals=["P01 slow push-in on the tower at sunset", "P11 gothic detail, slow pan", "P02 the Alamo with the tower behind", "P05 valet canopy at 705 E. Houston", "P03 lobby doors open", "GFX title_card"],
       lines=[
    ("NARRATOR", "Nineteen twenty-four. A Gothic Revival tower rises across the plaza from the Alamo.", ""),
    ("NARRATOR", "It started life as the Medical Arts Building. Today it's one of the most recognizable hotels in Texas.", ""),
    ("NARRATOR", "Every single day, people from all over the world walk through these doors. And every single day, they decide whether they'll come back.", ""),
    ("DIR", "Music hit. Title card: THE EMILY MORGAN WAY. Subtitle: Service Training for Every Department.", ""),
  ]),
  dict(heading="Host intro", setting="Kole avatar, lobby background (P04 softened), lower third.",
       visuals=["GFX lower_third_kole"],
       lines=[
    ("KOLE", "Hi everyone, I'm Kole Siefken, General Manager here at the Emily Morgan. Bienvenidos, welcome.", ""),
    ("KOLE", "Over the next forty-five minutes we're going to talk about how we show up, how we treat guests, how we treat each other, and what we do when something goes wrong. No lectures, no corporate speeches. Real situations, real words you can use on your very next shift.", ""),
    ("KOLE", "You'll meet some of your fictional teammates along the way. Ana at the front desk, Marcus out front at valet, Rosa running housekeeping, Jake from engineering, Luis behind the bar at Oro, and Hannah, who's new and learning right alongside you.", ""),
    ("DIR", "Quick cast montage, 1.5 seconds each, name/title lower thirds. Each character waves or nods. Rosa: \"¡Hola!\" Luis raises a glass of iced tea.", ""),
    ("KOLE", "Grab a coffee. Let's get into it.", ""),
  ]),
]),
# ---------------------------------------------------------------- 1
dict(key="ch01", num="1", title="Why Service Matters", subtitle="The guest's choice", start=2.0, end=6.5, scenes=[
  dict(heading="Every job is a guest job", setting="Kole avatar, split screen with photos.",
       visuals=["GFX ch01_card", "P07 room", "P05 entrance", "P12 meeting room"],
       lines=[
    ("KOLE", "Let's start with something simple. Every job in this hotel affects the guest experience. Every one.", ""),
    ("KOLE", "A guest might remember the person who checked them in. But they're just as likely to remember the housekeeper who said good morning in the hallway, the engineer who fixed the shower fast, the bartender who gave them a great dinner recommendation, or the valet who remembered their name.", ""),
    ("KOLE", "Think about the last time you felt truly welcome somewhere as a customer. A restaurant, a store, anywhere. What did they actually do?", ""),
    ("DIR", "Pause beat. On-screen prompt: \"Think of a time you felt truly welcome.\" 4-second timer animation.", ""),
  ]),
  dict(heading="Team voices", setting="Break room. Quick talking-head interviews, documentary style.",
       visuals=["Break room set"],
       lines=[
    ("ROSA", "My first trip to New York, the doorman at the hotel noticed I was nervous. He walked me to the subway entrance himself. Thirty years later, I still remember his face.", ""),
    ("MARCUS", "A little diner in Fredericksburg. Second time I went in, the waitress said, \"Coffee, black, right?\" That's it. That's all it took. I've been going back for ten years.", ""),
    ("ANA", "Mi abuela's pharmacy in Laredo. They always asked about her by name. It's not complicated. They paid attention.", ""),
  ]),
  dict(heading="The four things that make people feel welcome", setting="Kole avatar + animated graphic.",
       visuals=["GFX four_welcomes"],
       lines=[
    ("KOLE", "Notice what those stories have in common. Nobody said \"they gave me something free.\" They said: they noticed me. They listened. They followed through. They made it easy.", ""),
    ("DIR", "Four icons animate in: NOTICED ME, LISTENED, FOLLOWED THROUGH, MADE IT EASY.", ""),
    ("KOLE", "Those four things cost nothing, and they are completely in your control.", ""),
  ]),
  dict(heading="Guests have choices", setting="Kole avatar, aerial photo behind.",
       visuals=["P01 aerial, slow drift showing nearby hotels"],
       lines=[
    ("KOLE", "Now let's be honest. Look at that skyline. Guests have choices. Another hotel down the street might have a newer room, a different price, or an amenity we don't have.", ""),
    ("KOLE", "Here's how we compete. We never criticize another hotel. We never promise something we can't deliver. We earn trust by being honest, being welcoming, and being consistent, every single time.", ""),
    ("KOLE", "And let me be clear about one thing. Great service doesn't replace fixing a broken shower or a noisy AC. If something's wrong with the room, we fix it. Service is how we make the guest feel while we fix it.", ""),
    ("KOLE", "So here's the question I want you to sit with: if a guest could choose us or a hotel down the street at the exact same price, what could you do today that would make them choose us again?", ""),
  ]),
  dict(heading="Minimum Standard vs. Above and Beyond", setting="Animated two-column graphic.",
       visuals=["GFX minimum_vs_beyond"],
       lines=[
    ("KOLE", "Two ideas we'll use for the rest of this training. First, the minimum standard. That's what every guest receives, every time, no exceptions: clean surroundings, a courteous welcome, accurate information, respectful treatment, and ownership of their requests.", ""),
    ("KOLE", "Second, above and beyond. That's a thoughtful, appropriate extra step based on that specific guest's needs. It does not mean giving things away without approval, ignoring safety, or making promises we can't keep.", ""),
    ("KOLE", "And remember: an extra never makes up for a missed basic. A handwritten card doesn't fix a dirty bathroom. Basics first, every time.", ""),
  ]),
]),
# ---------------------------------------------------------------- 2
dict(key="ch02", num="2", title="Ready for Work", subtitle="Dependable, presentable, respectful", start=6.5, end=12.0, scenes=[
  dict(heading="Show up ready", setting="Kole avatar walking-shot feel; checklist graphic.",
       visuals=["GFX ch02_card", "GFX ready_checklist"],
       lines=[
    ("KOLE", "Great service starts before you ever meet a guest. It starts with how you arrive.", ""),
    ("KOLE", "Be ready at your scheduled start time, following our timekeeping policy. And if you're going to be late or you can't make it, follow the call-in procedure right away. A text to your coworker is not a call-in. Your supervisor needs to hear it from you.", ""),
    ("DIR", "On-screen policy box (FILL IN BEFORE PRODUCTION): Late/absence contact: [CONFIRM]. Time clock location: [CONFIRM].", ""),
    ("KOLE", "Use the employee entrance, the time clock, and the staff route. Never prop open a secured door, and never let someone you don't know follow you in. And one more thing: all required work, including shift handoffs, happens on the clock. Always.", ""),
    ("DIR", "On-screen policy box (FILL IN): Employee entrance/exit: [CONFIRM]. Staff route and restricted areas: [CONFIRM].", ""),
  ]),
  dict(heading="Scene: 2:50 PM", setting="Hannah in her car in a parking garage, phone in hand, traffic outside. Clock graphic reads 2:50.",
       visuals=["Car interior set", "Clock overlay 2:50"],
       lines=[
    ("HANNAH", "(to herself) Shift starts at three... I'm at least fifteen minutes out. Okay, I'll just text Ana and ask her to cover for me.", ""),
    ("DIR", "FREEZE FRAME. Red buzzer sound. On-screen: \"What should Hannah do?\"", ""),
    ("KOLE", "Pause right there. Texting a coworker feels easier, but it puts Ana in a tough spot and it doesn't reach the person who manages the schedule.", ""),
    ("DIR", "REWIND effect. Hannah dials instead.", ""),
    ("HANNAH", "Hi, this is Hannah from banquets. I'm stuck in traffic on I-35 and I'll be about fifteen minutes late. I'm sorry. I'll be there by three-fifteen.", ""),
    ("KOLE", "That's it. Contact the designated supervisor promptly, give an honest arrival estimate, follow the procedure. Simple, respectful, done.", ""),
  ]),
  dict(heading="Look the part", setting="Locker room. Rosa and Hannah.",
       visuals=["Locker room set", "GFX uniform_standard"],
       lines=[
    ("DIR", "Hannah looks at a coffee stain on her uniform shirt, shrugs, starts to close her locker.", ""),
    ("ROSA", "Mija, wait. What happened there?", ""),
    ("HANNAH", "Coffee. It's small. Nobody will notice.", ""),
    ("ROSA", "The guests notice everything. Come on, tell your supervisor and let's get you a clean one. Takes two minutes. Ándale.", ""),
    ("KOLE", "Rosa's right. Wear the correct uniform, clean, pressed, and fitting well, with your name badge and approved footwear. Hair, hands, and nails clean and maintained for your role. If you work around food, follow food safety rules. Go easy on the cologne and perfume.", ""),
    ("KOLE", "And if something's wrong with your uniform, don't hide it. Tell your supervisor and get an approved replacement. We apply our grooming standards and any approved accommodations the same way for everyone.", ""),
    ("DIR", "On-screen policy box (FILL IN): Uniform, footwear, name badge, and grooming requirements by department: [CONFIRM].", ""),
  ]),
  dict(heading="Respect on the team", setting="Lobby. A guest is at the desk. Marcus and a coworker nearby.",
       visuals=["P04 lobby", "GFX respect_rules"],
       lines=[
    ("DIR", "A guest waits at the desk. A coworker (background extra) mutters loudly enough to be heard:", ""),
    ("EXTRA", "Ugh. Housekeeping never gets anything right.", ""),
    ("DIR", "The guest's eyebrows go up. Freeze frame.", ""),
    ("KOLE", "Ouch. What did that guest just learn about our hotel? Nothing good. Let's run it back.", ""),
    ("DIR", "Rewind. Marcus steps in calmly.", ""),
    ("MARCUS", "(to coworker, quietly) Hey, let's take care of our guest first. We'll talk about it after. (to guest, warm) Sorry for the wait, sir. How can I help?", ""),
    ("KOLE", "Here's our team standard. Speak respectfully about coworkers, in front of guests and behind the scenes. No insults, no gossip, no eye-rolling, no discriminatory comments, no public blame. Offer help. Make clean handoffs. If you have a concern, bring it privately to your supervisor.", ""),
    ("KOLE", "Being dependable is one of the ways we show respect. Your coworkers should be able to count on you, and you should be able to count on them.", ""),
  ]),
]),
# ---------------------------------------------------------------- 3
dict(key="ch03", num="3", title="First Impressions", subtitle="The greeting standard", start=12.0, end=17.5, scenes=[
  dict(heading="Why the greeting matters", setting="Kole avatar; P03 entry doors behind.",
       visuals=["GFX ch03_card", "P03 doors"],
       lines=[
    ("KOLE", "A guest decides how they feel about a hotel in the first few seconds. Before they see the room. Before they taste a drink at Oro. It's the greeting.", ""),
    ("KOLE", "A warm welcome is part of the job. A smile is part of our everyday welcome, a natural one, not a forced one. But read the moment: if someone's upset, hurt, or worried, a calm, caring expression is the right choice. And if smiling isn't comfortable for you, you can show warmth with your voice and your attention.", ""),
  ]),
  dict(heading="The three moves", setting="Animated graphic.",
       visuals=["GFX greeting_three_moves"],
       lines=[
    ("KOLE", "Three moves. One: notice the guest. Pause a non-essential task, when it's safe to do so. Two: face them, with open posture and natural eye contact. Three: give a friendly greeting and a clear next step.", ""),
    ("KOLE", "Already helping someone? Acknowledge the next guest and let them know you'll be right with them. And never stop a safety-critical task to say hi.", ""),
    ("KOLE", "Use a guest's name when you know it and it's appropriate, but don't overdo it. And never, ever announce a room number or private information out loud.", ""),
  ]),
  dict(heading="Same words, different result", setting="Front desk. Ana. Side-by-side split screen.",
       visuals=["Front desk set", "Split screen"],
       lines=[
    ("DIR", "LEFT SIDE: Ana looking down at her phone, flat voice.", ""),
    ("ANA", "Good afternoon. Welcome to the Emily Morgan. How may I help you.", ""),
    ("DIR", "RIGHT SIDE: Ana sets the pen down, looks up, smiles naturally.", ""),
    ("ANA", "Good afternoon! Welcome to the Emily Morgan. How may I help you?", ""),
    ("KOLE", "Exact same words. Completely different feeling. Attention is the difference.", ""),
  ]),
  dict(heading="Round 1: Arrival with luggage", setting="Exterior canopy (P05). A family steps out of an SUV, looking uncertain.",
       visuals=["P05 entrance"],
       lines=[
    ("MARCUS", "Good afternoon, and welcome! Are you checking in with us today?", ""),
    ("GUEST (Sr. Trevino)", "Sí... yes. Sorry, my English is not so good.", ""),
    ("MARCUS", "No problem at all. Would you prefer English or Spanish? ¿Prefiere inglés o español?", ""),
    ("GUEST (Sr. Trevino)", "Español, por favor.", "Spanish, please."),
    ("MARCUS", "Perfect. One moment. Ana! (Ana steps out)", ""),
    ("ANA", "¡Bienvenidos al Emily Morgan! Me llamo Ana. Con gusto los ayudo con el registro. Marcus les sube el equipaje.", "Welcome to the Emily Morgan! My name is Ana. I'm happy to help you check in. Marcus will bring up your luggage."),
    ("GUEST (Sra. Trevino)", "¡Qué amables! Gracias.", "How kind! Thank you."),
    ("KOLE", "Notice what Marcus did. He didn't guess what language they spoke based on how they looked or sounded. He asked. Then he connected them with a teammate who could help. That's the standard: ask, don't assume, and use approved help when there's a language barrier.", ""),
  ]),
  dict(heading="Round 2: The hallway", setting="Guest-floor hallway. Rosa with her cart, pulled flush to the wall.",
       visuals=["Hallway set", "P09 suite glimpse through door"],
       lines=[
    ("DIR", "A business traveler walks past, on the phone. Rosa pauses, steps aside, smiles, small nod.", ""),
    ("ROSA", "Good morning.", ""),
    ("DIR", "Guest nods back, keeps walking. Ten seconds later a couple walks by, unhurried.", ""),
    ("ROSA", "Good morning! Enjoy your day in San Antonio.", ""),
    ("KOLE", "Every department shares the greeting standard. Front desk, housekeeping, engineering, food and beverage, everybody. Rosa matched each guest. Quick nod for the busy one, a little more for the couple taking their time.", ""),
  ]),
  dict(heading="Round 3: Two guests at once", setting="Front desk. Ana helping one guest; another approaches.",
       visuals=["Front desk set"],
       lines=[
    ("ANA", "(making eye contact with the second guest) Hi there! I'll be with you as soon as I finish helping this guest.", ""),
    ("DIR", "Second guest relaxes, nods. Ana finishes, turns.", ""),
    ("ANA", "Thank you so much for waiting. How can I help?", ""),
    ("KOLE", "Ten words, and that guest went from \"am I invisible?\" to \"I'm next.\" Keep these ready.", ""),
    ("DIR", "GFX greeting_phrases: \"Good morning. Enjoy your day.\" / \"Hello. May I help you find something?\" / \"I'll be with you as soon as I finish helping this guest.\"", ""),
    ("KOLE", "And one quick tip: don't guess a guest's title, relationship, or reason for visiting. \"Is this your daughter?\" can go very wrong. Keep it simple and friendly.", ""),
  ]),
]),
# ---------------------------------------------------------------- 4
dict(key="ch04", num="4", title="Words That Work", subtitle="The phrase makeover", start=17.5, end=23.5, scenes=[
  dict(heading="Language basics", setting="Kole avatar.",
       visuals=["GFX ch04_card"],
       lines=[
    ("KOLE", "Words matter. The same answer can make a guest feel helped or brushed off, depending on how you say it.", ""),
    ("KOLE", "Clear, respectful language. Calm volume. No profanity, no sarcasm, no confusing slang, no pet names like \"honey\" or \"buddy,\" and no internal hotel jargon. Guests don't know what \"OOO\" or \"the MOD\" means. And listen all the way through before you answer.", ""),
  ]),
  dict(heading="Phrase Makeover (game segment)", setting="Game-show style. Bright stinger. Hannah plays contestant; Luis hosts from behind the Oro bar.",
       visuals=["GFX makeover_title", "GFX makeover_1..7 (one card per phrase)", "Oro bar set"],
       lines=[
    ("LUIS", "Welcome to... PHRASE MAKEOVER! The show where bad phrases get a glow-up. Hannah, you ready?", ""),
    ("HANNAH", "Uh, I think so?", ""),
    ("LUIS", "Round one. A guest asks what time the River Walk boat tours stop running. You don't know. What do you NOT say?", ""),
    ("HANNAH", "\"I don't know.\"", ""),
    ("LUIS", "And what do you say instead?", ""),
    ("HANNAH", "\"Let me find out for you.\"", ""),
    ("DIR", "Ding! Card flips: \"I don't know.\" becomes \"Let me find out for you.\"", ""),
    ("LUIS", "Round two. Guest asks you, the banquet server, about their parking charge.", ""),
    ("HANNAH", "Not \"That's not my department.\" Instead: \"Let me connect you with the right person and explain what you need, so you don't have to repeat yourself.\"", ""),
    ("LUIS", "¡Eso! Round three. Guest's room isn't ready.", ""),
    ("HANNAH", "Not \"You have to wait.\" Instead: \"I'm checking on that now. I'll update you in five minutes.\"", ""),
    ("LUIS", "Ah, but careful, contestant! Only use a time you can actually meet. If it's twenty minutes, say twenty.", ""),
    ("LUIS", "Round four. Guest is upset and raising their voice.", ""),
    ("HANNAH", "Never \"Calm down.\" Try: \"I can see this has been frustrating. Let me understand what happened.\"", ""),
    ("LUIS", "Round five, the classic. We're busy and the guest has waited.", ""),
    ("HANNAH", "Not \"We're short-staffed.\" Instead: \"I'm sorry for the delay. Here's what I can do right now.\"", ""),
    ("LUIS", "Round six. Guest asks for something we can't do.", ""),
    ("HANNAH", "Not \"No, we can't.\" Instead: \"That option isn't available, but let me check what alternatives we can offer.\"", ""),
    ("LUIS", "Final round. A request fell through the cracks on the last shift.", ""),
    ("HANNAH", "Not \"They didn't tell me.\" Instead: \"Thank you for explaining. I'll take it from here and confirm the next step.\"", ""),
    ("LUIS", "Seven for seven! Hannah, you're going home with... the satisfaction of excellent guest communication!", ""),
    ("HANNAH", "(laughing) I was hoping for a gift card.", ""),
  ]),
  dict(heading="Ownership words", setting="Kole avatar, all 7 cards on screen in a grid.",
       visuals=["GFX makeover_grid"],
       lines=[
    ("KOLE", "Look at the right column. What do almost all of those phrases have in common? \"Let me.\" \"I'll.\" That's ownership language. You're telling the guest: I've got you.", ""),
    ("KOLE", "But here's the catch. Helpful words have to be followed by action. Never invent an answer, a repair time, an available room, a refund, or an amenity just to make the moment easier. A made-up answer becomes a broken promise later.", ""),
  ]),
  dict(heading="Phone and radio", setting="PBX/phone desk. Ana with headset.",
       visuals=["Phone desk set", "GFX phone_script"],
       lines=[
    ("ANA", "Thank you for calling the Emily Morgan, this is Ana. How may I help you?", ""),
    ("CALLER (V.O.)", "Hi, I need to talk to someone about a banquet invoice.", ""),
    ("ANA", "Of course. May I place you on a brief hold while I connect you with our events team?", ""),
    ("CALLER (V.O.)", "Sure.", ""),
    ("ANA", "Thank you. I'm transferring you to Catering Sales now. If we get disconnected, their direct line is [CONFIRM NUMBER].", ""),
    ("KOLE", "Answer with our name and yours. Ask permission before placing someone on hold. Tell them where you're transferring them. Follow our approved phone procedure.", ""),
    ("DIR", "Cut to Jake on a radio in a service corridor.", ""),
    ("JAKE", "Engineering to front desk. Room 1-2-... uh, actually, front desk, can you call my phone?", ""),
    ("KOLE", "Nice catch, Jake. Keep radio messages brief and professional. Guests can sometimes hear them. Anything sensitive, like names, room numbers with names, or security details, moves to an approved private channel.", ""),
  ]),
]),
# ---------------------------------------------------------------- 5
dict(key="ch05", num="5", title="Read the Guest", subtitle="Creating moments of delight", start=23.5, end=30.0, scenes=[
  dict(heading="Cues are clues, not proof", setting="Kole avatar.",
       visuals=["GFX ch05_card", "GFX notice_ask_offer_confirm"],
       lines=[
    ("KOLE", "Great hospitality professionals are great observers. But here's the important part: body language gives you clues, not proof.", ""),
    ("KOLE", "A guest looking around might need directions. Short answers might mean they want a quick interaction. But folded arms, silence, limited eye contact, or an accent? Those tell you nothing about someone's mood or ability. Don't assume. Ask a respectful question and let the guest tell you what they need.", ""),
    ("KOLE", "Here's the sequence. Notice a cue. Ask a useful question. Offer a relevant action. Confirm it helped. And if the guest says no thanks, respect that \"no.\"", ""),
    ("KOLE", "One firm rule: never touch a guest, their belongings, or a mobility device without permission.", ""),
  ]),
  dict(heading="Cue 1: Lost on Alamo Plaza", setting="Exterior near the Alamo (P02). A couple looking from phone to street signs.",
       visuals=["P02 Alamo"],
       lines=[
    ("MARCUS", "Hi folks, may I help you find your way?", ""),
    ("GUEST (woman)", "We're trying to get to the River Walk, but the map keeps spinning.", ""),
    ("MARCUS", "Happens to everybody. It's about a three-minute walk. Here, (pulls a hotel map card from his pocket and draws a line) straight down this way, and the stairs are right by the bridge. Want me to mark a good spot for lunch too?", ""),
    ("GUEST (man)", "That would be great.", ""),
    ("KOLE", "Confirm current directions, offer a clear written route, and the extra step came naturally because Marcus asked first.", ""),
  ]),
  dict(heading="Cue 2: The birthday", setting="Oro Restaurant & Bar. Luis behind the bar. A woman mentions a birthday, smiling.",
       visuals=["Oro bar set"],
       lines=[
    ("GUEST", "It's my birthday today, actually. First time in San Antonio!", ""),
    ("LUIS", "Happy birthday! ¡Feliz cumpleaños! Would you enjoy a suggestion for celebrating while you're in town?", ""),
    ("GUEST", "Absolutely.", ""),
    ("LUIS", "If you like live music, the Pearl district is beautiful at night. And I'll let my team know it's your special day.", ""),
    ("KOLE", "Luis offered a personal recommendation, and he can arrange an approved note or gesture. Notice he didn't promise a free dessert he doesn't have authority to give. Personal, appropriate, within our authority.", ""),
  ]),
  dict(heading="Cue 3: The guest in a hurry", setting="Lobby (P04). A business traveler giving one-word answers, checking his watch.",
       visuals=["P04 lobby"],
       lines=[
    ("ANA", "Good morning, Mr. Collins. Would you prefer the quickest option today?", ""),
    ("GUEST (Mr. Collins)", "Yes. Please.", ""),
    ("ANA", "You're all set. Key's in the sleeve, your receipt is going to your email. Valet is bringing the car now.", ""),
    ("DIR", "Collins nods, actually smiles, leaves.", ""),
    ("KOLE", "Was Mr. Collins rude? No. He was busy. Ana didn't take it personally and she didn't force small talk. For him, the extra step was speed. Same values, very different delivery.", ""),
  ]),
  dict(heading="Having fun with guests", setting="Kole avatar, playful music bed.",
       visuals=["GFX fun_dos_donts"],
       lines=[
    ("KOLE", "Can we have fun with guests? Absolutely, we're in San Antonio! Follow the guest's lead. Light conversation about their trip, the Spurs, the food... that's often welcome. When their attention shifts or replies get shorter, wrap it up.", ""),
    ("KOLE", "Stay away from jokes about appearance, identity, politics, religion, money, or a service problem. Never flirt, tease, or pressure someone to join in.", ""),
  ]),
  dict(heading="Our building has stories", setting="Oro bar, evening lighting. Luis with a couple. P11 gothic details cut-ins.",
       visuals=["P11 gothic detail", "P01 tower at dusk", "GFX legends_card"],
       lines=[
    ("GUEST", "Someone told us this place is haunted. Is that true?", ""),
    ("LUIS", "(grinning) Well... this building opened in 1924 as the Medical Arts Building. Doctors, a hospital, the whole thing. And if you look up at the outside you'll see carved gargoyles. Legend says some of them show the ailments the doctors treated, like a toothache or a broken bone.", ""),
    ("GUEST", "And the ghosts?", ""),
    ("LUIS", "Some guests say they've had experiences. I'll let you decide for yourself. There are a lot of fun legends about this place. I just tell them as legends.", ""),
    ("KOLE", "Perfect. Guests love the history and the stories of this building. Share a brief, approved anecdote if they ask. Present legends as legends. Don't invent history, don't scare children, and don't turn a quiet guest's stay into a ghost tour they didn't ask for.", ""),
    ("DIR", "On-screen note for production: have the approved building history/legend talking points reviewed before final render.", ""),
  ]),
  dict(heading="What made it personal?", setting="Kole avatar.",
       visuals=["GFX personal_three_checks"],
       lines=[
    ("KOLE", "So, what made each of those extra steps personal? Three things. It matched what the guest actually told us. It respected their preference. And it stayed within our authority.", ""),
    ("DIR", "Graphic: MATCHED THEIR NEED / RESPECTED THEIR PREFERENCE / STAYED WITHIN OUR AUTHORITY.", ""),
  ]),
]),
# ---------------------------------------------------------------- 6
dict(key="ch06", num="6", title="We All Own It", subtitle="Cleanliness and safety", start=30.0, end=35.0, scenes=[
  dict(heading="If you see it, own it", setting="Kole avatar, P03 lobby doors.",
       visuals=["GFX ch06_card", "P03 lobby doors"],
       lines=[
    ("KOLE", "Here's a simple rule. If you see ordinary trash and it's safe to pick it up, pick it up. We all own the appearance of this hotel. Don't walk past a problem because another department usually handles it.", ""),
    ("KOLE", "But safety first. Use the right equipment and wash your hands. Never pick up needles, broken glass, unknown substances, or bodily waste with your bare hands. Protect the area and call the trained team. Never mix cleaning chemicals, and never try a task you haven't been trained on.", ""),
  ]),
  dict(heading="SPOT THE PROBLEM (interactive)", setting="Wide lobby shot, staged. 15-second on-screen timer. Viewers pause and count issues.",
       visuals=["GFX spot_the_problem_title", "Staged lobby wide shot", "GFX timer_15"],
       lines=[
    ("KOLE", "Time for a challenge. You're walking through the lobby. I'm going to show you a scene for fifteen seconds. Count how many problems you can spot. Ready? Go.", ""),
    ("DIR", "Staged scene: paper cup on a table; water puddle near the entrance; fingerprints on the brass front door; a bag blocking a walkway; a housekeeping cart blocking an exit; a wallet left on a chair; a guest waiting for directions while two employees argue nearby. 15-second countdown.", ""),
    ("KOLE", "Time! How many did you get? There were seven. Let's go through them, in the right order.", ""),
  ]),
  dict(heading="The answers, in priority order", setting="Each problem circled in gold as Kole explains.",
       visuals=["GFX spot_answers"],
       lines=[
    ("KOLE", "Safety first. The water by the entrance and the cart blocking the exit. Address immediate safety. Protect the area, get help, keep emergency routes clear. Don't leave a slip hazard unguarded while you go find a mop if someone could get hurt.", ""),
    ("DIR", "Rosa places a wet-floor sign and radios for help while staying with the spill. Jake moves the cart.", ""),
    ("ROSA", "(on radio) Housekeeping, I need a mop at the main entrance, please. I'm staying with it.", ""),
    ("KOLE", "Next, the cup and the fingerprints. Make sure the cup isn't still in use, then remove it. Clean the door with approved methods, or let the responsible person know.", ""),
    ("KOLE", "Now the bag and the wallet. Belongings are never trash. If the bag's owner is nearby, ask them politely to move it. If it's unattended, follow hotel security procedures. The wallet goes through our lost and found process. Secure it, document it.", ""),
    ("DIR", "On-screen policy box (FILL IN): Lost & found and unattended item procedure: [CONFIRM].", ""),
    ("KOLE", "And the guest waiting while two employees argue? Acknowledge the guest, offer help, and take the employee disagreement somewhere private.", ""),
    ("KOLE", "So ask yourself: what can I fix safely myself, and what needs trained help? Ownership means taking the right next action and making sure someone follows through.", ""),
  ]),
  dict(heading="Rosa's tip", setting="Housekeeping office, talking head.",
       visuals=["Housekeeping office set"],
       lines=[
    ("ROSA", "I tell my team: el hotel es nuestra casa. The hotel is our house. You wouldn't walk past trash in your own living room. Same thing here. But you also wouldn't pick up broken glass with your hands at home, ¿verdad? Use your head. Get the right tools.", "\"El hotel es nuestra casa\" = The hotel is our house. \"¿verdad?\" = right?"),
  ]),
]),
# ---------------------------------------------------------------- 7
dict(key="ch07", num="7", title="When Things Go Wrong", subtitle="Problem solving with ownership", start=35.0, end=42.0, scenes=[
  dict(heading="The 5 Steps of Ownership", setting="Kole avatar with animated stair-step graphic.",
       visuals=["GFX ch07_card", "GFX five_steps"],
       lines=[
    ("KOLE", "Things will go wrong. Rooms get cold. Cars get delayed. Requests get missed. What guests remember most is not the problem. It's how we handled it.", ""),
    ("KOLE", "Five steps. One: Listen. Let the guest finish, and understand how it affected them. Two: Acknowledge and apologize. \"I'm sorry your room is uncomfortable.\" Three: Act. Ask what would help, explain realistic options, and work within your authority.", ""),
    ("KOLE", "Four: Hand off clearly. Give the next person the issue and the agreed action, so the guest never has to start over. Five: Follow through. Record the request, agree on a specific update time, and check that the solution actually worked.", ""),
    ("KOLE", "Now listen closely. An update time is a promise to communicate. It is not a promise that the repair will be finished. If it's not fixed when the time comes, you update the guest anyway, and you escalate.", ""),
    ("KOLE", "And if there's immediate danger, an injury, a threat, or a security concern, follow emergency procedures and get help right away. You never have to tolerate abuse or handle a threat alone.", ""),
    ("DIR", "On-screen policy box (FILL IN): Manager on duty contact: [CONFIRM]. Request tracking tool and escalation: [CONFIRM]. Employee remedy authority/limits: [CONFIRM].", ""),
  ]),
  dict(heading="Role play 1: The cold room", setting="Front desk, late evening. Guest (Ms. Patterson) is tired and frustrated. Ana at the desk.",
       visuals=["GFX roleplay_1", "P07 room", "Front desk set"],
       lines=[
    ("GUEST (Ms. Patterson)", "My room is freezing. I already called once and nobody came. I'm exhausted and I just want to sleep.", ""),
    ("DIR", "Freeze. On-screen: WHAT WOULD YOU SAY? (5-second pause). Then play.", ""),
    ("ANA", "I'm so sorry, Ms. Patterson. You called once already and you're still cold. That's not okay, especially when you just want to rest. Can I ask, is the issue the thermostat, or does it feel like the air isn't working at all?", ""),
    ("GUEST (Ms. Patterson)", "It's blowing cold no matter what I set it to.", ""),
    ("ANA", "Thank you, that helps. I'm calling engineering and our manager on duty right now to check the options, including whether another room is available. I'll update you in five minutes, even if I'm still waiting on an answer.", ""),
    ("DIR", "Ana picks up phone. Cut to Jake receiving the call.", ""),
    ("ANA", "Jake, room [####], heat stuck on cold. Guest already called once, she's tired and wants to rest. Can you get eyes on it, and let me know your ETA in the next five?", ""),
    ("JAKE", "Heading up now. I'll call you from the room.", ""),
    ("DIR", "Five minutes later. Ana walks to the guest, who's waiting in the lobby lounge.", ""),
    ("ANA", "Ms. Patterson, quick update. Jake from engineering is in your room now, and our manager is confirming a room that's ready, in case you'd rather move. Which would you prefer?", ""),
    ("KOLE", "Did you catch what Ana did NOT do? She didn't minimize it. She didn't blame the last shift. She didn't promise a repair time, a room move, or a credit she couldn't authorize. And she never suggested an improvised fix like a space heater. She owned it, handed it off clearly, and came back when she said she would.", ""),
    ("KOLE", "One more thing. Ana logs it in our tracking system. Repeated problems get recorded so management can fix the cause, not just tonight's complaint.", ""),
  ]),
  dict(heading="Role play 2: Late for dinner", setting="Valet podium (P05), evening. A couple, dressed up, checking the time.",
       visuals=["GFX roleplay_2", "P05 entrance"],
       lines=[
    ("GUEST (man)", "We've been waiting for our car for twenty minutes. Our reservation's in fifteen. We're going to miss it.", ""),
    ("MARCUS", "I'm sorry about the wait, sir. Let me check right now exactly where your car is.", ""),
    ("DIR", "Marcus radios the garage.", ""),
    ("MARCUS", "(radio) Podium to garage, status on ticket 4-1-8? (listens) Okay, thank you.", ""),
    ("MARCUS", "Here's what I know: your car is being pulled now, they're on the second level. I don't want to give you a guess, so I'll update you again in three minutes either way. In the meantime, would you like me to help you call the restaurant and let them know you're running a few minutes behind?", ""),
    ("GUEST (woman)", "Yes, that would help a lot.", ""),
    ("KOLE", "Marcus apologized, confirmed real status, and gave an honest update commitment. He didn't invent an arrival time, and he didn't promise the restaurant would hold the table. With their permission, he helped them call. And he stays with them until they have a clear next step.", ""),
  ]),
  dict(heading="Role play 3: The towels and the birthday", setting="Phone desk. Ana takes a call. Split screen with a guest in room P09, getting ready.",
       visuals=["GFX roleplay_3", "P09 suite", "Split screen"],
       lines=[
    ("GUEST (Mrs. Harper, V.O.)", "Hi, we asked for extra towels an hour ago. We're trying to get ready for my daughter's birthday dinner.", ""),
    ("ANA", "I'm sorry, Mrs. Harper, you should have had those already. How many towels do you need?", ""),
    ("GUEST (Mrs. Harper)", "Three. Just quickly and quietly, please.", ""),
    ("ANA", "Three bath towels, quick and quiet. I'm sending them with Rosa's team right now and I'll call you back to confirm they arrived. And happy birthday to your daughter!", ""),
    ("DIR", "Ana can't leave the desk. She calls Rosa.", ""),
    ("ANA", "Rosa, room [####] needs three bath towels, priority. It's the second request. Can you confirm when they're delivered?", ""),
    ("ROSA", "Ya voy. On my way. Five minutes.", "\"Ya voy\" = I'm on my way."),
    ("DIR", "Rosa delivers, knocks softly, hands towels with a quick smile, \"Happy birthday to your daughter.\" Leaves. Ana calls back.", ""),
    ("ANA", "Mrs. Harper, did the towels arrive? Is there anything else you need before dinner?", ""),
    ("KOLE", "The essential request came first. A brief birthday wish matched what the guest wanted: quiet and quick, not a parade. A note or a gesture can be a lovely extra, but it never replaces the towels.", ""),
  ]),
  dict(heading="Debrief", setting="Kole avatar.",
       visuals=["GFX five_steps (recap)"],
       lines=[
    ("KOLE", "In all three stories, the employee couldn't fix everything personally. What did they say? \"Let me check.\" \"I'll update you by.\" \"Here's what I know.\" And they avoided promising anything they couldn't keep.", ""),
    ("KOLE", "Remember: a handoff isn't complete until the next person accepts responsibility. Ana didn't just send a message into the void. She got a \"heading up now\" and a \"ya voy.\"", ""),
  ]),
]),
# ---------------------------------------------------------------- 8
dict(key="ch08", num="8", title="Knowledge Check", subtitle="The Alamo City Quiz", start=42.0, end=44.0, scenes=[
  dict(heading="Quiz show", setting="Game-show graphics. Luis hosts again. Each question shows a 5-second countdown. Tell viewers to pause if they need more time.",
       visuals=["GFX quiz_title", "GFX quiz_1..5"],
       lines=[
    ("LUIS", "¡Bienvenidos a THE ALAMO CITY QUIZ! Five questions. Answer out loud or in your head. Pause the video if you need a minute. ¿Listos? Ready?", "\"¿Listos?\" = Ready?"),
    ("LUIS", "Question one. You realize you'll be late for your shift. What must you do?", ""),
    ("DIR", "5-second timer. Answer reveal.", ""),
    ("KOLE", "Follow the call-in procedure promptly, and give your supervisor an honest arrival estimate.", ""),
    ("LUIS", "Question two. A guest asks you something outside your department.", ""),
    ("KOLE", "Offer to find the answer or connect them with the right person, and confirm someone owns it.", ""),
    ("LUIS", "Question three. A guest gives short answers and keeps looking at the time. Are they being rude?", ""),
    ("KOLE", "No. Don't assume. Ask if they'd prefer the quickest option, and respect their preference.", ""),
    ("LUIS", "Question four. Broken glass in a walkway. First move?", ""),
    ("KOLE", "Protect the area and contact trained help with the proper equipment. Never use bare hands.", ""),
    ("LUIS", "Final question. The update time you promised arrives, but the problem isn't fixed.", ""),
    ("KOLE", "Update the guest on time anyway. Explain what you know, escalate if needed, and agree on the next contact.", ""),
    ("LUIS", "Five for five? ¡Felicidades! You're ready.", "\"¡Felicidades!\" = Congratulations!"),
  ]),
]),
# ---------------------------------------------------------------- 9
dict(key="ch09", num="9", title="The Emily Morgan Way", subtitle="My next-shift commitment", start=44.0, end=45.5, scenes=[
  dict(heading="Seven every-shift standards", setting="Kole avatar + animated list.",
       visuals=["GFX ch09_card", "GFX seven_standards"],
       lines=[
    ("KOLE", "Let's bring it home. Every shift, the Emily Morgan way: Be dependable. Be presentable. Be welcoming. Be respectful. Be observant. Be helpful. Be responsible.", ""),
  ]),
  dict(heading="Your commitment", setting="Kole avatar, P01 sunset behind.",
       visuals=["GFX commitment_card", "P01 tower at sunset"],
       lines=[
    ("KOLE", "Now I want you to pick one. Just one behavior you'll practice on your very next shift. Maybe it's greeting every guest in the hallway. Maybe it's replacing \"I don't know\" with \"Let me find out.\" Maybe it's coming back exactly when you said you would. Write it on your handout, and tell a teammate.", ""),
    ("DIR", "Cast quick-cuts, each saying their commitment:", ""),
    ("HANNAH", "I'm going to stop saying \"no problem\" and start saying \"I'll take care of it.\"", ""),
    ("MARCUS", "Learning five returning guests' names this week.", ""),
    ("ROSA", "Saludar a cada huésped en el pasillo. Every guest in the hallway gets a greeting.", "Greet every guest in the hallway."),
    ("JAKE", "When I fix something, I call the front desk so they can tell the guest.", ""),
    ("ANA", "Coming back on time, every time. Even if I don't have the answer yet.", ""),
    ("LUIS", "Recommending one hidden gem in San Antonio to every guest who asks.", ""),
    ("KOLE", "Our guests should feel that we're glad they chose us. That starts with being ready, treating one another well, noticing what needs attention, and doing what we say we will do.", ""),
    ("KOLE", "Thank you for taking care of our guests, and thank you for taking care of each other. Muchas gracias, equipo. Now let's put one of these into practice on our very next shift.", ""),
    ("DIR", "Music swells. Drone shot (P01) pulls back. End card: THE EMILY MORGAN HOTEL logo. \"Thank you for making every guest feel welcome.\" Hold 5 seconds.", ""),
  ]),
]),
]

KNOWLEDGE_CHECK = [
    ("You realize you'll be late for your shift. What must you do?",
     "Follow the hotel's call-in procedure promptly and give an honest arrival estimate."),
    ("A guest asks something outside your department. What do you say and do?",
     "Offer to find the answer or connect them with the right person; confirm someone owns it."),
    ("A guest gives short answers and checks the time. Are they rude? What could you ask?",
     "No. Ask whether they prefer the quickest option and respect their preference."),
    ("You see broken glass in a walkway. What is your first response?",
     "Protect the area and contact trained help with proper equipment. Never bare hands."),
    ("Your promised update time arrives, but the issue isn't fixed. What next?",
     "Update the guest on time, explain what is known, escalate as needed, agree on the next contact."),
]

PHRASES = [
    ("I don't know.", "Let me find out for you."),
    ("That's not my department.", "Let me connect you with the right person and explain what you need."),
    ("You have to wait.", "I'm checking on that now. I'll update you in five minutes."),
    ("Calm down.", "I can see this has been frustrating. Let me understand what happened."),
    ("We're short-staffed.", "I'm sorry for the delay. Here's what I can do right now."),
    ("No, we can't.", "That option isn't available. Let me check what alternatives we can offer."),
    ("They didn't tell me.", "Thank you for explaining. I'll take it from here and confirm the next step."),
]

POLICY_BLANKS = [
    "Employee entrance and exit location",
    "Approved staff route and restricted areas",
    "Time clock and reporting location",
    "Late arrival / absence contact and notice procedure",
    "Uniform and footwear requirements by department",
    "Name badge and grooming requirements",
    "Manager on duty contact and backup contact",
    "Employee remedy authority and approval limits",
    "Guest request tracking tool and escalation procedure",
    "Lost & found / unattended item procedure",
    "Catering Sales direct phone line (Ch. 4 phone scene)",
    "Approved building history and legend talking points (Ch. 5)",
]


# ---------------------------------------------------------------------------
# Additional scenes and chapter recaps (inserted into CHAPTERS below)
# ---------------------------------------------------------------------------
def _insert(chkey, scene, before_heading=None):
    ch = next(c for c in CHAPTERS if c["key"] == chkey)
    if before_heading is None:
        ch["scenes"].append(scene)
    else:
        i = next(i for i, s in enumerate(ch["scenes"]) if s["heading"] == before_heading)
        ch["scenes"].insert(i, scene)

_insert("ch01", dict(heading="Our house has a story", setting="Kole avatar; slow Ken Burns on P11, P02, P01.",
    visuals=["P11 gothic detail", "P02 Alamo + tower", "GFX history_timeline"],
    lines=[
    ("KOLE", "Before we go further, take a second to appreciate where you work. This building opened in 1924 as the Medical Arts Building. It's Gothic Revival, which is why you see all that carved detail on the outside. Later it became the hotel you know today, the Emily Morgan, and it's a member of Historic Hotels of America.", ""),
    ("KOLE", "We sit right across the plaza from the Alamo, one of the most visited places in Texas. That means a lot of our guests are here for a once-in-a-lifetime trip. A family reunion. A honeymoon. A kid seeing the Alamo for the first time.", ""),
    ("KOLE", "For them, we're not just a place to sleep. We're part of the memory. That's a big responsibility, and honestly, it's a pretty cool one.", ""),
    ("DIR", "Graphic: 1924 Medical Arts Building -> Today: The Emily Morgan Hotel, A DoubleTree by Hilton. (Have dates verified before final render.)", ""),
]), before_heading="Guests have choices")

_insert("ch02", dict(heading="Pre-shift huddle", setting="Back-of-house corridor, 2:58 PM. Rosa leads a quick housekeeping huddle. Mixed team.",
    visuals=["BOH corridor set"],
    lines=[
    ("ROSA", "Okay, equipo, buenas tardes. Quick one. We have a full house tonight, a big wedding group on floors eight through ten.", "\"equipo\" = team. \"buenas tardes\" = good afternoon."),
    ("ROSA", "Uniforms, badges, everybody looks sharp, good. Remember, if the elevators get busy, guests come first, we wait for the next one.", ""),
    ("HANNAH", "Rosa, I'm on banquets tonight, but I can help with turndown if you need it later.", ""),
    ("ROSA", "¡Eso es! That's what I like to hear. Gracias, Hannah. Okay, let's go.", ""),
    ("KOLE", "That's what a respectful team looks like. Ready on time, looking the part, offering help across departments. Nobody had to be asked twice.", ""),
]), before_heading="Respect on the team")

_insert("ch05", dict(heading="Cue 4: When the answer is no", setting="Lobby. A guest using a wheelchair is heading toward the elevator with a heavy tote on her lap. Jake walking by.",
    visuals=["P04 lobby"],
    lines=[
    ("JAKE", "Good afternoon! Would you like a hand with that bag, or are you all set?", ""),
    ("GUEST", "I've got it, thank you. I do this every day.", ""),
    ("JAKE", "Sounds good. Have a great afternoon. (presses and holds the elevator door button, steps back)", ""),
    ("KOLE", "Jake offered. The guest said no. Jake respected it, completely, without making it awkward, and still found a small, helpful thing to do by holding the elevator. He never grabbed the bag or touched the chair. That's what respect for a guest's preference looks like.", ""),
]), before_heading="Having fun with guests")

_insert("ch06", dict(heading="Report it and confirm it", setting="Guest corridor. Hannah notices a flickering hallway light and a loose handrail by the stairwell.",
    visuals=["Corridor set"],
    lines=[
    ("HANNAH", "(to camera, a little unsure) The light's flickering, and this rail is loose. That's not my department... but somebody could get hurt.", ""),
    ("DIR", "She pulls out the request tool / calls engineering.", ""),
    ("HANNAH", "Hi Jake, it's Hannah. Tenth floor, by the east stairwell, the handrail is loose and a light is flickering. I'm going to stay near it until someone's here.", ""),
    ("JAKE", "Got it, thanks Hannah. I'll be up in ten, and I'll put it in the work order system.", ""),
    ("KOLE", "Hannah didn't try to fix the rail herself. She reported the defect, made sure a real person owned it, and confirmed the next step. That's ownership. Report it, and make sure it landed.", ""),
]), before_heading="Rosa's tip")

_insert("ch07", dict(heading="Blooper reel: How NOT to do it", setting="Same cold-room setup, played for laughs. Record-scratch sound effects, red X graphics after each line.",
    visuals=["GFX red_x", "Front desk set"],
    lines=[
    ("DIR", "Alternate-universe Ana (\"Bad Ana\"), slouching, chewing gum.", ""),
    ("ANA", "(Bad Ana) Cold? Huh. It's probably fine. Did you try the thermostat?", ""),
    ("DIR", "Record scratch. Red X: MINIMIZING.", ""),
    ("ANA", "(Bad Ana) Yeah, the night shift never logs anything. Not my fault.", ""),
    ("DIR", "Red X: BLAMING.", ""),
    ("ANA", "(Bad Ana) Tell you what, I'll comp your whole stay and get you a suite. Engineering will have it fixed in ten minutes, guaranteed.", ""),
    ("DIR", "Red X: PROMISES WE CAN'T KEEP.", ""),
    ("ANA", "(Bad Ana) Or I could find you a space heater from the storage room...", ""),
    ("DIR", "Siren sound. Red X: SAFETY RISK. Real Ana walks into frame, shakes her head, laughs.", ""),
    ("ANA", "(Real Ana) Okay, okay. Let's do this the right way.", ""),
    ("KOLE", "We laugh, but every one of those has happened at some hotel somewhere. Minimizing, blaming, promising what you can't deliver, improvising unsafe fixes. Let's see the right way.", ""),
]), before_heading="Role play 1: The cold room")

RECAPS = {
    "ch01": ["Every job is a guest job", "Notice, listen, follow through, make it easy", "Basics first. Extras never replace basics"],
    "ch02": ["Call in to your supervisor, not a coworker", "Clean uniform, badge, approved footwear", "Disagree privately. Never in front of guests"],
    "ch03": ["Notice, face, greet", "Acknowledge the next guest", "Ask language preference. Never assume"],
    "ch04": ["\"Let me\" and \"I'll\" = ownership", "Only promise times you can meet", "Hold, transfer and radio etiquette"],
    "ch05": ["Cues are clues, not proof", "Notice, ask, offer, confirm", "Legends are legends. Respect the \"no\""],
    "ch06": ["Safety first", "Belongings are never trash", "Report it and confirm someone owns it"],
    "ch07": ["Listen, acknowledge, act, hand off, follow through", "Update on time, even without an answer", "Never promise without authority"],
}
for _c in CHAPTERS:
    if _c["key"] in RECAPS:
        _items = RECAPS[_c["key"]]
        _c["scenes"].append(dict(heading="Chapter recap", setting="Kole avatar + recap card (15 seconds on screen).",
            visuals=["GFX recap_" + _c["key"]],
            lines=[("KOLE", "Quick recap before we move on. " + ". ".join(i.rstrip('.') for i in _items) + ".", ""),
                   ("DIR", "Recap card holds 6 seconds. Transition stinger to next chapter.", "")]))
