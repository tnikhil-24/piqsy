# Spec: Piqsy badge (V1, part 1)

## Goal

On a YouTube search results page, each of the first results gets a small Piqsy badge: `Great`, `Partial` or `Unsure`, with a start timestamp when one is trustworthy. It must work on the **first** search (no warm cache).

## Out of scope for this spec

Watch-page ranges, sort by fit, accounts, payments, intent normalisation, metadata-only verdicts, summaries/explanations, non-English.

## Shape

```
YouTube /results page
  → content script finds first N video results, injects "Pending" badge
  → extension fetches timestamped English captions per result (in the browser)
  → POST query + captions to Piqsy backend (holds the Jev key)
  → backend splits captions into ~2-min windows, asks Jev per window:
      noul "this window explains <query>"
  → verdict + start from window probabilities
  → badge updates to Great / Partial / Unsure (+ start)
```

See `docs/jev.md` for Jev.

## Rules

- A false `Great` is worse than `Unsure`. When in doubt, `Unsure`.
- A timestamp is shown only when relevant windows are clear; broad queries ("relevant throughout") get no timestamp.
- Piqsy failing must never break YouTube: errors hide or neutralise the badge.
- Jev API key lives only on the backend.

## Slices

1. `01-pending-badges` — tracer bullet: Pending badges on search results
2. `02-captions` — fetch captions in the browser (also the caption feasibility spike)
3. `03-jev-verdict` — real verdict via backend + Jev
4. `04-timestamp-link` — badge timestamp opens the video at that point
5. `05-mini-benchmark` — ~50 labelled cases, measure Great precision, tune thresholds
6. `06-user-context` — free-text "about me" passed to the evaluator
