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
