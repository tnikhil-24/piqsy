# 05 — Long videos (up to 24 hr) and "relevant throughout"

Status: done
Type: AFK
Blocked by: 04

## Parent

`docs/prd/badge-v1.md`

## What to build

Make verdicts work and stay fast on 1–24 hr videos. Windows grow beyond 2 minutes so a video produces at most about 60 Jev requests. When a long video's verdict is Great or Partial and its best window is longer than 2 minutes, a second pass scores 2-minute windows inside it to get precise ranges. When relevant windows cover ≥ 40% of the video, the result is "relevant throughout" with no ranges.

## Acceptance criteria

- [x] A ~24 hr video produces ≤ ~60 first-pass requests.
- [x] Second pass runs only for Great/Partial with a best window > 2 min, and refines ranges to 2-minute precision.
- [x] "Relevant throughout" at the 40% boundary (named constant); no ranges in that case.
- [x] Tests extended: 2 hr boundary, 24 hr cap, caption gaps, fine windows inside a range, throughout boundary.
- [x] A search containing a multi-hour video still meets the p95 < 8 s target, or the log shows by how much it misses.

## Blocked by

- 04

## Comments

**2026-10-01, from slice 02** (`docs/captions-spike.md`): caption fetch alone blows the budget for long auto-captioned videos as json3 (word-level timing): 12 h → 10 s, 16 h → 22 s, 31 h → 31 s on a hotspot. Manual tracks are fine (6.2 h in 0.9 s). Try a line-level format (`srv1`: 1.9 MB vs 17.6 MB json3 for 22 h; re-measure its speed) and measure before/after. Also: creator 'English' tracks on Hindi videos can be sparse translations (`gfDE2a7MKjA`: 1,251 lines for 11.9 h), so windowing must handle long caption gaps.

**2026-10-01, from slice 04:** `makeWindows` in `extension/windows.js` already widens windows so a video makes at most 60 (`MAX_WINDOWS`), to stop a 24 h video sending 720 Jev requests. Still to do here: the 2-minute second pass, "relevant throughout", and the tests listed above.

**2026-10-01, from issue 10 (before starting):** long videos mean big caption files, the likeliest trigger of a timedtext 429. Piqsy now pauses 30 min after a block and saves captions per video (videos over 5,000 lines are *not* saved: `CAP_MAX_LINES` in `extension/captionstore.js`; raise it if `srv1` makes them small). Test with as few long-video searches as possible, and reuse saved captions across runs. `playerMs`/`textMs` in the run log split fetch time per request.

**2026-10-01, built (agent):** `fineWindows` in `windows.js` (2-minute windows inside one wide window); `judge` now returns `throughout` (`THROUGHOUT_SHARE` = 0.4 of the video in windows ≥ `RANGE_MIN`; no ranges then) and `bestWindow`; `refine` in `verdict.js` rebuilds ranges with the best window swapped for its scored fine windows (keeps the wide window if none reaches `RANGE_MIN`). `content.js` runs the second pass only for Great/Partial, not throughout, when the best window splits into more than one fine window (in practice videos over 2 h). A failed second pass keeps first-pass ranges and logs `jevError`. Run log gains `throughout`, `fineWindows`, `fineScores`; `jevMs` covers both passes. Tests cover the 2 h boundary, 24 h cap, caption gaps, fine windows, throughout boundary. Not done: the `srv1` caption format (needs network measurements; see the owner check below).

Owner check (one search, to keep YouTube requests low): search something whose top 5 includes one multi-hour video (ideally one already saved). In `[piqsy]` console lines, look for `N windows + M fine` on it, then export the log and check its `totalMs` against the 8 s p95 target and `ranges`.

**2026-10-01, owner check 1 (`sql joins full course`):** top 5 all under 41 min (303–2418 s), so no second pass and not "throughout": 2 Partial, 3 Unsure, 3–20 windows. Slice 05 code made no difference to normal videos; 5 videos in 2.9 s. Still to check: a search with a video over 2 h.

**2026-10-01, owner check 2 (`data structures and algorithms full course`, 19:36 UTC):** three videos over 2 h, all 60 first-pass windows; second pass ran on each (Partial):

| video | length | lines | text fetch | windows | Jev (both passes) | total |
|---|---|---|---|---|---|---|
| `CBYHwZcbD-s` | 4.0 h | 6,018 | 0.8 s | 60 + 2 fine | 1.9 s | 3.0 s |
| `8hly31xKli0` | 5.4 h | 8,721 | 2.8 s | 60 + 3 fine | 1.6 s | 4.8 s |
| `pkYVOmU3MgA` | 12.5 h | 18,248 | 5.3 s | 60 + 6 fine | 1.9 s | 7.6 s |
| `RpLnQnurpLY` | 1.2 h | 1,912 | 10.3 s | 37 | 0.9 s | 11.7 s |

- `8hly31xKli0`: best window 14858–15181 s (0.81) refined to 14848–14978 (fine 0.80, 0.65, 0.64). Works as intended.
- `CBYHwZcbD-s`: no fine window reached 0.7 (0.65, 0.41), so the wide range 0–241 stayed (the fallback).
- `pkYVOmU3MgA`: bug found and fixed. The best window (0.78) refined to a fine run peaking 0.72, which then lost to three coarse ranges at 0.72–0.74 and was dropped. `refine` now ranks passing fine windows by the best window's score; regression test added.
- Latency: the search's slowest video took 11.7 s, missing the 8 s target by 3.7 s. That was not a long video: `RpLnQnurpLY` (1.2 h) had the recurring ~10 s caption stall (issue 10). The multi-hour videos took 3.0–7.6 s; the second pass adds about 1 s of Jev time. The json3 caption download grows with length (5.3 s at 12.5 h), so a 24 h auto-captioned video would likely miss 8 s on its own: `srv1` is still worth measuring.
- The three long videos have over 5,000 lines (`CAP_MAX_LINES`), so their captions are not saved; repeating this search refetches them.
