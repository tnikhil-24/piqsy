# 0005 — Judge broad and narrow queries differently

Date: 2026-10-01 · Status: accepted

## Context

Every query got the same window question: "this 2-minute excerpt explains <query>". On `data structures and algorithms full course` (slice 05 owner check) that failed both ways: Sajjaad Khader's 15:51 overview got Unsure (windows 0.24–0.54) and 4–12.5 h full courses got Partial, mostly from an intro window saying "in this full course…". No 2-minute excerpt explains a whole subject, and the format words "full course" were matched as if they were the topic.

## Decision

- Piqsy judges **coverage only**, not teaching quality (see `docs/future-plans.md`). Chips stay words.
- Two kinds of learning query: **broad** (a whole subject) and **narrow** (one concept). Jev decides, as a second `noul` question in the learning-query check request (slice 06). Unsure or failed → narrow.
- **Format words** are removed from the query before window scoring and passed to the check as a hint toward broad. If nothing is left, the original query is used.
- **Narrow:** unchanged (ADR 0001 rules, ranges, slice 05 second pass).
- **Broad:** window question "teaches part of <topic>"; Great when relevant windows (≥ 0.7) cover ≥ 40% of the video (shown as relevant throughout, no ranges); Partial when some window ≥ 0.6 but coverage < 40%.
- The hover card says which kind was assumed.

## Why

- Matches what each searcher wants: a broad searcher wants time spent on the subject; a narrow searcher wants the part that explains one thing.
- No extra Jev requests: the kind question rides on the query check, which runs while captions download.
- Narrow is the stricter rule, so falling back to it avoids false Greats.

## Rejected

- **One whole-video Jev question for broad queries** ("teaches <subject> as a whole"): asks the real question, but needs sampling past ~2.5 h (32k-token state) and is untested. Kept as the benchmark's broad-query experiment.
- **User picks the kind** (popup switch): a per-search toggle gets ignored. Add an override only if the run log shows frequent misjudgement.
- **Confidence meter instead of words:** Jev scores aren't calibrated (`docs/future-plans.md`).

## Consequences

- For broad queries a 12 h course and a 15 min overview can both be Great; telling them apart is teaching quality, out of scope for now.
- Two more thresholds to tune in the benchmark: the broad/narrow probability and the broad coverage share (starting at the existing 40%).
