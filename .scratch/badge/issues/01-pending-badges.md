# 01 — Pending badges on search results

Status: ready-for-agent
Type: task

## What

Tracer bullet. A Manifest V3 Chrome extension that, on `youtube.com/results`, adds a `Piqsy · Pending` badge to the first 5 video results. No backend, no captions.

## Acceptance criteria

- [ ] Loads unpacked in Chrome; only YouTube host permission.
- [ ] Badges appear on the first 5 *video* results (not Shorts shelves, ads, channels, playlists).
- [ ] Works after in-app navigation: new search from the search box, back/forward, home → search.
- [ ] No duplicate badges when YouTube re-renders or the user scrolls.
- [ ] Each badge knows its video ID and the current search query (visible via console or a data attribute).
- [ ] If the script throws, YouTube still works normally.
