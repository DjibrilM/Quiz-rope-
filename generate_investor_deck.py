"""
Generates the QuizRope investor/funder Excel presentation.
Run with: python3 generate_investor_deck.py
"""

from openpyxl import Workbook
from openpyxl.styles import (
    PatternFill, Font, Alignment, Border, Side, GradientFill
)
from openpyxl.utils import get_column_letter

wb = Workbook()

# ─── Colour palette ──────────────────────────────────────────────────────────
PURPLE       = "9B59B6"
DARK_PURPLE  = "6C3483"
LIGHT_PURPLE = "E8D0FF"
GOLD         = "F1C40F"
DARK_BG      = "1A1520"
WHITE        = "FFFFFF"
LIGHT_GRAY   = "F5F5F5"
MID_GRAY     = "CCCCCC"
GREEN        = "27AE60"
BLUE         = "2980B9"
ORANGE       = "E67E22"
RED          = "E74C3C"

def hex_fill(hex_color):
    return PatternFill("solid", fgColor=hex_color)

def header_font(size=12, bold=True, color=WHITE):
    return Font(name="Calibri", size=size, bold=bold, color=color)

def body_font(size=11, bold=False, color="1A1520"):
    return Font(name="Calibri", size=size, bold=bold, color=color)

def thin_border():
    s = Side(style="thin", color=MID_GRAY)
    return Border(left=s, right=s, top=s, bottom=s)

def thick_border():
    s = Side(style="medium", color=PURPLE)
    return Border(left=s, right=s, top=s, bottom=s)

def set_col_widths(ws, widths: dict):
    for col_letter, width in widths.items():
        ws.column_dimensions[col_letter].width = width

def title_row(ws, row, text, merge_to, bg=PURPLE, fg=WHITE, size=16):
    ws.merge_cells(f"A{row}:{merge_to}{row}")
    cell = ws[f"A{row}"]
    cell.value = text
    cell.fill = hex_fill(bg)
    cell.font = Font(name="Calibri", size=size, bold=True, color=fg)
    cell.alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[row].height = 36

def section_header(ws, row, col, text, bg=DARK_PURPLE, fg=WHITE, merge_end=None):
    if merge_end:
        ws.merge_cells(f"{col}{row}:{merge_end}{row}")
    cell = ws[f"{col}{row}"]
    cell.value = text
    cell.fill = hex_fill(bg)
    cell.font = Font(name="Calibri", size=12, bold=True, color=fg)
    cell.alignment = Alignment(horizontal="left", vertical="center", indent=1)
    ws.row_dimensions[row].height = 24

def data_cell(ws, row, col, value, bg=WHITE, bold=False, align="left", size=11, color="1A1520", wrap=False):
    cell = ws[f"{col}{row}"]
    cell.value = value
    cell.fill = hex_fill(bg)
    cell.font = Font(name="Calibri", size=size, bold=bold, color=color)
    cell.alignment = Alignment(horizontal=align, vertical="center", wrap_text=wrap, indent=1)
    cell.border = thin_border()
    return cell

def alt_row_bg(row):
    return LIGHT_GRAY if row % 2 == 0 else WHITE

# ═══════════════════════════════════════════════════════════════════════════════
# SHEET 1 — Executive Summary
# ═══════════════════════════════════════════════════════════════════════════════
ws1 = wb.active
ws1.title = "Executive Summary"
set_col_widths(ws1, {"A": 28, "B": 55, "C": 28, "D": 55})

title_row(ws1, 1, "QuizRope — Educational Game Platform", "D", bg=DARK_BG, fg=GOLD, size=20)
ws1.row_dimensions[1].height = 50

# Tagline
ws1.merge_cells("A2:D2")
c = ws1["A2"]
c.value = "Transforming Screen Time into Brain Time — Where Kids Learn Without Knowing It"
c.fill = hex_fill(PURPLE)
c.font = Font(name="Calibri", size=13, italic=True, color=WHITE)
c.alignment = Alignment(horizontal="center", vertical="center")
ws1.row_dimensions[2].height = 28

ws1.row_dimensions[3].height = 10

# Two-column key-facts layout
left_data = [
    ("MISSION", "Make academic learning so fun that children ask to play — not stop."),
    ("VISION", "Become the #1 family-first learning game platform used in homes and classrooms worldwide."),
    ("PRODUCT", "QuizRope is a mobile quiz game built around a tug-of-war mechanic: every correct answer pulls the rope toward your team. Players compete across Math, Science, English, History, and Geography."),
    ("TARGET USERS", "Children aged 3–18 and their parents / guardians. Designed for family co-play, classroom use, and independent practice."),
    ("GAME MODES", "• Solo practice  • Split-screen head-to-head  • Real-time online multiplayer"),
    ("AI INTEGRATION", "AI-powered question generation personalised to the child's grade, subject, and custom learning context (e.g. 'fractions with denominators up to 20')."),
    ("PLATFORM", "iOS & Android (React Native / Expo). Backend: Node.js + MongoDB + WebSocket. Authentication: Firebase."),
    ("LANGUAGES", "10 languages: English, Arabic, Spanish, French, Hindi, Bengali, Portuguese, Russian, Japanese, Chinese."),
]

