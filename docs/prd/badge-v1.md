# PRD: Piqsy Badge V1 — search badge + watch-page ranges

Status: ready-for-agent

## Problem Statement

When I search YouTube to learn a technical concept ("kafka consumer group rebalancing", "adv java interview questions", "B+ tree insertion"), the results all look equally plausible. Titles and thumbnails don't tell me whether a video actually explains what I searched for. I open several videos, sit through intros, scrub long timelines, and often find the topic isn't covered, is covered too briefly, or is buried somewhere inside a 3-hour or 24-hour course. Most of my wasted time goes into either picking the wrong video or hunting for the part of a long video that actually covers my topic.

## Solution

A Chrome extension that works on YouTube search:

1. **On the search results page**, the top 5 video results get a small chip on the thumbnail (top-left) saying how well the video's actual content matches my query: `✓ Great`, `◐ Partial`, `✕ Not covered`, `? Unsure`, or `no captions` / `Piqsy error` when it couldn't check. Hovering a chip shows the caption snippet that best matches my query.
2. **When I click a rated result**, the watch page shows a thin Piqsy strip under the player, for example `✓ Great · Watch 4:18–9:40 · 31:02–35:10`. Clicking a range jumps the video there.

Verdicts come from the video's real captions, not its title: the captions are split into time windows, and Jev (TypeSafe AI's decision model, see `docs/jev.md`) scores how well each window explains my query. It works on the first search, with no warm cache, and stays silent on non-learning searches like music.

## User Stories

### Searching

1. As a learner, I want Piqsy to rate the top 5 video results of my YouTube search, so that I can pick a video without opening several.
2. As a learner, I want the verdict to reflect what the video actually says (its captions), not just its title, so that misleading titles don't fool me.
3. As a learner, I want the verdict to be relative to my exact query, so that the same course can be Great for "B+ trees" and Not covered for "LSM trees".
4. As a learner, I want a chip on the thumbnail's top-left corner, so that I see it in the same glance I use to scan thumbnails.
5. As a learner, I want `✓ Great` to be the only visually loud state, so that my eye goes straight to the best videos.
6. As a learner, I want `◐ Partial` to tell me the video covers my topic but not fully, so that I know I may need another source.
7. As a learner, I want `✕ Not covered` in muted grey, so that I can skip those videos without the page becoming noisy.
8. As a learner, I want `? Unsure` when Piqsy can't tell, so that I'm never given false confidence.
9. As a learner, I want `no captions` when a video has no English captions, so that I can tell "couldn't read it" from "read it and unsure".
10. As a learner, I want `Piqsy error` when the check failed (network, Jev error, rate limit), so that failures don't masquerade as verdicts.
11. As a learner, I want a faint pulsing `Piqsy …` chip while a result is being checked, so that I know a verdict is coming.
12. As a learner, I want verdicts for the top 5 within about 4 seconds typically and 8 seconds at worst, so that they arrive before I'd normally click.
13. As a learner, I want it to work on a brand-new search with nothing cached, so that it's useful for every search, not just repeats.
14. As a learner, I want every state to use an icon plus a word, not colour alone, so that it's readable regardless of colour vision.
15. As a learner, I want chips to look right on YouTube's light and dark themes, so that they're always legible.
16. As a learner, I want to hover a chip and see the caption snippet that best matches my query, so that I can see why Piqsy rated it that way.
17. As a learner, I want chips to keep working when I search again from the search box, go back/forward, or arrive at search from the home page, so that it works the way I actually use YouTube.
18. As a learner, I want no duplicate chips when YouTube re-renders or I scroll, so that the page stays clean.
19. As a learner, I want results beyond the top 5, Shorts, ads, channels, playlists and mixes to get no chip, so that Piqsy stays focused and quiet.
20. As a learner, I want videos from 10 minutes up to 24 hours to be rated, so that long courses — where the pain is worst — are covered.
21. As a learner, I want "relevant throughout" videos (e.g. an interview-questions compilation) recognised as such, so that I'm not given a misleading start time.

### Non-learning searches

22. As a user searching for music or entertainment, I want Piqsy to stay silent, so that I don't see "Not covered" on lofi videos.
23. As a user, I want Piqsy to decide automatically whether my query is a learning search, so that I don't have to toggle it all the time.
24. As a user, I want an on/off switch in the extension popup, so that I can override Piqsy when its guess is wrong.
25. As a user, I want the learning-search check not to slow down verdicts, so that the gate costs me nothing.

### Watch page

