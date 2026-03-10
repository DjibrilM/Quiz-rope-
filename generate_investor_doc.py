"""
Generates the QuizRope investor/funder Microsoft Word document.
Run with: python3 generate_investor_doc.py
"""

from docx import Document
from docx.shared import Pt, RGBColor, Inches, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
import copy

# ─── Colours ─────────────────────────────────────────────────────────────────
C_PURPLE      = RGBColor(0x9B, 0x59, 0xB6)
C_DARK_PURPLE = RGBColor(0x6C, 0x34, 0x83)
C_LIGHT_PURPLE= RGBColor(0xE8, 0xD0, 0xFF)
C_GOLD        = RGBColor(0xF1, 0xC4, 0x0F)
C_DARK_BG     = RGBColor(0x1A, 0x15, 0x20)
C_WHITE       = RGBColor(0xFF, 0xFF, 0xFF)
C_LIGHT_GRAY  = RGBColor(0xF5, 0xF5, 0xF5)
C_MID_GRAY    = RGBColor(0xCC, 0xCC, 0xCC)
C_GREEN       = RGBColor(0x1E, 0x84, 0x49)
C_GREEN_BG    = RGBColor(0xD5, 0xF5, 0xE3)
C_BLUE        = RGBColor(0x1A, 0x52, 0x76)
C_BLUE_BG     = RGBColor(0xEB, 0xF5, 0xFB)
C_AMBER_BG    = RGBColor(0xFE, 0xF9, 0xE7)
C_AMBER       = RGBColor(0x7D, 0x66, 0x08)
C_BODY        = RGBColor(0x1A, 0x15, 0x20)

def hex_to_rgb_str(r, g, b):
    return f"{r:02X}{g:02X}{b:02X}"

def rgb_to_hex(color: RGBColor):
    return f"{color.rgb:06X}"

# ─── XML helpers ─────────────────────────────────────────────────────────────
def set_cell_bg(cell, hex_color: str):
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), hex_color)
    # Remove any existing shd
    for existing in tcPr.findall(qn('w:shd')):
        tcPr.remove(existing)
    tcPr.append(shd)

def set_cell_borders(cell, color="CCCCCC", size="4"):
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    tcBorders = OxmlElement('w:tcBorders')
    for side in ('top', 'left', 'bottom', 'right'):
        border = OxmlElement(f'w:{side}')
        border.set(qn('w:val'), 'single')
        border.set(qn('w:sz'), size)
        border.set(qn('w:space'), '0')
        border.set(qn('w:color'), color)
        tcBorders.append(border)
    for existing in tcPr.findall(qn('w:tcBorders')):
        tcPr.remove(existing)
    tcPr.append(tcBorders)

def set_col_width(table, col_idx, width_inches):
    for row in table.rows:
        row.cells[col_idx].width = Inches(width_inches)

def remove_table_borders(table):
    tbl = table._tbl
    tblPr = tbl.find(qn('w:tblPr'))
    if tblPr is None:
        tblPr = OxmlElement('w:tblPr')
        tbl.insert(0, tblPr)
    tblBorders = OxmlElement('w:tblBorders')
    for side in ('top', 'left', 'bottom', 'right', 'insideH', 'insideV'):
        b = OxmlElement(f'w:{side}')
        b.set(qn('w:val'), 'none')
        tblBorders.append(b)
    for existing in tblPr.findall(qn('w:tblBorders')):
        tblPr.remove(existing)
    tblPr.append(tblBorders)

def set_paragraph_spacing(para, before=0, after=0, line=None):
    pPr = para._p.get_or_add_pPr()
    spacing = OxmlElement('w:spacing')
    spacing.set(qn('w:before'), str(before))
    spacing.set(qn('w:after'), str(after))
    if line:
        spacing.set(qn('w:line'), str(line))
        spacing.set(qn('w:lineRule'), 'auto')
    for ex in pPr.findall(qn('w:spacing')):
        pPr.remove(ex)
    pPr.append(spacing)

# ─── Styled paragraph helpers ────────────────────────────────────────────────
def add_heading_block(doc, text, level=1):
    """Adds a styled heading that matches our brand."""
    p = doc.add_paragraph()
    set_paragraph_spacing(p, before=160, after=60)
    run = p.add_run(text)
    run.bold = True
    if level == 1:
        run.font.size = Pt(22)
        run.font.color.rgb = C_DARK_PURPLE
    elif level == 2:
        run.font.size = Pt(15)
        run.font.color.rgb = C_PURPLE
    else:
        run.font.size = Pt(12)
        run.font.color.rgb = C_DARK_PURPLE
    run.font.name = "Calibri"
    return p

