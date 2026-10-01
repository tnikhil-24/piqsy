## Agent skills

### Issue tracker

Issues live as local markdown files under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one root `CONTEXT.md` plus `docs/adr/`. See `docs/agents/domain.md`.

## Project docs

- `docs/jev.md`: what Jev (our evaluator, TypeSafe AI) is and how Piqsy uses it. Read before touching evaluation code.
- `docs/prd/badge-v1.md`: current PRD (search chip + watch-page ranges). Slices in `.scratch/badge/issues/`.
- `docs/adr/`: why the big decisions were made (Jev window scoring, no backend, verified verdicts only, captions via the ANDROID client).
- `docs/captions-spike.md`: how captions are fetched, measured latency, and what breaks (IP block, long auto captions). Read before touching `extension/captions.js`.
- `docs/assessment.md`: open risks and concerns not yet resolved.
- `CONTEXT.md`: glossary; use its terms.

## Code and status

- `extension/`: Manifest V3, plain JS, no build step. `content.js` (search page adapter, chips, per-video evaluation), `captions.js` (caption fetcher, block pause, per-tab cache), `captionstore.js` (saved captions per video, background), `windows.js` (windowing), `verdict.js` (verdict engine), `background.js` (service worker: the only Jev caller and run-log writer), `jev.js` (Jev client), `runlog.js` (persistent run log), `options.html`/`options.js` (Jev key, log export), `chip.css`.
- Slices 01–04 done. 10 (survive YouTube blocks): parts 2 and 3 built, awaiting the owner's Chrome check; option 1 (cookies) waits for the next block. 05 (long videos): built, awaiting the owner's Chrome check. Status is the `Status:` line in each `.scratch/badge/issues/*.md`; a done slice is `Status: done`.

## Running and testing

- Tests: `node --test` from the repo root (Node's built-in runner; don't pass a directory, as Node 22 treats it as a file).
- Load: `chrome://extensions` → Developer mode → Load unpacked → `extension/`. After a code change, click ↻ on Piqsy **and** reload the YouTube tab; reloading only one leaves the old code running.
- Inspect: on a YouTube search page, open DevTools → Console and filter by `[piqsy]`. Ask the owner to paste only those lines; full console dumps are huge and get truncated.
- Run log: Piqsy → Details → Extension options → "Export log as JSON" (storage key `runLog`, last 2000 evaluations). Use it to check failures (`detail`, e.g. timedtext 429) and latency over real searches.
- Demo mode (all chip states): `localStorage.piqsyDemo = 1` in the console, then reload.
- Background worker (Jev calls, run log): `chrome://extensions` → Piqsy → "service worker" link opens its own DevTools.
- Logged out: Incognito needs "Allow in Incognito" in Piqsy's details.
- Page adapters, views and caption fetching are checked manually in Chrome by the owner (PRD testing decisions).

## Don't bulk-fetch from YouTube

Downloading many caption files from the owner's machine (scripts, probes) gets the IP blocked by Google (timedtext HTTP 429, "automated queries"), which also breaks Piqsy and the owner's own YouTube captions for a while. On 2026-10-01 about 30 large caption downloads in 5 minutes did it. Probe at most a few small videos, and never loop over long courses. If blocked, the owner can switch networks (e.g. phone hotspot).

The same day the hotspot was blocked too, at normal-use volume (about 60 videos in a few hours; see `docs/assessment.md` risk 1 and issue 10). So in manual tests:
- Ask for as few searches as the check needs, with short videos.
- Reloading the extension or the tab empties the caption cache, so the next search fetches everything again. Don't ask for reloads that aren't needed.
- Run-log timestamps (`ts`) are UTC.
- After a block Piqsy sends no caption requests for 30 min (`localStorage.piqsyPausedUntil` on youtube.com; delete it to test). Saved captions survive reloads, so repeat searches cost nothing.
