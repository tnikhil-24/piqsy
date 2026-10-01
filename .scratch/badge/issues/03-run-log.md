# 03 — Local run log and JSON export

Status: done
Type: AFK
Blocked by: 02

## Parent

`docs/prd/badge-v1.md`

## What to build

Every evaluation is appended to a persistent local log (in extension storage), and an options page offers an "Export log as JSON" button. In this slice the log records the caption outcome; slice 04 adds verdict fields.

## Acceptance criteria

- [x] Each entry records: timestamp, query, video ID, caption outcome and reason, caption kind, caption latency.
- [x] Log survives closing the browser.
- [x] Options page exports the full log as a JSON file.
- [x] Log size is bounded (oldest entries dropped past a limit) so storage can't grow without end.
- [x] Nothing is sent off the machine.

## Blocked by

- 02

## Comments

**2026-10-01, from slice 02:** the content script already has each caption result (`getCaptions` in `extension/captions.js`: outcome, `detail`, kind, lang, line count, video duration, and whether it was `cached`). Log `detail` and `cached` too; they're what showed the 429 block and the re-render duplicates in the spike.

**2026-10-01, agent part done.** `extension/runlog.js` appends one entry per caption check to `chrome.storage.local` key `runLog` (fields: `ts`, `query`, `videoId`, `outcome`, `reason`, `detail`, `kind`, `lang`, `lines`, `durationSec`, `captionMs`, `cached`), capped at 2000 entries, oldest dropped. Options page (`options.html`) shows the count and exports JSON. Appends are serialized per tab; two tabs at the same instant can still lose an entry until the background worker owns the log (slice 04). **Owner check in Chrome:** search, close and reopen Chrome, open Piqsy's Details → Extension options → Export, and confirm the entries are there.

**2026-10-01: owner verified in Chrome.** The export held 22 entries across a browser restart, with all 12 fields. 15 were `timedtext HTTP 429` errors (an IP block, gone by 18:28), 5 had captions, and 2 were `cached: true` at 0–1 ms. Bug found via the log: right after a new search, the old query's videos were logged under the new query (adapter runs before YouTube swaps the results). Separate fix.
