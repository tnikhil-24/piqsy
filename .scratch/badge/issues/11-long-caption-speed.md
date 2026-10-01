# 11 — Long-video caption speed and saving

Status: ready-for-human
Type: HITL (a few small measurements on the owner's machine)
Blocked by: 05

## Parent

`docs/prd/badge-v1.md` · `.scratch/badge/issues/05-long-videos.md` (owner check 2)

## Why

Slice 05 showed the json3 caption download grows with video length: 5.3 s for a 12.5 h auto-captioned course (18,248 lines), so a 24 h one likely misses the 8 s p95 target on download alone. Videos over 5,000 lines (`CAP_MAX_LINES` in `extension/captionstore.js`) are also not saved, so every repeat search refetches the biggest files, the likeliest trigger of a timedtext 429.

## What to build

1. Measure `srv1` (line-level XML) against json3 for one or two long auto-captioned videos: bytes and `textMs`. Earlier size estimate: 1.9 MB vs 17.6 MB for 22 h (`docs/captions-spike.md`). Keep probes to a few videos (AGENTS.md: don't bulk-fetch).
2. If `srv1` is clearly faster, switch long videos (or all) to it, with a parser test like `parseJson3`'s.
3. Decide `CAP_MAX_LINES`: measure stored size for an 18k-line video; raise the limit if `chrome.storage.local` quota allows.

## Acceptance criteria

- [ ] `srv1` vs json3 timings recorded in `docs/captions-spike.md`.
- [ ] Format decision made (and built, if switching), with a parser test.
- [ ] `CAP_MAX_LINES` reviewed against measured storage size.