26. As a learner who clicked a rated result, I want a strip under the player showing where the relevant content is, so that I don't have to scrub.
27. As a learner, I want up to 3 ranges shown in time order, so that topics that appear in several places in a long video are all reachable.
28. As a learner, I want the strongest range visually emphasised, so that I know where to start.
29. As a learner, I want to click a range and have the video jump there and keep playing, so that I get straight to the explanation.
30. As a learner, I want ranges to start slightly before the explanation rather than after it, so that I never land mid-sentence.
31. As a learner, I want "relevant throughout" shown instead of ranges when most of the video is relevant, so that the strip stays honest.
32. As a learner, I want no strip for Not covered, Unsure, no captions or error results, so that the watch page only speaks when it has something useful.
33. As a learner, I want the video to open normally at the beginning when I click a result, so that I'm in control of when to jump.
34. As a learner, I want the strip to appear only when I arrived from a search Piqsy rated, so that ranges are never judged against an unrelated old query.
35. As a learner, I want the strip to disappear when I navigate to a different video, so that stale ranges never show.

### Setup and data

36. As the owner, I want to paste my Jev API key into an options page once, so that the extension can call Jev without a backend.
37. As the owner, I want the options page to tell me clearly if my key is wrong, so that I don't just see a page of `Piqsy error` chips.
38. As the owner, I want my key and all data to stay on my machine, so that nothing leaks.
39. As the owner, I want captions remembered for the browser session, so that refining a search doesn't re-fetch the same videos from YouTube.
40. As the owner, I want every evaluation logged locally (query, video, caption outcome and reason, window count, Jev latency, total latency, verdict, ranges), so that I can measure reliability and the latency target over real use.
41. As the owner, I want to export that log as JSON from the options page, so that I can analyse a week of searches.
42. As the owner, I want computed ranges logged even when not shown, so that the benchmark can measure timestamp accuracy.
43. As the owner, I want a failure anywhere in Piqsy never to break YouTube, so that I can keep it installed all the time.

### Quality

44. As the owner, I want verdict thresholds and timestamp rules to be named constants, so that I can tune them from the benchmark.
45. As the owner, I want a benchmark of about 50 hand-labelled (query, video) cases with a report of Great precision and timestamp error, so that I know whether badges deserve trust before sharing Piqsy.
46. As the owner, I want a false Great to be treated as the worst error, so that thresholds favour Great precision over Great recall.

## Implementation Decisions

### Platform and architecture

- Chrome extension, Manifest V3, plain JavaScript, no build step. Loaded unpacked; single user (the owner) until the benchmark shows badges are trustworthy.
- **No backend.** The extension's background service worker calls Jev directly with the owner's key, stored in extension storage. Jev's CORS policy blocks normal pages but an extension service worker with host permission for the Jev API bypasses CORS. A server proxy becomes necessary only when other people install the extension.
- Host permissions limited to YouTube and the Jev API.
- YouTube search only; English only.

### Modules

1. **Verdict engine** (pure, deep). Input: per-window scores (probability the window explains the query) with window time bounds, plus video duration. Output: `{ verdict, ranges, throughout, bestWindow }`. Owns all thresholds as named constants. Starting rules (guesses, tuned by the benchmark):
   - Great: some window ≥ 0.85 **and** it plus an adjacent window are both ≥ 0.7.
   - Partial: some window ≥ 0.6, Great not met.
   - Not covered: every window < 0.3.
   - Unsure: anything else.
   - Ranges: runs of consecutive windows ≥ 0.7; at most 3, in time order, strongest flagged; each start shifted 10 s earlier (landing early is fine, landing late is not).
   - Throughout: relevant windows cover ≥ 40% of the video → no ranges, `throughout = true`.
