<div align="center">

# Verdiqx

### AI-powered training platform for Codeforces and competitive programming.

*Practice smarter. Debug faster. Rate higher.*

<p>
  <img src="./public/og-image.png" alt="Verdiqx — AI-powered Codeforces training platform" width="920" />
</p>

<p>
  <a href="https://verdyx.lovable.app"><img alt="Live" src="https://img.shields.io/badge/live-verdyx.lovable.app-8b5cf6?style=for-the-badge&logo=vercel&logoColor=white" /></a>
  <a href="./LICENSE"><img alt="License" src="https://img.shields.io/badge/license-MIT-38bdf8?style=for-the-badge" /></a>
  <img alt="TypeScript" src="https://img.shields.io/badge/typescript-strict-3178c6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img alt="React" src="https://img.shields.io/badge/react-19-149eca?style=for-the-badge&logo=react&logoColor=white" />
</p>

<p>
  <img alt="React 19" src="https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white&style=flat-square" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.8-3178c6?logo=typescript&logoColor=white&style=flat-square" />
  <img alt="TanStack Start" src="https://img.shields.io/badge/TanStack%20Start-v1-ff4154?logo=react-query&logoColor=white&style=flat-square" />
  <img alt="Vite" src="https://img.shields.io/badge/Vite-7-646cff?logo=vite&logoColor=white&style=flat-square" />
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss&logoColor=white&style=flat-square" />
  <img alt="Supabase" src="https://img.shields.io/badge/Supabase-Postgres-3ecf8e?logo=supabase&logoColor=white&style=flat-square" />
  <img alt="Lovable AI" src="https://img.shields.io/badge/Lovable_AI-Gateway-a855f7?style=flat-square" />
  <img alt="shadcn/ui" src="https://img.shields.io/badge/shadcn%2Fui-New%20York-000?style=flat-square" />
</p>

<p>
  <a href="#-features">Features</a> ·
  <a href="#-screenshots">Screenshots</a> ·
  <a href="#-tech-stack">Tech Stack</a> ·
  <a href="#-installation">Installation</a> ·
  <a href="#-architecture">Architecture</a> ·
  <a href="#-roadmap">Roadmap</a> ·
  <a href="#-contributing">Contributing</a>
</p>

</div>

---

## 📖 Overview

**Verdiqx** is an AI-native training platform built around **Codeforces**. It turns
a passive scroll through problem lists into a guided, measurable practice loop:
it reads your submission history, spots weak topics, generates a personalized
practice sheet at the right difficulty, and gives you a mentor that can read
problem screenshots, editorials, and your own code.

### Why it exists

Competitive programmers plateau not for lack of problems — the problemset is
infinite — but for lack of **the right next problem**. Verdiqx fixes that by
combining Codeforces's public API with an AI mentor and rich analytics, so every
practice session targets the tag or rating band that is actually holding you
back.

### Who it's for

- Codeforces users grinding from Pupil → Expert → Candidate Master and beyond
- ICPC / ACM teams that need shared, curated sheets
- Self-taught DSA learners who want a mentor that explains *their* WA
- Educators building custom problem sets for a class or cohort

### What it solves

| Problem | Verdiqx |
| --- | --- |
| "I don't know what to solve next." | AI recommendations from your rating + weak tags |
| "The editorial is too terse." | AI problem explanations with worked intuition |
| "Why is this a WA?" | Paste code or a screenshot — mentor reviews it |
| "Am I actually improving?" | Rating deltas, topic mastery, streaks, mistake log |
| "Contest prep is chaos." | Contest tracker + virtual contest simulator |

---

## ✨ Features

### 🧠 AI
- **AI mentor** (`/mentor`) — multi-turn chat that accepts **text, screenshots, and PDFs** (problem statements, editorials, submission images). Powered by Lovable AI Gateway.
- **AI problem explanations** — plain-English intuition, complexity, and a nudge before the full solution.
- **AI-generated practice sheets** — rating band + tag mix → a curated set of problems with balanced difficulty.
- **AI recommendations** — "what to solve next" driven by your CF submission history and topic mastery.

