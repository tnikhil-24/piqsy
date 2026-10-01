# 0001 — Evaluate with Jev window scoring, not an LLM

Date: 2026-10-01 · Status: accepted

## Context

Piqsy must judge whether a video explains a query and where, on the first search, for videos from 10 minutes to 24 hours. The original audit proposed Jev as "primary evaluator, LLM fallback" without a mechanism. Jev (see `docs/jev.md`) returns typed probabilities, generates no text, costs $0.042 per million input tokens and answers in ~70–500 ms, with a 32k-token state limit.

## Decision

Split captions into windows and ask Jev one `noul` question per window ("this window explains <query>"). A pure verdict engine turns window scores into the verdict and ranges using named thresholds. Long videos use larger windows (≤ ~60 requests per video) plus a 2-minute second pass inside the best window. No LLM in V1.

## Why

- Window scores give the verdict, the ranges and the evidence (best window's captions) from one mechanism.
- Cheap enough that per-query evaluation needs no cache (~$0.013 for a 24-hr video).
- Fast and parallel, so the bottleneck is caption fetching, not evaluation.

## Rejected

- **LLM as primary evaluator:** slower and pricier; worth revisiting only if the benchmark shows Jev can't reach high Great precision.
- **Many windows per Jev request:** far fewer requests, but accuracy unknown. Tested as an experiment in the benchmark slice.
- **Fixed 2-minute windows always:** a 24-hr video becomes ~720 requests, ~18 s at the rate limit.

## Consequences

- Jev can't write explanations; the hover card shows the best window's caption text instead.
- Thresholds are guesses until the benchmark (slice 09) calibrates them.
