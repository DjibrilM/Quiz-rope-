"""
Generates a plain, professional government-style Word document for QuizRope.
Run with: python3 generate_plain_doc.py
"""

from docx import Document
from docx.shared import Pt, Inches, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
from datetime import date

doc = Document()

# ── Page setup ────────────────────────────────────────────────────────────────
for section in doc.sections:
    section.top_margin    = Cm(3.0)
    section.bottom_margin = Cm(3.0)
    section.left_margin   = Cm(3.5)
    section.right_margin  = Cm(3.0)
    section.page_width    = Cm(21.0)   # A4
    section.page_height   = Cm(29.7)

# ── Helpers ───────────────────────────────────────────────────────────────────
def add_para(doc, text="", align=WD_ALIGN_PARAGRAPH.LEFT, size=11,
             bold=False, italic=False, space_before=0, space_after=120,
             indent=None, font="Times New Roman", underline=False,
             color=None):
    p = doc.add_paragraph()
    p.alignment = align
    pf = p.paragraph_format
    pf.space_before = Pt(space_before)
    pf.space_after  = Pt(space_after)
    if indent is not None:
        pf.left_indent = Inches(indent)
    if text:
        run = p.add_run(text)
        run.bold      = bold
        run.italic    = italic
        run.underline = underline
        run.font.name = font
        run.font.size = Pt(size)
        if color:
            run.font.color.rgb = color
    return p

def add_hr(doc):
    """Adds a thin horizontal rule via paragraph border."""
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after  = Pt(4)
    pPr = p._p.get_or_add_pPr()
    pb = OxmlElement('w:pBdr')
    bottom = OxmlElement('w:bottom')
    bottom.set(qn('w:val'),   'single')
    bottom.set(qn('w:sz'),    '6')
    bottom.set(qn('w:space'), '1')
    bottom.set(qn('w:color'), '000000')
    pb.append(bottom)
    pPr.append(pb)
    return p

def add_section_title(doc, text):
    p = add_para(doc, text.upper(), size=11, bold=True,
                 space_before=14, space_after=4,
                 font="Times New Roman", underline=True)
    return p

def add_body(doc, text, space_after=8, indent=None):
    return add_para(doc, text, size=11, space_before=0,
                    space_after=space_after, indent=indent,
                    font="Times New Roman")

