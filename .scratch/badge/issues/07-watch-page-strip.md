# 07 — Watch-page strip with clickable ranges

Status: ready-for-agent
Type: AFK
Blocked by: 04

## Parent

`docs/prd/badge-v1.md`

## What to build

When the owner clicks a result Piqsy rated Great or Partial, the watch page shows a thin Piqsy strip under the player, e.g. `✓ Great · Watch 4:18–9:40 · 31:02–35:10`. Clicking a range seeks the video there and keeps playing. "Relevant throughout" results show that text instead of ranges.

## Acceptance criteria

- [ ] Strip appears only for videos reached from a Piqsy-rated search in this session (looked up by video ID).
- [ ] Up to 3 ranges, time order, strongest visually emphasised.
- [ ] Clicking a range seeks and keeps playing; the video still opens at the beginning.
- [ ] No strip for Not covered, Unsure, no captions or error.
- [ ] Strip disappears when navigating to another video (in-app navigation).
- [ ] Legible on light and dark themes; failures never break the player.

## Blocked by

- 04