right_data = [
    ("FOUNDED", "2024"),
    ("STAGE", "MVP — feature-complete, entering beta testing"),
    ("FUNDING ASK", "Seed round — contact team for details"),
    ("USE OF FUNDS", "• App store launch & QA testing\n• School partnership programme\n• Content expansion (new subjects)\n• Marketing & user acquisition"),
    ("KEY METRICS (PROJECTED)", "• 50,000 downloads in Year 1\n• 500 school partnerships in Year 2\n• 85 %+ monthly retention among families"),
    ("COMPETITIVE EDGE", "• Tug-of-war mechanic drives genuine rivalry & engagement\n• Parental dashboard with child-level analytics\n• AI question tailoring — no two sessions are the same"),
    ("SOCIAL IMPACT", "Bridges the engagement gap in K-12 learning; multilingual reach supports underserved communities globally."),
    ("CONTACT", "Available upon request"),
]

row = 4
for (lk, lv), (rk, rv) in zip(left_data, right_data):
    bg = alt_row_bg(row)
    # Left key
    kc = ws1[f"A{row}"]
    kc.value = lk
    kc.fill = hex_fill(LIGHT_PURPLE)
    kc.font = Font(name="Calibri", size=10, bold=True, color=DARK_PURPLE)
    kc.alignment = Alignment(horizontal="left", vertical="top", indent=1)
    kc.border = thin_border()
    # Left value
    vc = ws1[f"B{row}"]
    vc.value = lv
    vc.fill = hex_fill(bg)
    vc.font = body_font(size=10)
    vc.alignment = Alignment(horizontal="left", vertical="top", wrap_text=True, indent=1)
    vc.border = thin_border()
    # Right key
    kc2 = ws1[f"C{row}"]
    kc2.value = rk
    kc2.fill = hex_fill(LIGHT_PURPLE)
    kc2.font = Font(name="Calibri", size=10, bold=True, color=DARK_PURPLE)
    kc2.alignment = Alignment(horizontal="left", vertical="top", indent=1)
    kc2.border = thin_border()
    # Right value
    vc2 = ws1[f"D{row}"]
    vc2.value = rv
    vc2.fill = hex_fill(bg)
    vc2.font = body_font(size=10)
    vc2.alignment = Alignment(horizontal="left", vertical="top", wrap_text=True, indent=1)
    vc2.border = thin_border()
    ws1.row_dimensions[row].height = 70
    row += 1

# ═══════════════════════════════════════════════════════════════════════════════
# SHEET 2 — Product Deep Dive
# ═══════════════════════════════════════════════════════════════════════════════
ws2 = wb.create_sheet("Product Deep Dive")
set_col_widths(ws2, {"A": 30, "B": 22, "C": 22, "D": 22, "E": 32})

title_row(ws2, 1, "Product Deep Dive — Features & Game Mechanics", "E", bg=DARK_BG, fg=GOLD, size=16)

# Core mechanic
section_header(ws2, 3, "A", "CORE GAME MECHANIC", merge_end="E")
desc = ("QuizRope uses a real-time animated tug-of-war rope as the central scoring visual. "
        "Two teams (Red vs Blue) answer quiz questions; each correct answer pulls the rope toward "
        "their side. The team that pulls the rope past the win threshold — or leads when rounds end — wins. "
        "This mechanic creates instant, visceral feedback that makes every question feel high-stakes and exciting.")
ws2.merge_cells("A4:E4")
c = ws2["A4"]
c.value = desc
c.fill = hex_fill(LIGHT_GRAY)
c.font = body_font(size=10)
c.alignment = Alignment(wrap_text=True, vertical="top", indent=1)
ws2.row_dimensions[4].height = 60

# Features table
section_header(ws2, 6, "A", "KEY FEATURES", merge_end="E")
feature_headers = ["Feature", "Who Benefits", "Status", "Educational Value", "Notes"]
for ci, h in enumerate(feature_headers, 1):
    c = ws2.cell(row=7, column=ci)
    c.value = h
    c.fill = hex_fill(PURPLE)
    c.font = header_font(size=10)
    c.alignment = Alignment(horizontal="center", vertical="center")
    c.border = thin_border()
ws2.row_dimensions[7].height = 22

