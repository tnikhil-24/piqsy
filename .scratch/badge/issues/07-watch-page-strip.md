# 07 — Watch-page strip with clickable ranges

Status: ready-for-human
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

## Comments

**2026-10-01, from slices 05 and ADR 0005:** `judge` in `extension/verdict.js` already returns `ranges` (refined by the 2-minute second pass on long videos) and `throughout`; both are in the run log. This slice needs a per-video session store of `{ query, verdict, ranges, throughout }` and the strip. Broad-query Greats (issue 12) are always `throughout`, so they show "Relevant throughout", no ranges.

**2026-10-01, built (awaiting the owner's check).**

- Store: each judged video's `{ query, verdict, ranges, throughout }` goes to `chrome.storage.session` (key `rated:<videoId>`) through the background worker. It lasts until the browser closes and is shared by tabs, so a result opened in a new tab (Ctrl/middle-click) also gets the strip. The latest rating of a video wins, whichever search it came from.
- Strip: prepended to `ytd-watch-flexy #below` (under the player), looked up once per watched video and put back if YouTube re-renders. `✓ Great · Watch 4:18–9:40 · 31:02–35:10`, or `· Relevant throughout`. Strongest range bold with an outline. Clicking sets `currentTime` on the main `<video>` and plays; the video still opens at 0:00. Tooltip names the search it came from.
- A Partial with no window ≥ 0.7 (so no ranges) shows its best window as its one range.
- Clicking a result while its chip is still pending: the strip appears when the evaluation finishes (same tab only).
- Theme: first built with YouTube's CSS variables; the owner's check showed dark-grey text on the dark area under the player (light theme, new layout). Now a dark translucent backing with white text, like the chip.
- Popup switch off hides the strip too.

**2026-10-01, owner check 1.** `data structures and algorithms full course` → Sajjaad Khader's `O9v10jQkm5c` (broad Great, 8 windows) showed `✓ Great · Relevant throughout` under the player. Text was unreadable (theme variable mismatch, fixed above). Ranges, seeking, navigation and new-tab not yet checked; a YouTube block (timedtext 429) hit during the same search.

**2026-10-01, "Relevant from".** The run log showed `udJ0ZJf97w8` (kafka) as relevant throughout (5 of 9 windows) though its first 8 minutes scored 0.03–0.30, so the strip said "Relevant throughout" with nothing to click. Now `judge` returns `from` (first relevant window's start minus the 10 s lead) and the strip shows `✓ Great · Relevant from 7:50` with the time as a clickable range; "Relevant throughout" only when relevance starts at the beginning. `from` is also in the run log. Owner agreed.
