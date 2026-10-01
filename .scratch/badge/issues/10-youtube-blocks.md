# 10 — Survive YouTube blocks

Status: needs-triage
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

- [ ] After the first 429 or bot check, no caption requests go out for the pause period; chips show `Piqsy error`; the run log records the block.
- [ ] Captions survive a tab reload and an extension reload; a repeat search after a reload sends no caption requests.
- [ ] Storage stays bounded (oldest videos dropped past a limit).
- [ ] Option 1 probed and the result recorded in `docs/captions-spike.md`.

## Comments

**2026-10-01, option 1 experiment wired in.** `extension/captions.js` reads `localStorage.piqsyCookies` in the YouTube tab: unset/0 = no cookies (default, unchanged), 1 = send the user's cookies (`credentials: 'include'`), 2 = cookies + `Authorization: SAPISIDHASH …` like YouTube's own page (needs logged in). The console line ends `[cookies N]` and the run log gains `cookieMode`. The owner is testing over a VPN. Note: VPN IPs are shared and often already flagged by YouTube, and in modes 1/2 the requests are tied to the owner's Google account, not just the IP.