features = [
    ("Tug-of-War Quiz Engine",     "Children, Parents",    "Live",     "Competitive motivation; instant correct-answer feedback",    "Rope position tracked per round"),
    ("Solo Practice Mode",         "Children",             "Live",     "Self-paced deep practice; custom context topics via AI",     "AI question generation integrated"),
    ("Split-Screen Head-to-Head",  "2 children / 1 device","Live",     "Peer learning; healthy competition on shared tablet",        "No internet required"),
    ("Real-time Online Multiplayer","Families, classes",    "Live",     "Remote learning; social connection across distance",         "WebSocket low-latency sync"),
    ("AI Custom Context",          "Children, Teachers",   "Live",     "Hyper-personalised curriculum alignment",                    "e.g. 'square roots up to 100'"),
    ("Parental Dashboard",         "Parents",              "Live",     "Progress visibility; responsible screen time",               "Per-child stats & history"),
    ("Child Profile Management",   "Parents",              "Live",     "Age/grade-aware difficulty selection",                       "Age range: 3–18"),
    ("Match History & Analytics",  "Parents, Children",    "Live",     "Longitudinal learning progress tracking",                    "Accuracy, avg. response time"),
    ("Streak Badges",              "Children",             "Live",     "Positive reinforcement; habit formation",                    "Animated reward UI"),
    ("Leaderboard",                "All Users",            "Live",     "Motivational benchmarking",                                  "Family & global rankings"),
    ("QR / Link Code Child Linking","Parents, Children",   "Live",     "Safe account linkage without child email required",          "Time-limited secure codes"),
    ("Guest Mode",                 "New Users",            "Live",     "Low-friction onboarding; try before you commit",             "Progress transferable to account"),
    ("10-Language Support",        "Global Families",      "Live",     "Inclusive learning regardless of home language",             "RTL Arabic supported"),
    ("Sound & Haptic Feedback",    "Children",             "Live",     "Multisensory engagement improves memory encoding",           "Toggleable in settings"),
    ("Answer Correction Review",   "Children, Parents",    "Live",     "Metacognitive learning from mistakes",                       "Post-match review screen"),
    ("Difficulty Selector",        "Parents, Children",    "Live",     "Scaffolded learning progression",                            "Easy / Medium / Hard"),
    ("5 Core Subjects",            "All Users",            "Live",     "Curriculum-aligned breadth",                                 "Math, Science, English, History, Geography"),
    ("Push Notifications",         "Parents",              "Planned",  "Engagement reminders, achievement alerts",                   "Q3 2025 roadmap"),
    ("Teacher / Classroom Mode",   "Teachers",             "Planned",  "Class roster management; assignment setting",                "Q4 2025 roadmap"),
    ("Adaptive Difficulty AI",     "Children",             "Planned",  "Dynamic adjustment to child's performance curve",           "Q1 2026 roadmap"),
]

for ri, feat in enumerate(features, 8):
    bg = alt_row_bg(ri)
    for ci, val in enumerate(feat, 1):
        c = ws2.cell(row=ri, column=ci)
        c.value = val
        # Status colour coding
        if ci == 3:
            if val == "Live":
                c.fill = hex_fill("D5F5E3")
                c.font = Font(name="Calibri", size=10, bold=True, color="1E8449")
            else:
                c.fill = hex_fill("FEF9E7")
                c.font = Font(name="Calibri", size=10, bold=True, color="B7950B")
        else:
            c.fill = hex_fill(bg)
            c.font = body_font(size=10)
        c.alignment = Alignment(horizontal="left", vertical="center", wrap_text=True, indent=1)
        c.border = thin_border()
    ws2.row_dimensions[ri].height = 30

# ═══════════════════════════════════════════════════════════════════════════════
# SHEET 3 — Market Opportunity
# ═══════════════════════════════════════════════════════════════════════════════
ws3 = wb.create_sheet("Market Opportunity")
set_col_widths(ws3, {"A": 32, "B": 18, "C": 18, "D": 18, "E": 30})

title_row(ws3, 1, "Market Opportunity — EdTech & Educational Gaming", "E", bg=DARK_BG, fg=GOLD, size=16)

section_header(ws3, 3, "A", "GLOBAL EDTECH MARKET", merge_end="E")
mkt_headers = ["Metric", "2023 Value", "2025 (Est.)", "2030 (Projected)", "Source / Note"]
for ci, h in enumerate(mkt_headers, 1):
    c = ws3.cell(row=4, column=ci)
    c.value = h
    c.fill = hex_fill(PURPLE)
    c.font = header_font(size=10)
    c.alignment = Alignment(horizontal="center", vertical="center")
    c.border = thin_border()
ws3.row_dimensions[4].height = 22

market_data = [
    ("Global EdTech Market Size",         "$142 B",  "$180 B",  "$348 B",  "HolonIQ / Grand View Research"),
    ("Educational Gaming Market",          "$9.5 B",  "$13 B",  "$32 B",   "Allied Market Research 2023"),
    ("K-12 Digital Learning Market",       "$38 B",   "$52 B",  "$110 B",  "MarketsandMarkets 2023"),
    ("Mobile Learning (mLearning) Market", "$37 B",   "$53 B",  "$166 B",  "Global Market Insights"),
    ("CAGR — Ed. Gaming",                  "—",       "—",       "~17 %",   "Compound annual growth"),
    ("Smartphone-owning families (global)","~2.1 Bn", "—",       "—",       "GSMA Intelligence"),
    ("Children aged 5–17 globally",        "~1.8 Bn", "—",       "—",       "UNESCO / World Bank"),
]

for ri, row_data in enumerate(market_data, 5):
    bg = alt_row_bg(ri)
    for ci, val in enumerate(row_data, 1):
        c = ws3.cell(row=ri, column=ci)
        c.value = val
        c.fill = hex_fill(bg)
        c.font = body_font(size=10, bold=(ci == 1))
        c.alignment = Alignment(horizontal="center" if ci > 1 else "left", vertical="center", indent=1)
        c.border = thin_border()
    ws3.row_dimensions[ri].height = 22

