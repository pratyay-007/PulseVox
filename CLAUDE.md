# CLAUDE.md — PulseVox: Total Project Understanding

> Read this file fully, then open `PROGRESS.md` to see what is done and what is next, then open `PROMPT.md` before touching any UI.
> This file replaces the older `PulseVox-Build-Guide.md`. If they disagree, this file wins.

---

## 1. What PulseVox is

PulseVox is a **desktop-only web app** that works as a personal AI English-speaking coach.

1. The user gets a random speaking topic (from a pool of 50 fresh topics generated daily across many genres).
2. They get prep time (5–15 min, chosen by the user).
3. They speak for 2–5 minutes (chosen by the user) while the browser records.
4. The audio is transcribed (Groq Whisper), analysed by code (filler words, pace, pauses) and by an LLM (Groq, with a second Groq model as fallback).
5. They get **detailed feedback**, not just a score: grammar corrections, vocabulary upgrades, better phrasing, structure and confidence notes, and what to practise next.

**Owner context:** this is a personal project by one student, built with vibe coding. It will not be used by thousands of people. Keep it simple, free, and working. Do not over-engineer.

### Hard requirements
- **100% free to build, run and host.** No paid services.
- **No login, no accounts, no database** (no Supabase, no SQL). Only a small Redis counter store (Upstash).
- **Max 3 completed sessions per day per user**, enforced on the server.
- **Desktop/laptop only.** On mobile, show a message telling the user to open it on a laptop or desktop and block the app.
- **Real AI pipeline**, not a fake or mocked one: Whisper for speech-to-text, deterministic code for filler/pace stats, an LLM for language feedback.
- Whole product is built **in one pass** (no "basic version first"), but **one PROGRESS step at a time**. To save the owner's tokens, nothing is run or tested until the final verification phase (Phase 12).

---

## 2. User flow

1. **Landing (`/`)**: headline about practising English speaking, short real description, `[ start ]` button.
2. **Practice (`/practice`)** is a single-page state machine with these screens:
   1. **Genres**: multi-select genres (can pick several, or "select all"). At least one required.
   2. **Topic slot machine**: user presses `[ choose topic ]`. A vertical reel of random topics (from the chosen genres) spins fast, slows down, and **stops with the chosen topic centred**. This animation is a key feature of the product (see PROMPT.md for the exact spec). User can `[ spin again ]` or `[ use this topic ]`.
   3. **Timers**: user selects prep time (5–15 min, default 5) and speaking time (2–5 min, default 3).
   4. **Prep**: countdown, topic + hints visible, optional private notes box (stays in the browser, never sent anywhere), microphone permission + real input-level check. User may skip to speaking early.
   5. **Speaking**: recording starts when prep ends (or when the user skips). Countdown shown. User may finish early after 30 seconds.
   6. **Analysing**: shows **real** stages only: sending audio, transcribing, analysing.
   7. **Results**: transcript with highlighted mistakes, side-by-side improvements, stats, coaching summary, next steps. Saved to browser history.
3. **History (`/history`)**: past sessions saved in the browser (localStorage). A simple trend of filler words and pace over time.

The top session bar always shows the real number of trials left today, e.g. `trials left today: 2/3`.

---

## 3. Tech stack (fixed — do not change without asking the owner)

| Part | Choice |
|---|---|
| Framework | Next.js (App Router) + TypeScript |
| Styling | Plain CSS (global tokens + CSS modules). **No Tailwind, no UI library.** |
| Font | IBM Plex Mono (regular + medium), self-hosted via `@fontsource/ibm-plex-mono`, exposed as the font-family alias `TerminalPlex` |
| Speech-to-text | Groq Whisper (`whisper-large-v3-turbo`) via Groq's OpenAI-compatible audio endpoint |
| LLM feedback | Groq LLM (primary model) → a second, different Groq LLM (fallback, because Groq rate limits are per model). **No Cerebras** (its no-card free tier ended in July 2026 and now needs a card). **No OpenRouter.** |
| Counters + daily topics | Upstash Redis (free tier) via `@upstash/redis` |
| History | Browser `localStorage` |
| Hosting | Vercel Hobby (free) |

Model names change often on free tiers. **Never hard-code them.** Read them from env vars and verify the current names in the Groq docs before using them.

---

## 4. Environment variables

`.env.local` (never commit; also commit a `.env.example` with empty values):