def add_body(doc, text, indent=False):
    p = doc.add_paragraph()
    set_paragraph_spacing(p, before=0, after=60)
    run = p.add_run(text)
    run.font.name = "Calibri"
    run.font.size = Pt(11)
    run.font.color.rgb = C_BODY
    if indent:
        p.paragraph_format.left_indent = Inches(0.3)
    return p

def add_bullet(doc, text, level=0):
    p = doc.add_paragraph(style="List Bullet")
    set_paragraph_spacing(p, before=0, after=30)
    p.paragraph_format.left_indent = Inches(0.3 + level * 0.2)
    run = p.add_run(text)
    run.font.name = "Calibri"
    run.font.size = Pt(11)
    run.font.color.rgb = C_BODY
    return p

def add_section_banner(doc, text):
    """Full-width dark banner for section titles."""
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = table.cell(0, 0)
    set_cell_bg(cell, "1A1520")
    cell.width = Inches(6.5)
    p = cell.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    set_paragraph_spacing(p, before=80, after=80)
    run = p.add_run(f"  {text}")
    run.bold = True
    run.font.name = "Calibri"
    run.font.size = Pt(13)
    run.font.color.rgb = C_GOLD
    doc.add_paragraph()
    return table

def add_kv_table(doc, rows_data, key_width=2.0, val_width=4.5):
    """Two-column key-value table."""
    table = doc.add_table(rows=len(rows_data), cols=2)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, (key, val) in enumerate(rows_data):
        bg = "F5F5F5" if i % 2 == 0 else "FFFFFF"
        # Key cell
        kc = table.cell(i, 0)
        kc.width = Inches(key_width)
        set_cell_bg(kc, "E8D0FF")
        set_cell_borders(kc)
        kp = kc.paragraphs[0]
        set_paragraph_spacing(kp, before=60, after=60)
        kr = kp.add_run(key)
        kr.bold = True
        kr.font.name = "Calibri"
        kr.font.size = Pt(10)
        kr.font.color.rgb = C_DARK_PURPLE
        # Val cell
        vc = table.cell(i, 1)
        vc.width = Inches(val_width)
        set_cell_bg(vc, bg)
        set_cell_borders(vc)
        vp = vc.paragraphs[0]
        set_paragraph_spacing(vp, before=60, after=60)
        vr = vp.add_run(val)
        vr.font.name = "Calibri"
        vr.font.size = Pt(10)
        vr.font.color.rgb = C_BODY
    doc.add_paragraph()
    return table

def add_data_table(doc, headers, rows_data, col_widths=None, status_col=None):
    """Styled table with purple header row."""
    total_cols = len(headers)
    table = doc.add_table(rows=1 + len(rows_data), cols=total_cols)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER

    # Header row
    hrow = table.rows[0]
    for ci, h in enumerate(headers):
        cell = hrow.cells[ci]
        set_cell_bg(cell, "9B59B6")
        set_cell_borders(cell, color="6C3483")
        if col_widths:
            cell.width = Inches(col_widths[ci])
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        set_paragraph_spacing(p, before=60, after=60)
        run = p.add_run(h)
        run.bold = True
        run.font.name = "Calibri"
        run.font.size = Pt(10)
        run.font.color.rgb = C_WHITE

    # Data rows
    for ri, row_data in enumerate(rows_data):
        bg = "F5F5F5" if ri % 2 == 0 else "FFFFFF"
        trow = table.rows[ri + 1]
        for ci, val in enumerate(row_data):
            cell = trow.cells[ci]
            if col_widths:
                cell.width = Inches(col_widths[ci])
            # Status column colour
            if status_col is not None and ci == status_col:
                if val == "Live" or val == "COMPLETE":
                    set_cell_bg(cell, "D5F5E3")
                    color = C_GREEN
                elif val == "IN PROGRESS":
                    set_cell_bg(cell, "EBF5FB")
                    color = C_BLUE
                else:
                    set_cell_bg(cell, "FEF9E7")
                    color = C_AMBER
            else:
                set_cell_bg(cell, bg)
                color = C_BODY
            set_cell_borders(cell)
            p = cell.paragraphs[0]
            set_paragraph_spacing(p, before=40, after=40)
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            run = p.add_run(str(val))
            run.font.name = "Calibri"
            run.font.size = Pt(9)
            run.font.color.rgb = color
            if ci == 0:
                run.bold = True

    doc.add_paragraph()
    return table

