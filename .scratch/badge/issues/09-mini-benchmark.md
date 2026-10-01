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

**2026-10-01, from slice 04's first real run** (run log, 21 evaluations):
- **Scores saturate on topic:** relevant windows are mostly 0.85–0.98 and off-topic ones 0.01–0.2, with little in between. 14 of 21 were Great. Check whether these are true Greats; if Jev says 0.9 for "mentions the topic", thresholds alone won't fix it and the question wording needs work.
- **Videos shorter than about 2 minutes can never be Great:** Great needs two adjacent windows, so a single-window video caps at Partial (`U7_C8llyoGE`, 95 s, score 0.98; `JNdLRT0BoGo`, 52 s, 0.93). Decide whether that's right.
- **One strong window → Partial:** `o_2psWN8k_c` for "b+ tree deletion underflow merge" scored [0.05, 0.03, 0.95, 0.19]: a 2-minute section in a 7-minute video.
- **Sparse manual tracks:** `FsAPt_9Bf3U` has 55 lines for a 30-minute video, so 14 of 16 windows are empty (score 0); it got Partial from its first window alone.