### 📊 Codeforces analytics
- **Profile dashboard** with rating graph, verdict breakdown, tag heatmap, and streaks
- **Rating analytics** — deltas per contest, best/worst tags, performance vs. expected
- **Topic mastery** — per-tag accuracy, average rating solved, and a "next level" target
- **Mistake log** — every WA / TLE / MLE grouped by problem with re-attempt tracking
- **Compare** (`/compare`) — side-by-side profile comparison against a friend or rival

### 🏁 Practice & contests
- **Problem explorer** (`/problems`) — filter by rating, tag, contest, solved status
- **Custom sheet builder** (`/sheets/$sheetId`) — create, share, duplicate, archive, favorite, restore
- **Contest tracker** (`/contests`) — upcoming rounds with countdown, division, and registration
- **Virtual contest simulator** (`/simulator`) — pick past rounds and race the clock
- **Video solutions** — YouTube editorial search per problem, deep-linked
- **Cheatsheets** (`/cheatsheets`) — DSA templates and snippets

### 👥 Community
- **Public profiles** (`/u/$handle`) with shareable OG cards
- **Community feed** (`/community`) — activity from other trainees

### 🔐 Auth & platform
- Email/password + **Google OAuth** via the managed Lovable auth broker
- Row-Level-Security-enforced Postgres (Supabase / Lovable Cloud)
- Admin dashboard with bug-report inbox
- End-to-end typed **server functions** (TanStack Start `createServerFn`)

### 🎨 UX polish
- Fully **responsive** (mobile → 4K)
- Native **dark mode** + light mode with a persistent theme toggle
- Global **`⌘K` / `Ctrl+K` command palette** on every route
- Scroll-driven 3D reveals, respectful `prefers-reduced-motion`
- Accessible focus rings, ARIA labels, keyboard navigation
- SEO-ready per-route `<head>` (title, description, OG, Twitter card)

---

## 📸 Screenshots

See the live app for a full walkthrough: **<https://verdyx.lovable.app>**

Key surfaces to explore:

- **Landing** — animated hero, features, and roadmap
- **Dashboard** — rating graph, streaks, next-to-solve
- **Profile** — CF handle, tag mastery, mistake log
- **Contest tracker** — upcoming rounds with countdown
- **Analytics** — rating deltas and topic heatmap
- **AI Mentor** — chat with image + PDF attachments
- **Problem explorer** — filter by rating, tag, contest
- **Custom sheet builder** — curated practice sets
- **Settings** — profile, handle, preferences
- **Virtual contest simulator** — race the clock on past rounds

---

## 🛠 Tech Stack

<table>
<thead><tr><th>Layer</th><th>Technology</th></tr></thead>
<tbody>
<tr><td><b>Frontend</b></td><td>React 19, TypeScript 5.8, TanStack Router, framer-motion, react-three-fiber / drei, recharts, react-markdown + remark-gfm, cmdk</td></tr>
<tr><td><b>Backend</b></td><td>TanStack Start server functions (Vite 7 SSR), Cloudflare Workers runtime (<code>nodejs_compat</code>)</td></tr>
<tr><td><b>Database</b></td><td>Postgres via Supabase / Lovable Cloud (RLS on every user table)</td></tr>
<tr><td><b>Auth</b></td><td>Supabase Auth (email/password) + Google OAuth via Lovable broker, JWT bearer middleware</td></tr>
<tr><td><b>AI</b></td><td>Lovable AI Gateway (Google Gemini flash), OpenAI-compatible chat + vision + PDF</td></tr>
<tr><td><b>External APIs</b></td><td>Codeforces public API (problemset, contests, user status), YouTube search</td></tr>
<tr><td><b>State management</b></td><td>TanStack Query (server cache), React 19 hooks, URL state via TanStack Router</td></tr>
<tr><td><b>Styling</b></td><td>Tailwind CSS v4, shadcn/ui (New York), Radix primitives, lucide-react icons, tw-animate-css</td></tr>
<tr><td><b>Deployment</b></td><td>Lovable Cloud / Cloudflare Workers (edge SSR)</td></tr>
<tr><td><b>Dev Tools</b></td><td>Bun, Vite, ESLint 9 + typescript-eslint, Prettier, Playwright (visual tests), sharp (icon pipeline)</td></tr>
</tbody>
</table>

