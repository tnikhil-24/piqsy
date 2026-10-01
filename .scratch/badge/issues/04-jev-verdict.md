# 04 — Jev verdict on short videos

Status: ready-for-human
Type: AFK
Blocked by: 02, 03

## Parent

`docs/prd/badge-v1.md`

## What to build

The first real verdict. The owner pastes their Jev key into the options page (with a validity check). For each chipped result with captions, captions are split into 2-minute windows; the background service worker asks Jev a `noul` question per window ("this window explains <query>"); the verdict engine turns window scores into a verdict and ranges; the chip updates to Great / Partial / Not covered / Unsure, or `Piqsy error` on failure. Ranges are computed and logged but not shown. See `docs/jev.md` for the API contract and the PRD for the starting rules.

## Acceptance criteria

- [x] **Do first:** stale results are no longer chipped under a new query (see the 2026-10-01 comment from slice 03).
- [x] Options page stores the Jev key locally and clearly reports an invalid key.
- [x] Jev is called from the background service worker only (host permission for the Jev API).
- [x] Jev client: one `noul` request per window, parallel with a concurrency limit, retries with backoff on 429/529/5xx honouring `Retry-After`, no retry on 401.
- [x] Verdict engine applies the PRD's starting rules; all thresholds are named constants.
- [x] Ranges: runs of windows ≥ 0.7, max 3, time order, strongest flagged, start shifted 10 s earlier (clamped at 0).
- [x] Chip shows the verdict; Jev/network failure after retries shows `Piqsy error`.
- [x] Run log gains: window count, Jev latency, total latency, verdict, ranges, per-window scores.
- [x] Automated tests (Node built-in runner) for the verdict engine, windowing and the Jev client (fake fetch), testing behaviour through their interfaces.
- [ ] Measured on real searches: p50/p95 time to verdict for the top 5.

## Blocked by

- 02
- 03

## Comments

**2026-10-01, from slice 02** (`docs/captions-spike.md`):
- YouTube re-renders search results right after each search, so chips are dropped and re-added. Cache verdicts per (query, video) and de-duplicate in-flight evaluations, or Jev is called twice per search.
- Score each video as soon as its own captions arrive; don't wait for all 5.
- The caption cache is in-memory per tab (`captionCache` in `extension/captions.js`). Once the background worker exists, consider moving it to `chrome.storage.session` (10 MB quota; a 31 h course is about 47k lines).

**2026-10-01, from slice 03** (found in the run log): right after a new search, `sync()` in `extension/content.js` reads the new `search_query` from the URL while the previous search's results are still in the DOM. The old 5 videos get chips, caption fetches and log entries under the new query, then the real results arrive about 2 s later. Example: the b+ tree videos (`_nY8yR6iqx4`, …) were logged at 18:24:51 under "python decorators tutorial". This doubles the caption fetches per search (more 429 risk) and would double the Jev calls. Fix it before wiring Jev.

**2026-10-01, agent part done.**
- Stale fix (`7d5d2e8`): `sync()` waits while the results are exactly the ones last seen for another query; if a new query truly returns the same top 5, chips appear after 3 s (`STALE_MS`).
- Flow: `content.js` fetches captions → `windows.js` (2-min windows; already widened so a video makes ≤ 60, see slice 05) → message to `background.js` → `jev.js` (one `noul` per non-empty window, concurrency 8 shared across tabs, retries 3× on 429/529/5xx/network, none on 401/422) → `verdict.js` → chip. Evaluations are de-duplicated per (query, video) per tab, so a re-render doesn't call Jev again.
- The run log moved to the background worker (single writer, fixes the cross-tab race) and gained `verdict`, `windows`, `jevMs`, `totalMs`, `ranges`, `scores`, `jevError`. One entry per evaluation, not per chip.
- Options page: key field ("Save and check"); a 401 shows "Jev rejected this key".
- **Owner steps:** paste the key, check the chips on a few searches, then export the log so p50/p95 of `totalMs` can be computed (last criterion).