2. **Windowing** (pure, deep). Input: timestamped caption lines and duration. Output: windows (start, end, text). 2-minute windows, growing so a video produces at most about 60 windows. A second function produces fine 2-minute windows inside a given range, used for a second pass when a long video's verdict is Great or Partial and its best window is longer than 2 minutes.
3. **Jev client** (deep). `scoreWindows(query, windows) → probabilities[]` (one `noul` request per window, run in parallel with a concurrency limit) and `isLearningQuery(query) → probability`. Hides the request shape (questions keyed by id), retries with exponential backoff on 429/529/5xx honouring `Retry-After`, and error classification (auth vs transient vs overloaded). See `docs/jev.md` for the API contract.
4. **Caption fetcher.** `videoId → { lines: [{ start, duration, text }], kind: manual | auto } | { reason }`. English captions only (manual or auto-generated); auto-translated tracks are rejected with reason "not English". The fetching mechanism is decided by slice 02 (the caption feasibility check) and documented in `docs/captions-spike.md`.
5. **Evaluator** (background orchestrator). For one search: runs the learning-query check in parallel with caption fetches for the top 5, then windowing → Jev → verdict engine for each video, emitting per-video results as they complete. Writes the run log.
6. **Search page adapter.** Reads the query from the page, finds the first 5 regular video results, injects and updates chips, handles YouTube's in-app navigation and re-renders without duplicates.
7. **Watch page adapter.** On a watch page, looks up the current video in the session store; if it has a result from a Piqsy-rated search with Great/Partial, renders the strip under the player; clicking a range seeks the player and keeps playing. Clears on navigation to another video.
8. **Chip and strip views.** State → element. States: pending (faint, pulsing), Great (solid green, white text), Partial (amber outline), Not covered (muted grey), Unsure (neutral outline), no captions and error (faint text). Icon + word in every state; light and dark themes. Hover on chip shows the best window's caption snippet. No Piqsy logo mark in V1.
9. **Session store and run log.** Per-browser-session store: captions per video; latest result per video (query, verdict, ranges, snippet). Persistent local run log with JSON export.
10. **Options page and popup.** Options: Jev key entry with a validity check, log export. Popup: on/off switch.

### Behaviour decisions

- Badge states are exactly: pending, Great, Partial, Not covered, Unsure, no captions, error. No Skip.
- No timestamps on the search page in V1. Ranges are always computed and logged; they are shown only on the watch page.
- Clicking a result opens the video normally (no `&t=` rewriting).
- Non-learning queries (learning-query probability below a threshold) get no chips at all; the popup switch overrides.
- "Great" labelling definition (for the benchmark): watching from where the relevant section starts would teach the searcher what they searched for, at about their level. "Partial": covers it, but you'd need another source.
- Latency target: verdicts for the top 5 at p50 < 4 s, p95 < 8 s. Late verdicts still render but count as misses in the log.

### Gate

If slice 02 shows captions cannot be fetched reliably from the search page, stop and decide plan B before building the Jev verdict slice.

## Testing Decisions

- Good tests check external behaviour through a module's interface (inputs → outputs), never internals, so thresholds and implementation can change without rewriting tests.
- Automated tests for three modules, using Node's built-in test runner (no framework):
  - **Verdict engine:** each verdict boundary, adjacency requirement for Great, range merging, max 3 ranges, strongest flag, 10 s early shift clamped at 0, throughout at the 40% boundary, empty/one-window videos.
  - **Windowing:** short videos, exactly-2-hour videos, a 24-hour video capped at about 60 windows, caption gaps and silences, fine windows inside a range.
  - **Jev client:** with a fake fetch — request shape, parsing of `noul` answers, retry/backoff on 429/529/5xx, honouring `Retry-After`, no retry on 401, concurrency limit respected.
- Caption fetcher, page adapters and views are checked manually in Chrome against the acceptance criteria of each slice.
- Prior art: none yet; this is the first code in the repo.
- Product-level quality is measured by the mini benchmark (~50 labelled cases): confusion matrix, Great precision, timestamp error with asymmetric tolerance (early OK, late bad).

## Out of Scope

- Timestamps on the search page; rewriting result links to jump to a start time.
- Seek-bar range highlights on the watch page.
- Watch-page strips for videos not reached from a Piqsy-rated search; a "what are you looking for?" box.
- Pausing at the end of a range.
- Backend server, shared cache across users, accounts, payments, Chrome Web Store release.
- Piqsy logo/brand mark in the chip.
- Free-text user context ("about me") — decided after the benchmark.
- Beginner/Intermediate/Advanced selector.
- Intent normalisation, verdict caching, LLM fallback, summaries, "what it misses", freshness, format detection.
- Google search, other platforms, Firefox, mobile, non-English captions and auto-translated captions.
- Sort by fit / reordering YouTube results.
- Results beyond the top 5, Shorts, ads, channels, playlists, mixes.

## Further Notes

- Jev facts (endpoint, schema, 32k-token state limit, rate limits, CORS, calibration claim) are in `docs/jev.md`.
- Rough cost: about 12k tokens per hour of speech, so a 1-hour video ≈ $0.0005 and a 24-hour video ≈ $0.013 per query at $0.042 per million input tokens.
- Open experiment for the benchmark slice: whether one Jev request can score many windows at once (numbered windows in one state) as accurately as one window per request. If so, switch to it to cut request counts.
- The biggest product risk remains caption access from the search page; the second is Great precision. Both have explicit checks (slice 02 and the benchmark).
- Planned slices: 01 pending chips · 02 captions + log · 03 Jev verdict · 04 learning-query check + switch · 05 watch-page strip · 06 hover snippet · 07 mini benchmark · 08 user context.