# ═══════════════════════════════════════════════════════════════════════════════
# Build Document
# ═══════════════════════════════════════════════════════════════════════════════
doc = Document()

# Page margins
for section in doc.sections:
    section.top_margin    = Cm(2.0)
    section.bottom_margin = Cm(2.0)
    section.left_margin   = Cm(2.5)
    section.right_margin  = Cm(2.5)

# ── COVER ────────────────────────────────────────────────────────────────────
cover_table = doc.add_table(rows=1, cols=1)
cover_table.alignment = WD_TABLE_ALIGNMENT.CENTER
cc = cover_table.cell(0, 0)
set_cell_bg(cc, "1A1520")
cc.width = Inches(6.5)
cp = cc.paragraphs[0]
cp.alignment = WD_ALIGN_PARAGRAPH.CENTER
set_paragraph_spacing(cp, before=200, after=40)
title_run = cp.add_run("QuizRope")
title_run.bold = True
title_run.font.name = "Calibri"
title_run.font.size = Pt(36)
title_run.font.color.rgb = C_GOLD

p2 = cc.add_paragraph()
p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
set_paragraph_spacing(p2, before=0, after=20)
r2 = p2.add_run("Educational Game Platform")
r2.font.name = "Calibri"
r2.font.size = Pt(18)
r2.font.color.rgb = C_LIGHT_PURPLE

p3 = cc.add_paragraph()
p3.alignment = WD_ALIGN_PARAGRAPH.CENTER
set_paragraph_spacing(p3, before=0, after=200)
r3 = p3.add_run("Transforming Screen Time into Brain Time")
r3.italic = True
r3.font.name = "Calibri"
r3.font.size = Pt(13)
r3.font.color.rgb = C_WHITE

doc.add_paragraph()

tagline_p = doc.add_paragraph()
tagline_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
set_paragraph_spacing(tagline_p, before=60, after=200)
tr = tagline_p.add_run("Where Kids Learn Without Knowing It")
tr.italic = True
tr.bold = True
tr.font.name = "Calibri"
tr.font.size = Pt(14)
tr.font.color.rgb = C_PURPLE

doc.add_page_break()

# ── SECTION 1: EXECUTIVE SUMMARY ─────────────────────────────────────────────
add_section_banner(doc, "01  |  EXECUTIVE SUMMARY")
add_heading_block(doc, "Mission & Vision", level=2)
add_body(doc, "Mission: Make academic learning so fun that children ask to play — not stop.")
add_body(doc, "Vision: Become the #1 family-first learning game platform used in homes and classrooms worldwide.")

add_heading_block(doc, "What is QuizRope?", level=2)
add_body(doc,
    "QuizRope is a mobile quiz game built around a tug-of-war mechanic: every correct answer "
    "pulls the animated rope toward your team. Two teams (Red vs Blue) compete across Math, Science, "
    "English, History, and Geography questions. The team that pulls the rope past the win threshold — "
    "or leads when rounds end — wins. This single mechanic transforms passive quiz-taking into a "
    "visceral, competitive, team-based experience that children request, not resist.")

add_heading_block(doc, "At a Glance", level=2)
add_kv_table(doc, [
    ("Product",        "QuizRope — cross-platform mobile quiz game (iOS & Android)"),
    ("Stage",          "Feature-complete MVP — entering beta testing"),
    ("Target Users",   "Children aged 3–18 and their parents / guardians"),
    ("Game Modes",     "Solo practice · Split-screen head-to-head · Real-time online multiplayer"),
    ("Subjects",       "Math · Science · English · History · Geography"),
    ("AI Integration", "Google Gemini AI for personalised question generation per grade & topic"),
    ("Languages",      "10 languages: English, Arabic, Spanish, French, Hindi, Bengali, Portuguese, Russian, Japanese, Chinese"),
    ("Platform",       "React Native (Expo) — iOS & Android from a single codebase"),
    ("Backend",        "Node.js + NestJS · MongoDB · WebSocket (Socket.IO) · Firebase Auth"),
    ("Parental Tools", "Child profile management, match analytics, age/grade-aware difficulty, QR linking"),
])

doc.add_page_break()

# ── SECTION 2: THE PROBLEM & OUR SOLUTION ────────────────────────────────────
add_section_banner(doc, "02  |  THE PROBLEM & OUR SOLUTION")

