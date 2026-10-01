# 02 — English captions in the browser (caption feasibility gate)

Status: done
Type: HITL
Blocked by: 01

## Parent

`docs/prd/badge-v1.md`

## What to build

For each of the 5 chipped results, fetch the video's timestamped English captions inside the browser without the user opening the video. The chip shows a line count when captions were found, or `no captions` when there are none or they aren't English (auto-translated tracks rejected). Captions are remembered for the browser session so a refined search doesn't re-fetch them. Findings are written up so the owner can make the go/no-go decision.

## Acceptance criteria

- [x] Chip shows `captions ✓ (N lines)` or `no captions`; the reason (none, not English, fetch failed) and latency are logged to the console.
- [x] Manual vs auto-generated captions distinguished.
- [x] Captions cached per video for the browser session; a repeat search doesn't re-fetch.
- [x] Tried on: a 10-min video, a 1–3 hr video, a ~24 hr video, a video with no captions, auto-only captions, a non-English video, logged in and logged out.
- [x] Measured: time to get captions for all 5 results in parallel.
- [x] `docs/captions-spike.md` records the mechanism, success rate, latency, and what breaks.
- [x] **Human step:** owner reviews the findings and decides go / plan B before slice 04.

## Blocked by

- 01

## Comments

**2026-10-01 — agent part done.** Fetcher in `extension/captions.js` (ANDROID InnerTube player → timedtext json3), wired into the chips in `content.js`, and tested with `node --test`. Mechanism, Node results and what breaks are in `docs/captions-spike.md`. Main risk found: timedtext 429 bot-block after heavy fetching from one IP. Remaining: the owner's browser run (the table in the spike doc) and the go / plan B decision.
uy
**2026-10-01: owner decided Go.** Browser run complete: 30/30 videos handled correctly, logged in and out; 24 h search 30.8 s (long auto captions too slow as json3 → slice 05). Mechanism recorded in `docs/adr/0004-captions-via-android-client.md`; full results in `docs/captions-spike.md`.
