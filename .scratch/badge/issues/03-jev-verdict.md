# 03 — Real verdict via backend + Jev

Status: ready-for-agent
Type: task
Blocked by: 02

## What

Minimal backend endpoint: receives `{ query, videoId, captions }`, splits captions into ~2-min windows, asks Jev a `noul` question per window, returns `{ verdict, start, windows }`. The badge replaces `Pending` with the verdict.

## Acceptance criteria

- [ ] Jev API key is only on the backend.
- [ ] Badge shows `✓ Great · 4:18`, `◐ Partial`, `? Unsure`.
- [ ] Verdict and start come from window probabilities; thresholds are named constants (initial guesses, tuned in 05).
- [ ] Many consecutive relevant windows → verdict without a timestamp ("relevant throughout").
- [ ] No captions, backend down or Jev error → `Unsure` or hidden badge; YouTube unaffected.
- [ ] Logs per request: window count, Jev latency, total latency.
- [ ] Works for a ~24 hr video (check Jev's input/rate limits; see `docs/jev.md`).