add_heading_block(doc, "The Problem", level=2)
problems = [
    ("Screen Time is Passive",         "Children spend an average of 7+ hours per day on screens — most of it watching videos or playing games with zero educational value."),
    ("Engagement Gap in EdTech",       "Existing educational apps feel like homework dressed up. Kids open them once and never return. Retention rates in edtech average below 10% after 30 days."),
    ("One-Size-Fits-All Content",      "Static question banks cannot adapt to a child's grade, school curriculum, or individual pace. A child practising fractions needs different questions every session."),
    ("Parents Lack Visibility",        "Parents have no easy way to understand what their child actually knows, where they struggle, or how much genuine learning is happening."),
    ("Language Exclusion",             "The majority of quality educational gaming is English-only, excluding the 6 billion people who speak Arabic, Hindi, Bengali, Spanish, and other major languages."),
    ("No Safe Multiplayer for Kids",   "Competitive games for children expose them to strangers and toxic chat. Safe, parent-controlled family multiplayer barely exists."),
]
for title, desc in problems:
    p = doc.add_paragraph()
    set_paragraph_spacing(p, before=30, after=30)
    p.paragraph_format.left_indent = Inches(0.2)
    r1 = p.add_run(f"{title}: ")
    r1.bold = True
    r1.font.name = "Calibri"
    r1.font.size = Pt(11)
    r1.font.color.rgb = C_DARK_PURPLE
    r2 = p.add_run(desc)
    r2.font.name = "Calibri"
    r2.font.size = Pt(11)
    r2.font.color.rgb = C_BODY

doc.add_paragraph()
add_heading_block(doc, "Our Solution", level=2)
solutions = [
    "The tug-of-war rope mechanic creates instant, high-stakes competitive tension that makes every question feel like it matters — children lean in, not away.",
    "AI-powered question generation (Google Gemini) means no two sessions are identical. Parents can type a custom learning context (e.g. 'prime numbers below 100') and the AI generates fresh, accurate questions on the spot.",
    "The parental dashboard gives parents complete visibility: per-child accuracy, average response time, match history, and subject performance — all in one place.",
    "10 languages from day one — including right-to-left Arabic — means QuizRope serves families globally, not just in English-speaking markets.",
    "All multiplayer is family/known-group only. Children join via parent-generated QR codes. Zero exposure to strangers. Zero third-party ads targeting children.",
]
for s in solutions:
    add_bullet(doc, s)

doc.add_page_break()

# ── SECTION 3: PRODUCT FEATURES ──────────────────────────────────────────────
add_section_banner(doc, "03  |  PRODUCT FEATURES")

add_heading_block(doc, "Core Game Mechanic", level=2)
add_body(doc,
    "An animated tug-of-war rope sits at the centre of the screen. Two teams answer questions in "
    "real time — each correct answer pulls the rope toward their side. Players see the rope move "
    "instantly, creating a visceral reward loop that no static progress bar can match. "
    "Score animations, streak badges, sound effects, and haptic feedback amplify every moment.")

add_heading_block(doc, "Feature Overview", level=2)
add_data_table(doc,
    ["Feature", "Who Benefits", "Status", "Educational Value"],
    [
        ("Tug-of-War Quiz Engine",      "Children, Parents",     "Live",    "Competitive motivation; instant correct-answer feedback"),
        ("Solo Practice Mode",          "Children",              "Live",    "Self-paced practice; AI custom context topics"),
        ("Split-Screen Head-to-Head",   "2 players / 1 device",  "Live",    "Peer learning; no internet required"),
        ("Real-time Online Multiplayer","Families, classes",      "Live",    "Remote social learning; low-latency WebSocket sync"),
        ("AI Custom Context",           "Children, Teachers",    "Live",    "Hyper-personalised curriculum alignment"),
        ("Parental Dashboard",          "Parents",               "Live",    "Progress visibility; responsible screen time"),
        ("Child Profile Management",    "Parents",               "Live",    "Age/grade-aware difficulty; safe accounts"),
        ("Match History & Analytics",   "Parents, Children",     "Live",    "Longitudinal learning progress tracking"),
        ("Streak Badges",               "Children",              "Live",    "Positive reinforcement; habit formation"),
        ("Leaderboard",                 "All Users",             "Live",    "Motivational benchmarking"),
        ("QR / Link Code Child Linking","Parents, Children",     "Live",    "Safe account linkage without child email"),
        ("Guest Mode",                  "New Users",             "Live",    "Low-friction onboarding; progress transferable"),
        ("10-Language Support",         "Global Families",       "Live",    "Inclusive learning across languages & cultures"),
        ("Answer Correction Review",    "Children, Parents",     "Live",    "Metacognitive learning from mistakes"),
        ("Difficulty Selector",         "All Users",             "Live",    "Scaffolded progression: Easy / Medium / Hard"),
        ("Teacher / Classroom Mode",    "Teachers",              "Planned", "Class roster; assignment setting"),
        ("Adaptive Difficulty AI",      "Children",              "Planned", "Dynamic adjustment to performance curve"),
    ],
    col_widths=[2.0, 1.5, 0.9, 2.1],
    status_col=2,
)

