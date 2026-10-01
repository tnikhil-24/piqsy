# 10 — Survive YouTube blocks

Status: ready-for-human
Type: AFK (parts 2 and 3) + HITL (part 1 probe)
Blocked by: 04

## Parent

`docs/prd/badge-v1.md` · risk 1 in `docs/assessment.md` · ADR 0004

## Why

On 2026-10-01 YouTube blocked two networks in one day: home Wi-Fi (timedtext HTTP 429) and the phone hotspot (player `LOGIN_REQUIRED: Sign in to confirm you're not a bot`, every video, ~160 ms). The hotspot had seen about 60 distinct videos (~115 requests) in a few hours, which a heavy user can reach in a day. So blocks are a product problem, not just a testing one. Details: `docs/captions-spike.md` ("What breaks" 1 and 6).

Ruled out: rotating IPs/proxies to dodge the check (evades YouTube's abuse detection, breaks their terms). Chrome profiles don't help (the block is per IP; Piqsy sends no cookies).

## Options (most to least promising)

1. **Send the user's own YouTube session.** Requests use `credentials: 'omit'`, so they look like an anonymous scraper, and the error literally says "sign in". Try `credentials: 'include'`. Unknown whether the ANDROID client accepts web cookies; may need a different client. Needs a probe on 1–2 short videos once the block lifts.
2. **Stop on the first block.** On a timedtext 429 or player `LOGIN_REQUIRED`, pause all caption fetching for about 30 min and show `Piqsy error` without sending requests. Today every search keeps hitting YouTube after the first refusal, which likely prolongs the block and also hurts the user's own YouTube.
3. **Cache captions across reloads.** The cache is in tab memory, so a tab or extension reload re-fetches everything (the second `python decorators` run fetched all 5 again). Persist captions or a compact form per video in extension storage.
4. **Smaller caption files.** A line-level format (`srv1`) is about 10× smaller than json3 for long auto captions. Overlaps with slice 05.
5. **YouTube's transcript panel (`get_transcript`) in a real page.** Most "normal" traffic, but it returned `FAILED_PRECONDITION` in the slice 02 spike, so it needs new research.

## Proposed plan (awaiting the owner's OK)

- Now, with no YouTube requests needed: 2 and 3, tested with Node's built-in runner (fake fetch, fake storage).
- After the block lifts, on 1–2 short videos only: probe 1. If it works, make it the default.
- First check after the block lifts: search `react useEffect cleanup function` once; `U7_C8llyoGE` (95 s) should show Great, confirming the short-video rule from `35bc3c5`.

## Acceptance criteria

- [x] After the first 429 or bot check, no caption requests go out for the pause period; chips show `Piqsy error`; the run log records the block.
- [x] Captions survive a tab reload and an extension reload; a repeat search after a reload sends no caption requests.
- [x] Storage stays bounded (oldest videos dropped past a limit).
- [ ] Option 1 probed and the result recorded in `docs/captions-spike.md`.

## Comments

**2026-10-01, option 1 experiment wired in.** `extension/captions.js` reads `localStorage.piqsyCookies` in the YouTube tab: unset/0 = no cookies (default, unchanged), 1 = send the user's cookies (`credentials: 'include'`), 2 = cookies + `Authorization: SAPISIDHASH …` like YouTube's own page (needs logged in). The console line ends `[cookies N]` and the run log gains `cookieMode`. The owner is testing over a VPN. Note: VPN IPs are shared and often already flagged by YouTube, and in modes 1/2 the requests are tied to the owner's Google account, not just the IP.

**2026-10-01, VPN test, mode 2:** cookies + `SAPISIDHASH` with the ANDROID client → **HTTP 400 Bad Request** for every video. YouTube rejects web auth on the ANDROID client. Mode 2 removed. Modes 0 and 1 still to test.

**2026-10-01, VPN test, mode 0:** 5/5 captions (0.6–0.7 s) and 5 Great verdicts (total 1.0–1.2 s), so the VPN IP is **not** blocked and can't show whether cookies avoid a block. Windowing change confirmed (`aKOQtGLT-Yk`, 409 s: 3 windows, was 4). `U7_C8llyoGE` wasn't in the top 5 this time, so the one-window Great is still unconfirmed. The real mode 1 test needs a blocked network (hotspot or home Wi-Fi while blocked).

**2026-10-01, VPN test, mode 1:** same search, 5/5 captions (0.31–0.37 s) and 5 Great (total 0.66–0.87 s). Sending cookies with the ANDROID client works and breaks nothing. Still to show: whether it avoids a block (test on the blocked hotspot/home Wi-Fi, mode 1 then mode 0).

**2026-10-01, owner's normal network (no VPN), mode 0:** 5/5 captions, so the earlier block there has **lifted** (it lasted at least 4 min and less than a few hours; exact lift time unknown). So no blocked network was available to test mode 1 against. Option 1 is safe (works, no errors) but **unproven against a block**; test it on the next block before making it the default.
- `U7_C8llyoGE` (95 s, 1 window) → **Great**: the one-window rule from `35bc3c5` is confirmed in Chrome.
- Outlier: `KnKXHcsde5A` (188 s) captions took **10.7 s** (others 0.4–0.5 s). Same pattern as `DqcZLulVJ0M` (11.2 s) in the slice 02 run. Possibly soft throttling right after a block lifts; watch for it in the run log (`captionMs`).

**2026-10-01, full run-log review (times UTC):**
- 18:54 hotspot: bot check, 5/5. 19:18 the owner's normal network: 5/5 OK in both modes.
- 19:09 VPN, mode 0: 4× `TypeError: Failed to fetch` after ~4.2 s (VPN tunnel failures, not YouTube); the 5th took 23 s for captions and 5 s for Jev (slow tunnel).
- Mode 1 total: 4 searches (19:11 and 19:15 on VPN, 19:17 and 19:18 on the normal network), 20/20 captions, 0 errors. Mode 1 is safe on both networks.
- Mode 2: 10/10 rejected (HTTP 400), removed.
- **Recurring ~10 s outlier:** `KnKXHcsde5A` (188 s video) took 10.4 s (19:11, mode 1, VPN) and 10.7 s (19:18, mode 0, normal) for captions, but 0.35–0.67 s in three other runs. Each slow time was the last of 5 parallel fetches. Same as `tfCz563ebsU` 4.4 s (18:43) and `DqcZLulVJ0M` 11.2 s (slice 02). It isn't tied to one video or cookie mode. **It breaks the p95 < 8 s target.** Next step: log the player and timedtext times separately to see which request stalls.

**2026-10-01, owner:** the "normal network" was the **hotspot**, so its bot check lasted **under 25 min** (blocked 18:54 UTC, fine by 19:17 UTC). Home Wi-Fi's timedtext 429 lasted over an hour. Owner OK'd parts 2 and 3; saved captions are per video only.

**2026-10-01, parts 2 and 3 built (agent):**
- Pause: `isBlock` in `extension/captions.js` (timedtext/player HTTP 429, or "not a bot"; not "confirm your age") sets `localStorage.piqsyPausedUntil` = now + 30 min (`PAUSE_MS`). While paused, no caption requests; chips show `Piqsy error` and the run log `detail` says "paused after a YouTube block until …". Shared by all tabs, survives reloads. To test during a pause: `delete localStorage.piqsyPausedUntil`.
- Saved captions: `extension/captionstore.js` in the background worker, key `cap:<videoId>` + `capIndex`; only results with captions (not "none", which can change for fresh uploads); newest 200 videos; videos over 5,000 lines not saved. `unlimitedStorage` permission added.
- Stall diagnosis: each fetch logs `playerMs` and `textMs` (console and run log).
- **Owner check:** search once, reload the tab, search again: the second run's lines say `[cached]` and no requests go out. Watch the next 10 s stall's `player`/`text` split.
