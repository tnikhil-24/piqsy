# 12 — Broad-query verdicts

Status: done
Type: AFK
Blocked by: 06

## Parent

`docs/prd/badge-v1.md` · ADR 0005

## What to build

When the query check (issue 06) says a query is broad, score windows with `This transcript excerpt teaches part of "<topic>"` and judge by coverage: Great when relevant windows (≥ 0.7) cover ≥ 40% of the video (relevant throughout, no ranges); Partial when some window ≥ 0.6 but coverage < 40% (up to 3 ranges, slice 05 second pass as usual); Not covered and Unsure as for narrow queries. Narrow queries are unchanged.

## Acceptance criteria

- [x] Verdict engine takes the query kind; broad rules as above, thresholds as named constants. Tests: broad Great at the 40% boundary, broad Partial below it, narrow unchanged.
- [x] Jev client sends the broad question for broad queries (request-shape test).
- [x] Run log records the kind (`broad`/`narrow`) per evaluation.
- [x] Owner check, one search: `data structures and algorithms full course` (reuse saved captions where possible). Expect the full courses and Sajjaad Khader's overview (`O9v10jQkm5c`) to move toward Great; record scores in this issue.

## Blocked by

- 06

## Comments

**2026-10-01, built (awaiting the owner's check).**

- `verdict.js`: `judge(windows, kind)`; broad Great = relevant windows (≥ `RANGE_MIN`) cover ≥ `BROAD_GREAT_SHARE` (0.4) of the video, shown as throughout; otherwise the narrow Partial / Not covered / Unsure rules. A narrow-style Great pattern (0.9 next to 0.85) with low coverage is only Partial for broad.
- `jev.js`: `scoreWindows(..., { broad })` asks `This transcript excerpt teaches part of "<topic>"`; the slice 05 second pass uses the same question.
- Run log: `kind` (`broad`/`narrow`) replaces 06's `broad` boolean. Console verdict line shows the kind.

**2026-10-01, owner check.** `data structures and algorithms full course`: learning 0.98, broad 0.93, topic "data structures and algorithms" → broad. All 5 top results Great, throughout (before: full courses Partial):

| Video | Length | Windows | Verdict | Total |
|---|---|---|---|---|
| RpLnQnurpLY | 1.2 h | 37 | Great, throughout | 1.4 s (saved captions) |
| BBpAmxU_NQo | 1.3 h | 39 | Great, throughout | 2.5 s |
| CBYHwZcbD-s | 4 h | 60 | Great, throughout | 4.1 s |
| 8hly31xKli0 | 5.4 h | 60 | Great, throughout | 7.3 s |
| pkYVOmU3MgA | 12.5 h | 60 | Great, throughout | 9.5 s (captions 7 s) |

Sajjaad Khader's overview (`O9v10jQkm5c`) was not in the top 5 this time, so it is unchecked. Five Greats out of five also says nothing about false Greats: the benchmark (09) needs broad negatives (e.g. a full course on a different subject, a video that only mentions the subject) to test `BROAD_GREAT_SHARE` and the "teaches part of" wording.
