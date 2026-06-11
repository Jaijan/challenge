# PROJECT ASCENSION — Full Architecture & Deployment Guide

## Overview

PROJECT ASCENSION is a cinematic AI-evaluation web app for selecting Programming Club leads.
Built as a Next.js 15 App Router project with Supabase, TypeScript, Tailwind CSS, and Framer Motion.

The standalone HTML prototype in `project-ascension.html` is fully functional and self-contained
(LocalStorage-based, no backend required). The guide below shows how to scale it into a full
production Next.js + Supabase deployment.

---

## Folder Structure

```
project-ascension/
├── app/
│   ├── layout.tsx                  # Root layout with fonts + ParticleBackground
│   ├── page.tsx                    # → redirects to /evaluation
│   ├── evaluation/
│   │   ├── page.tsx                # Intro / Registration screen
│   │   ├── curiosity/
│   │   │   └── page.tsx            # Module 01 — ACCESS DENIED challenge
│   │   ├── logic/
│   │   │   └── page.tsx            # Module 02 — Logic Chamber (5 questions)
│   │   ├── debug/
│   │   │   └── page.tsx            # Module 03 — Debugging Arena (4 scenarios)
│   │   ├── glitch/
│   │   │   └── page.tsx            # Module 04 — System Failure Simulation
│   │   ├── leadership/
│   │   │   └── page.tsx            # Module 05 — Leadership Chamber (3 scenarios)
│   │   ├── terminal/
│   │   │   └── page.tsx            # Module 06 — Terminal Simulation
│   │   └── final/
│   │       └── page.tsx            # Module 07 — Written Response
│   ├── results/
│   │   └── page.tsx                # Score, verdict, achievements
│   └── admin/
│       ├── layout.tsx              # Admin auth gate (password protected)
│       └── page.tsx                # Candidate analytics dashboard
│
├── components/
│   ├── ui/
│   │   ├── ParticleBackground.tsx  # Canvas particle animation
│   │   ├── TypingText.tsx          # Typewriter animation component
│   │   ├── GlassPanel.tsx          # Glassmorphism card wrapper
│   │   ├── CodeBlock.tsx           # Syntax-highlighted code viewer
│   │   ├── OptionButton.tsx        # Quiz/scenario choice button
│   │   ├── ScoreRing.tsx           # Animated SVG score circle
│   │   ├── StatBar.tsx             # Animated score breakdown bar
│   │   ├── AchievementToast.tsx    # Slide-in achievement notification
│   │   ├── LiveTimer.tsx           # Countdown / elapsed timer
│   │   ├── ProgressNodes.tsx       # Stage progress indicator
│   │   └── TerminalWindow.tsx      # Full terminal emulator
│   ├── stages/
│   │   ├── IntroSequence.tsx       # Boot/typewriter opening
│   │   ├── CuriosityChallenge.tsx  # ACCESS DENIED stage
│   │   ├── LogicQuestion.tsx       # Reusable logic Q component
│   │   ├── DebugScenario.tsx       # Reusable debug scenario
│   │   ├── GlitchEffect.tsx        # System failure animation
│   │   ├── LeadershipScenario.tsx  # Reusable leadership scenario
│   │   └── FinalResponse.tsx       # Textarea + submission
│   └── admin/
│       ├── CandidateTable.tsx      # Sortable/searchable candidate list
│       ├── StatsGrid.tsx           # Summary stat cards
│       └── ResponseViewer.tsx      # Written answer reader
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Browser Supabase client
│   │   ├── server.ts               # Server Supabase client (cookies)
│   │   └── types.ts                # Generated DB types
│   ├── questions/
│   │   ├── logic.ts                # All logic questions + metadata
│   │   ├── debug.ts                # All debug scenarios + metadata
│   │   └── leadership.ts           # All leadership scenarios + metadata
│   ├── scoring.ts                  # Score computation + weights
│   ├── achievements.ts             # Achievement definitions + unlock logic
│   └── terminal-fs.ts              # Virtual filesystem for terminal
│
├── store/
│   └── evaluationStore.ts          # Zustand store (scores, progress, answers)
│
├── hooks/
│   ├── useTimer.ts                 # Start/stop/read elapsed timer
│   ├── useAchievements.ts          # Unlock + display achievement
│   └── useTerminal.ts              # Terminal command processor
│
├── app/api/
│   ├── candidates/
│   │   ├── route.ts                # POST: save candidate; GET: admin list
│   │   └── [id]/route.ts           # GET: single candidate detail
│   └── export/
│       └── route.ts                # GET: CSV export for admin
│
├── public/
│   └── sounds/
│       ├── keypress.mp3            # Optional: terminal key SFX
│       └── achievement.mp3         # Achievement unlock SFX
│
├── styles/
│   └── globals.css                 # Tailwind base + custom CSS vars
│
├── tailwind.config.ts              # Custom colors, fonts, animations
├── next.config.ts
├── tsconfig.json
└── .env.local                      # Supabase keys

```

