# 09 — Mini benchmark and threshold tuning

Status: ready-for-human
Type: HITL
Blocked by: 05

## Parent

`docs/prd/badge-v1.md`

## What to build

About 50 hand-labelled cases `(query, video, label, relevant start)` covering short, long and 24 hr videos, misleading titles, buried topics, broad queries and noisy auto-captions. A script runs the evaluator (windowing + Jev + verdict engine) on every case and reports results; thresholds are tuned to favour Great precision. Also try the batching experiment: many numbered windows per Jev request vs one per request.

## Acceptance criteria

- [ ] **Human step:** owner labels the cases using the PRD's definitions of Great/Partial; a subset is labelled by a second person to measure agreement.
- [ ] Cases stored in the repo.
- [ ] Report: confusion matrix, Great precision and recall, timestamp error with asymmetric tolerance (early OK, late bad).
- [ ] Thresholds tuned; before/after results and the batching experiment written to `docs/benchmark.md`.

## Blocked by

- 05