```
GROQ_API_KEY=
GROQ_STT_MODEL=whisper-large-v3-turbo
GROQ_LLM_MODEL=qwen/qwen3.8-27b                   # primary feedback model (Oct 2026: verified available on Groq free tier)
GROQ_LLM_FALLBACK_MODEL=openai/gpt-oss-20b         # fallback: different, smaller/faster Groq model with its own rate limits
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
COOKIE_SECRET=             # long random string, used to sign the device cookie
CRON_SECRET=               # only if the optional cron step is done
DAILY_TRIALS_PER_DEVICE=3
DAILY_TRIALS_PER_IP=15     # looser: shared hostel/college Wi-Fi shares one IP
DAILY_GLOBAL_CAP=120
DEV_BYPASS_LIMIT=false     # true only locally, so testing does not burn trials
NEXT_PUBLIC_DEV_SHORT_TIMERS=false  # true only locally, allows 10-second timers for testing
```

All keys are **server-side only**. Never import them in client components. Only variables starting with `NEXT_PUBLIC_` may reach the browser, and only the dev-timer flag does.

---

## 5. Folder structure (target)

```
/app
  layout.tsx              root layout, loads tokens, mounts DesktopOnlyGate + SessionBar
  page.tsx                landing
  practice/page.tsx       practice flow (client state machine)
  history/page.tsx        local history
  api/
    usage/route.ts        GET remaining trials
    topics/route.ts       GET today's 50 topics (lazy-generates if missing)
    session/analyze/route.ts   POST audio -> transcript + stats + feedback (streams stage events)
    cron/generate-topics/route.ts   optional, secured with CRON_SECRET
/components
  DesktopOnlyGate.tsx  SessionBar.tsx  GenrePicker.tsx  SlotReel.tsx
  TimerSetup.tsx  PrepScreen.tsx  SpeakingScreen.tsx  AnalysingScreen.tsx  Results.tsx
/lib
  day.ts                  IST day key helper
  redis.ts                Upstash client
  limits.ts               device/IP/global counter logic
  device.ts               signed device cookie helpers
  topics.ts               generation, validation, dedupe, seed fallback
  rss.ts                  fetch current-affairs headlines
  groq.ts                 API client (speech-to-text + chat, with model fallback)
  stats.ts                filler words, WPM, pauses
  feedback.ts             prompt + JSON validation + provider fallback
  history.ts              localStorage helpers
/data/seed-topics.json    ~100 fallback topics
/middleware.ts            sets the signed device cookie
/public/fonts             self-hosted IBM Plex Mono woff2 files
CLAUDE.md  PROGRESS.md  PROMPT.md  .env.example
```

---

## 6. Redis data (the only server-side storage)

Day key = **IST date** (`Asia/Kolkata`), format `YYYY-MM-DD`, so everything resets at midnight IST.

| Key | Type | Purpose | Expiry |
|---|---|---|---|
| `usage:device:{deviceId}:{day}` | integer | completed sessions for this device today | 36 h |
| `usage:ip:{ipHash}:{day}` | integer | completed sessions for this IP today | 36 h |
| `usage:global:{day}` | integer | completed sessions today, all users | 36 h |
| `topics:{day}` | JSON string (50 topics) | today's topic pool | 8 days (needed for 7-day dedupe) |
| `topics:lock:{day}` | string (`SET NX`) | stops two requests generating topics at once | 2 min |

- Hash the IP (SHA-256 with `COOKIE_SECRET` as salt) before using it in a key. Never store raw IPs.
- **Increment counters only after a session fully succeeds.** A failed or too-short session must not use up a trial.
- If `DEV_BYPASS_LIMIT=true`, skip the checks (local development only).
- Free tier is 500K commands/month (about 16K/day). This app uses a few dozen commands per session, so it is fine. Do not add polling or per-keystroke Redis calls.

---

## 7. Anonymous identity

`middleware.ts` gives every visitor a random `device_id`, stored in an **httpOnly, SameSite=Lax cookie** (`Secure` in production, 1-year expiry), signed with HMAC-SHA256 using `COOKIE_SECRET` (use Web Crypto, since middleware runs on the Edge runtime). A tampered or missing signature means a fresh id is issued.

Honest limit: a person who clears cookies gets a fresh device id. The IP cap and global cap are the backstop. This is acceptable for a personal project.

---

## 8. Daily topics (50 per day)