---

## 📁 Folder Structure

```text
verdiqx/
├── public/                         # Static assets, manifest, OG image, icons
├── scripts/                        # Icon generation & audit scripts
├── src/
│   ├── assets/                     # Bundled images (logo, hero)
│   ├── components/
│   │   ├── app/                    # AppShell, CommandMenu, mentor markdown, bug button…
│   │   ├── ds/                     # Design-system primitives (EmptyState, MetricCard, Kbd…)
│   │   ├── ui/                     # shadcn/ui components
│   │   └── theme-toggle.tsx
│   ├── hooks/                      # use-current-user, use-is-admin, use-sheets, use-countdown…
│   ├── integrations/
│   │   ├── lovable/                # Managed OAuth broker
│   │   └── supabase/               # Auto-generated client, middleware, attacher, types
│   ├── lib/
│   │   ├── *.functions.ts          # Client-callable server functions (RPC)
│   │   ├── *.server.ts             # Server-only helpers (AI gateway, CF sync, mastery)
│   │   └── utils, seo, format, rand
│   ├── routes/                     # File-based routing (TanStack Start)
│   │   ├── __root.tsx              # Root shell, head metadata, global palette
│   │   ├── index.tsx               # Landing page
│   │   ├── auth.tsx                # Sign in / sign up
│   │   ├── problems.tsx            # Problem explorer
│   │   ├── contests.tsx            # Contest tracker
│   │   ├── mentor.tsx              # AI mentor chat
│   │   ├── compare.tsx             # Profile comparison
│   │   ├── community.tsx           # Community feed
│   │   ├── cheatsheets.tsx         # DSA cheatsheets
│   │   ├── sheets.$sheetId.tsx     # Custom sheet detail
│   │   ├── simulator.tsx           # Virtual contest simulator
│   │   ├── videos.tsx              # Video solutions search
│   │   ├── search.tsx              # Ask Verdiqx (AI search)
│   │   ├── u.$handle.tsx           # Public profile
│   │   └── _authenticated/         # Gated subtree: profile, settings, notifications,
│   │                               #   mistakes, inbox, admin, admin.bug-reports
│   ├── router.tsx                  # Router bootstrap + QueryClient
│   ├── server.ts                   # SSR entry
│   ├── start.ts                    # createStart config + function middleware
│   └── styles.css                  # Tailwind v4 + design tokens
├── supabase/                       # DB migrations & config
├── tests/visual/                   # Playwright visual tests
├── package.json
└── vite.config.ts
```

---

## 🚀 Installation

### Prerequisites
- **Bun** ≥ 1.1 (or Node ≥ 20)
- A **Lovable Cloud** project (Supabase under the hood) — free tier is enough
- A **Lovable AI Gateway** API key for the AI mentor

### 1 — Clone

```bash
git clone https://github.com/your-org/verdiqx.git
cd verdiqx
```

### 2 — Install

```bash
bun install
```

### 3 — Configure environment

```bash
cp .env.example .env
# then fill in the values (see the next section)
```

### 4 — Run

| Task | Command |
| --- | --- |
| Start dev server (HMR, port 8080) | `bun run dev` |
| Type-check + production build | `bun run build` |
| Development build (unminified) | `bun run build:dev` |
| Preview production build | `bun run preview` |
| Lint | `bun run lint` |
| Format | `bun run format` |
| Regenerate PWA icons | `bun run icons` |
| Visual regression tests | `bun run test:visual` |

Then open <http://localhost:8080>.

---

## 🔑 Environment Variables

Create a `.env` from the template below.