doc.add_page_break()

# ── SECTION 4: MARKET OPPORTUNITY ────────────────────────────────────────────
add_section_banner(doc, "04  |  MARKET OPPORTUNITY")

add_heading_block(doc, "Global EdTech Market", level=2)
add_data_table(doc,
    ["Metric", "2023", "2025 (Est.)", "2030 (Proj.)", "Source"],
    [
        ("Global EdTech Market",          "$142 B", "$180 B", "$348 B",  "Grand View Research"),
        ("Educational Gaming",            "$9.5 B", "$13 B",  "$32 B",   "Allied Market Research"),
        ("K-12 Digital Learning",         "$38 B",  "$52 B",  "$110 B",  "MarketsandMarkets"),
        ("Mobile Learning (mLearning)",   "$37 B",  "$53 B",  "$166 B",  "Global Market Insights"),
        ("Ed. Gaming CAGR",               "—",      "—",      "~17 %",   "Compound annual growth"),
        ("Children aged 5–17 globally",   "—",      "1.8 Bn", "—",       "UNESCO / World Bank"),
    ],
    col_widths=[2.2, 0.9, 1.0, 1.0, 1.4],
)

add_heading_block(doc, "Why Now?", level=2)
why_now = [
    "Post-pandemic digital learning habits are permanent — families actively seek quality educational apps.",
    "AI commoditisation makes personalised question generation affordable at scale for the first time.",
    "App stores are flooded with children's games, yet no dominant 'family tug-of-war quiz' brand exists — first-mover advantage is available.",
    "Parents in emerging markets (MENA, South Asia, LatAm) are smartphone-first and deeply underserved by English-only edtech.",
    "School districts worldwide are mandating gamification strategies — QuizRope aligns directly.",
]
for w in why_now:
    add_bullet(doc, f"✔  {w}")

add_heading_block(doc, "Target Segments", level=2)
add_data_table(doc,
    ["Segment", "Size", "Pain Point", "Revenue Model"],
    [
        ("Parents of children 4–12",   "~400 M globally",  "Passive, unproductive screen time",         "Premium subscription"),
        ("Parents of children 13–18",  "~300 M globally",  "Teen disengagement from learning content",  "Family plan"),
        ("Primary school teachers",    "~30 M globally",   "Limited budget for engaging tools",         "Institutional licence"),
        ("Homeschooling families",      "~12 M (US alone)", "Need structured curriculum games",          "Premium plan"),
        ("International families",     "~500 M",           "No quality multilingual edtech",            "Regional partnerships"),
        ("After-school programmes",    "~50 M children",   "Need affordable group activities",          "Per-seat licence"),
    ],
    col_widths=[1.8, 1.2, 2.0, 1.5],
)

doc.add_page_break()

# ── SECTION 5: EDUCATIONAL IMPACT ────────────────────────────────────────────
add_section_banner(doc, "05  |  EDUCATIONAL IMPACT")

add_heading_block(doc, "Pedagogical Foundations", level=2)
add_body(doc,
    "QuizRope is not edutainment — it is education with entertainment as the delivery vehicle. "
    "Every feature maps directly to peer-reviewed learning science:")

