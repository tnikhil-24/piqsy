# Captions spike (slice 02)

Status: done — **Go** (owner, 2026-10-01) · 2026-10-01

Question: can the extension get a search result's timestamped English captions in the browser, without opening the video, fast enough for the 4 s / 8 s target?

## Mechanism

Code: `extension/captions.js` (pure parts tested in `extension/captions.test.js`).

1. `POST https://www.youtube.com/youtubei/v1/player` with the **ANDROID** InnerTube client (`clientVersion 20.10.38`) and the video ID, sent from the content script with no cookies (`credentials: 'omit'`).
2. From `captions.playerCaptionsTracklistRenderer.captionTracks`, pick a creator-written English track (`languageCode` `en` / `en-*`, no `kind`), else English ASR (`kind: 'asr'`).
3. Fetch that track's `baseUrl` with `fmt=json3` (override any existing `fmt`; some URLs carry `fmt=srv3`). Each event with `segs` becomes one line `{ start, duration, text }`.

Outcomes: `none` (no tracks), `not English` (tracks but none English), `fetch failed` (player not `OK`, HTTP error, empty body, exception). Auto-translated captions are never requested (`&tlang=` is never added).

## What was tried

| Route | Result |
|---|---|
| Watch-page HTML → `ytInitialPlayerResponse` tracks → timedtext | Tracks are listed, but the URLs carry `exp=xpe`, and timedtext returns **HTTP 200 with an empty body** without a proof-of-origin (PO) token. Dead. |
| `youtubei/v1/get_transcript` (the "Show transcript" panel) with params from the watch page | **400 FAILED_PRECONDITION** from curl. It might work with a real browser session, but this wasn't pursued once the ANDROID route worked. |
| `youtubei/v1/player` with WEB, MWEB, WEB_EMBEDDED, TVHTML5, ANDROID_VR | UNPLAYABLE / ERROR / LOGIN_REQUIRED, no tracks. |
| `youtubei/v1/player` with **ANDROID** or **IOS** | `OK`, tracks with no `exp=xpe`, and timedtext returns captions. ANDROID is used; IOS is the drop-in fallback. |

Format: json3 was fastest (22 h video: json3 17.6 MB in 0.9 s; srv3 6.3 MB in 0.6 s; vtt 8.2 MB in 0.9 s; srv1 1.9 MB but **11.5 s**). json3 parses with `JSON.parse` and gzips well, so it's kept.

## Results so far (Node, from the owner's home network, logged out)

| Video | Kind | Length | Outcome | Time |
|---|---|---|---|---|
| `o_2psWN8k_c` B+ tree | auto en | 7 min | 177 lines | 0.3 s |
| `BHY0FxzoKZE` TED | manual en (+35 langs) | 13 min | 245 lines | 0.3 s |
| `NIQshbx88hs` Kafka | auto en | 37 min | English ASR track found | — |
| `JFPN-GwON9U` Kafka | auto en | 3.8 h | 5,808 lines, 3.3 MB | 0.6 s |
| `rfscVS0vtbw` freeCodeCamp | manual en | 4.4 h | 2,935 lines | 0.4 s |
| `EerdGm-ehJQ` JS course | auto en | 22 h | 25,999 lines, 17.6 MB | 1.5 s |
| `8jLOx1hD3_o` course | auto en | 31 h | 46,959 lines, 35.6 MB | 2.4 s |
| `qHJjMvHLJdg` Python in Hindi | auto hi only | 1 h | `not English` | 0.15 s |
| `fr1f84rg4Nw` Python in Hindi | — | 18 min | `none` | 0.17 s |
| `UrsmFxEIp5k`, `gfDE2a7MKjA` Hindi courses | creator English track | 11–12 h | picks the English track | — |

Player call: 150–470 ms. 6 videos in parallel (including the 31 h one): 2.4 s overall, dominated by the largest caption file.

## What breaks

