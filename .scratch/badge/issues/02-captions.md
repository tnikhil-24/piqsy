# 02 — English captions in the browser (caption feasibility gate)

Status: ready-for-human
Type: HITL
Blocked by: 01

## Parent

`docs/prd/badge-v1.md`

## What to build

For each of the 5 chipped results, fetch the video's timestamped English captions inside the browser without the user opening the video. The chip shows a line count when captions were found, or `no captions` when there are none or they aren't English (auto-translated tracks rejected). Captions are remembered for the browser session so a refined search doesn't re-fetch them. Findings are written up so the owner can make the go/no-go decision.

## Acceptance criteria

- [ ] Chip shows `captions ✓ (N lines)` or `no captions`; the reason (none, not English, fetch failed) and latency are logged to the console.
- [ ] Manual vs auto-generated captions distinguished.
- [ ] Captions cached per video for the browser session; a repeat search doesn't re-fetch.
- [ ] Tried on: a 10-min video, a 1–3 hr video, a ~24 hr video, a video with no captions, auto-only captions, a non-English video, logged in and logged out.
- [ ] Measured: time to get captions for all 5 results in parallel.
- [ ] `docs/captions-spike.md` records the mechanism, success rate, latency, and what breaks.
- [ ] **Human step:** owner reviews the findings and decides go / plan B before slice 04.

## Blocked by

- 01