---

## Supabase Schema

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ══════════════════════════════════════════
--  CANDIDATES TABLE
-- ══════════════════════════════════════════
create table candidates (
  id                    uuid primary key default uuid_generate_v4(),
  name                  text not null,
  email                 text not null,
  score                 integer not null default 0,
  curiosity_score       integer not null default 0,
  logic_score           integer not null default 0,
  debugging_score       integer not null default 0,
  leadership_score      integer not null default 0,
  persistence_score     integer not null default 0,
  final_written_response text,
  time_taken            integer,          -- seconds
  achievements          text[] default '{}',
  created_at            timestamptz default now()
);

-- Leaderboard index
create index idx_candidates_score on candidates(score desc);
create index idx_candidates_created on candidates(created_at desc);

-- ══════════════════════════════════════════
--  ROW LEVEL SECURITY
-- ══════════════════════════════════════════
alter table candidates enable row level security;

-- Public: anyone can INSERT their own result
create policy "candidates_insert" on candidates
  for insert with check (true);

-- Admin: only service_role can SELECT (protect candidate data)
create policy "candidates_admin_select" on candidates
  for select using (
    auth.role() = 'service_role'
  );

-- ══════════════════════════════════════════
--  ADMIN VIEW (for dashboard queries)
-- ══════════════════════════════════════════
create view candidate_leaderboard as
  select
    row_number() over (order by score desc) as rank,
    id,
    name,
    email,
    score,
    curiosity_score,
    logic_score,
    debugging_score,
    leadership_score,
    persistence_score,
    time_taken,
    achievements,
    created_at,
    case
      when score >= 85 then 'PROGRAMMING LEAD'
      when score >= 70 then 'CO-LEAD CANDIDATE'
      when score >= 50 then 'ACTIVE MEMBER'
      else 'RE-EVALUATION'
    end as verdict
  from candidates
  order by score desc;
```

---

## Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...   # Admin API routes only
ADMIN_PASSWORD=your-secret-admin-key    # Hashed, gates the /admin route
```

---

## Key Implementation Notes

### Scoring System

```typescript
// lib/scoring.ts
export const SCORE_WEIGHTS = {
  curiosity:   0.20,
  logic:       0.20,
  debugging:   0.30,
  leadership:  0.15,
  persistence: 0.15,
} as const;

export function computeFinalScore(scores: ScoreMap): number {
  return Math.round(
    scores.curiosity   * SCORE_WEIGHTS.curiosity   +
    scores.logic       * SCORE_WEIGHTS.logic       +
    scores.debugging   * SCORE_WEIGHTS.debugging   +
    scores.leadership  * SCORE_WEIGHTS.leadership  +
    scores.persistence * SCORE_WEIGHTS.persistence
  );
}

export function getVerdict(score: number): Verdict {
  if (score >= 85) return { rank: 'PROGRAMMING LEAD',    class: 'lead' };
  if (score >= 70) return { rank: 'CO-LEAD CANDIDATE',   class: 'colead' };
  if (score >= 50) return { rank: 'ACTIVE MEMBER',       class: 'member' };
  return            { rank: 'RE-EVALUATION REQUIRED', class: 'retry' };
}
```

### Curiosity Stage — Browser Detective Challenge

