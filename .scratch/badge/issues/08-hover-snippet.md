# 08 — Hover snippet on the chip

Status: done
Type: AFK
Blocked by: 04

## Parent

`docs/prd/badge-v1.md`

## What to build

Hovering a verdict chip on the search page shows the caption text of the best-scoring window, so the owner can see the evidence behind the verdict.

## Acceptance criteria

- [x] Hover on Great / Partial / Unsure shows the best window's caption text (trimmed to a readable length).
- [x] Not covered, no captions and error show a short plain explanation instead.
- [x] Hover card doesn't block clicking the result or YouTube's own hover preview controls.
- [x] Legible on light and dark themes.
- [x] Once issue 12 is in: one line saying which kind was assumed, "Judged as: whole subject" or "Judged as: one topic" (ADR 0005).

## Blocked by

- 04

## Comments

**2026-10-01, from slice 05:** `judge` already returns `bestWindow` (`{ start, end, text, score }` when the scored windows carry text), so the snippet is its `text`. On long videos the window is up to ~25 min of captions; trim it, or use the best 2-minute window from the second pass when it ran.

**2026-10-01, built (awaiting the owner's check).** The hover card is the chip's native `title` tooltip: drawn by Chrome, so legible on both YouTube themes, and it can't block clicks or YouTube's hover preview. Text comes from `hoverText` in `verdict.js` (pure, tested):

- Great / Partial / Unsure: `Best part 4:18–6:18: "<caption text>"`, trimmed at a word to 280 characters (`SNIPPET_MAX`), then `Judged as: one topic` / `whole subject`. The best window is the second pass's best 2-minute window when it ran, else the first pass's best window (up to ~25 min; its first 280 characters may be intro to the relevant part).
- Not covered: plain sentence plus the kind. No captions: "This video has no captions" / "No English captions". Error: "Piqsy couldn't check this video: <detail>".
- Skipped: a styled card. Add it if the native tooltip proves too plain (it appears after ~1 s and can't be styled).

**2026-10-01, owner check.** Snippets read as real evidence. The tooltip is "kinda too plain, but no need for now". Snippets follow the fixed 2-minute grid, not where the explanation starts and ends; recorded in `docs/future-plans.md`.