```dotenv
# ─── Lovable Cloud / Supabase (public — safe to expose to the browser) ───
VITE_SUPABASE_URL="https://<project-ref>.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_..."
VITE_SUPABASE_PROJECT_ID="<project-ref>"

# ─── Server-side mirror of the same values (used during SSR) ───
SUPABASE_URL="https://<project-ref>.supabase.co"
SUPABASE_PUBLISHABLE_KEY="sb_publishable_..."
SUPABASE_PROJECT_ID="<project-ref>"

# ─── Lovable AI Gateway (server-only, required for /mentor & AI features) ───
LOVABLE_API_KEY="lov_..."

# ─── Optional: transactional email via Resend (auth emails, notifications) ───
RESEND_API_KEY="re_..."
```

> `SUPABASE_SERVICE_ROLE_KEY` is **not** required — Verdiqx uses the publishable
> key plus RLS for all app-internal reads. Admin operations run through
> authenticated server functions gated by the `has_role` security-definer function.

---

## 🧭 Usage

1. **Sign in** — email/password or Google OAuth from `/auth`.
2. **Connect your Codeforces handle** — Settings → Profile → CF handle. Verdiqx pulls your submissions and refreshes on demand.
3. **Track progress** — the dashboard surfaces rating, streak, mistake log, and the next problem to attempt.
4. **Generate a practice sheet** — Problems → filter → "Save as sheet", or ask the AI to build one at a target rating.
5. **Join contests** — Contests page shows the next round with a live countdown; register directly on Codeforces.
6. **View analytics** — profile page shows rating deltas, per-tag mastery, verdict split, and topic heatmap.
7. **Use the AI mentor** — `/mentor` accepts text, screenshots (drag & drop), and PDF editorials; use it to debug a WA or walk through a hard problem.
8. **⌘K** — anywhere in the app to jump to any route.

---

## 🏗 Architecture

```text
┌──────────────────────────────────────────────────────────────────┐
│                     Browser (React 19 + Vite)                    │
│  Routes → TanStack Router · State → TanStack Query · UI → shadcn │
└───────────────┬──────────────────────────────┬───────────────────┘
                │  useServerFn (typed RPC)     │  supabase-js
                ▼                              ▼
   ┌────────────────────────┐    ┌────────────────────────────────┐
   │  TanStack Start server │    │  Supabase Auth (JWT, Google)   │
   │  functions + routes    │◄───┤  attached as bearer via        │
   │  (Cloudflare Workers)  │    │  functionMiddleware            │
   └────────┬───────────────┘    └────────────────────────────────┘
            │
            ├──► Postgres (RLS) — profiles, sheets, mistakes, submissions…
            ├──► Codeforces public API — problemset, contests, user.status
            └──► Lovable AI Gateway — Gemini chat + vision + PDF
```

- **Frontend** — TanStack Router owns URL state; TanStack Query owns server
  cache. Every data read goes through `queryClient.ensureQueryData` in a route
  loader, then `useSuspenseQuery` in the component.
- **Backend** — App-internal logic is written as `createServerFn` (typed RPC).
  Webhooks and public endpoints live under `src/routes/api/public/*`.
- **Auth flow** — Supabase issues a JWT on sign-in; a client
  `functionMiddleware` attaches it as `Authorization: Bearer <token>` on every
  server-function call. `requireSupabaseAuth` validates the token and provides
  a per-request Supabase client scoped to the user (RLS as that user).
- **AI flow** — Server functions call `callLovableAI()` (raw fetch to the
  gateway, `Lovable-API-Key` header) with a system prompt + optional multimodal
  parts (`text` / `image_url` / `file`). Keys never touch the browser.
- **Data flow** — Codeforces submissions are pulled by `syncUserSubmissions`,
  normalized in `sync.server.ts`, and mastered/aggregated in `mastery.server.ts`
  before the client sees them.

---

## ⚡ Performance & Quality

- **Edge SSR** on Cloudflare Workers — first byte in tens of milliseconds
- **Route-level code splitting** via the TanStack Router Vite plugin
- **Lazy 3D scenes** — three.js/drei behind `<ClientOnly>` + `React.lazy`
- **`view()` scroll-driven animations** — GPU, no scroll listeners
- **Query cache + optimistic updates** for sheets, favorites, and progress
- **SEO** — per-route `head()` with `<title>`, meta description, OG, Twitter card, JSON-LD where relevant
- **Accessibility** — keyboard-first, visible focus, ARIA labels on brand links, `prefers-reduced-motion` respected
- **Responsive** — designed mobile-first, tested at 320 → 1920+ px
- **Security** — RLS on every user table, `has_role` security-definer for privileged checks, secrets kept server-side

