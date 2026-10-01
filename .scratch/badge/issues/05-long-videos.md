# 05 — Long videos (up to 24 hr) and "relevant throughout"

Status: ready-for-agent
Type: AFK
Blocked by: 04

## Parent

`docs/prd/badge-v1.md`

## What to build

Make verdicts work and stay fast on 1–24 hr videos. Windows grow beyond 2 minutes so a video produces at most about 60 Jev requests. When a long video's verdict is Great or Partial and its best window is longer than 2 minutes, a second pass scores 2-minute windows inside it to get precise ranges. When relevant windows cover ≥ 40% of the video, the result is "relevant throughout" with no ranges.

## Acceptance criteria

- [ ] A ~24 hr video produces ≤ ~60 first-pass requests.
- [ ] Second pass runs only for Great/Partial with a best window > 2 min, and refines ranges to 2-minute precision.
- [ ] "Relevant throughout" at the 40% boundary (named constant); no ranges in that case.
- [ ] Tests extended: 2 hr boundary, 24 hr cap, caption gaps, fine windows inside a range, throughout boundary.
- [ ] A search containing a multi-hour video still meets the p95 < 8 s target, or the log shows by how much it misses.

## Blocked by

- 04

## Comments

**2026-10-01, from slice 02** (`docs/captions-spike.md`): caption fetch alone blows the budget for long auto-captioned videos as json3 (word-level timing): 12 h → 10 s, 16 h → 22 s, 31 h → 31 s on a hotspot. Manual tracks are fine (6.2 h in 0.9 s). Try a line-level format (`srv1`: 1.9 MB vs 17.6 MB json3 for 22 h; re-measure its speed) and measure before/after. Also: creator 'English' tracks on Hindi videos can be sparse translations (`gfDE2a7MKjA`: 1,251 lines for 11.9 h), so windowing must handle long caption gaps.

**2026-10-01, from slice 04:** `makeWindows` in `extension/windows.js` already widens windows so a video makes at most 60 (`MAX_WINDOWS`), to stop a 24 h video sending 720 Jev requests. Still to do here: the 2-minute second pass, "relevant throughout", and the tests listed above.