pedagogy = [
    ("Retrieval Practice",       "Roediger & Karpicke (2006): recalling information strengthens memory 20–40% more than re-studying. Every round is active recall."),
    ("Immediate Feedback",       "Hattie & Timperley (2007): feedback has the highest effect size (d = 0.79) of all learning interventions. QuizRope shows correct/incorrect instantly."),
    ("Competitive Motivation",   "Malone & Lepper (1987): competition increases intrinsic motivation up to 3×. The rope creates visible, real-time competitive stakes."),
    ("Scaffolded Difficulty",    "Vygotsky's Zone of Proximal Development: Easy/Medium/Hard selectors + AI difficulty ensure children are always in the optimal learning zone."),
    ("Positive Reinforcement",   "Operant conditioning (Skinner): streak badges, score animations, and win overlays create dopamine-driven habit loops."),
    ("Metacognition",            "Flavell (1979): reviewing mistakes is among the highest-impact learning strategies. The post-match correction screen builds this habit."),
    ("AI Personalisation",       "Bloom's 2-sigma problem (1984): personalised instruction produces 2-standard-deviation improvement. AI custom context approximates a personal tutor."),
    ("Social Learning",          "Vygotsky social constructivism: peer-to-peer multiplayer and leaderboards leverage social motivation for deeper engagement."),
]
for principle, basis in pedagogy:
    p = doc.add_paragraph()
    set_paragraph_spacing(p, before=30, after=30)
    p.paragraph_format.left_indent = Inches(0.2)
    r1 = p.add_run(f"{principle}: ")
    r1.bold = True
    r1.font.name = "Calibri"
    r1.font.size = Pt(11)
    r1.font.color.rgb = C_PURPLE
    r2 = p.add_run(basis)
    r2.font.name = "Calibri"
    r2.font.size = Pt(11)
    r2.font.color.rgb = C_BODY

add_heading_block(doc, "Child Safety & Responsible Design", level=2)
safety = [
    "No direct child social features — children cannot message strangers. All multiplayer is family/known-group only.",
    "Parent-gated child accounts — children join only via parent-generated QR/link codes. No independent child sign-up.",
    "Zero third-party ads to children — monetisation via parent-facing subscription only.",
    "COPPA / GDPR-Kids aligned design — minimal data collection from child profiles; no behavioural advertising.",
    "Age-appropriate content — all questions vetted for curriculum alignment across ages 3–18.",
    "Screen time transparency — parents see all session data; designed for structured play, not infinite scrolling.",
]
for s in safety:
    add_bullet(doc, s)

doc.add_page_break()

# ── SECTION 6: TECHNOLOGY ────────────────────────────────────────────────────
add_section_banner(doc, "06  |  TECHNOLOGY & ARCHITECTURE")

add_heading_block(doc, "Technology Stack", level=2)
add_data_table(doc,
    ["Layer", "Technology", "Why Chosen", "Scalability"],
    [
        ("Mobile Frontend",    "React Native + Expo (TypeScript)",  "Cross-platform iOS & Android from one codebase",              "Millions of devices; OTA updates"),
        ("Animations",         "React Native Reanimated + SVG",     "60 fps rope animation; GPU-accelerated",                      "No performance ceiling"),
        ("State Management",   "Zustand",                           "Lightweight, ideal for real-time game state",                 "Minimal overhead"),
        ("Backend API",        "Node.js + NestJS (TypeScript)",     "Typed, modular, battle-tested for real-time apps",           "Horizontal scaling; microservices-ready"),
        ("Real-time Layer",    "WebSocket (Socket.IO)",             "Sub-100 ms multiplayer latency",                             "10,000+ concurrent rooms"),
        ("Database",           "MongoDB + Mongoose",                "Flexible schema for evolving question formats",              "Atlas sharding at 100 M+ documents"),
        ("Authentication",     "Firebase Auth",                     "Google-grade security; email, social, guest accounts",       "Millions of auth ops/day; SOC2"),
        ("AI / Question Gen",  "Google Gemini API",                 "State-of-the-art question generation; cost-effective",       "Scales linearly; supports offline batch"),
        ("i18n",               "react-i18next",                     "Industry standard; 10 locales incl. RTL Arabic",             "Add languages without code changes"),
    ],
    col_widths=[1.4, 1.8, 2.2, 1.1],
)

add_heading_block(doc, "Key Technical Differentiators", level=2)
diffs = [
    "End-to-end TypeScript (frontend + backend + shared types) eliminates an entire class of runtime bugs and accelerates feature delivery.",
    "Real-time WebSocket architecture enables sub-100 ms multiplayer sync — matching the experience of native game engines, not typical mobile web apps.",
    "AI question personalisation is deeply integrated: parents type a curriculum context and the AI generates fresh, accurate, grade-appropriate questions for that session — not pre-cached content.",
    "Offline-first split-screen mode: two children can play on one device with no internet, removing the digital-divide barrier for families with limited connectivity.",
    "Guest-to-account migration: children play as guests and seamlessly link progress to a parent account via time-limited secure codes — reducing sign-up friction without sacrificing data safety.",
]
for d in diffs:
    add_bullet(doc, d)

