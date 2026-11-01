# PROMPT.md — PulseVox UI/UX Design Prompt

> For the AI agent: read `CLAUDE.md` first (what the product is and does), then use this file for **every** visual and interaction decision.
> Part A is the base design system (the owner's chosen "Terminal" style). Parts B to H apply it to PulseVox, screen by screen.
> If Part A and Parts B–H seem to clash, Parts B–H win for PulseVox, because they were written for this product.

---

## Part A: Base design system (authoritative)

```xml
<prompt>
<task>
Apply this visual style to the user's existing project. Inspect and preserve its stack, copy, routes, and behavior. Follow existing component and styling conventions. Treat framework, library, and page examples in these design instructions as illustrations; they do not require a stack change or new sections. Scope changes to the user's requested work.

Keep controls keyboard accessible, focus visible, and text legible. Preserve reading order, responsive behavior, and reduced-motion preferences. Verify actual states at the rendered width. The user's stack and content take precedence over illustrative implementation details.
</task>

<design-system>
# Terminal

## Identity

Build a continuous black page in green IBM Plex Mono. Arrange content as commands and their output, with a numbered command gutter, character-based alignment, and thin green rules. White is reserved for strong emphasis. The page should read like a useful session manual.

## Layout

Use a narrow command gutter beside a wider output column. Measure horizontal spacing in character units so numbers, labels, and text share a consistent rhythm. A compact session bar can introduce the page. The opening may pair a large title and actions with a narrow list of supporting facts.

Carry the command/output relationship through the page. Available output patterns include a compact capability listing, numbered steps, quoted statements with attribution, broad comparison rows, and a directory-style footer. Keep related information in rows with fine separators. Use a larger gap between commands than between lines of output.

A character-rendered wordmark or image can be part of the identity, but derive it from the customer's name or actual imagery. Do not invent shell commands, logs, file paths, statuses, or metrics that imply functionality the product lacks.

## Typography

Use IBM Plex Mono regular and medium, bound to the "TerminalPlex" alias. All text, controls, and numbers stay monospaced. Use the body, label, heading, and display tokens to preserve the restrained scale. Keep ordinary reading at the body-leading value and lists aligned to the row spacing. Prefer weight, white emphasis, punctuation, and indentation to another font or oversized display typography.

## Color and surfaces

Use ground for black, ink for primary green, ink-muted for supporting text, and rule for quiet separators. Emphasis is white. Keep every field flat and square. Do not add glow around reading text, simulated screen curvature, texture, or shaded cards. A filled green control with black text can identify an action or selected state.

## Components

Present actions as clearly labeled rectangular controls or bracketed links. Use inversion or an underline for hover and a visible outline for keyboard focus. A comparison can use one row per option, with identity at the left, features in the output column, and the action beneath. Keep a featured label separate from the current selection and expose selection through the control's semantics.

Native disclosures can use a compact question row and plus/minus at the right. Keep the answer indented into the output column. Every visual command that acts must remain a real link or button; decorative syntax must not obscure its name.

## Images

The distinctive image treatment is a fixed-width character rendition of a real photograph. Preserve enough tonal structure to recognize the subject, and keep accessible image text describing the source image. Mark the decorative character rendition as hidden from assistive technology to avoid reading a wall of symbols. Reserve its dimensions and keep character alignment intact. Use this pattern only where an image helps; portraits and decorative graphics are not required.

## Motion

A single cursor can blink at the motion token's interval using discrete steps. Stop the blink under reduced motion. Other content and state changes remain still and immediate. Do not animate typing, stream invented logs, or make the reader wait for text to appear.

## Responsive behavior

At 1100px, narrow the command gutter and comparison identity column. At 800px, stack the hero and prose, simplify capability rows, and move comparisons to a vertical layout. Editorial entries can temporarily pair a character image with text beside it. At 540px, stack those entries, shorten indentation, and use single-column feature lists. Preserve the command/output relationship without horizontal scrolling. Footer groups can remain in two columns where their labels fit.

## Design limits

Keep the interface green, black, and white, with character-aligned structure and no rounded cards. Use actual customer content and meaningful command wording. A terminal appearance does not justify fake output, inaccessible preformatted prose, or decorative progress indicators.

## Authoritative tokens

<prompt>
<task>
Apply this visual style to the user's existing project. Inspect and preserve its stack, copy, routes, and behavior. Follow existing component and styling conventions. Treat framework, library, and page examples in these design instructions as illustrations; they do not require a stack change or new sections. Scope changes to the user's requested work.

Keep controls keyboard accessible, focus visible, and text legible. Preserve reading order, responsive behavior, and reduced-motion preferences. Verify actual states at the rendered width. The user's stack and content take precedence over illustrative implementation details.
</task>

<design-system>
# Neo Brutalism

## Identity

Use an unfolded press sheet with cream paper, yellow, red, violet, heavy black outlines, and solid offset shadows. Oversized headline strips, overlaps, and slightly rotated clippings create the energy. Reading areas remain stable and clearly divided beneath them.

## Layout

Open with a yellow poster carrying a large uppercase statement across overlapping strips. Mix yellow, cream, and black strip treatments and use one red arrow tile as a directional accent. A violet band beneath can hold the explanation and actions.

Carry exposed seams and occasional overlaps across section boundaries. Features can use a ruled ledger; editorial images can become staggered clippings with small rotations. Numbered paper steps, a yellow benefit field, and tilted quotation slips are available when the content needs them. Comparisons work as broad horizontal rows with clear internal divisions. Close with another large yellow poster on a red field before a grouped footer.

Keep the sense of one assembled sheet. The customer's brief supplies the content and determines which of these patterns appears.

## Typography

Use Host Grotesk throughout, bound to "NeoBrutalismHost". Display text is very heavy, tightly tracked, and often uppercase. Let it occupy broad strips with compact leading. Use bold reading text at a smaller scale, and reserve the largest figures for information that deserves attention. Keep supporting paragraphs upright even when a nearby label or clipping is tilted.

## Color and surfaces

Cream paper is the base, with black ink and outlines. Use yellow for dominant posters and emphasis, red for strong interruptions, and violet for supporting bands. White gives dense reading or image areas a clearer ground.

Use exposed thick borders, square corners, and hard shadows without blur. Overlaps should look intentional and preserve the seams that explain the layout. Reduce rotation when content becomes long; legibility matters more than an irregular edge.

## Components

Buttons have heavy outlines and solid offset shadows. Hover can lift a control by a few pixels and enlarge its shadow; pressing brings it back toward the shadow. Make these changes immediate. A distinct focus outline must remain visible around the control.

Features use symbols, headings, and ruled reading cells. Optional comparison rows keep the featured row yellow with its own badge, while selection changes the action's fill and adds a readable mark. Disclosures use boxed plus/minus signs and a clear open fill. Quotes and facts must come from the customer's content.

## Images

Use natural-color editorial photographs as wide paper clippings with black frames and offset shadows. Vary their size, vertical position, and slight rotation while keeping the subjects recognizable. Avoid decorative cropping through important details. Reserve dimensions, describe meaningful images in alternative text, and keep decorative arrows separate from image descriptions.

## Motion

Use immediate control feedback. Keep headline strips, clippings, and poster rotations static. Do not animate wobble, bouncing stickers, or perpetual shaking.

## Responsive behavior

At 1050px, tighten splits and reduce large spacing. At 720px, stack the major structures, soften rotations, and reduce hard-shadow offsets. Facts can remain in two columns. Feature symbols and headings share a row above their explanation; comparisons stack internally. Keep image crops wide and footer groups in two columns. At very narrow widths, reduce headline and control sizes enough to preserve the full label and edge.

## Design limits

Keep every overlap clear of essential text and hit areas. Avoid blurred shadows, gradients, glass, soft pill styling, and random sticker decoration. The press-sheet treatment should still support a coherent reading sequence and useful controls.

## Authoritative tokens

| CSS variable | Value |
| --- | --- |
| --dp-color-ground | #fff5d6 |
| --dp-color-ink | #000000 |
| --dp-color-emphasis | #ffed00 |
| --dp-color-signal | #ff4332 |
| --dp-color-field | #d4bdff |
| --dp-color-contrast | #ffffff |
| --dp-typography-face | "NeoBrutalismHost", sans-serif |
| --dp-typography-body | 17px |
| --dp-typography-reading | 16px |
| --dp-typography-small | 14px |
| --dp-typography-metadata | 13px |
| --dp-typography-label | 12px |
| --dp-typography-reading-weight | 700 |
| --dp-typography-emphasis-weight | 800 |
| --dp-typography-display-weight | 900 |
| --dp-typography-display-tracking | -0.065em |
| --dp-spacing-gap | 24px |
| --dp-spacing-gap-compact | 18px |
| --dp-radius-control | 0 |
| --dp-border-panel | 4px |
| --dp-border-divider | 3px |
| --dp-border-annotation | 2px |
| --dp-motion-interaction | 0s |
</design-system>
</prompt>
```

---

## Part B: How to apply the system to PulseVox

### B1. Implementation rules
- Plain CSS: put all tokens in `:root` inside `app/globals.css` exactly as named above. Components use CSS modules and **only** `var(--dp-*)` values. No hard-coded colours, no Tailwind, no UI library, no icon library.
- Declare `@font-face` with `font-family: "TerminalPlex"` for IBM Plex Mono 400 and 500 (self-hosted woff2 in `/public/fonts`, `font-display: swap`). Never use another font.
- `border-radius: var(--dp-radius-control)` (0) everywhere. No box-shadow, no text-shadow, no gradients, no blur, no background textures.
- Colours in use: black ground, green ink, muted green, quiet rule green, white emphasis. Nothing else. The danger/error state is also expressed in these colours (white text with a `!` prefix), never red.

### B2. Page grid
- Two columns: a **command gutter** (numbers and prompts, about 6ch wide) and an **output column** (about 76ch maximum, `minmax(0, 76ch)`). Left-aligned, page padding of `var(--dp-spacing-column-gap-wide)`.
- At widths under 1100px, narrow the gutter to about 4ch. The app is blocked below 1024px (see Part G), so 800px and 540px rules from Part A are **never reached** inside the app; do not build them.
- Space between commands: `var(--dp-spacing-section-compact)`. Space between lines of output: `var(--dp-spacing-row-compact)` or the 27px list rhythm. Separators between related rows: 1px `--dp-color-rule`.
- Every interactive row must keep the 27px rhythm so everything lines up on the same character grid.

### B3. Session bar (top, on every page)
One compact row: `PULSEVOX` · links `[ practice ]` `[ history ]` · right-aligned `trials left today: 2/3` (real value from `/api/usage`, never a placeholder number; while loading show `trials left today: …`, on error show `trials left today: unavailable`). A **single** blinking block cursor sits after the brand (blinks with `steps(1)` at `--dp-motion-cursor`, stops under `prefers-reduced-motion`). This is the only cursor on the whole page.

### B4. Commands and output wording
Use plain, meaningful labels that name the real action, shown after a `>` prompt in the gutter column, for example `> choose genres`, `> choose topic`, `> set timers`, `> prepare`, `> speak`, `> results`. Do **not** print fake shell commands, fake logs, fake file paths, or fake statuses. Every line of output on screen is either the real content, a real state, or a real number.

### B5. Controls
- Buttons and links look like bracketed rectangles: `[ start ]`, `[ choose topic ]`, `[ spin again ]`, `[ use this topic ]`, `[ skip to speaking ]`, `[ finish early ]`, `[ new session ]`.
- **Primary action** on a screen: filled green background with black text (the selected/primary state). Secondary actions: bracketed text in green.
- Hover: invert (green background, black text) or underline. Keyboard focus: `outline: 2px solid var(--dp-color-emphasis); outline-offset: 2px;`, always visible, never removed.
- Disabled: muted green, no hover inversion, with `aria-disabled` or `disabled`, and a visible reason nearby (for example "choose at least one genre").
- Real `<button>` and `<a>` elements only. The brackets are visual, and must not stop the accessible name from reading cleanly (put the brackets in CSS pseudo-elements or `aria-hidden` spans).
- Checkboxes (genres): real `<input type="checkbox">`, visually hidden, with the label drawn as `[x] technology` / `[ ] technology` using `:checked` and `:focus-visible` on the label.
- Number/time controls: real `<input type="range">` or `<select>`, styled flat and square with green ink; value shown in text next to it (`prep time: 5 min`).

---

## Part C: The topic slot machine (the most important interaction)

The owner calls this "very important". It must feel like a slot machine: topics rush past, slow down, and **stop with the chosen topic exactly in the middle**. Keep it in the terminal style (flat, green, no glow).

### C1. Visual structure
- A **reel window** in the output column: 5 visible rows, each row 54px tall (two 27px units), so the window is 270px high. Full output-column width.
- The **centre row** is the "payline": a 1px `--dp-color-rule` line above and below it, and a `>` marker in the gutter on its left and `<` on its right, both in `--dp-color-ink`.
- Each row is one line: `[genre]  topic title`, in a fixed grid (genre label column about 22ch, title takes the rest), the title truncated with an ellipsis. Rows never wrap and never change height during the spin.
- Row colours: centre row `--dp-color-ink`; the rows above and below `--dp-color-ink-muted`. **No blur, no fade gradients, no glow.**
- The window has `overflow: hidden`. The reel strip sits inside and moves with `transform: translate3d(0, Ypx, 0)`.
- When the reel has stopped, the centre row turns white (`--dp-color-emphasis`, medium weight) and the **full topic** appears in an output block directly under the window (title in white, then the 2–3 hints as muted lines prefixed with `-`, then type and difficulty). The block's height is reserved so nothing jumps.

### C2. Building the reel strip
1. Take the pool: today's 50 topics filtered by the selected genres.
2. Build a strip of about **40 rows before** the target, the **target row**, and **3 rows after** it (so rows below the payline are visible when it stops).
3. Fill the "before" rows by random draws from the pool, never repeating the same topic twice in a row, and shuffling again if the pool is small (a pool of 5 topics must still make a long, full-looking reel; repeating topics across the strip is fine).
4. Choose the target randomly from the pool, **never the same as the previously selected topic** (unless the pool has only one topic).
5. On **spin again**, put the previously selected topic as the first row at the payline so the reel appears to continue from where it stopped, then reset the strip behind the scenes.

### C3. Animation
- Use one CSS `transition: transform` on the strip, duration **randomised between 3.6 s and 4.6 s**, with a long ease-out curve such as `cubic-bezier(0.12, 0.8, 0.2, 1)`: fast start, long slow finish, **no overshoot, no bounce**.
- Set the final `translate3d` so that the target row's centre sits exactly on the payline.
- Use `will-change: transform` only while spinning.
- On `transitionend`, mark the reel as settled. Also set a fallback timer a little longer than the duration, because `transitionend` may never fire if the tab was hidden or the style was interrupted.
- The `[ choose topic ]` button is disabled while spinning, and its label changes to `[ choosing… ]`.
- **This animation is the one deliberate exception** to "other state changes stay still". Everything else on the page stays still and immediate.

### C4. Reduced motion
Under `prefers-reduced-motion: reduce`, skip the animation completely: place the target on the payline at once and settle immediately.

### C5. Accessibility
- The whole moving strip is `aria-hidden="true"` (a wall of changing text would be unreadable by screen readers).
- A visually hidden `aria-live="polite"` region announces `Choosing a topic…` when the spin starts and `Topic selected: <title>. <type>, <difficulty>.` when it settles.
- After settling, move keyboard focus to `[ use this topic ]`.
- Never trap focus. Keyboard users can press the buttons with Enter or Space.

### C6. After it stops
Show two actions: `[ spin again ]` (secondary) and `[ use this topic ]` (primary, filled). Spinning again is unlimited and does **not** use a trial (only a completed analysed session does). Show the genre selection above the reel as a muted summary line (`genres: technology, debate`) with a `[ change genres ]` link.

---

## Part D: Screen by screen

### D1. Landing `/`
- **Hero**: the character-rendered `PULSEVOX` wordmark (`aria-hidden`, generated once from the name, fixed-width, with a real `<h1>` for assistive tech). Beside or below it: a headline about practising English speaking, one or two true sentences, `[ start ]` (primary). A narrow list of **real supporting facts** next to it: `topics   50 new every day`, `prep     5–15 min`, `speak    2–5 min`, `feedback grammar, vocabulary, fillers, pace`.
- **How it works**: numbered steps `01 … 05` in the command gutter (choose genres, choose topic, prepare, speak, get feedback), each one line of output.
- **FAQ**: native `<details>` rows with `+`/`−` at the right and the answer indented into the output column. Only true statements: no account needed, audio is not stored, 3 sessions per day, history stays in this browser, works on laptop/desktop only.
- **Footer**: directory-style listing with `practice` and `history`. No fake links.

### D2. Genres
Heading `> choose genres`. Ten real checkbox rows arranged in two columns of output (aligned on the character grid), each `[ ] genre-name` plus a one-line muted description. `[ select all ]` toggle above. `[ choose topic ]` is disabled with the visible reason "choose at least one genre" until one is picked.

### D3. Topic
The slot machine from Part C. Heading `> choose topic`.

### D4. Timers
Heading `> set timers`. Two rows: `prep time` (5–15 min, default 5) and `speaking time` (2–5 min, default 3), each with a real control and the value in text. A summary line: `you will have 5 min to prepare, then speak for 3 min.` Primary: `[ begin preparing ]`.

### D5. Prep
Heading `> prepare`. Output column: the topic in white, hints below, a large countdown `MM:SS` (heading size, medium weight, white), the notes textarea (flat, square, 1px rule border, label "your notes (stay in this browser, never uploaded)"), the **microphone check** row (permission state in words, plus a **real** input-level meter drawn with characters such as `[|||||·····]` that updates from the actual audio level; if there is no signal, say so). `[ skip to speaking ]` secondary. Countdown is plain text; announce time remaining to screen readers only at meaningful moments (for example 1 minute and 10 seconds left) through a polite live region, not every second.

### D6. Speaking
Heading `> speak`. Show the topic and hints (muted) for reference, a clear `recording` state word, elapsed time and remaining time, and the real input-level meter. `[ finish early ]` becomes available after 30 s (before that, show "available after 0:30"). No decorative waveforms.

### D7. Analysing
Heading `> results`. Show only the **real** stages from the server stream, as three rows: `sending audio`, `transcribing`, `analysing`. The current stage is marked with `>`, completed ones with `x`, pending ones with `-`. No fake percentage, no fake spinner. On error: the real error message in plain words (limit reached, too short, provider unavailable) and what the user can do, with `[ try again ]` when that is allowed.

### D8. Results
Heading `> results`. Output column, in this order, each separated by a rule:
1. **Summary** (3–5 sentences, white emphasis on the key points).
2. **Stats rows**: duration, words, pace (words per minute), detected fillers (with a breakdown), long pauses, vocabulary variety. Label fillers as "detected fillers". Values are real; show `n/a` rather than inventing anything.
3. **Transcript** with flagged phrases underlined in white and tagged with numbered markers `[1]`, `[2]`. A flagged phrase whose quote cannot be found in the transcript is simply not highlighted.
4. **Corrections**, one row per item: `[1]` original (muted, struck through) → improved (white) → reason (muted). Same layout for vocabulary and phrasing.
5. **Structure** (opening, body, closing), **confidence**, **topic relevance**.
6. **Next steps**: three numbered items.
7. Actions: `[ new session ]` (primary, disabled with a clear reason if trials are used up) and `[ view history ]`.

### D9. History `/history`
A list of past sessions, one row each (date, topic, words, pace, fillers) with `[ open ]` and `[ delete ]`, and `[ delete all ]`. A **real-data** trend for fillers per minute and pace using character bars (`████░░░░ 12`), always with the number printed beside the bar. A short note: "History is saved only in this browser. Clearing site data deletes it." Empty state in words, no fake rows.

---

## Part E: Motion summary
- One blinking block cursor in the session bar (discrete `steps`, `--dp-motion-cursor`), stopped under reduced motion.
- The slot-machine reel (Part C), which is skipped under reduced motion.
- Nothing else moves. No typing effects, no streaming fake logs, no page transitions, no hover animations (hover inverts instantly).

---

## Part F: Accessibility and quality checklist (must pass before a UI step is marked done)
- Every action is a real `<button>` or `<a>`, reachable by keyboard, with a visible white focus outline.
- Reading order matches visual order. The decorative character art and the reel strip are `aria-hidden`.
- Text is legible: green on black at 16–18px, white for emphasis. `--dp-color-rule` is for separators only and never for text.
- Timers are computed from timestamps (so they stay correct when the tab is in the background).
- Live regions announce reel results, stage changes and errors without being noisy.
- No horizontal scrolling at 1024px and up. Verify at 1024, 1100, 1280 and 1920px wide.
- Every number and status on screen is real data. No lorem ipsum, no mock feedback, no invented metrics.
- Under `prefers-reduced-motion`: cursor does not blink, reel shows the result immediately.

---

## Part G: Desktop-only screen (mobile gate)

Shown instead of the whole app on phones, tablets, and any viewport narrower than 1024px. Same terminal style, nothing else on the page:

```
> pulsevox

PulseVox needs a laptop or desktop.
Please open this page on a laptop or desktop computer.
```

- On a narrow desktop window, add a muted line below: `If you are on a desktop, widen this window.`
- Black ground, green text, the message in white emphasis, left-aligned with the page padding, vertically near the top third of the screen. No buttons, no links, no animation (the cursor may blink).
- It is a real text message (not an image) so screen readers read it.
- While the gate is showing, the practice flow must not mount and no microphone request may happen.

---

## Part H: Things the agent must NOT do
- Do not add rounded cards, shadows, glows, gradients, textures, or screen-curvature effects.
- Do not add colours beyond green, muted green, quiet-rule green, white and black.
- Do not use any font except TerminalPlex (IBM Plex Mono 400/500).
- Do not invent fake commands, logs, progress bars, scores, metrics, or testimonials.
- Do not animate typing or make users wait for text to appear.
- Do not build layouts for widths under 1024px (the gate covers them).
