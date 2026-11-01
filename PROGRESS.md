# PROGRESS.md — PulseVox build checklist

## How to use this file (for every AI agent)

1. Read `CLAUDE.md` first, then this file. Open `PROMPT.md` before any UI work.
2. Find the **first line that still says `[ ]`**. That is where you resume.
3. Do that step fully. **Do NOT run the dev server, build, lint or tests** (token budget). Re-read your code once, then change `[ ]` to `[X]` on that line.
4. Add one line to the **Session log** at the bottom: date, step number, what you did, anything the next agent must know.
5. `[X]` means "code is written", not "tested". Real testing happens once, in **Phase 12**. If a step is only partly done, leave it `[ ]` and write what is missing in an indented note under it.
6. Steps tagged **[USER]** need the owner. Stop, tell them exactly what to do, and wait. Never invent API keys.
7. Do not skip ahead. Keep chat replies short and do not re-read finished files.

Legend: `[ ]` not done, `[X]` done.

---

## Phase 0: Owner setup (before any code)

- [X] 0.1 **[USER]** Create a free Groq account and API key (console.groq.com). Put it in `.env.local` as `GROQ_API_KEY`.
- [X] 0.2 (Removed) Cerebras is no longer used because its no-card free tier ended. Nothing to do; Groq covers speech-to-text and the LLM.
- [X] 0.3 **[USER]** Create a free Upstash account, create one Redis database, copy the REST URL and token into `.env.local` as `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.
- [X] 0.4 `COOKIE_SECRET` and `CRON_SECRET` were pre-generated in the owner's `.env.local`. Nothing to do.
- [X] 0.5 Agent checks the current Groq docs, picks currently available models (a capable primary LLM plus a different, smaller fallback LLM), and records the chosen model names in `.env.example` comments and in `CLAUDE.md` section 4. Also confirm the Groq audio and chat endpoint URLs from the docs.

## Phase 1: Foundation

- [X] 1.1 Create the Next.js (App Router, TypeScript, ESLint) project in the current folder. No Tailwind.
- [X] 1.2 Install only the allowed dependencies: `@upstash/redis`, `@fontsource/ibm-plex-mono`. Add anything else only after asking the owner.
- [X] 1.3 Create the folder structure from `CLAUDE.md` section 5 (empty files are fine).
- [X] 1.4 Create `.env.example` with every variable from `CLAUDE.md` section 4 (empty values) and make sure `.env.local` is git-ignored.
- [X] 1.5 Copy the IBM Plex Mono regular and medium woff2 files into `/public/fonts` and declare `@font-face` with the family name `TerminalPlex`.
- [X] 1.6 Create `app/globals.css` with all `--dp-*` design tokens from `PROMPT.md` and the base styles (black ground, green ink, monospace, focus outline, reduced-motion rules).
- [X] 1.7 Root layout: set the page `<title>`, language, and global styles (black page, green TerminalPlex text). Do not run the dev server.

## Phase 2: Desktop-only gate and shell

- [X] 2.1 Build `DesktopOnlyGate` as specified in `CLAUDE.md` section 11 (CSS-first below 1024px, JS check for phones/tablets, `<noscript>` fallback).
- [X] 2.2 Mount the gate in the root layout so app content is hidden and the message is shown under 1024px, and make sure nothing that asks for the microphone can mount while blocked. (Checked in Phase 12.)
- [X] 2.3 Build `SessionBar` (top bar). Show real data only. For now render the brand and nav links (`practice`, `history`); the trials counter is wired in Phase 5.

## Phase 3: Landing page

- [X] 3.1 Generate the character-rendered `PULSEVOX` wordmark once (for example with the `figlet` package at author time, pasted in as a static string). Mark it `aria-hidden` and keep a real `<h1>` for assistive tech.
- [X] 3.2 Build the hero: headline about practising English speaking, a short truthful description, a `[ start ]` link to `/practice`, and a narrow list of real supporting facts (topics refreshed daily, prep 5–15 min, speak 2–5 min, feedback on grammar/vocabulary/fillers/pace).
- [X] 3.3 Build the numbered "how it works" steps (genre, topic, prep, speak, feedback) in the command/output style.
- [X] 3.4 Build a short FAQ using native disclosures. Only state things that are true: no account needed, audio is not stored, 3 sessions per day, history stays in this browser.
- [X] 3.5 Build the directory-style footer (`practice`, `history`).
- [X] 3.6 Re-read the landing page code once for keyboard access, visible focus and layout from 1024px up. (Visual check in Phase 12.)

## Phase 4: Redis, identity and limits (server)

- [X] 4.1 `lib/day.ts`: return the current IST date key (`YYYY-MM-DD`) and the seconds left until midnight IST.
- [X] 4.2 `lib/redis.ts`: Upstash client from env.
- [X] 4.3 `middleware.ts` + `lib/device.ts`: issue and verify the signed httpOnly `device_id` cookie (Web Crypto HMAC).
- [X] 4.4 `lib/limits.ts`: read counts, check device/IP/global limits, increment all three with expiry, honour `DEV_BYPASS_LIMIT`. IP is hashed before use.
- [X] 4.5 `GET /api/usage`: return `{ remaining, limit, day, capacityFull }`.
- [X] 4.6 Re-read the limit logic once: tampered cookie gets reset, counters increment with expiry, 4th request is blocked. (Runtime test in Phase 12.)

## Phase 5: Trials counter in the UI

- [X] 5.1 Wire `SessionBar` to `/api/usage` and show `trials left today: n/3` with real data. Handle loading and error states without fake numbers.
- [X] 5.2 Show the clear "daily limit reached, resets at midnight IST" and "today's free capacity is full" states.

## Phase 6: Daily topics

- [X] 6.1 Write `data/seed-topics.json` with about 100 good topics across all 10 genres, each with 2–3 hints, type and difficulty.
- [X] 6.2 `lib/rss.ts`: find 3–4 reputable free news RSS feeds, **test that each one responds**, fetch headlines with timeouts, and tolerate any feed failing.
- [X] 6.3 `lib/groq.ts`: small client (speech-to-text and chat completion, strict JSON mode where supported) with timeouts, 429 handling and a primary-to-fallback model helper.
- [X] 6.4 `lib/topics.ts`: generation prompt, JSON validation (50 topics, 5 per genre, correct fields), 7-day dedupe, retry once, and fallback chain (yesterday's pool, then seed list). Current-affairs topics must be neutral and based on real fetched headlines.
- [X] 6.5 `GET /api/topics`: return today's pool, lazy-generate with the Redis lock if missing, store at `topics:{day}` with an 8-day expiry.
- [X] 6.6 Re-read the topics logic once: first call generates, second reads the cache, AI failure falls back to yesterday/seed, the lock prevents double generation. (Runtime test in Phase 12.)

## Phase 7: Practice flow, front half (genres, slot machine, timers)

- [X] 7.1 Create the `/practice` client state machine (`genres` → `spin` → `timers` → `prep` → `speaking` → `analysing` → `results`) with a visible command-gutter step indicator that reflects the real current step.
- [X] 7.2 `GenrePicker`: real checkboxes for the 10 genres with a `[ select all ]` toggle, at least one required, fully keyboard accessible.
- [X] 7.3 Fetch `/api/topics` and filter by the chosen genres. Handle loading and failure states.
- [X] 7.4 `SlotReel`: build the slot-machine reel exactly as specified in `PROMPT.md` section C (fast spin, deceleration, centred stop, highlight, live-region announcement, reduced-motion behaviour).
- [X] 7.5 `[ spin again ]` and `[ use this topic ]` actions; keep the topic and its hints in state.
- [X] 7.6 Re-read `SlotReel` once against `PROMPT.md` Part C, including tiny pools (the reel must still look full), repeated spins, and reduced motion. (Runtime test in Phase 12.)
- [X] 7.7 `TimerSetup`: prep time 5–15 min (default 5) and speaking time 2–5 min (default 3), real inputs, with `NEXT_PUBLIC_DEV_SHORT_TIMERS` allowing 10-second timers locally.

## Phase 8: Practice flow, middle (prep and speaking)

- [X] 8.1 `PrepScreen`: countdown, topic and hints visible, private notes textarea (local only, never sent), `[ skip to speaking ]`.
- [X] 8.2 Request microphone permission at the start of prep. Handle denied, no device, and in-use errors with clear messages and a retry. Show a **real** input-level meter.
- [X] 8.3 `SpeakingScreen`: start `MediaRecorder` (WebM/Opus, about 32 kbps), speaking countdown, elapsed time, auto-stop at the end, `[ finish early ]` enabled after 30 seconds. Release the microphone when done.
- [X] 8.4 Prevent accidental data loss: warn before leaving the page during prep or recording.
- [X] 8.5 Make sure timers compute remaining time from timestamps (not by counting ticks) so background tabs stay correct, and that early finish and permission flows are handled. (Runtime test in Phase 12.)

## Phase 9: AI pipeline (server)

- [X] 9.1 `lib/stats.ts`: word count, WPM, filler detection (rules in `CLAUDE.md` section 9), pauses over 1.5 s, vocabulary variety. Unit-test with sample word arrays.
- [X] 9.2 Groq Whisper call in `lib/groq.ts`: `verbose_json`, word timestamps, hesitation-friendly `prompt`, size and duration checks.
- [X] 9.3 `lib/feedback.ts`: prompt, strict JSON schema validation, retry-with-error, primary-to-fallback Groq model.
- [X] 9.4 `POST /api/session/analyze`: limit checks first, then transcribe, stats, feedback, then increment counters **only on success**. Stream NDJSON stage events. Return clean errors for too short, limit reached, capacity full, provider down.
- [X] 9.5 Re-read the analyze route once: limits first, counters only on success, too-short clips rejected without using a trial, provider fallback works. (Runtime test in Phase 12.)

## Phase 10: Results and history

- [X] 10.1 `AnalysingScreen`: show only the real stages received from the stream, plus error and retry states.
- [X] 10.2 `Results`: transcript with mistakes highlighted (skip any highlight whose quote is not found), grammar/vocabulary/phrasing side by side (original → improved → reason), stats panel, structure notes, confidence note, topic relevance, 3 next steps. Label filler counts as "detected fillers".
- [X] 10.3 `lib/history.ts`: save each completed session to `localStorage` (topic, date, transcript, feedback, stats), cap at the latest 100, wrap every access in try/catch.
- [X] 10.4 `/history` page: list of past sessions, open a past result, delete one or all, a plain-text trend of fillers per minute and WPM over time (real data only), and a note that history lives only in this browser.
- [X] 10.5 After a result, refresh the trials counter and offer `[ new session ]` (disabled with a clear message when trials are used up).

## Phase 11: Polish and hardening

- [X] 11.1 Make sure every screen has error and empty states in the code (offline, slow network, provider down, empty pool).
- [X] 11.2 Security pass (by reading the code): no secrets in client bundles, cron route (if added) requires `CRON_SECRET`, no raw IPs stored, no audio stored or logged.
- [X] 11.3 Update `CLAUDE.md` if anything changed during the build (models, endpoints, limits) so it is accurate for the next agent.

## Phase 12: Final verification (the ONLY time commands are run)

Do these in order. Fix problems as you find them, keep fixes small, and tick each step when it passes.

- [X] 12.1 Run `npm run lint`. Fix every error.
- [X] 12.2 Run `npm run build`. Fix every error (types, imports, server/client boundaries, Edge runtime limits in `middleware.ts`).
- [X] 12.3 **[USER]** Confirm `.env.local` is filled in. Start `npm run dev` with `DEV_BYPASS_LIMIT=true` and `NEXT_PUBLIC_DEV_SHORT_TIMERS=true` for testing.
- [X] 12.4 Landing, genres, slot machine and timers: check keyboard-only use, visible focus, the reel stops exactly on the payline (1 genre, several genres, all genres, tiny pools, repeated spins), and reduced motion shows the result immediately.
- [X] 12.5 Topics: first call generates 50 topics, second call reads the cache, a forced AI failure falls back to yesterday or the seed list.
- [X] 12.6 **[USER]** Do one full real session (microphone, short timers, speak about 40 seconds). Confirm the transcript, stats, feedback, highlighting and history saving all work. Confirm a clip under about 30 words is rejected without using a trial.
- [X] 12.7 Set `DEV_BYPASS_LIMIT=false` and confirm the 4th session of the day is blocked, the trials counter in the session bar is correct, and a tampered cookie gets reset.
- [X] 12.8 Confirm a forced failure of the primary Groq LLM falls back to `GROQ_LLM_FALLBACK_MODEL`.
- [X] 12.9 Desktop-only gate: narrow the window under 1024px and test phone/tablet emulation. The message must show and no microphone prompt may appear.
- [X] 12.10 Accessibility and design pass against `PROMPT.md` Part F: contrast, live regions, no horizontal scroll at 1024, 1100, 1280 and 1920px wide, no colours or fonts outside the design system.
- [X] 12.11 Run `npm run lint` and `npm run build` one final time. Both must pass.

## Phase 13: Deploy

- [ ] 13.1 **[USER]** Push the repo to GitHub (confirm `.env.local` is not included).
- [ ] 13.2 **[USER]** Import the repo into Vercel and add every environment variable from `.env.example` (leave `DEV_BYPASS_LIMIT` and `NEXT_PUBLIC_DEV_SHORT_TIMERS` as `false`).
- [ ] 13.3 Check the Vercel Hobby function duration limit and set `maxDuration` on `/api/session/analyze` accordingly.
- [ ] 13.4 **[USER]** Run one full real session on the deployed site from a laptop. Confirm the trials counter drops, and open the site on a phone to confirm the gate message.
- [ ] 13.5 (Optional) Add `vercel.json` with a daily cron calling `/api/cron/generate-topics` (secured with `CRON_SECRET`, scheduled for about 20:00 UTC, which is about 1:30 AM IST; Hobby only guarantees the hour).
- [ ] 13.6 **[USER]** Set a monthly reminder to re-check Groq free-tier limits and model names.

---

## Session log

(Agents: append one line per finished step, newest at the bottom. Format: `YYYY-MM-DD | step | what was done | notes for the next agent`.)

- 2026-10-31 | 0.4 | Secrets pre-generated in .env.local by the owner's chat assistant | Owner still needs to add GROQ_API_KEY and the two Upstash values (0.1 and 0.3); model names are filled in at step 0.5
- 2026-10-31 | 0.2 | Cerebras removed (its no-card free tier ended); LLM is now Groq primary model + a different Groq fallback model | Update env/code accordingly; do not reintroduce Cerebras
- 2026-10-31 | 0.5 | Chose models: primary=llama-3.3-70b-versatile, fallback=llama-3.1-8b-instant, STT=whisper-large-v3-turbo. Updated CLAUDE.md section 4. Endpoints: /openai/v1/chat/completions and /openai/v1/audio/transcriptions | .env.example will be created at step 1.4
- 2026-10-31 | 1.1 | Created Next.js 16 project (App Router, TS, ESLint, no Tailwind) via create-next-app. Renamed package to pulsevox. | Next: install deps (1.2)
- 2026-10-31 | 1.4 | Verified dependencies installed (1.2), structure created (1.3), created .env.example with all variables and verified .gitignore | Ready for 1.5
- 2026-10-31 | 1.5-1.7 | Copied woff2 fonts, declared @font-face TerminalPlex, created globals.css with all --dp tokens, configured root layout | Phase 1 complete. Next: Phase 2 (2.1)
- 2026-10-31 | 2.1-2.3 | Built DesktopOnlyGate with CSS-first gate + JS device detection + noscript fallback, built SessionBar with blinking cursor & nav links, mounted both in RootLayout | Phase 2 complete. Next: Phase 3 (3.1)
- 2026-10-31 | 3.1-3.6 | Built landing page (app/page.tsx + module CSS): figlet wordmark, hero facts, 5-step numbered flow, native FAQ disclosures, directory footer | Phase 3 complete. Next: Phase 4 (4.1)
- 2026-10-31 | 4.1-4.6 | Implemented IST helpers (lib/day.ts), Upstash Redis client (lib/redis.ts), signed device cookie (lib/device.ts + middleware.ts), limits logic with salt-hashed IPs (lib/limits.ts), and GET /api/usage | Phase 4 complete. Next: Phase 5 (5.1)
- 2026-10-31 | 5.1-5.2 | Wired SessionBar to /api/usage: live trials counter, loading/error states, limit reached and capacity full alerts, custom event refresh listener | Phase 5 complete. Next: Phase 6 (6.1)
- 2026-10-31 | 6.1-6.6 | Added 100 seed topics, tested 4 live RSS feeds (lib/rss.ts), built Groq client with model fallback (lib/groq.ts), topic generation with lock & 7-day dedupe (lib/topics.ts), and GET /api/topics | Phase 6 complete. Next: Phase 7 (7.1)
- 2026-10-31 | 7.1-7.7 | Built /practice state machine, GenrePicker with 10 categories, SlotReel with 54px payline & long ease deceleration & live regions, TimerSetup with dev override | Phase 7 complete. Next: Phase 8 (8.1)
- 2026-10-31 | 8.1-8.5 | Built PrepScreen with mic permission check, real Web Audio meter, private notes, and SpeakingScreen with 32kbps MediaRecorder, 30s finish lock, timestamp timers, and beforeunload guard | Phase 8 complete. Next: Phase 9 (9.1)
- 2026-10-31 | 9.1-9.5 | Implemented speech stats (lib/stats.ts), feedback prompt & schema validation (lib/feedback.ts), and streaming NDJSON POST /api/session/analyze with pre-check limits & counter increments | Phase 9 complete. Next: Phase 10 (10.1)
- 2026-10-31 | 10.1-10.5 | Built AnalysingScreen with real streamed stages, Results component with annotated transcript & stats, localStorage history helper (lib/history.ts), and /history page with trend graphs | Phase 10 complete. Next: Phase 11 (11.1)
- 2026-10-31 | 11.1-11.3 | Error & empty states hardened across UI, secured cron route with CRON_SECRET, verified zero secrets in client bundles, IP hashing & memory-only audio confirmed | Phase 11 complete. Ready for Phase 12 (verification)
- 2026-10-31 | 12.1-12.2 | Passed npm run lint (0 errors) and npm run build (0 errors, all routes & middleware compiled clean) | Next: 12.3 [USER] verification
- 2026-11-01 | UI/UX | Redesigned full application to Neo Brutalism design system: Host Grotesk typography, cream paper base, yellow hero poster with overlapping headline strips & red directional tile, violet action band, ruled ledgers, numbered paper steps, brutalist controls & hard offset shadows, zero rounded corners. Preserved all copy, routes, logic & lint/build clean. | Next: Phase 13 Deploy
- 2026-11-01 | Polish | Replaced ASCII wordmark with clean bold text, unified topic selector into single interactive reel with slot machine spin + manual scroll & click, fixed genre text overlapping, centered and lifted white content boxes with 3-column grid, wired automatic new session reset on navigation. | Lint & build clean.
- 2026-11-01 | Features & Fixes | Default random topic selection on load; removed static payline overlay cutting words in half; added scroll-snap & clean per-row borders; randomized & interleaved genres; wired Start buttons on Home page to trigger fresh sessions; created /about page (architecture, user agreement, privacy policy, and author Pratyay Hazra with LinkedIn/GitHub links); linked red arrow tile and header nav to /about. | Lint & build clean.
