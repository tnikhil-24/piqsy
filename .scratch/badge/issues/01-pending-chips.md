# 01 — Pending chips on the top 5 thumbnails

Status: ready-for-agent
Type: AFK
Blocked by: none

## Parent

`docs/prd/badge-v1.md`

## What to build

A Manifest V3 Chrome extension (plain JS, no build step, loaded unpacked) that, on a YouTube search results page, places a faint pulsing `Piqsy …` chip on the top-left of the thumbnail of each of the first 5 regular video results. All chip states from the PRD are styled now (pending, Great, Partial, Not covered, Unsure, no captions, error) so the look can be reviewed before real verdicts exist; a demo mode cycles the chips through every state.

## Acceptance criteria

- [ ] Loads unpacked; host permission only for YouTube.
- [ ] Chips on the first 5 regular video results only; none on Shorts, ads, channels, playlists, mixes, or results 6+.
- [ ] Works after in-app navigation: new search from the search box, back/forward, home → search.
- [ ] No duplicate chips when YouTube re-renders or the user scrolls.
- [ ] Each chip knows its video ID and the current search query.
- [ ] Every state shows icon + word; Great is the only loud state (solid green); Not covered is muted grey; legible on light and dark themes.
- [ ] Demo mode shows every state for the owner's visual review.
- [ ] If the script throws, YouTube keeps working normally.

## Blocked by

None - can start immediately.
