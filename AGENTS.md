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

- `extension/`: Manifest V3, plain JS, no build step. `content.js` (search page adapter + chips), `captions.js` (caption fetcher + per-tab cache), `chip.css`.
- Slices 01 and 02 done; next is 03 (run log). Status is the `Status:` line in each `.scratch/badge/issues/*.md`; a done slice is `Status: done`.

## Running and testing

- Tests: `node --test` from the repo root (Node's built-in runner; don't pass a directory, as Node 22 treats it as a file).
- Load: `chrome://extensions` → Developer mode → Load unpacked → `extension/`. After a code change, click ↻ on Piqsy **and** reload the YouTube tab; reloading only one leaves the old code running.
- Inspect: on a YouTube search page, open DevTools → Console and filter by `[piqsy]`. Ask the owner to paste only those lines; full console dumps are huge and get truncated.
- Demo mode (all chip states): `localStorage.piqsyDemo = 1` in the console, then reload.
- Logged out: Incognito needs "Allow in Incognito" in Piqsy's details.
- Page adapters, views and caption fetching are checked manually in Chrome by the owner (PRD testing decisions).

## Don't bulk-fetch from YouTube

Downloading many caption files from the owner's machine (scripts, probes) gets the IP blocked by Google (timedtext HTTP 429, "automated queries"), which also breaks Piqsy and the owner's own YouTube captions for a while. On 2026-10-01 about 30 large caption downloads in 5 minutes did it. Probe at most a few small videos, and never loop over long courses. If blocked, the owner can switch networks (e.g. phone hotspot).
