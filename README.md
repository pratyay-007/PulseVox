# PulseVox

**An AI speaking coach for English practice. Get a topic, prepare, speak, and receive detailed, actionable feedback.**

**Live app: [pulse-vox.vercel.app](https://pulse-vox.vercel.app/)** (open it on a laptop or desktop and allow microphone access)

PulseVox helps you improve your spoken English through short daily practice sessions. There is no sign-up and no tutor needed. You receive a fresh speaking topic, a timed preparation window and a timed speaking window. The app then transcribes your speech and explains exactly what to improve, with better ways to say it.

<!-- Add 2 or 3 screenshots here: the topic reel, the prep screen, the results page.
     Example: ![Topic reel](docs/reel.png) -->

---

## How to use it

1. **Choose genres.** Pick one, several, or all.
2. **Choose a topic.** A slot-machine style reel spins and stops on your topic, with hints to help you start.
3. **Set timers.** Preparation: 5 to 15 minutes. Speaking: 2 to 5 minutes.
4. **Prepare.** Use the countdown, write private notes, and check your microphone level.
5. **Speak.** The browser records while the timer runs. You can finish early after 30 seconds.
6. **Review your feedback.** Read the transcript, corrections and next steps. Past sessions are saved in your browser.

Each user gets **3 completed sessions per day**.

## What the feedback includes

- **Grammar corrections:** your original sentence, an improved version, and the reason.
- **Vocabulary upgrades** and **better phrasing**.
- **Speaking statistics:** words per minute, detected filler words, long pauses, vocabulary variety.
- **Structure notes** on your opening, body and closing, plus notes on confidence and topic relevance.
- **Three concrete next steps** for your next session.

The goal is not only a score. It is to show what to fix and how to say it better.

## Features

- 50 fresh topics every day across 10 genres, generated from real news headlines and other prompts
- A real AI pipeline: speech-to-text, a code-based analysis of filler words and pace, and an LLM for language feedback
- No accounts. Results and history are stored in your own browser
- Server-side daily limits (3 sessions per user per day, plus a network cap and a global cap)
- **Audio is never stored.** It is processed in memory and discarded
- Terminal-style interface that is keyboard accessible and respects reduced-motion settings
- Desktop and laptop only. Phones and small screens see a message asking to open it on a computer

## Architecture

```
Browser (MediaRecorder, WebM/Opus)
   |
   v
Next.js API route  /api/session/analyze
   |-- Limits check ........ Upstash Redis (device cookie, network, global cap)
   |-- Speech-to-text ...... Groq Whisper (word-level timestamps)
   |-- Code analysis ....... words per minute, filler words, pauses
   `-- LLM feedback ........ Groq (gpt-oss-120b, fallback gpt-oss-20b) -> validated JSON
   |
   v
Results screen + history in localStorage

Daily topics: first request of the day (IST) -> news RSS headlines + LLM -> validated,
de-duplicated pool cached in Redis -> fallback to yesterday's pool, then a built-in list.
```

## Tech stack

| Part | Technology |
|---|---|
| Framework | Next.js (App Router) and TypeScript |
| Styling | Plain CSS with design tokens, IBM Plex Mono |
| Speech-to-text | Groq Whisper (`whisper-large-v3-turbo`) |
| Feedback LLM | Groq `openai/gpt-oss-120b`, with `openai/gpt-oss-20b` as fallback |
| Limits and topic cache | Upstash Redis |
| History | Browser `localStorage` |
| Hosting | Vercel |

The whole project runs on free tiers.

## Engineering notes

- **Provider selection under a zero budget.** I compared free tiers for speech-to-text and LLM inference, and chose providers that need no payment card. When one provider changed its free tier, I replaced it and adjusted the design.
- **Model lifecycle.** Models on free tiers get retired. The app reads model names from environment variables and uses a different fallback model, because rate limits are applied per model.
- **Reasoning models and token budgets.** Reasoning models spend part of the completion budget on hidden reasoning. The app sets generous completion limits, keeps outputs compact, and validates the returned JSON itself, retrying once on failure instead of trusting provider-side validation.
- **Rate limits.** Output-tokens-per-minute limits count requested tokens, so the app sizes each request to the model's limit and runs one analysis at a time.
- **Abuse control without accounts.** A signed anonymous device cookie, a looser per-network cap (shared Wi-Fi is common) and a global daily cap, all enforced on the server with Redis counters. A trial is counted only after a session succeeds.
- **Deterministic metrics in code.** Pace, pauses and filler words are computed from word timestamps rather than asked from the LLM, which makes them more reliable and cheaper.
- **Privacy by design.** No accounts, no stored audio, and no raw IP addresses in storage (they are hashed).


## Known limitations

- The speech model can silently drop fillers such as "um" and "uh", so the count shows **detected** fillers only.
- Free-tier limits and model names change often. If feedback stops working, check the provider console first.
- History lives only in the browser you used. Clearing site data deletes it.
- The daily limit uses a device cookie plus a looser network cap, so a determined person can get extra sessions. This is acceptable for a personal project.
- Desktop only, by design.

## Author

**Pratyay Hazra**, B.Tech Computer Science student. I designed the product, researched and selected the APIs and models, wrote the technical specification, and built PulseVox with AI-assisted development.

- LinkedIn: [linkedin.com/in/pratyay-hazra](https://www.linkedin.com/in/pratyay-hazra)
- GitHub: [github.com/pratyay-007](https://github.com/pratyay-007)

Feedback, ideas and bug reports are welcome.