def add_numbered(doc, number, text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after  = Pt(6)
    p.paragraph_format.left_indent  = Inches(0.4)
    p.paragraph_format.first_line_indent = Inches(-0.4)
    run = p.add_run(f"{number}.  {text}")
    run.font.name = "Times New Roman"
    run.font.size = Pt(11)
    return p

def add_lettered(doc, letter, text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after  = Pt(5)
    p.paragraph_format.left_indent  = Inches(0.7)
    p.paragraph_format.first_line_indent = Inches(-0.35)
    run = p.add_run(f"({letter})  {text}")
    run.font.name = "Times New Roman"
    run.font.size = Pt(11)
    return p

# ── Document reference & date block ──────────────────────────────────────────
today = date.today().strftime("%d %B %Y")

ref_p = doc.add_paragraph()
ref_p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
ref_p.paragraph_format.space_after = Pt(0)
r = ref_p.add_run("REF: QR/EDU/2026/001")
r.font.name = "Times New Roman"
r.font.size = Pt(10)

date_p = doc.add_paragraph()
date_p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
date_p.paragraph_format.space_after = Pt(16)
r2 = date_p.add_run(f"Date: {today}")
r2.font.name = "Times New Roman"
r2.font.size = Pt(10)

# ── Document title ─────────────────────────────────────────────────────────
add_para(doc, "PROJECT BRIEFING DOCUMENT", align=WD_ALIGN_PARAGRAPH.CENTER,
         size=14, bold=True, space_before=0, space_after=4, font="Times New Roman")

add_para(doc, "QuizRope — Educational Game Platform", align=WD_ALIGN_PARAGRAPH.CENTER,
         size=12, bold=True, space_before=0, space_after=4, font="Times New Roman")

add_para(doc, "Submitted for Organisational Review and Funding Consideration",
         align=WD_ALIGN_PARAGRAPH.CENTER, size=11, italic=True,
         space_before=0, space_after=2, font="Times New Roman")

add_hr(doc)
add_hr(doc)
add_para(doc, space_after=12)   # spacer

# ── 1. PURPOSE ────────────────────────────────────────────────────────────────
add_section_title(doc, "1.  Purpose")
add_para(doc,
    "This document constitutes a formal briefing on QuizRope, an educational mobile game platform "
    "developed under the direction of Mr. Jibril Mugisho, Project Owner and Lead Developer. "
    "It is prepared for the consideration of prospective funding organisations, institutional "
    "partners, and educational authorities. The document sets out the nature, objectives, pedagogical "
    "basis, technical standing, and strategic importance of the project.",
    space_after=8, indent=None)
add_para(doc,
    "The contents herein are factual, based on the current state of the developed software, and "
    "are presented in good faith for the purposes of evaluation and potential co-operation.",
    space_after=14, indent=None)

# ── 2. BACKGROUND ─────────────────────────────────────────────────────────────
add_section_title(doc, "2.  Background and Context")
add_para(doc,
    "The global education technology sector faces a persistent and well-documented challenge: "
    "children's engagement with digital learning tools declines sharply within days of initial "
    "use. Retention rates across consumer edtech applications average below ten percent at the "
    "thirty-day mark, rendering significant investment in curriculum content largely ineffective. "
    "Simultaneously, children spend in excess of seven hours daily on screens — the overwhelming "
    "majority of which provides no educational value.",
    space_after=8)
add_para(doc,
    "QuizRope was conceived and developed in direct response to this gap. The project is the "
    "initiative of Mr. Jibril Mugisho, who identified that the missing element in educational "
    "gaming was not content quality, but the absence of a genuinely compelling game mechanic — "
    "one capable of generating the same involuntary engagement that commercial entertainment "
    "games produce in children.",
    space_after=14)

# ── 3. PROJECT DESCRIPTION ────────────────────────────────────────────────────
add_section_title(doc, "3.  Description of the Project")

add_para(doc,
    "QuizRope is a cross-platform mobile application for iOS and Android devices. "
    "Its central innovation is the application of a real-time animated tug-of-war rope as the "
    "primary scoring and feedback mechanism in an academic quiz environment. Two competing teams "
    "answer curriculum-aligned questions; each correct answer animates the rope toward the "
    "answering team's side. The team that pulls the rope past the win threshold — or holds the "
    "greater advantage when the round limit is reached — is declared the winner.",
    space_after=8)

add_para(doc, "The platform supports the following operational modes:", space_after=4)
add_lettered(doc, "i",   "Solo Practice Mode — a single learner practises independently against AI-generated questions, with the option to specify a precise curriculum topic.")
add_lettered(doc, "ii",  "Split-Screen Head-to-Head Mode — two players compete on a single physical device, requiring no internet connectivity.")
add_lettered(doc, "iii", "Real-Time Online Multiplayer Mode — players compete across separate devices via a low-latency WebSocket connection.")
add_para(doc, space_after=6)

add_para(doc, "The application covers the following academic subjects at the time of publication:", space_after=4)
for subj in ["Mathematics", "Natural Sciences", "English Language", "History", "Geography"]:
    add_lettered(doc, "—", subj)
add_para(doc, space_after=14)

# ── 4. ARTIFICIAL INTELLIGENCE INTEGRATION ────────────────────────────────────
add_section_title(doc, "4.  Artificial Intelligence Integration")
add_para(doc,
    "A distinguishing feature of the QuizRope platform is the integration of a large language "
    "model (Google Gemini) for the purpose of dynamic, personalised question generation. "
    "Unlike platforms that rely on static, pre-authored question banks, QuizRope generates "
    "original questions in real time, calibrated to the learner's age, grade level, selected "
    "subject, and — where specified by the parent or educator — a custom curriculum context.",
    space_after=8)
add_para(doc,
    "A parent or teacher may, for example, enter the instruction: 'fractions with denominators "
    "up to twenty.' The system will generate a complete set of fresh, accurate questions "
    "pertaining to that specific topic for the duration of the session. This capability "
    "constitutes a practical approximation of personalised tutoring at scale, a goal "
    "identified by educational researcher Benjamin Bloom as producing the greatest measurable "
    "learning gains of any known instructional method.",
    space_after=14)

# ── 5. PARENTAL OVERSIGHT AND CHILD SAFEGUARDING ──────────────────────────────
add_section_title(doc, "5.  Parental Oversight and Child Safeguarding")
add_para(doc,
    "The platform has been designed with child safety and parental authority as foundational "
    "requirements, not supplementary features. The following safeguards are implemented in "
    "the current production build:",
    space_after=6)

safeguards = [
    ("Account Structure",       "Child profiles are created and managed exclusively by a parent or guardian. Children do not create independent accounts and are not required to provide personal information."),
    ("Device Linking",          "Children may join a parent account on a separate device only via a time-limited, cryptographically generated link code or QR code issued by the parent. No alternative access pathway exists."),
    ("No Stranger Contact",     "The platform contains no direct messaging, open chat, or public matchmaking features. All multiplayer sessions are conducted within known family or group configurations."),
    ("No Targeted Advertising", "No third-party advertising software development kits are integrated. Monetisation is conducted exclusively through parent-facing subscription arrangements."),
    ("Data Minimisation",       "Child profile data is limited to name, age, and grade level. No biometric, location, or behavioural advertising data is collected from minors."),
    ("Compliance Alignment",    "The platform architecture has been designed in alignment with the principles of the Children's Online Privacy Protection Act (COPPA) and the General Data Protection Regulation as it pertains to children (GDPR-Kids)."),
]
for i, (title, text) in enumerate(safeguards, 1):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after  = Pt(5)
    p.paragraph_format.left_indent  = Inches(0.4)
    p.paragraph_format.first_line_indent = Inches(-0.4)
    r1 = p.add_run(f"{i}.  {title}: ")
    r1.bold = True
    r1.font.name = "Times New Roman"
    r1.font.size = Pt(11)
    r2 = p.add_run(text)
    r2.font.name = "Times New Roman"
    r2.font.size = Pt(11)

add_para(doc, space_after=14)

# ── 6. MULTILINGUAL ACCESSIBILITY ────────────────────────────────────────────
add_section_title(doc, "6.  Multilingual Accessibility")
add_para(doc,
    "In recognition of the global distribution of the target demographic, the platform has been "
    "localised into ten languages from the initial release. This is not a post-release adaptation "
    "but a foundational architectural decision. The supported languages are as follows: English, "
    "Arabic (including right-to-left layout support), Spanish, French, Hindi, Bengali, Portuguese, "
    "Russian, Japanese, and Chinese (Simplified).",
    space_after=8)
add_para(doc,
    "This multilingual capability positions QuizRope as an instrument of educational equity, "
    "extending quality, AI-personalised learning to families in regions that have historically "
    "been underserved by the predominantly English-language educational technology market.",
    space_after=14)

# ── 7. TECHNICAL STANDING ─────────────────────────────────────────────────────
add_section_title(doc, "7.  Technical Standing and Development Status")
add_para(doc,
    "As of the date of this document, QuizRope is a feature-complete mobile application. "
    "The following components are fully developed, tested, and operational:",
    space_after=6)

tech_items = [
    "Core quiz and tug-of-war game engine with animated rope physics.",
    "Solo, split-screen, and real-time online multiplayer game modes.",
    "Parental dashboard with per-child match history, accuracy statistics, and performance analytics.",
    "AI-powered question generation with custom curriculum context input.",
    "Child account management with age- and grade-aware difficulty calibration.",
    "QR code and link-based device pairing for child accounts.",
    "Answer correction review screen for post-session learning reinforcement.",
    "Leaderboard and streak badge reward system.",
    "Full localisation across ten languages.",
    "Guest mode with seamless account migration.",
]
for i, item in enumerate(tech_items, 1):
    add_numbered(doc, i, item)

add_para(doc, space_after=6)
add_para(doc,
    "The application is built on the following technology foundation: React Native with Expo "
    "for cross-platform mobile deployment; Node.js with NestJS for the backend application "
    "server; MongoDB for data persistence; Socket.IO for real-time communication; and Firebase "
    "Authentication for identity management. The entire codebase is written in TypeScript, "
    "spanning both the frontend and backend, with shared type definitions to ensure consistency "
    "across system boundaries.",
    space_after=14)

# ── 8. EDUCATIONAL SIGNIFICANCE ───────────────────────────────────────────────
add_section_title(doc, "8.  Educational Significance")
add_para(doc,
    "The pedagogical design of QuizRope draws upon established and peer-reviewed principles "
    "in educational psychology and cognitive science. The principal mechanisms engaged are:",
    space_after=6)

ped_items = [
    ("Retrieval Practice",     "The act of recalling information under timed competitive conditions has been demonstrated to improve long-term retention by twenty to forty percent over passive re-study (Roediger and Karpicke, 2006)."),
    ("Immediate Corrective Feedback",  "Research compiled by Hattie and Timperley (2007) identifies feedback as the single highest-impact intervention in learning, with an effect size of d = 0.79. Every question in QuizRope delivers instant feedback."),
    ("Intrinsic Competitive Motivation", "The tug-of-war mechanic creates moment-to-moment stakes that research has shown to increase intrinsic motivation by a factor of up to three in competitive settings (Malone and Lepper, 1987)."),
    ("Scaffolded Difficulty",  "The provision of Easy, Medium, and Hard difficulty settings, augmented by AI-calibrated question complexity, ensures that learners are consistently operating within the zone of proximal development (Vygotsky, 1978)."),
    ("Metacognitive Reflection", "The post-session answer correction review screen builds the habit of learning from errors, a strategy identified as among the highest-yielding instructional approaches in the literature."),
    ("Personalised Instruction", "Benjamin Bloom's 1984 study identified that personalised one-to-one tutoring produces improvements of two standard deviations above group instruction. The AI custom context feature is a practical implementation of this principle at scale."),
]
for i, (title, text) in enumerate(ped_items, 1):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after  = Pt(6)
    p.paragraph_format.left_indent  = Inches(0.4)
    p.paragraph_format.first_line_indent = Inches(-0.4)
    r1 = p.add_run(f"{i}.  {title}: ")
    r1.bold = True
    r1.font.name = "Times New Roman"
    r1.font.size = Pt(11)
    r2 = p.add_run(text)
    r2.font.name = "Times New Roman"
    r2.font.size = Pt(11)

add_para(doc, space_after=14)

# ── 9. PROJECTED IMPACT ───────────────────────────────────────────────────────
add_section_title(doc, "9.  Projected Social and Educational Impact")
add_para(doc,
    "The successful deployment and scaling of QuizRope is projected to produce measurable "
    "educational and social outcomes across the following dimensions:",
    space_after=6)

impacts = [
    "Increased academic engagement among children aged three to eighteen, particularly in subjects where rote learning has historically produced low retention.",
    "Reduced unproductive screen time among families who adopt the platform as a structured alternative to passive entertainment applications.",
    "Improved parental visibility into children's learning progress, enabling informed decisions regarding academic support and intervention.",
    "Expanded access to quality, curriculum-aligned educational tools in multilingual and economically underserved communities.",
    "A scalable model for school adoption through the planned classroom management tier, capable of serving entire class rosters within existing institutional budgets.",
    "A replicable proof of concept that gamification, when built on evidence-based pedagogy, can close the engagement gap that has limited the effectiveness of digital education for decades.",
]
for i, item in enumerate(impacts, 1):
    add_numbered(doc, i, item)

add_para(doc, space_after=14)

# ── 10. FUNDING REQUEST ───────────────────────────────────────────────────────
add_section_title(doc, "10.  Funding Request and Proposed Use of Resources")
add_para(doc,
    "The project is actively seeking institutional funding, grant support, or strategic "
    "partnership from organisations with a mandate in education, child welfare, technology "
    "for development, or related domains. Funds received will be directed to the following "
    "priority areas:",
    space_after=6)

fund_uses = [
    "Quality assurance testing, platform security audit, and formal submission to the Apple App Store and Google Play Store.",
    "Development of the teacher and classroom management module, enabling institutional adoption at the school and district level.",
    "Expansion of the subject content library to include Computational Thinking, Arts and Music, and Social Studies.",
    "Targeted user acquisition in multilingual markets, with particular emphasis on South Asia, the Middle East and North Africa, and Latin America.",
    "Establishment of formal partnerships with educational non-governmental organisations and government curriculum bodies.",
    "Continued development and refinement of the adaptive difficulty AI engine.",
]
for i, item in enumerate(fund_uses, 1):
    add_numbered(doc, i, item)

add_para(doc,
    "Full financial projections, technical documentation, and supporting materials are available "
    "upon request and will be furnished under appropriate confidentiality arrangements.",
    space_after=14)

# ── 11. CONCLUSION ────────────────────────────────────────────────────────────
add_section_title(doc, "11.  Conclusion")
add_para(doc,
    "QuizRope represents a disciplined and evidence-informed response to one of the most "
    "consequential challenges in contemporary education: the failure of digital learning tools "
    "to sustain children's engagement beyond initial novelty. It is a complete, functional "
    "product — not a prototype or concept — developed to professional software standards by "
    "Mr. Jibril Mugisho, whose commitment to combining rigorous educational design with "
    "compelling game mechanics has produced a platform of genuine and demonstrable value.",
    space_after=8)
add_para(doc,
    "The organisation is respectfully invited to review the attached materials, request a "
    "live demonstration of the application, and enter into dialogue regarding the terms "
    "and scope of potential collaboration.",
    space_after=20)

# ── Signature block ───────────────────────────────────────────────────────────
add_hr(doc)
add_para(doc, space_after=4)

add_para(doc, "Prepared and Submitted by:", size=11, bold=False, space_after=4, font="Times New Roman")

add_para(doc, "Jibril Mugisho", size=12, bold=True, space_after=2, font="Times New Roman")
add_para(doc, "Project Owner and Lead Developer — QuizRope", size=11, space_after=2, font="Times New Roman")
add_para(doc, f"Date: {today}", size=11, space_after=2, font="Times New Roman")
add_para(doc, "Contact: Available upon request", size=11, space_after=16, font="Times New Roman")

add_hr(doc)
add_para(doc, space_after=4)

add_para(doc,
    "This document is submitted in confidence for the purpose of funding evaluation and "
    "institutional review. It may not be reproduced or distributed without the express "
    "written consent of the project owner.",
    size=9, italic=True, space_after=4, font="Times New Roman",
    align=WD_ALIGN_PARAGRAPH.CENTER)

# ── Save ──────────────────────────────────────────────────────────────────────
output_path = "/Users/jibm/Desktop/projects/tug-of-war-for-your-brain/QuizRope_Project_Brief.docx"
doc.save(output_path)
print(f"Saved: {output_path}")
