# QuizRope Website — Full Design & Copy Prompt

## Overview

Build a **4-page minimalist marketing website** for **QuizRope**, a gamified educational quiz app for kids and parents. The site should feel like a gaming landing page — dark, energetic, and playful — while staying clean and fast.

**Pages:**
1. Home
2. Get the App
3. How It Works
4. Contact

---

## Brand Identity

**App Name:** QuizRope
**Tagline:** Battle of Brains
**Sub-tagline:** Learning disguised as war.

**Brand Essence:** QuizRope turns studying into an epic tug-of-war quiz battle. High-energy, competitive, and fun — built for kids ages 6–14 and the parents who want them to actually learn.

**Tone of Voice:** Energetic. Playful. Encouraging. Never preachy. Speaks to both kids ("let's battle!") and parents ("real learning outcomes").

---

## Color Palette

### Backgrounds
| Name | Hex | Usage |
|------|-----|-------|
| Game Dark | `#0D0B14` | Page background |
| Card Dark | `#1A1520` | Card / section backgrounds |
| Mid Dark | `#231C2B` | Subtle dividers, hover states |

### Brand Accents
| Name | Hex | Usage |
|------|-----|-------|
| Pink / Coral | `#E85D75` | Primary CTAs, highlights, links |
| Purple | `#9B59B6` | Secondary accents, gradients |
| Yellow / Gold | `#FFD93D` | Hero CTA button, achievements, badges |
| Indigo | `#6C5CE7` | Tertiary accent |

### Semantic Colors
| Name | Hex | Usage |
|------|-----|-------|
| Success Green | `#10B981` | Correct answers, checkmarks |
| Warning Amber | `#F59E0B` | Warnings, streaks |
| Red Player | `#EF4444` | Player 1 indicator (split-screen) |
| Blue Player | `#3B82F6` | Player 2 indicator (split-screen) |

### Text
| Name | Hex | Usage |
|------|-----|-------|
| Primary | `#FFFFFF` | Headings, body |
| Secondary | `#B8A9C9` | Subtitles, descriptions |
| Muted | `#7B6B8A` | Captions, footnotes |

---

## Typography

| Role | Font | Weight |
|------|------|--------|
| Hero / Display | Luckiest Guy | 400 (bold display) |
| Subheadings | Bungee | 400 |
| Body | Nunito | 400 / 600 / 700 / 800 |

**Font Size Scale:** 12 / 14 / 16 / 18 / 20 / 24 / 30 / 36 / 48 / 60 / 72 / 96px

---

## Gradients & Effects

### Button Gradients
- **Primary CTA:** `#E85D75` → `#9B59B6` (pink to purple, left to right)
- **Hero CTA:** `#FFD93D` → `#F59E0B` (yellow to amber)

### Background Gradient
`#0D0B14` → `#1A1028` → `#0D0B14` (vertical, hero section)

### Glow Effects
- Pink glow: `box-shadow: 0 0 20px #E85D75`
- Purple glow: `box-shadow: 0 0 16px #9B59B6`
- Yellow glow: `box-shadow: 0 0 15px #FFD93D`

### Border Radius
- Cards: `16px`
- Buttons: `9999px` (pill shape)
- Modals/Overlays: `28px`

---

## The Mascot — "Brainy"

A lovable animated brain character that serves as the face of QuizRope.

### Visual Description
- **Shape:** Stylized cartoon brain with organic folds and a rounded form
- **Fill Gradient:** Radial — `#FBCFE8` (light pink center) → `#EC4899` (mid pink) → `#9D174D` (deep magenta edge)
- **Fold Details:** Rendered in `#831843` at 40% opacity for a subtle 3D depth effect
- **Eyes:** Large expressive white eyeballs with dark pupils and white catchlight gleams
- **Mouth:** Gentle curved smile
- **Vibe:** Cheerful, curious, slightly competitive — like a genius best friend

### Animations
- **Idle Bounce:** Gentle up-and-down float loop (3s cycle, spring easing)
- **Blink:** Eyes blink every ~3 seconds
- **Speech Bubble:** Appears beside Brainy with a pointer tail, pink text (`#BE185D`), white bubble

### Where Brainy Appears on the Website
- Hero section: Large Brainy floating on the right side of the headline
- How It Works: Small Brainy icons guide each step
- Get the App: Brainy holding a phone mockup
- Contact: Brainy waving next to the contact form

### Sample Brainy Speech Bubbles
- "Ready to battle?"
- "Your brain called. It wants a workout."
- "Learning is more fun when someone loses."
- "Download. Challenge. Conquer."

---

## Page 1 — Home

### Hero Section
**Layout:** Full-viewport dark hero. Headline left-aligned. Brainy mascot floating right.

**Headline (Luckiest Guy, 72px, white):**
```
The Quiz Game
That Actually
Hurts To Lose.
```

