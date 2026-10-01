# 0003 — Verdicts only from captions; honest non-verdicts

Date: 2026-10-01 · Status: accepted

## Context

The audit proposed progressive analysis: a quick metadata-only verdict, upgraded in place once captions are checked. It also had Beginner/Intermediate/Advanced levels and a Skip state.

## Decisions

1. **No metadata-only verdicts.** A chip shows pending until the caption-backed verdict arrives. A badge that flips ("Likely" → "Not covered") teaches users badges lie.
2. **States:** Great, Partial, Not covered, Unsure. **Not covered** replaces Skip: it states what Piqsy observed instead of giving an order.
3. **Failures are not verdicts:** `no captions` and `Piqsy error` look different from Unsure. "Couldn't read it" ≠ "read it and can't tell".
4. **No level selector.** Level depends on the topic, and the query usually carries it ("adv java…"). Free-text user context is deferred until after the benchmark.
5. **No timestamps on the search page.** Search shows the chip; the watch page strip shows ranges. Clicking a result opens the video at the start (no `&t=` rewriting) until the benchmark proves timestamp accuracy.
6. **Precision over recall on Great.** A false Great is the worst error; thresholds favour saying Partial or Unsure.
