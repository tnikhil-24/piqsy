# 12 — Broad-query verdicts

Status: ready-for-human
Type: AFK
Blocked by: 06

## Parent

`docs/prd/badge-v1.md` · ADR 0005

## What to build

When the query check (issue 06) says a query is broad, score windows with `This transcript excerpt teaches part of "<topic>"` and judge by coverage: Great when relevant windows (≥ 0.7) cover ≥ 40% of the video (relevant throughout, no ranges); Partial when some window ≥ 0.6 but coverage < 40% (up to 3 ranges, slice 05 second pass as usual); Not covered and Unsure as for narrow queries. Narrow queries are unchanged.

## Acceptance criteria

- [ ] Verdict engine takes the query kind; broad rules as above, thresholds as named constants. Tests: broad Great at the 40% boundary, broad Partial below it, narrow unchanged.
- [ ] Jev client sends the broad question for broad queries (request-shape test).
- [ ] Run log records the kind (`broad`/`narrow`) per evaluation.
- [ ] Owner check, one search: `data structures and algorithms full course` (reuse saved captions where possible). Expect the full courses and Sajjaad Khader's overview (`O9v10jQkm5c`) to move toward Great; record scores in this issue.

## Blocked by

- 06

## Comments

**2026-10-01, built (awaiting the owner's check).**

- `verdict.js`: `judge(windows, kind)`; broad Great = relevant windows (≥ `RANGE_MIN`) cover ≥ `BROAD_GREAT_SHARE` (0.4) of the video, shown as throughout; otherwise the narrow Partial / Not covered / Unsure rules. A narrow-style Great pattern (0.9 next to 0.85) with low coverage is only Partial for broad.
- `jev.js`: `scoreWindows(..., { broad })` asks `This transcript excerpt teaches part of "<topic>"`; the slice 05 second pass uses the same question.
- Run log: `kind` (`broad`/`narrow`) replaces 06's `broad` boolean. Console verdict line shows the kind.