The ACCESS DENIED page hides the key (`PROMETHEUS-X`) in three discovery paths:
1. **Page Source** — comment in HTML: `<!-- Key: PROMETHEUS-X -->`
2. **Browser Console** — `window.getKey()` prints the key in styled output
3. **DevTools Element Inspector** — hidden `data-key` attribute on a div

All three paths award different achievement points. The stage score is:
```
base(70) + console_bonus(+20 if used) + speed_bonus(+10 if < 60s) - attempt_penalty(-15 per extra attempt)
```

### Terminal Virtual Filesystem

The virtual FS in `lib/terminal-fs.ts` contains:
```
~/
├── documents/
│   ├── readme.txt       — basic instructions
│   ├── config.json      — hint pointing to /system/vault
│   └── notes.md         — explicit path hint
├── logs/
│   ├── access.log       — mentions "open vault"
│   ├── error.log        — security atmosphere
│   └── ascension.log    — rewards explorers, hints vault path
└── system/
    ├── key.enc          — encrypted decoy file
    └── vault/
        └── classified.txt  ← FINAL KEY: ZEPHYR-424 (secret: true)
```

### Persistence Score Calculation

```typescript
function computePersistenceScore(state: EvaluationState): number {
  let score = 40; // base
  score += Math.min(filesOpened.size * 10, 30);  // terminal exploration
  if (state.terminalKeyFound) score += 30;        // found the key organically
  if (state.curiosityAttempts > 1) score += 10;   // kept trying
  return Math.min(score, 100);
}
```

---

## Achievements Reference

| ID                | Icon | Trigger |
|-------------------|------|---------|
| `curious_mind`    | 🔍   | Submitted correct curiosity key |
| `console_master`  | 💻   | Called `window.getKey()` in console |
| `fast_thinker`    | ⚡   | Completed logic chamber in < 90 seconds |
| `debugger`        | 🐛   | 100% accuracy in debugging arena |
| `persistent`      | 🔥   | Made > 2 attempts on any stage |
| `architect`       | 🏗️   | Final score ≥ 80 |
| `future_lead`     | 🌟   | Final score ≥ 90 |
| `terminal_explorer`| 🖥️  | Opened classified.txt in terminal |
| `early_bird`      | ⏱️   | Completed evaluation in < 10 minutes |

---

## Deployment (Vercel + Supabase)

```bash
# 1. Install dependencies
npx create-next-app@latest project-ascension --typescript --tailwind --app
cd project-ascension
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install framer-motion zustand
npm install --save-dev @types/node

# 2. Add fonts to layout.tsx
import { Orbitron, Share_Tech_Mono, Inter } from 'next/font/google'

# 3. Set up Supabase
# - Create project at supabase.com
# - Run the schema SQL above in the SQL editor
# - Copy keys to .env.local

# 4. Deploy
vercel --prod
# Add env vars in Vercel dashboard

# 5. Optional: Custom domain
vercel domains add ascension.yourclub.dev
```

---

## Admin Panel Access

The `/admin` route is protected. Access it by appending `?key=YOUR_ADMIN_PASSWORD` to the URL,
or build a proper login screen using Supabase Auth with a single admin user.

Features available in the admin panel:
- View all candidates ranked by score
- Search by name or email
- Sort by score, time, or name
- View full written responses (click any row)
- Export all data as CSV
- Summary statistics (total, average, top score, lead count)
- Verdict classification by score threshold

---

## Tailwind Custom Config

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'
export default {
  content: ['./app/**/*.tsx', './components/**/*.tsx'],
  theme: {
    extend: {
      colors: {
        accent:  '#00d4ff',
        accent2: '#7b2fff',
        accent3: '#ff2d78',
        panel:   '#050a0f',
      },
      fontFamily: {
        mono:    ['Share Tech Mono', 'monospace'],
        orb:     ['Orbitron', 'sans-serif'],
        sans:    ['Inter', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'float':      'float 4s ease-in-out infinite',
        'glitch':     'glitch 4s infinite',
        'scanline':   'scanline 8s linear infinite',
      },
    },
  },
} satisfies Config
```
