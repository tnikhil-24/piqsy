# 02 — Fetch captions in the browser

Status: ready-for-agent
Type: task
Blocked by: 01

## What

For each badged result, get its timestamped English captions from inside the browser, without the user opening the video. This is also the **caption feasibility spike**: the biggest risk in the product.

## Acceptance criteria

- [ ] Each badge shows `captions ✓` (with line count) or `no captions` + reason.
- [ ] Console logs per video: success/failure, failure reason, latency, manual vs auto-generated.
- [ ] Tried on: a 10-min video, a 1–3 hr video, a ~24 hr video, a video with no captions, auto-only captions, logged-in and logged-out.
- [ ] Measured: time to get captions for all 5 results in parallel.
- [ ] Findings written to `docs/captions-spike.md` (mechanism used, success rate, latency, what breaks).

## Gate

If captions can't be fetched reliably from the search page, stop and rethink before slice 03.
