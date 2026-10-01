# 0004 — Captions via the InnerTube ANDROID player client

Date: 2026-10-01 · Status: accepted

## Context

Piqsy needs the captions of the top 5 results without the user opening them. YouTube has no official API for other people's captions. The obvious routes are closed: the WEB player's caption URLs need a proof-of-origin token (timedtext returns an empty body without it), and the transcript panel endpoint (`get_transcript`) returns `FAILED_PRECONDITION`. Evidence: `docs/captions-spike.md`.

## Decision

The content script calls `youtubei/v1/player` with the **ANDROID** client and no cookies, picks a creator-written English track (else English ASR), and fetches it from timedtext as json3. Auto-translated tracks are never requested. Results are cached per video in memory for the tab.

## Why

It was the only route that worked, and it held up in the browser: 30/30 videos handled correctly (captions, `none` or `not English`), logged in and out, with no 429 under normal searching.

## Consequences

- The client is unofficial and its version is pinned (`PLAYER_CLIENT` in `extension/captions.js`). If YouTube retires the version or adds PO tokens to ANDROID, captions break: bump the version, switch to IOS (also verified), or fall back to `get_transcript` inside a real page.
- Bulk fetching from one IP triggers Google's timedtext block (HTTP 429), which also breaks the user's own YouTube captions while it lasts. Never prefetch beyond the top 5, and keep caching.
- Long auto-caption videos are slow as json3 (31 h → 31 s). Slice 05 must switch to a line-level format or otherwise bound the fetch time.

## Update 2026-10-01 (afternoon)

The "revisit" trigger fired the same day: after about 60 videos on the hotspot, the **player** request itself returned `LOGIN_REQUIRED: Sign in to confirm you're not a bot` for every video. Cookie-less requests look like a scraper; the first fix to try is sending the user's own YouTube session. See `.scratch/badge/issues/10-youtube-blocks.md` and `docs/captions-spike.md` ("What breaks" 6). The block lifted in under 25 min. Since then Piqsy pauses caption requests for 30 min after a block, and captions are saved per video across reloads (background worker), not just per tab. Cookies with ANDROID work but are untested during a block; web auth (SAPISIDHASH) gets HTTP 400.

## Revisit when

Captions start failing (`fetch failed` in the run log), or before anyone else installs the extension: many users on one unofficial client draw attention.