**Shape**
```json
{ "id": "2026-11-01-03", "genre": "technology", "type": "opinion",
  "title": "…", "hints": ["…", "…"], "difficulty": "medium" }
```
- `type`: `opinion | debate | story | describe`; `difficulty`: `easy | medium | hard`.
- **10 genres × 5 topics = 50**: current-affairs, technology, society-culture, personal-stories, debate, career-education, health-sports-lifestyle, entertainment, ethics-scenarios, business-money.
- Each topic has 2–3 `hints` (guiding questions) so the user does not freeze.

**Generation (lazy, inside `GET /api/topics`)**
1. Read `topics:{today}`. If it exists, return it.
2. Otherwise try `SET topics:lock:{today} NX`. If the lock is taken, wait briefly and re-read; if still missing, fall back to the seed list.
3. Fetch headlines from 3–4 **verified working** free RSS feeds of reputable news sources (the agent must test that each feed responds before relying on it). The LLM does not know today's news, so the current-affairs genre must be built from these headlines. Prompt it to write **neutral, balanced** speaking prompts, never one-sided political ones.
4. One Groq LLM call (fallback model if it fails) generates the other genres as strict JSON.
5. Validate: correct shape, exactly 5 per genre, 50 total, no duplicate titles against the last 7 days of pools. Retry once. If it still fails, serve yesterday's pool, then the seed list.
6. Store at `topics:{today}`.

Optional last step: a daily Vercel Cron call to the same logic. On the Hobby plan cron runs once a day, only guarantees the hour, and uses UTC. The lazy path means the app works without it.

`/data/seed-topics.json` (about 100 hand-written topics across the same genres) is the last-resort fallback, so the app never has an empty pool.

---

## 9. AI pipeline: `POST /api/session/analyze`

Input: `multipart/form-data` with `audio` (WebM/Opus), `durationSec`, `topicTitle`.

**Steps (stream newline-delimited JSON events so the UI can show real stages):**
1. Validate the device cookie, then check the limits (device, IP, global). If blocked, return a clear error and call nothing external.
2. Event `{stage:"transcribing"}`: send audio to Groq Whisper with `response_format=verbose_json` and **word-level timestamps**.
   - **Known limitation:** Whisper often silently deletes "um/uh". Pass a `prompt` containing a short sample with natural hesitations (e.g. "Umm, so, let me think, uh, like, you know…") to encourage it to keep them, and rely on pause detection too. Never promise perfect filler detection.
3. Reject recordings under about 30 words as "too short". This returns an error and does **not** use up a trial.
4. Compute stats **in code** (`lib/stats.ts`, no AI): word count, words per minute, filler counts per type (um, uh, er, ah, hmm, you know, I mean, basically, actually, kind of, sort of; count "like" and "so" only as hesitations, e.g. after a pause of 0.4 s or more), pauses longer than 1.5 s with their positions, vocabulary variety ratio.
5. Event `{stage:"analysing"}`: send transcript + stats + topic to the primary Groq LLM. On error, timeout or HTTP 429, retry once on `GROQ_LLM_FALLBACK_MODEL`. Ask for **only valid JSON**.
6. Validate the JSON against the schema below. If invalid, retry once with the validation error appended. If it still fails, return a clear error (no trial used).
7. Increment device, IP and global counters. Event `{stage:"done", result}`.