# Target segments
section_header(ws3, 13, "A", "TARGET AUDIENCE SEGMENTS", merge_end="E")
seg_headers = ["Segment", "Size", "Pain Point", "Our Solution", "Revenue Potential"]
for ci, h in enumerate(seg_headers, 1):
    c = ws3.cell(row=14, column=ci)
    c.value = h
    c.fill = hex_fill(DARK_PURPLE)
    c.font = header_font(size=10)
    c.alignment = Alignment(horizontal="center", vertical="center")
    c.border = thin_border()
ws3.row_dimensions[14].height = 22

segments = [
    ("Parents of children 4–12",   "~400 M globally", "Screen time is passive & unproductive",       "Turns device time into active learning",      "Premium subscription / one-time purchase"),
    ("Parents of children 13–18",  "~300 M globally", "Teen disengagement from academic content",    "Competitive multiplayer keeps teens hooked",  "Family plan subscription"),
    ("Primary school teachers",    "~30 M globally",  "Limited budget for engaging curriculum tools","Free/freemium classroom tier",                "Institutional licensing"),
    ("Homeschooling families",      "~12 M (US alone)","Need structured curriculum games",            "5 subjects, AI custom context, grade levels", "Premium plan"),
    ("International families",     "~500 M",          "Lack of quality multilingual edtech",         "10 languages incl. Arabic, Hindi, Bengali",   "Premium + regional partnerships"),
    ("After-school programmes",    "~50 M children",  "Need affordable engagement activities",       "Group match mode, easy device sharing",       "Institutional + per-seat licences"),
]

for ri, seg in enumerate(segments, 15):
    bg = alt_row_bg(ri)
    for ci, val in enumerate(seg, 1):
        c = ws3.cell(row=ri, column=ci)
        c.value = val
        c.fill = hex_fill(bg)
        c.font = body_font(size=10, bold=(ci == 1))
        c.alignment = Alignment(horizontal="left", vertical="center", wrap_text=True, indent=1)
        c.border = thin_border()
    ws3.row_dimensions[ri].height = 40

# Why now
section_header(ws3, 22, "A", "WHY NOW?", merge_end="E")
why_now = [
    "Post-pandemic digital learning habits are permanent — families actively seek quality educational apps.",
    "AI commoditisation makes personalised question generation affordable at scale for the first time.",
    "App stores have exploded in children's education — yet no dominant 'family tug-of-war quiz' brand exists.",
    "Parents in emerging markets (MENA, South Asia, LatAm) are smartphone-first and underserved by English-only edtech.",
    "School districts worldwide are mandating gamification strategies — QuizRope aligns directly with this mandate.",
]
for ri, point in enumerate(why_now, 23):
    ws3.merge_cells(f"A{ri}:E{ri}")
    c = ws3[f"A{ri}"]
    c.value = f"✔  {point}"
    c.fill = hex_fill(alt_row_bg(ri))
    c.font = body_font(size=10)
    c.alignment = Alignment(horizontal="left", vertical="center", wrap_text=True, indent=1)
    c.border = thin_border()
    ws3.row_dimensions[ri].height = 35

# ═══════════════════════════════════════════════════════════════════════════════
# SHEET 4 — Educational Impact
# ═══════════════════════════════════════════════════════════════════════════════
ws4 = wb.create_sheet("Educational Impact")
set_col_widths(ws4, {"A": 30, "B": 35, "C": 35, "D": 20})

title_row(ws4, 1, "Educational Impact — The Science Behind QuizRope", "D", bg=DARK_BG, fg=GOLD, size=16)

section_header(ws4, 3, "A", "PEDAGOGICAL FOUNDATIONS", merge_end="D")
ped_headers = ["Principle", "Academic Basis", "How QuizRope Implements It", "Evidence Strength"]
for ci, h in enumerate(ped_headers, 1):
    c = ws4.cell(row=4, column=ci)
    c.value = h
    c.fill = hex_fill(PURPLE)
    c.font = header_font(size=10)
    c.alignment = Alignment(horizontal="center", vertical="center")
    c.border = thin_border()
ws4.row_dimensions[4].height = 22

