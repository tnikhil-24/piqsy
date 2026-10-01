# 03 — Local run log and JSON export

Status: ready-for-agent
Type: AFK
Blocked by: 02

## Parent

`docs/prd/badge-v1.md`

## What to build

Every evaluation is appended to a persistent local log (in extension storage), and an options page offers an "Export log as JSON" button. In this slice the log records the caption outcome; slice 04 adds verdict fields.

## Acceptance criteria

- [ ] Each entry records: timestamp, query, video ID, caption outcome and reason, caption kind, caption latency.
- [ ] Log survives closing the browser.
- [ ] Options page exports the full log as a JSON file.
- [ ] Log size is bounded (oldest entries dropped past a limit) so storage can't grow without end.
- [ ] Nothing is sent off the machine.

## Blocked by

- 02

## Comments

**2026-10-01, from slice 02:** the content script already has each caption result (`getCaptions` in `extension/captions.js`: outcome, `detail`, kind, lang, line count, video duration, and whether it was `cached`). Log `detail` and `cached` too; they're what showed the 429 block and the re-render duplicates in the spike.