**Subheadline (Nunito 700, 20px, #B8A9C9):**
```
QuizRope is a tug-of-war quiz battle for kids.
Answer faster. Pull harder. Win smarter.
```

**CTA Buttons:**
- Primary (yellow): `Download the App`
- Secondary (outline): `See How It Works`

**Background:** Dark gradient with subtle scattered star/sparkle particles. A faint rope SVG element stretching horizontally behind the headline.

---

### Feature Strip (3 columns)
A quick 3-icon row below the hero.

| Icon | Headline | Body |
|------|----------|------|
| ⚡ | Split-Screen Battles | Two players, one device — the rope moves with every answer. |
| 🧠 | AI-Generated Questions | Powered by Google Gemini. Every game is fresh, every topic covered. |
| 📊 | Track Every Win | Parents get full analytics. Kids get bragging rights. |

---

### Social Proof / Trust Section
**Headline:** Built for curious kids. Trusted by involved parents.

**Stats (large numbers, Luckiest Guy font, pink/yellow):**
- `5` Subjects
- `3` Difficulty Levels
- `13` Languages
- `∞` Rematches

---

### Screenshot / App Preview Section
**Headline (Bungee):** The arena awaits.

**Body (Nunito):**
```
From solo practice to split-screen battles — QuizRope runs on any device.
Pick your subject. Set the difficulty. Let the rope decide who wins.
```

Show 2–3 mobile app screenshots with a subtle glow border.

---

### Subject Arenas Section
**Headline:** Choose Your Arena

**6 Subject Cards** (dark cards, colored icon, glowing hover):
- 🔢 Math
- 🔬 Science
- 📖 English
- 🏛️ History
- 🌍 Geography
- 🎲 Mixed (coming soon)

---

### Final CTA Section
**Headline (Luckiest Guy, 60px):** Your brain is bored. Fix that.

**Body:** QuizRope is free to download. Start your first game in under 60 seconds.

**Button (yellow CTA):** Get QuizRope — It's Free

Brainy speech bubble nearby: *"I've been waiting for you."*

---

## Page 2 — Get the App

**Headline (Luckiest Guy):** Download QuizRope

**Subheadline:** Free. No subscriptions. Just battles.

**Body:**
```
QuizRope is available on iOS and Android. Download it, create your account
(or jump in as a guest), and start your first game in under a minute.
```

**App Store Badges:** Apple App Store + Google Play Store buttons

**Platform Notes:**
- Available for iOS 14+ and Android 8+
- No ads. No in-app purchases. Just learning through competition.
- Works offline for solo practice mode.

**Brainy holding a phone mockup centered on the page.**

**Feature checklist (Nunito, checkmarks in green `#10B981`):**
- ✓ Free to download
- ✓ Guest mode — no sign-up required
- ✓ Parent dashboard included
- ✓ Split-screen & solo modes
- ✓ Works in 13 languages
- ✓ AI-powered question engine

---

## Page 3 — How It Works

**Headline:** How QuizRope Works

**Subheadline:** Simple to start. Impossible to stop.

### Steps (alternating left/right layout, Brainy as step guide)

**Step 1 — Download & Set Up**
```
Create a parent account or jump straight in as a guest player.
Add your child's profile, choose their age group, and you're ready.
```

**Step 2 — Pick Your Arena**
```
Choose a subject: Math, Science, English, History, or Geography.
Set the difficulty and number of rounds. Play solo or challenge a friend on the same device.
```

**Step 3 — Pull the Rope**
```
Answer questions as fast as you can. Every correct answer pulls the rope
toward your side. First player to pull it all the way wins.
```

**Step 4 — Review & Improve**
```
After every match, review the questions you missed. See explanations,
track your accuracy, and watch your ranking climb the leaderboard.
```

**Step 5 — Parents Stay in the Loop**
```
The parent dashboard shows performance by subject, accuracy over time,
and highlights where your child needs more practice.
```

---

### Game Modes Section
**Headline:** Pick Your Battle

| Mode | Description |
|------|-------------|
| 📱 Split-Screen Battle | Two players, one device. Perfect for siblings or classmates. |
| 🎯 Solo Practice | Train alone. AI generates fresh questions every time. |
| 🎲 Guest Mode | No account needed. Jump in, play, and link to a parent later. |

---

## Page 4 — Contact

**Headline:** Got Questions? We've Got Answers.

**Subheadline:** Reach out and a real human (not Brainy) will get back to you.

**Contact Form Fields:**
- Name
- Email
- Subject (dropdown: General, Bug Report, Partnership, Schools & Education, Other)
- Message
- Submit button: `Send It` (pink CTA)

**Aside — Quick Links:**
- Email: `hello@quizrope.com`
- For schools & educators: `schools@quizrope.com`
- Response time: Usually within 24 hours

**Brainy waving beside the form with speech bubble:** *"We read every message. Promise."*

---

## Navigation

**Nav items:**
- Logo (QuizRope wordmark, Luckiest Guy font, white)
- Home
- Get the App
- How It Works
- Contact
- CTA Button: `Download` (yellow pill button, top right)

**Behavior:** Sticky top nav. On scroll, slight blur backdrop (`backdrop-filter: blur(12px)`) with subtle dark background.

---

## Footer

**Left:** QuizRope logo + tagline: *"Battle of Brains"*

**Center links:**
- Home · Get the App · How It Works · Contact
- Privacy Policy · Terms of Service

**Right:** App store badges (small)

**Bottom line:** `© 2025 QuizRope. Built for curious minds everywhere.`

---

## Overall Design Guidelines

- **Layout:** Full-width sections, max content width `1200px`, centered
- **Section Padding:** `80–120px` vertical
- **Animations:** Subtle entrance animations (fade-in + slide-up, 300–500ms, staggered)
- **Hover States:** Cards lift with `translateY(-4px)` + glow on accent color
- **Scrollbar:** Custom dark scrollbar matching background
- **Cursor:** Default (no custom cursor needed)
- **Mobile:** Fully responsive. Stack columns to single column below `768px`.
- **Dark mode only** — there is no light mode.

---

## Tech Recommendations

- **Framework:** Next.js (App Router) or Astro for static speed
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion (entrance + Brainy bounce)
- **Fonts:** Google Fonts — Luckiest Guy, Bungee, Nunito
- **Icons:** Lucide or Heroicons
- **Mascot:** SVG-based Brainy (inline, animatable via CSS/Framer Motion)