pedagogy = [
    ("Retrieval Practice",           "Roediger & Karpicke (2006): testing effect — recalling info strengthens memory more than re-reading", "Every round forces active recall of subject matter through timed questions", "High — meta-analyses confirm +20-40% retention gains"),
    ("Spaced Repetition",            "Ebbinghaus forgetting curve; Cepeda et al. (2006)",                                                    "Match history enables parents/teachers to identify weak areas for repeat sessions", "High — foundational to all modern learning apps"),
    ("Competitive Motivation",       "Deci & Ryan Self-Determination Theory; Malone & Lepper (1987) on intrinsic motivation",                "Tug-of-war rope provides immediate, visual competitive feedback every question", "High — competition shown to increase engagement up to 3×"),
    ("Immediate Feedback",           "Hattie & Timperley (2007): feedback is the #1 lever for learning gains",                              "Correct/incorrect shown instantly after each answer; post-match correction review available", "Very High — effect size d=0.79 in Hattie's meta-analysis"),
    ("Scaffolded Difficulty",        "Vygotsky's Zone of Proximal Development",                                                              "Easy / Medium / Hard selectors; AI adjusts question complexity to grade level", "High — adaptive systems show 30%+ learning acceleration"),
    ("Multisensory Engagement",      "Dual-coding theory (Paivio 1986); embodied cognition",                                                 "Sound effects, haptic feedback, and animated rope create multisensory experience", "Moderate–High — multimodal learning improves recall"),
    ("Social Learning",              "Vygotsky social constructivism; Bandura (1977)",                                                       "Head-to-head play, leaderboards, and multiplayer foster peer-to-peer learning", "Moderate — peer play shown to improve motivation & performance"),
    ("Positive Reinforcement",       "Skinner operant conditioning; behavioural game design",                                                "Streak badges, score pops, win animations create dopamine-driven reward loops", "High — well-established in gamification literature"),
    ("Metacognition",                "Flavell (1979); Hacker et al. review",                                                                 "Answer correction review screen teaches children to analyse and learn from mistakes", "High — metacognitive strategies among top learning interventions"),
    ("Personalised Learning",        "Bloom's 2-sigma problem (1984)",                                                                       "AI custom context lets parents/teachers specify exact curriculum topics per session", "Very High — personalised tutoring yields 2-sigma improvement"),
]

for ri, row_data in enumerate(pedagogy, 5):
    bg = alt_row_bg(ri)
    for ci, val in enumerate(row_data, 1):
        c = ws4.cell(row=ri, column=ci)
        c.value = val
        if ci == 4:
            if "Very High" in val:
                c.fill = hex_fill("D5F5E3")
                c.font = Font(name="Calibri", size=10, bold=True, color="1E8449")
            elif "High" in val:
                c.fill = hex_fill("EBF5FB")
                c.font = Font(name="Calibri", size=10, color="1A5276")
            else:
                c.fill = hex_fill("FEF9E7")
                c.font = Font(name="Calibri", size=10, color="7D6608")
        else:
            c.fill = hex_fill(bg)
            c.font = body_font(size=10, bold=(ci == 1))
        c.alignment = Alignment(horizontal="left", vertical="top", wrap_text=True, indent=1)
        c.border = thin_border()
    ws4.row_dimensions[ri].height = 55

# Child safeguarding
section_header(ws4, 16, "A", "CHILD SAFETY & RESPONSIBLE DESIGN", merge_end="D")
safety_items = [
    ("No direct child social features",    "Children cannot message strangers. All multiplayer is family/known-group only."),
    ("Parent-gated child accounts",        "Children join only via parent-generated QR / link codes — no independent sign-up."),
    ("No third-party ads to children",     "Zero ad SDK targeting children; monetisation via parent-facing subscription only."),
    ("COPPA / GDPR-Kids aligned design",   "Minimal data collection from child profiles; no behavioural advertising."),
    ("Screen time transparency",           "Parents see all session data; designed for structured play sessions, not infinite scrolling."),
    ("Age-appropriate content",            "All questions vetted for curriculum alignment and age-appropriateness (ages 3–18)."),
]
for ri, (title, desc) in enumerate(safety_items, 17):
    bg = alt_row_bg(ri)
    ws4.merge_cells(f"A{ri}:A{ri}")
    tc = ws4[f"A{ri}"]
    tc.value = title
    tc.fill = hex_fill(LIGHT_PURPLE)
    tc.font = Font(name="Calibri", size=10, bold=True, color=DARK_PURPLE)
    tc.alignment = Alignment(horizontal="left", vertical="center", indent=1)
    tc.border = thin_border()
    ws4.merge_cells(f"B{ri}:D{ri}")
    dc = ws4[f"B{ri}"]
    dc.value = desc
    dc.fill = hex_fill(bg)
    dc.font = body_font(size=10)
    dc.alignment = Alignment(horizontal="left", vertical="center", wrap_text=True, indent=1)
    dc.border = thin_border()
    ws4.row_dimensions[ri].height = 28

# ═══════════════════════════════════════════════════════════════════════════════
# SHEET 5 — Technology & Architecture
# ═══════════════════════════════════════════════════════════════════════════════
ws5 = wb.create_sheet("Technology")
set_col_widths(ws5, {"A": 26, "B": 30, "C": 26, "D": 30})

title_row(ws5, 1, "Technology & Architecture", "D", bg=DARK_BG, fg=GOLD, size=16)

section_header(ws5, 3, "A", "TECHNOLOGY STACK", merge_end="D")
tech_headers = ["Layer", "Technology", "Why Chosen", "Scalability"]
for ci, h in enumerate(tech_headers, 1):
    c = ws5.cell(row=4, column=ci)
    c.value = h
    c.fill = hex_fill(PURPLE)
    c.font = header_font(size=10)
    c.alignment = Alignment(horizontal="center", vertical="center")
    c.border = thin_border()
ws5.row_dimensions[4].height = 22