1. **IP rate limit on timedtext (the big one).** After about 30 caption downloads (~100 MB, several 20–35 MB files) in about 5 minutes, timedtext started returning **HTTP 429** with Google's "your computer or network may be sending automated queries" page. The player endpoint kept working. It's not yet known how long the block lasts, whether it's counted by requests or by bytes, or whether a real Chrome request is treated differently from Node. Normal use (5 videos per search, cached) is far lighter than this probing was, but heavy searching on long courses could hit it. **The block covers the whole IP, not just Piqsy's route:** while it lasted, YouTube's own web player (hover previews, with a valid `pot` token) also got 429 from timedtext, so the user's normal YouTube captions stop working too. Still blocked about 6 min after the probing stopped (13:16 → 13:22 EDT), and the same home Wi-Fi was still blocked in Chrome at 14:24–14:28 EDT (18:24–18:28 UTC in the run log) the same day (run log: every timedtext request 429), so the block lasts **hours, not minutes**; lift time not yet observed. Mitigations if needed: keep the session cache, skip refetching, try `srv3` (a third of json3's size), and back off on 429.
2. **The ANDROID client is unofficial.** YouTube can retire the pinned client version or add PO tokens to it, as it did for WEB. Fixes: bump `clientVersion`, switch to IOS, and as a last resort the `get_transcript` route inside a real page.
3. **AI-dubbed audio.** With the WEB client, a dubbed video lists "auto-generated" tracks for every dub language (ASR of the dub). The ANDROID response for the same video listed only the original-language track. If dubs into English start appearing as `a.en`, compare against `audioTracks[defaultAudioTrackIndex].audioTrackId`.
4. **Age-restricted / login-required videos** → player status not `OK` → `fetch failed`.
5. **Memory:** a 31 h course is about 47k lines held in the tab's memory. The cache is per tab and is cleared on reload.
6. **Bot check on the player request (seen 2026-10-01, about 15:00 EDT, phone hotspot).** After a day of testing (about 30 searches across two networks, plus the morning's Node probing), the player endpoint itself returned `LOGIN_REQUIRED: Sign in to confirm you're not a bot` for every video, in ~160 ms. That is a different block from the timedtext 429: it hits the first request, so no caption track URL is even obtained. Piqsy shows `Piqsy error` correctly. Unknown: how long it lasts, and whether sending the user's cookies (Piqsy uses `credentials: 'omit'`) or another client (IOS) avoids it. Both are plan B options in `docs/assessment.md`.

## Browser confirmation (13:25 EDT, same blocked IP)

In Chrome, the content script's ANDROID player request succeeded (no CORS issue, track picked) and the timedtext request was sent (`captions.js:47`), but it got **429** from the IP block. So the code path is confirmed; the captions themselves haven't arrived in the browser yet. Side observations: the timedtext URL carried `variant=gemini`. The `googlevideo.com/videoplayback` 403s in the console also appear on an unblocked network, so they're unrelated (YouTube's hover previews).

## Owner's browser run

Network: mobile hotspot (home IP blocked by the probing). Switching the IP fixed it immediately, which confirms the block is per IP.

Load the extension (`chrome://extensions` → reload Piqsy), open DevTools → Console and filter by `[piqsy]`.

| Case | Query | Outcome |
|---|---|---|
| 10-min videos | `b+ tree insertion` | 5/5 captions; 177–406 lines; 277–890 ms each |
| 1–3 h video | `kafka full course` | `B7CwU_tNYIE` 1.1 h: 1,411 lines, 3.3 s; also 3.8 h and 4.3 h (5.8k–5.9k lines, 4.3–4.6 s) |
| ~24 h video | `24 hour programming course` | 5/5 captions, but **30.8 s** for the batch: manual 2 h (1,384 lines) 0.9 s · manual 6.2 h (4,530) 0.9 s · auto 12 h (15,121) 10.4 s · auto 16 h (24,851) 21.7 s · auto 31 h (46,959) 30.8 s |
| no captions | `python tutorial in hindi 15 minute`, `codewithharry python hindi` | `fr1f84rg4Nw`, `ihk_Xglr164` → `none` |
| auto-only captions | all searches | 13 of 15 caption hits were auto en |
| manual captions | `b+ tree insertion`, `codewithharry python hindi` | `K1a2Bk8NrYQ` en; `UrsmFxEIp5k` en (10.9 h, 17,558 lines); `gfDE2a7MKjA` en-IN |
| non-English video | `python tutorial in hindi 15 minute` | `qHJjMvHLJdg`, `vLqTf2b6GZw` → `not English (a.hi)` |
| logged in | all searches above | works (requests send no cookies, so the login state shouldn't matter) |
| logged out (Incognito) | `kafka consumer group rebalancing` | 5/5 captions (4 auto, 1 manual en-US), 636–837 ms each, batch about 0.84 s |
| repeat / refined search | every search, and `b+ tree insertion tutorial` | `[cached]` in 0–4 ms; the refined search fetched only its 1 new video (444 ms) |

All 5 in parallel, fresh fetches: 891 ms (short videos) · 3,645 ms (Hindi mix) · 4,614 ms (`kafka full course`, two 4 h videos) · 2,719 ms (3 new, 2 cached).

**Success rate: 30 / 30 distinct videos** got captions (26) or a correct `none` (2) / `not English` (2). 0 `fetch failed`, no 429 on the hotspot, including after the 24 h batch.

One outlier: `DqcZLulVJ0M` (18 min, 406 lines) took **11.2 s** once on a repeat `b+ tree insertion tutorial` search (it took 0.7 s earlier). A chip that was re-added meanwhile waited on the same in-flight request (`2595ms [cached]`), so the request de-duplication works.

### Observations

0. **Long auto-caption videos are far too slow as json3 (the main problem).** Auto (ASR) json3 has word-level timing, so the file size grows with every word: 12 h → 10 s, 16 h → 22 s, 31 h → 31 s on the hotspot. Manual tracks of similar length are small and fast (6.2 h in 0.9 s). Against the p95 < 8 s target, any auto-captioned course over about 8 h misses badly. Fix belongs in slice 05 (long videos): fetch a line-level format (`srv1` was 1.9 MB vs 17.6 MB json3 for 22 h; its one 11.5 s timing came right before the IP block and needs re-measuring), and/or let the chip render late as the PRD allows.
1. **Long videos are close to the latency budget before Jev even runs.** Time grows with caption size: a 4 h course took 4.3–4.6 s on the hotspot, against 0.6 s for the same 3.8 h video from home in Node. The batch time is set by the slowest of the 5, so the p50 < 4 s target is at risk on course-heavy searches over slow links. Options: `srv3` (about a third of json3's size), or start scoring each video as soon as its own captions arrive, as the PRD's evaluator already does.
2. **Creator-written "English" tracks on Hindi videos are translations.** `UrsmFxEIp5k` and `gfDE2a7MKjA` are spoken in Hindi; their manual English tracks are uploaded translations, which the PRD allows (only YouTube's auto-translation is rejected). `gfDE2a7MKjA` has only 1,251 lines for 11.9 h (one line per ~34 s), so the track is sparse or partial. Windowing must cope with long caption gaps, and a sparse track may deserve `Unsure`.
3. **Each search logged a second, fully cached batch right after the first.** YouTube re-renders the results, Piqsy drops the chips and re-adds them, and the cache answers instantly. That's harmless here, but slice 04 must cache results per (query, video) too, or it will call Jev twice per search.

## Decision

**Go** (owner, 2026-10-01). Recorded in `docs/adr/0004-captions-via-android-client.md`.

Why: captions are reachable from the search page without opening the video, logged in and out (30/30 correct). The two risks found both have known fixes:

| Risk | Where it's handled |
|---|---|
| Long auto-caption videos too slow as json3 | slice 05: line-level caption format, bounded fetch time |
| Timedtext IP block after bulk fetching | never fetch beyond the top 5; keep the cache; the run log (slice 03) records failures so a block shows up |
| ANDROID client retired / PO tokens added | ADR 0004: bump the version, then IOS, then `get_transcript` |
| Duplicate evaluations from YouTube re-rendering results | slice 04: cache results per (query, video) |
| Sparse or translated creator tracks | slice 05 windowing handles gaps; benchmark (09) checks verdict quality |
