# YouTube blocks: the problem

Status: open, top risk (see `docs/assessment.md` risk 1) · 2026-10-01

This doc states the block problem in one place: what it is, what we've seen, what we don't know, and options to discuss. Evidence lives in `docs/captions-spike.md` ("What breaks" 1, 6, 7) and `.scratch/badge/issues/10-youtube-blocks.md`. This doc summarizes them and doesn't replace them.

## What a block is

To rate a search result, Piqsy needs its captions. YouTube has no official way to get captions for other people's videos, so Piqsy makes the same two requests YouTube's Android app makes, from the user's browser and IP (ADR 0004):

1. **player** (`youtubei/v1/player`, ANDROID client): returns the video's caption track list.
2. **timedtext** (the track's URL): returns the caption file itself.

A **block** is Google deciding the IP is sending automated traffic and refusing it. We've seen two kinds:

| Kind | What YouTube returns | Seen | Lasted |
|---|---|---|---|
| timedtext block | `HTTP 429` and the "your computer or network may be sending automated queries" page | home Wi-Fi, twice | over an hour (exact lift time unknown) |
| player bot check | `LOGIN_REQUIRED: Sign in to confirm you're not a bot` for every video, in ~160 ms | phone hotspot | under 25 min |

A block covers the **whole IP**, not just Piqsy. While it's on, YouTube's own player can't load captions either, so the user's normal YouTube use breaks too.

## Why it matters

- **Users:** a heavy learner (about 20 searches × 5 videos a day) sends about as many requests as the hotspot did before it got blocked. Blocks aren't only a testing problem. A real user can get one, and then Piqsy shows only errors and their own YouTube captions stop working. That's worse than not having Piqsy at all.
- **Development:** every manual check costs requests. On 2026-10-01 both of the owner's networks got blocked in one day, so slice 07's last check (a Partial with real ranges) is stuck, and 09 (benchmark) and 11 (long captions) need YouTube requests too.

## Timeline, 2026-10-01

1. Morning, home Wi-Fi: Node probing, about 30 caption downloads (~100 MB, several 20–35 MB files) in 5 minutes → timedtext 429. Still blocked over an hour later.
2. Afternoon, hotspot: about 60 distinct videos (~115 requests, several 10–31 h caption files) over a few hours of normal testing → player bot check. Lifted in under 25 min.
3. Evening, home: one `data structures and algorithms full course` search, with 3 long courses not saved yet → timedtext 429. The 30 min pause triggered.
4. Home, during that block: sending the user's cookies got past the player request but timedtext still returned 429. **Cookies don't help.**
5. Later, hotspot: blocked again during the slice 07 check. *(Owner: fill in which kind, with the `[piqsy]` lines or run-log `detail`.)*

## What's already built

- **Pause on block:** after the first 429 or bot check, no caption requests for 30 min (`localStorage.piqsyPausedUntil`).
- **Saved captions:** the newest 200 videos survive reloads (`extension/captionstore.js`), but videos over 5,000 lines aren't saved, so the biggest files are fetched again on every repeat search.
- **Only the top 5 results:** nothing is prefetched.

## What we don't know

1. **What gets counted:** number of requests, bytes, or both? The worst blocks followed big files (10–35 MB json3 for long auto-captioned courses). If it's bytes, smaller caption files (issue 11) would help a lot. If it's requests, they won't.
2. **The limit:** how many requests or MB per hour, and is it a rolling window?
3. **How long a block lasts**, and whether requests sent during a block make it longer (we assume so, which is why the pause exists).
4. **Whether the two kinds are linked:** does a player bot check lead to a timedtext block?
5. **Whether the IP's history adds up:** both networks had a lot of testing earlier the same day. Is an IP that was blocked once flagged sooner the next time?
6. **Whether normal YouTube use counts toward the limit.**

## Options to brainstorm

Nothing is ruled out yet (owner, 2026-10-01). Some options have been tried; each is listed with its evidence.

### A. Fetch less (the only defence we have today)

1. **Smaller caption files (issue 11).** For long auto-captioned videos, json3 includes timing for every word: 22 h is 17.6 MB as json3, 6.3 MB as srv3 and 1.9 MB as srv1. Helps if bytes are counted (unknown 1).
2. **Save every caption file, including long ones.** Raise or drop the 5,000-line limit so a long course is downloaded once, ever.
3. **Fetch only when needed.** For example, rate the top 3 instead of 5, rate on hover or scroll into view, or skip videos over N hours unless asked. Fewer requests, but fewer chips too.
4. **A per-hour limit inside Piqsy.** Stop at, say, X videos per hour, below the level where we've seen blocks. Needs unknowns 1 and 2 first.

### B. Look like normal YouTube traffic

5. **`get_transcript` (YouTube's "Show transcript" panel) from inside a real page.** It returned `FAILED_PRECONDITION` from curl in the slice 02 spike, but it might work with the page's own session and context. Needs research.
6. **Use what the page already loads.** YouTube's own player fetches captions for the video being watched, and maybe for hover previews. Watch-page-only Piqsy costs zero extra requests, but loses the search chip.
6a. **Send the user's own YouTube session (cookies).** Tried (issue 10, mode 1): it works and breaks nothing, but during a real timedtext block (home, 21:31 UTC) timedtext still returned 429. Untested: whether it avoids the player bot check, and whether a signed-in session is allowed more requests before it gets blocked. Cost: the requests are tied to the user's Google account, so a block could land on the account, not just the IP.
6b. **Separate Chrome profiles.** Untested. They'd only help if the block depended on cookies or the browser. Piqsy sends no cookies by default and blocks so far followed the IP, so likely no effect. A cheap test while blocked: a fresh profile on the same network.

### C. Don't fetch from the user's IP

7. **A third-party transcript API** (paid services that fetch captions themselves). Moves the problem to them and needs a backend or a key in the extension (ADR 0002). Check their terms and how reliable they are.
8. **A shared caption cache on a server.** Each video gets fetched once across all users. Needs a backend (ADR 0002) and raises the policy question in `docs/assessment.md` (collecting captions through users' browsers).
8a. **Rotating IPs or proxies.** Send caption requests through other IPs so no single IP reaches the limit. Common among caption scrapers, and it would remove the block from the user's own network. Costs: proxy fees; Piqsy would need a backend or a proxy setup per user; it deliberately gets around YouTube's abuse detection, which breaks YouTube's terms and puts a Chrome Web Store listing at risk; users' requests go through a third party (privacy); residential proxy networks are often built from other people's devices without their clear consent. A VPN worked once (issue 10, 19:11 UTC) but shared VPN IPs are often already flagged.
9. Not an option: the official YouTube Data API's `captions.download` only works for videos you own.

### D. Need fewer captions

10. **Metadata first:** chapters, description, timestamped comments. Captions only when those can't decide.

### E. Testing without YouTube (separate from the product problem)

11. **Test from saved captions.** During a pause, a search still rates every result whose captions are saved, and sends no requests for the others. A narrow query whose top results are mostly saved videos can check the UI (e.g. slice 07) with zero caption requests.
12. **A replay mode:** recorded caption files served in place of YouTube for development, like demo mode for chips. Makes UI checks independent of blocks.

## Questions for the brainstorm

- Which unknown do we measure first, and how, without causing another block?
- Is watch-page-only (6) an acceptable fallback if search chips can't be made safe?
- Is a backend (7, 8) on the table for V1, or does ADR 0002 hold?