tech_stack = [
    ("Mobile Frontend",   "React Native + Expo (TypeScript)", "Cross-platform iOS & Android from one codebase; Expo managed workflow accelerates delivery", "Scales to millions of devices; OTA updates without app store review"),
    ("UI / Animations",   "React Native Reanimated + SVG",    "60 fps rope animation; fluid transitions critical for game feel",                           "GPU-accelerated; no performance ceiling for game animations"),
    ("State Management",  "Zustand",                           "Lightweight, boilerplate-free global state; perfect for real-time game state",             "Minimal overhead; easy to extend for classroom roster state"),
    ("Backend API",       "Node.js + NestJS (TypeScript)",     "Typed, modular, battle-tested for real-time apps",                                          "Horizontal scaling; microservices-ready architecture"),
    ("Real-time Layer",   "WebSocket (Socket.IO)",             "Sub-100 ms latency for live multiplayer — essential for competitive feel",                  "Supports 10,000+ concurrent rooms on commodity hardware"),
    ("Database",          "MongoDB + Mongoose",                "Flexible schema ideal for evolving question formats and user profiles",                     "Atlas horizontal sharding; proven at 100 M+ document scale"),
    ("Authentication",    "Firebase Auth",                     "Google-grade security; supports email, social login, anonymous (guest) accounts",           "Handles millions of auth ops/day; SOC2 compliant"),
    ("AI / Question Gen", "Google Gemini API",                 "State-of-the-art question generation; cost-effective at scale vs OpenAI",                   "API scales linearly; can batch-generate question banks offline"),
    ("Internationalisation","react-i18next",                   "Industry standard; supports 10 locales incl. RTL Arabic",                                   "Add new languages without code changes"),
    ("Analytics",         "Custom + Firebase Analytics",       "Track learning outcomes, session length, subject performance per child",                    "Exportable for school/district reporting dashboards"),
]

for ri, row_data in enumerate(tech_stack, 5):
    bg = alt_row_bg(ri)
    for ci, val in enumerate(row_data, 1):
        c = ws5.cell(row=ri, column=ci)
        c.value = val
        c.fill = hex_fill(bg)
        c.font = body_font(size=10, bold=(ci == 1))
        c.alignment = Alignment(horizontal="left", vertical="top", wrap_text=True, indent=1)
        c.border = thin_border()
    ws5.row_dimensions[ri].height = 45

section_header(ws5, 16, "A", "TECHNICAL DIFFERENTIATORS", merge_end="D")
diff_items = [
    "Real-time WebSocket architecture enables sub-100 ms multiplayer sync — matching the experience of native game engines.",
    "AI question personalisation is not a marketing feature — it is deeply integrated: parents type a curriculum context (e.g. 'prime numbers below 100') and the AI generates fresh, accurate questions for that session.",
    "Guest-to-account migration: children can play as guests and seamlessly link their progress to a parent account via time-limited secure codes — reducing sign-up friction while protecting child data.",
    "Offline-first design for split-screen mode: no internet required for two children on one device, removing the digital-divide barrier for families with limited connectivity.",
    "TypeScript end-to-end (frontend + backend + shared types) eliminates an entire class of runtime bugs and accelerates feature development.",
]
for ri, point in enumerate(diff_items, 17):
    ws5.merge_cells(f"A{ri}:D{ri}")
    c = ws5[f"A{ri}"]
    c.value = f"▶  {point}"
    c.fill = hex_fill(alt_row_bg(ri))
    c.font = body_font(size=10)
    c.alignment = Alignment(horizontal="left", vertical="center", wrap_text=True, indent=1)
    c.border = thin_border()
    ws5.row_dimensions[ri].height = 40

# ═══════════════════════════════════════════════════════════════════════════════
# SHEET 6 — Roadmap & Milestones
# ═══════════════════════════════════════════════════════════════════════════════
ws6 = wb.create_sheet("Roadmap & Milestones")
set_col_widths(ws6, {"A": 18, "B": 28, "C": 35, "D": 22, "E": 22})

title_row(ws6, 1, "Product Roadmap & Key Milestones", "E", bg=DARK_BG, fg=GOLD, size=16)

section_header(ws6, 3, "A", "MILESTONE TIMELINE", merge_end="E")
rd_headers = ["Phase", "Timeline", "Deliverables", "KPI / Success Metric", "Status"]
for ci, h in enumerate(rd_headers, 1):
    c = ws6.cell(row=4, column=ci)
    c.value = h
    c.fill = hex_fill(PURPLE)
    c.font = header_font(size=10)
    c.alignment = Alignment(horizontal="center", vertical="center")
    c.border = thin_border()
ws6.row_dimensions[4].height = 22

phase_colors = {
    "COMPLETE":    ("D5F5E3", "1E8449"),
    "IN PROGRESS": ("EBF5FB", "1A5276"),
    "PLANNED":     ("FEF9E7", "7D6608"),
    "FUTURE":      ("F4ECF7", "6C3483"),
}

