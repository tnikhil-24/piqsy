# 05 — Mini benchmark and threshold tuning

Status: ready-for-human
Type: task
Blocked by: 03

## What

~50 hand-labelled `(query, video, label, true start)` cases covering short, long and 24-hr videos, misleading titles, buried topics, noisy auto-captions. A script runs the evaluator on all of them and reports results.

## Acceptance criteria

- [ ] Cases stored as a file in the repo; a subset labelled by a second person to measure agreement.
- [ ] Report: confusion matrix, Great precision, timestamp error (landing early is OK, landing late is bad).
- [ ] Thresholds from 03 tuned to favour Great precision; results written to `docs/benchmark.md`.

Human-labelled, so `ready-for-human` for the labelling part.