**Audio is never stored.** It is processed in memory and discarded. Set a low recorder bitrate (about 32 kbps) so a 5-minute clip stays small (Vercel serverless request bodies are limited to roughly 4.5 MB, and Groq's free tier accepts files up to 25 MB). Set `maxDuration` on the route and check the current Hobby limits.

**Feedback schema**
```json
{
  "summary": "string, 3-5 sentences, speaks to the learner directly, references real numbers from stats",
  "strengths": ["string"],
  "grammar":    [{ "original": "exact quote from transcript", "improved": "string", "reason": "string" }],
  "vocabulary": [{ "original": "string", "better": "string", "note": "string" }],
  "phrasing":   [{ "original": "string", "improved": "string", "why": "string" }],
  "structure":  { "opening": "string", "body": "string", "closing": "string" },
  "confidence": "string",
  "topicRelevance": "string",
  "nextSteps": ["exactly 3 concrete practice actions"]
}
```
Rules for the prompt: every `original` must be a real quote from the transcript (the UI uses it to highlight mistakes; if a quote cannot be found in the transcript, the UI must skip the highlight, not crash). Do not invent mistakes to fill the lists; empty lists are fine. Be encouraging but honest. No numeric "score".

---

## 10. Limits and capacity

- Per device: 3 completed sessions/day. Per IP: 15/day. Global: `DAILY_GLOBAL_CAP` (default 120).
- Groq's free speech-to-text allows roughly 8 hours of audio per day, which is the real ceiling (about 130 sessions of 3.5 minutes). Free-tier numbers change, so re-check them before relying on them.
- When blocked, show a clear terminal-style message: "daily limit reached, resets at midnight IST", or "today's free capacity is full".

---

## 11. Desktop-only gate

- Rendered in the root layout so it covers every route.
- Block when the viewport is narrower than 1024px, **or** the device is a phone/tablet (`navigator.userAgentData?.mobile`, a UA regex for Android/iPhone/iPad/iPod/Mobile, or `(pointer: coarse) and (hover: none)`).
- When blocked: hide the entire app and show only this message in the terminal style: **"PulseVox needs a laptop or desktop. Please open this page on a laptop or desktop computer."** If the viewport is narrow on a desktop, add: "If you are on a desktop, widen this window."
- Do not mount the practice flow and never trigger the microphone permission prompt while blocked.
- Use CSS (`@media (max-width: 1023px)`) so there is no flash of the app on phones, plus a small JS check for tablets/UA. Add a `<noscript>` fallback.
- The 800px and 540px responsive rules in the design system therefore never apply inside the app. The design must still look right from 1024px up, including the 1100px narrowing.

---

## 12. Design

All visual rules live in **`PROMPT.md`** (Terminal style: black, green IBM Plex Mono, command/output layout, no rounded corners, no glow). Read it before writing any component. Never invent fake logs, statuses or metrics. Every number on screen must be real.

---

## 13. Rules for AI agents working on this repo

**Token efficiency is a hard rule.** The owner has a limited free token budget.

1. **Start of every session:** read this file, then `PROGRESS.md` (including the Session log). Read `PROMPT.md` only when you reach a UI step. Resume from the first unchecked `[ ]` step. Do not redo `[X]` steps.
2. **After finishing a step:** change `[ ]` to `[X]` in `PROGRESS.md` and add one line to the Session log (date, step number, what was done, anything the next agent must know). `[X]` means "code written", not "tested". Testing happens once, in Phase 12.
3. **Do NOT run `npm run dev`, `npm run build`, `npm run lint`, tests, or any verification command during Phases 0 to 11.** Just write correct code, re-read it once for obvious mistakes, and move on. The only allowed commands are creating the project and `npm install` of the dependencies listed in this file. All checking is done at the end in Phase 12.
4. **Save tokens:** do not re-read files you just wrote; do not print or paste large outputs; use small targeted edits instead of rewriting whole files; do not refactor or "improve" finished steps; keep chat replies to a few lines (what you did, what is next). Do not write explanations the owner did not ask for.
5. **One step at a time, in order.** Do not jump ahead. Do not mark a step done if it is only partly done: leave it `[ ]` and write what is missing under it.
6. **Steps marked `[USER]`** need the owner to do something (create API keys, deploy). Stop, tell the owner exactly what to do, and wait. **Never invent, hard-code or guess API keys.**
7. Do not add dependencies beyond those listed here without asking. Do not switch the stack.
8. Never put secrets in client code, logs or git. Keep `.env.local` out of git.
9. Never ship fake data, mocked AI output or placeholder feedback in the real flow. For testing later, use `DEV_BYPASS_LIMIT` and `NEXT_PUBLIC_DEV_SHORT_TIMERS`.
10. Keep accessibility (keyboard, visible focus, reduced motion, live regions) built into the code as you write it.
11. If you are interrupted mid-step, the step stays `[ ]`. The next agent must inspect only the files that step would have created, finish the step, and not duplicate work.
12. If something in this file turns out to be wrong (for example a model was retired or an endpoint changed), fix the code, then **update this file** so the next agent is not misled.

---

## 14. Known risks (be honest in the UI)

- Whisper may drop "um/uh", so filler counts can be low. The UI should word it as "detected fillers".
- Free-tier limits and model names change without notice.
- History lives only in the browser the user used. Clearing site data deletes it. Tell the user this on the history page.
- The daily limit can be bypassed by someone who clears cookies and changes network. This is accepted.
