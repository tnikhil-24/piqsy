# 09 — Mini benchmark and threshold tuning

Status: ready-for-human
Type: HITL
Blocked by: 05 (done 2026-10-01)

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

**2026-10-01, owner decision:** video length doesn't matter; a very good 2-minute video deserves Great. A one-window video (under about 3 min) is now Great on its own score (≥ `GREAT_PEAK`), and a leftover piece under 1 minute joins the last window. This changes the PRD's Great rule (adjacent support) for one-window videos only. Watch short videos for false Greats here.
- Confirmed in Chrome 2026-10-01: `U7_C8llyoGE` (95 s, one window) → Great.

**2026-10-01, from slice 05 owner check:** include `data structures and algorithms full course` as a broad-query case. Owner labels Sajjaad Khader's `O9v10jQkm5c` (15:51) as a good result; Piqsy said Unsure while full courses got Partial from their intros. See `docs/assessment.md` (broad and format queries).

**2026-10-01, from ADR 0005:** label each case's query as broad or narrow too, and include several broad queries (`dsa full course`, `learn kafka`, …). Tune the broad/narrow threshold and the broad coverage share. Experiment: one whole-video Jev question for broad queries vs the coverage-share rule.

**2026-10-01, from slice 05:** include long videos where the topic is one section (second pass): e.g. `8hly31xKli0` (5.4 h) and `pkYVOmU3MgA` (12.5 h) for `data structures and algorithms full course` refined well; check the refined range against where the topic really starts. Fine 2-minute windows score lower than the wide window they refine (0.78 → 0.72), so check whether `RANGE_MIN` should differ for fine windows.
