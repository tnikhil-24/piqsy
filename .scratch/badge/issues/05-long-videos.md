# 05 — Long videos (up to 24 hr) and "relevant throughout"

Status: built, awaiting the owner's Chrome check
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

**2026-10-01, from issue 10 (before starting):** long videos mean big caption files, the likeliest trigger of a timedtext 429. Piqsy now pauses 30 min after a block and saves captions per video (videos over 5,000 lines are *not* saved: `CAP_MAX_LINES` in `extension/captionstore.js`; raise it if `srv1` makes them small). Test with as few long-video searches as possible, and reuse saved captions across runs. `playerMs`/`textMs` in the run log split fetch time per request.

**2026-10-01, built (agent):** `fineWindows` in `windows.js` (2-minute windows inside one wide window); `judge` now returns `throughout` (`THROUGHOUT_SHARE` = 0.4 of the video in windows ≥ `RANGE_MIN`; no ranges then) and `bestWindow`; `refine` in `verdict.js` rebuilds ranges with the best window swapped for its scored fine windows (keeps the wide window if none reaches `RANGE_MIN`). `content.js` runs the second pass only for Great/Partial, not throughout, when the best window splits into more than one fine window (in practice videos over 2 h). A failed second pass keeps first-pass ranges and logs `jevError`. Run log gains `throughout`, `fineWindows`, `fineScores`; `jevMs` covers both passes. Tests cover the 2 h boundary, 24 h cap, caption gaps, fine windows, throughout boundary. Not done: the `srv1` caption format (needs network measurements; see the owner check below).

Owner check (one search, to keep YouTube requests low): search something whose top 5 includes one multi-hour video (ideally one already saved). In `[piqsy]` console lines, look for `N windows + M fine` on it, then export the log and check its `totalMs` against the 8 s p95 target and `ranges`.