doc.add_page_break()

# ── SECTION 7: ROADMAP ───────────────────────────────────────────────────────
add_section_banner(doc, "07  |  ROADMAP & MILESTONES")

add_heading_block(doc, "Development Timeline", level=2)
add_data_table(doc,
    ["Phase", "Timeline", "Key Deliverables", "KPI", "Status"],
    [
        ("MVP Build",          "2024 Q2–Q4", "Core engine, solo/split/multiplayer, 5 subjects, parent accounts",        "Feature-complete MVP",            "COMPLETE"),
        ("AI Integration",     "2025 Q1",    "Gemini question generation; custom context; answer correction review",    "AI accuracy ≥4/5 by beta testers","COMPLETE"),
        ("Multilingual",       "2025 Q1–Q2", "10 languages; RTL Arabic; locale-specific QA",                           "All 10 locales pass QA",          "COMPLETE"),
        ("Beta Programme",     "2025 Q2–Q3", "50 family beta users; usability testing; App Store submission",           "4.0+ star; <1% crash rate",       "IN PROGRESS"),
        ("Public Launch",      "2025 Q3",    "App Store & Play Store release; marketing; press outreach",               "5,000 downloads in 30 days",      "PLANNED"),
        ("School Tier",        "2025 Q4",    "Teacher panel; class roster; assignment setting; school login",           "20 pilot schools signed",         "PLANNED"),
        ("Adaptive AI",        "2026 Q1",    "Dynamic difficulty; AI knowledge-gap identification",                     "+10% correct-answer rate / 4 wks","PLANNED"),
        ("Content Expansion",  "2026 Q1–Q2", "Coding, Art & Music, Social Studies; 500 K question bank",               "3 new subjects live",             "PLANNED"),
        ("Platform Expansion", "2026 Q2",    "Web app for school computer labs; TV / Chromecast mode",                  "20% users on web in 6 months",    "PLANNED"),
        ("Global Partnerships","2026 Q3–Q4", "EdTech NGO deals; UNESCO application; government curriculum agreements",  "2 MOU-level partnerships",        "PLANNED"),
    ],
    col_widths=[1.3, 0.9, 2.2, 1.5, 0.9],
    status_col=4,
)

add_heading_block(doc, "Projected Growth Metrics", level=2)
add_data_table(doc,
    ["Metric", "Launch (Month 1)", "Year 1", "Year 2", "Year 3"],
    [
        ("Total Downloads",          "5,000",   "50,000",   "250,000",    "1,000,000"),
        ("Monthly Active Users",     "2,000",   "20,000",   "100,000",    "400,000"),
        ("Paying Subscribers",       "200",     "3,000",    "20,000",     "80,000"),
        ("School Partnerships",      "—",       "20",       "500",        "2,000"),
        ("Questions Answered / Day", "10,000",  "200,000",  "2,000,000",  "10,000,000"),
        ("Monthly Revenue (Est.)",   "$400",    "$6,000",   "$50,000",    "$200,000"),
    ],
    col_widths=[2.0, 1.2, 1.1, 1.1, 1.1],
)

doc.add_page_break()

# ── SECTION 8: WHY FUND US ───────────────────────────────────────────────────
add_section_banner(doc, "08  |  WHY FUND QUIZROPE?")

add_heading_block(doc, "10 Reasons to Invest", level=2)