roadmap = [
    ("MVP Build",         "2024 Q2–Q4",   "Core tug-of-war engine, solo + split-screen modes, parent/child accounts, 5 subjects, Firebase auth, REST API, WebSocket multiplayer", "Feature-complete MVP shipped",                  "COMPLETE"),
    ("AI Integration",    "2025 Q1",      "Google Gemini AI question generation; custom context input; answer correction review screen",                                           "AI questions rated ≥4/5 accuracy by beta testers", "COMPLETE"),
    ("Multilingual",      "2025 Q1–Q2",   "10-language localisation (EN/AR/ES/FR/HI/BN/PT/RU/JA/ZH); RTL Arabic layout support",                                                 "All 10 locales pass QA; RTL renders correctly",     "COMPLETE"),
    ("Beta Programme",    "2025 Q2–Q3",   "50 family beta users; usability testing; performance profiling; App Store / Play Store submission",                                    "4.0+ star beta rating; <1% crash rate",             "IN PROGRESS"),
    ("Public Launch",     "2025 Q3",      "App Store & Google Play release; marketing campaign; press outreach; influencer partnerships (parent & teacher communities)",           "5,000 downloads in first 30 days",                  "PLANNED"),
    ("School Tier",       "2025 Q4",      "Teacher / classroom management panel; class roster; assignment setting; school-branded login",                                          "20 pilot school partnerships signed",               "PLANNED"),
    ("Adaptive AI",       "2026 Q1",      "Dynamic difficulty adjustment based on child's rolling accuracy; AI identifies knowledge gaps and recommends subjects",                 "10% improvement in correct-answer rate over 4 weeks","FUTURE"),
    ("Content Expansion", "2026 Q1–Q2",   "Add Coding / Computational Thinking, Art & Music, Social Studies subjects; partner with curriculum providers for question banks",      "3 new subjects live; 500 K question bank",          "FUTURE"),
    ("Platform Expansion","2026 Q2",      "Web app version for school computer labs; TV/Chromecast family game night mode",                                                        "20% of users engage via web within 6 months",       "FUTURE"),
    ("Global Partnerships","2026 Q3–Q4",  "EdTech NGO partnerships in Sub-Saharan Africa, South Asia; UNESCO digital learning initiative application; government curriculum deals", "2 MOU-level institutional partnerships signed",     "FUTURE"),
]

for ri, row_data in enumerate(roadmap, 5):
    status = row_data[4]
    bg_color, txt_color = phase_colors.get(status, (WHITE, "1A1520"))
    for ci, val in enumerate(row_data, 1):
        c = ws6.cell(row=ri, column=ci)
        c.value = val
        if ci == 5:
            c.fill = hex_fill(bg_color)
            c.font = Font(name="Calibri", size=10, bold=True, color=txt_color)
            c.alignment = Alignment(horizontal="center", vertical="center")
        else:
            c.fill = hex_fill(alt_row_bg(ri))
            c.font = body_font(size=10, bold=(ci == 1))
            c.alignment = Alignment(horizontal="left", vertical="top", wrap_text=True, indent=1)
        c.border = thin_border()
    ws6.row_dimensions[ri].height = 45

# Key metrics projection
section_header(ws6, 16, "A", "PROJECTED GROWTH METRICS", merge_end="E")
metrics_headers = ["Metric", "Launch (Month 1)", "Year 1", "Year 2", "Year 3"]
for ci, h in enumerate(metrics_headers, 1):
    c = ws6.cell(row=17, column=ci)
    c.value = h
    c.fill = hex_fill(DARK_PURPLE)
    c.font = header_font(size=10)
    c.alignment = Alignment(horizontal="center", vertical="center")
    c.border = thin_border()
ws6.row_dimensions[17].height = 22

proj_data = [
    ("Total Downloads",           "5,000",     "50,000",     "250,000",    "1,000,000"),
    ("Monthly Active Users",      "2,000",     "20,000",     "100,000",    "400,000"),
    ("Paying Subscribers",        "200",       "3,000",      "20,000",     "80,000"),
    ("School Partnerships",       "—",         "20",         "500",        "2,000"),
    ("Questions Answered / Day",  "10,000",    "200,000",    "2,000,000",  "10,000,000"),
    ("Languages Active",          "10",        "10",         "15",         "20"),
    ("Subjects Available",        "5",         "5",          "8",          "12"),
    ("Monthly Revenue (Est.)",    "$400",      "$6,000",     "$50,000",    "$200,000"),
]

for ri, row_data in enumerate(proj_data, 18):
    for ci, val in enumerate(row_data, 1):
        c = ws6.cell(row=ri, column=ci)
        c.value = val
        bg = alt_row_bg(ri)
        c.fill = hex_fill(bg)
        c.font = body_font(size=10, bold=(ci == 1))
        c.alignment = Alignment(horizontal="center" if ci > 1 else "left", vertical="center", indent=1)
        c.border = thin_border()
    ws6.row_dimensions[ri].height = 22

# ═══════════════════════════════════════════════════════════════════════════════
# SHEET 7 — Why Fund Us
# ═══════════════════════════════════════════════════════════════════════════════
ws7 = wb.create_sheet("Why Fund Us")
set_col_widths(ws7, {"A": 30, "B": 65})

