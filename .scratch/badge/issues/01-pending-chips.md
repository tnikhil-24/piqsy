# 01 — Pending chips on the top 5 thumbnails

Status: done
Type: AFK
Blocked by: none

## Parent

`docs/prd/badge-v1.md`

## What to build

A Manifest V3 Chrome extension (plain JS, no build step, loaded unpacked) that, on a YouTube search results page, places a faint pulsing `Piqsy …` chip on the top-left of the thumbnail of each of the first 5 regular video results. All chip states from the PRD are styled now (pending, Great, Partial, Not covered, Unsure, no captions, error) so the look can be reviewed before real verdicts exist; a demo mode cycles the chips through every state.

## Acceptance criteria

- [x] Loads unpacked; host permission only for YouTube.
- [x] Chips on the first 5 regular video results only; none on Shorts, ads, channels, playlists, mixes, or results 6+.
- [x] Works after in-app navigation: new search from the search box, back/forward, home → search.
- [x] No duplicate chips when YouTube re-renders or the user scrolls.
- [x] Each chip knows its video ID and the current search query.
- [x] Every state shows icon + word; Great is the only loud state (solid green); Not covered is muted grey; legible on light and dark themes.
- [x] Demo mode shows every state for the owner's visual review.
- [x] If the script throws, YouTube keeps working normally.

## Blocked by

None - can start immediately.

## Comments

**2026-10-01 — implemented in `extension/`** (`manifest.json`, `content.js`, `chip.css`). Awaiting manual check in Chrome:

1. `chrome://extensions` → Developer mode → Load unpacked → `extension/`.
2. Search YouTube; inspect a chip: `data-video-id` / `data-query` attributes.
3. Demo: in the DevTools console on youtube.com run `localStorage.piqsyDemo = 1`, reload. `delete localStorage.piqsyDemo` to stop.

Selectors assume the `ytd-video-renderer` / `ytd-thumbnail` search layout; if YouTube has moved search to `yt-lockup-view-model`, `topResults()` in `content.js` is the one place to fix.

**2026-10-01: verified by owner in Chrome.** All criteria pass; 5 chips with correct video IDs and query on `kafka consumer group rebalancing`.