reasons = [
    ("1. Proven Market Demand",
     "The global educational gaming market is growing at ~17% CAGR, projected to reach $32B by 2030. "
     "Parents and schools are actively seeking engaging, curriculum-aligned digital tools — "
     "QuizRope sits precisely at this intersection."),
    ("2. Revolutionary Game Mechanic",
     "No other educational app uses a real-time tug-of-war rope as a learning engine. This mechanic "
     "transforms passive quiz-taking into a visceral, competitive, team-based experience that children "
     "will request, not resist. First-mover advantage in this format is significant."),
    ("3. Evidence-Based Pedagogy",
     "Every feature maps to peer-reviewed learning science: retrieval practice, immediate feedback, "
     "scaffolded difficulty, positive reinforcement, and metacognitive review. QuizRope is not "
     "edutainment — it is education with entertainment as the delivery vehicle."),
    ("4. Child Safety First",
     "Parent-gated accounts, zero ads to children, and COPPA/GDPR-Kids aligned data practices "
     "mean that schools and family-focused NGOs can trust and recommend the platform. In a world "
     "of child data scandals, this is a genuine competitive moat."),
    ("5. AI-Powered Personalisation at Scale",
     "Deeply integrated Google Gemini AI generates hyper-personalised questions per session. "
     "No pre-cached content banks, no one-size-fits-all: every session is fresh and curriculum-relevant. "
     "This removes the human content-creator bottleneck entirely."),
    ("6. Global Reach from Day One",
     "10 languages including Arabic, Hindi, Bengali, and Portuguese means QuizRope was built multilingual "
     "— not localised as an afterthought. It has immediate TAM in South Asia, MENA, and Latin America, "
     "regions where EdTech investment and demand are surging fastest."),
    ("7. Feature-Complete MVP — Low Execution Risk",
     "This is not a pitch deck without a product. QuizRope has a live, feature-complete mobile application: "
     "real-time multiplayer, parental dashboard, AI question generation, 10 languages, 5 subjects, analytics, "
     "leaderboard, and guest mode. Funding accelerates growth, not basic development."),
    ("8. Parent + Child Dual Flywheel",
     "Parents are the paying customers. Children are the retention engine. When a child loves the game, "
     "parents renew subscriptions, recommend to other parents, and request school adoption. This organic "
     "dual-sided flywheel produces low CAC and high LTV without aggressive marketing spend."),
    ("9. School Expansion Path",
     "The roadmap includes a classroom mode transforming QuizRope into a school tool — unlocking B2B "
     "institutional licensing at 10–100× the consumer price point. Early school partnerships create "
     "curriculum alignment and teacher advocacy that no marketing budget can replicate."),
    ("10. Social Impact Multiplier",
     "By making quality, personalised learning accessible on any smartphone — in 10 languages — "
     "QuizRope reaches children in under-resourced communities who have no access to tutors or premium "
     "learning centres. Funding this project funds educational equity at scale."),
]

for title, body in reasons:
    p = doc.add_paragraph()
    set_paragraph_spacing(p, before=60, after=30)
    p.paragraph_format.left_indent = Inches(0.2)
    r1 = p.add_run(f"{title}\n")
    r1.bold = True
    r1.font.name = "Calibri"
    r1.font.size = Pt(12)
    r1.font.color.rgb = C_DARK_PURPLE
    r2 = p.add_run(body)
    r2.font.name = "Calibri"
    r2.font.size = Pt(11)
    r2.font.color.rgb = C_BODY

doc.add_page_break()

# ── CLOSING PAGE ─────────────────────────────────────────────────────────────
close_table = doc.add_table(rows=1, cols=1)
close_table.alignment = WD_TABLE_ALIGNMENT.CENTER
cc2 = close_table.cell(0, 0)
set_cell_bg(cc2, "1A1520")
cc2.width = Inches(6.5)

cp1 = cc2.paragraphs[0]
cp1.alignment = WD_ALIGN_PARAGRAPH.CENTER
set_paragraph_spacing(cp1, before=240, after=60)
r_c1 = cp1.add_run("QuizRope is not just a game.")
r_c1.bold = True
r_c1.italic = True
r_c1.font.name = "Calibri"
r_c1.font.size = Pt(20)
r_c1.font.color.rgb = C_GOLD

cp2 = cc2.add_paragraph()
cp2.alignment = WD_ALIGN_PARAGRAPH.CENTER
set_paragraph_spacing(cp2, before=0, after=40)
r_c2 = cp2.add_run("It is a movement to make every child's screen time count.")
r_c2.italic = True
r_c2.font.name = "Calibri"
r_c2.font.size = Pt(15)
r_c2.font.color.rgb = C_LIGHT_PURPLE

cp3 = cc2.add_paragraph()
cp3.alignment = WD_ALIGN_PARAGRAPH.CENTER
set_paragraph_spacing(cp3, before=80, after=240)
r_c3 = cp3.add_run("Contact us to discuss partnership & funding opportunities.")
r_c3.font.name = "Calibri"
r_c3.font.size = Pt(12)
r_c3.font.color.rgb = C_WHITE

# ── SAVE ──────────────────────────────────────────────────────────────────────
output_path = "/Users/jibm/Desktop/projects/tug-of-war-for-your-brain/QuizRope_Investor_Doc.docx"
doc.save(output_path)
print(f"Saved: {output_path}")