title_row(ws7, 1, "Why Fund QuizRope?", "B", bg=DARK_BG, fg=GOLD, size=18)

ws7.merge_cells("A2:B2")
c = ws7["A2"]
c.value = "A clear investment thesis — built on evidence, purpose, and momentum."
c.fill = hex_fill(PURPLE)
c.font = Font(name="Calibri", size=12, italic=True, color=WHITE)
c.alignment = Alignment(horizontal="center", vertical="center")
ws7.row_dimensions[2].height = 28

ws7.row_dimensions[3].height = 10

reasons = [
    ("1. Proven Market Demand",
     "The global educational gaming market is growing at ~17% CAGR and projected to reach $32B by 2030. Parents and schools are actively seeking engaging, curriculum-aligned digital tools — QuizRope sits precisely at this intersection."),

    ("2. Revolutionary Game Mechanic",
     "No other educational app uses a real-time tug-of-war rope as a learning engine. This single mechanic transforms passive quiz-taking into a visceral, competitive, team-based experience that children will request, not resist. First-mover advantage in this mechanic is significant."),

    ("3. Evidence-Based Pedagogy",
     "Every feature is grounded in peer-reviewed educational research: retrieval practice, immediate feedback, scaffolded difficulty, positive reinforcement, and metacognitive review. QuizRope is not edutainment — it is education with entertainment as the delivery vehicle."),

    ("4. Child Safety First",
     "Parent-gated child accounts, zero third-party ads to children, and COPPA/GDPR-Kids aligned data practices mean that schools and family-focused NGOs can trust and recommend the platform. In a world of child data scandals, this is a genuine competitive moat."),

    ("5. AI-Powered Personalisation at Scale",
     "The integration of Google Gemini AI for hyper-personalised question generation means QuizRope can serve a child practising 'fractions with denominators up to 20' and another practising 'world capitals in Asia' — on the same platform, simultaneously, without any human content-creator bottleneck."),

    ("6. Global Reach from Day One",
     "10 languages including Arabic, Hindi, Bengali, and Portuguese means QuizRope is not a Western-market-first product with late localisation. It was built multilingual, giving it immediate TAM in South Asia, MENA, and Latin America — regions where EdTech investment is surging."),

    ("7. Feature-Complete MVP — Low Execution Risk",
     "This is not a pitch deck without a product. QuizRope has a live, feature-complete mobile application: real-time multiplayer, parental dashboard, AI question generation, 10 languages, 5 subjects, match analytics, leaderboard, and guest mode. Funding accelerates growth, not development of basic features."),

    ("8. Parent + Child Dual Flywheel",
     "Parents are the paying customers. Children are the retention engine. When a child loves the game, parents renew and upsell to premium plans, recommend to other parents, and request school adoption. This organic dual-sided flywheel produces low CAC and high LTV."),

    ("9. School Expansion Path",
     "The roadmap includes a classroom mode that transforms QuizRope into a school tool — unlocking B2B institutional licensing at 10-100× the consumer price point. Early school partnerships create curriculum alignment and teacher advocacy that no marketing budget can buy."),

    ("10. Social Impact Multiplier",
     "By making quality, personalised learning accessible on any smartphone — in 10 languages — QuizRope can reach children in under-resourced communities who have no access to tutors or premium learning centres. Funding this project funds educational equity at scale."),
]

for ri, (title, body) in enumerate(reasons, 4):
    ws7[f"A{ri}"].value = title
    ws7[f"A{ri}"].fill = hex_fill(LIGHT_PURPLE)
    ws7[f"A{ri}"].font = Font(name="Calibri", size=11, bold=True, color=DARK_PURPLE)
    ws7[f"A{ri}"].alignment = Alignment(horizontal="left", vertical="top", wrap_text=True, indent=1)
    ws7[f"A{ri}"].border = thin_border()
    ws7[f"B{ri}"].value = body
    ws7[f"B{ri}"].fill = hex_fill(alt_row_bg(ri))
    ws7[f"B{ri}"].font = body_font(size=11)
    ws7[f"B{ri}"].alignment = Alignment(horizontal="left", vertical="top", wrap_text=True, indent=1)
    ws7[f"B{ri}"].border = thin_border()
    ws7.row_dimensions[ri].height = 65

# Closing call to action
closing_row = 4 + len(reasons) + 1
ws7.merge_cells(f"A{closing_row}:B{closing_row}")
c = ws7[f"A{closing_row}"]
c.value = "QuizRope is not just a game. It is a movement to make every child's screen time count."
c.fill = hex_fill(DARK_BG)
c.font = Font(name="Calibri", size=14, bold=True, italic=True, color=GOLD)
c.alignment = Alignment(horizontal="center", vertical="center")
ws7.row_dimensions[closing_row].height = 40

# ═══════════════════════════════════════════════════════════════════════════════
# Save
# ═══════════════════════════════════════════════════════════════════════════════
output_path = "/Users/jibm/Desktop/projects/tug-of-war-for-your-brain/QuizRope_Investor_Deck.xlsx"
wb.save(output_path)
print(f"Saved: {output_path}")