---

## 🗺 Roadmap

**Shipped**
- [x] Codeforces handle linking + submission sync
- [x] AI mentor with image + PDF attachments
- [x] Custom sheet builder with archive / restore / favorite
- [x] Contest tracker + virtual simulator
- [x] Profile comparison & public share pages
- [x] Mistake log
- [x] Global command palette (`⌘K`)
- [x] Dark / light theme
- [x] Admin bug-report inbox

**Next**
- [ ] Team / cohort accounts with shared sheets
- [ ] AtCoder + LeetCode integration
- [ ] AI code-review on paste (line-level annotations)
- [ ] Weekly personalized email digest
- [ ] Public leaderboard by streak & rating delta
- [ ] Native mobile shell (Capacitor)
- [ ] Voice mentor (speech-to-text + TTS)
- [ ] Discord bot for contest reminders

---

## 🤝 Contributing

Contributions are welcome and appreciated. Whether it's a typo fix, a new
feature, or a whole subsystem, please:

1. **Fork** the repository and create your branch from `main`
   (`git checkout -b feat/amazing-thing`).
2. **Install & run** the app locally — see [Installation](#-installation).
3. **Follow the code style** — `bun run lint` and `bun run format` must pass.
4. **Match the architecture** — app-internal logic goes in `createServerFn`,
   not new Supabase edge functions.
5. **Add tests** where it matters (Playwright visual specs live in `tests/visual/`).
6. **Commit** using Conventional Commits (`feat:`, `fix:`, `docs:` …).
7. **Open a PR** with a clear description, screenshots for UI, and a link to
   any related issue.

<details>
<summary><b>Local dev tips</b></summary>

- The dev server always runs on **port 8080**.
- `bun run build` runs a strict TypeScript pass; unresolved imports fail hard.
- Never edit `src/routeTree.gen.ts` or files under `src/integrations/supabase/`
  ending in `client.ts`, `client.server.ts`, `auth-middleware.ts`,
  `auth-attacher.ts`, or `types.ts` — they are auto-generated.
- Use `⌘K` in-app to jump between routes while developing.

</details>

---

## 📜 License

Verdiqx is released under the **MIT License**. See [`LICENSE`](./LICENSE) for the full text.

```
MIT License

Copyright (c) 2026 Verdiqx contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
```

---

## 🙏 Acknowledgements

- **[Codeforces](https://codeforces.com)** — for the problems, the contests, and the public API that makes this platform possible. Mike Mirzayanov & team, thank you.
- **The competitive programming community** — Errichto, William Lin, SecondThread, cp-algorithms.com, USACO Guide, and every blog author who has ever written an editorial.
- **Open-source contributors** behind React, TanStack, Vite, Tailwind, shadcn/ui, Radix, Supabase, Recharts, three.js, framer-motion, and countless others.
- **[Lovable](https://lovable.dev)** — for Cloud, AI Gateway, and the toolchain this app is built on.

---

## 📬 Contact

<p>
  <a href="https://github.com/Pcmhacker-hero"><img alt="GitHub" src="https://img.shields.io/badge/GitHub-Pcmhacker--hero-181717?logo=github&style=for-the-badge" /></a>
  <a href="https://linkedin.com/in/prakash-meena-a46906324"><img alt="LinkedIn" src="https://img.shields.io/badge/LinkedIn-Prakash%20Meena-0a66c2?logo=linkedin&style=for-the-badge" /></a>
  <a href="mailto:pcmeena511@gmail.com"><img alt="Email" src="https://img.shields.io/badge/Email-pcmeena511%40gmail.com-ea4335?logo=gmail&logoColor=white&style=for-the-badge" /></a>
</p>

<div align="center">
  <sub>Built with ♥ for competitive programmers. If Verdiqx helps you climb, drop a ⭐ — it really does help.</sub>
</div>
