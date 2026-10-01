# Piqsy — Assessment and open risks (2026-10-01)

Summary of the initial founding-engineer review of `piqsy_product_audit (1).md`. Decisions that came out of it are in `docs/prd/badge-v1.md` and `docs/adr/`. This file keeps the risks and concerns that are **not yet resolved**.

## Where the value is

- Strongest for buried topics in long videos (1–24 hr); weakest for picking between five similar short explainers.
- The ranges ("watch 12:30–18:40") may be the real product; the verdict is the supporting signal.
- Piqsy only helps when its verdict *differs* from what YouTube's ranking + the title already suggest. Measure against that baseline.

## Existential risks

1. **Caption access from the search page.** No official API for other people's captions. Fetching for results the player hasn't loaded means extra requests from the user's logged-in session; YouTube has been tightening this (proof-of-origin tokens since 2024–25). Gate: slice 02. **Passed 2026-10-01 (Go)**: the ANDROID player client works (30/30 videos, logged in and out; ADR 0004). Residual risks: the client is unofficial and can be retired; bulk fetching from one IP triggers a timedtext block that also breaks the user's own YouTube captions. Plan B if it breaks: IOS client, `get_transcript` inside a real page, watch-page-only, or metadata/chapters only.
   **Update 2026-10-01 afternoon: now the top risk.** Two networks were blocked in one day: home Wi-Fi (timedtext 429, from the morning's probing) and then the phone hotspot (player `LOGIN_REQUIRED: Sign in to confirm you're not a bot`). The hotspot saw about 60 distinct videos (~115 requests, several 10–31 h caption files) over a few hours. A heavy user's day (20 searches ≈ 100 videos) is about the same, so **real users can hit this**; it is not just a testing artefact. Separate Chrome profiles don't help: the block is per IP and Piqsy sends no cookies, so all profiles look identical. Rotating IPs or proxies to dodge the check is ruled out (it evades YouTube's abuse detection and breaks their terms). Legitimate mitigations, planned in `.scratch/badge/issues/10-youtube-blocks.md`: send the user's own session, stop on the first block, cache captions across reloads, smaller caption formats.
2. **First-search latency.** A verdict that arrives after the click is no verdict. Target p50 < 4 s, p95 < 8 s for the top 5. Slice 02 measured caption fetch alone (hotspot): short videos 0.9 s; 4 h courses 4.6 s; a 24 h search 30.8 s (long auto captions as json3). Slice 05 must fix the long-video case. **Slice 04 (2026-10-01, short videos, with Jev):** p50 1.0 s, p95 3.7 s per video. But one of the 5 parallel caption fetches sometimes stalls ~10 s (seen 4 times; issue 10), which alone breaks p95; `playerMs`/`textMs` are now logged to find which request stalls.
3. **Is "Great" well-defined?** If humans don't agree on Great vs Partial, a high-precision target is meaningless. Measure inter-rater agreement in the benchmark.
4. **Behaviour change.** Users may find badges interesting and still click the top result.
5. **Platform competition.** Google Search already shows "key moments" / suggested clips that match queries to video segments; YouTube is adding its own AI features. Learners may also skip video and ask an LLM.

## Concerns to revisit later

- **Multi-user:** shared cache poisoning from client-supplied captions; prompt injection inside captions or descriptions ("this video fully explains X"); Jev key needs a server proxy (ADR 0002).
- **Privacy:** the sensitive data is the user's **queries**, not public-video transcripts. Keep query logging minimal; check provider retention before any multi-user release.
- **Policy:** building a server-side index from captions collected through users' browsers (the "flywheel") is the riskiest form of data collection; decide deliberately before Phase "standalone search".
- **Standalone Piqsy search conflicts with the extension architecture**: it needs server-side ingestion, which the browser-side design avoids. Don't let it shape V1.
- **Language:** much popular CS teaching content is Hindi/Hinglish; V1 is English-only. The run log will show how often that bites.
- **Entry points:** many learners start on Google, not YouTube search.
- **Benchmark statistics:** size the test set by the number of predicted Greats needed to support a precision claim (29/30 correct only proves ~83% at 95% confidence).
- **Broad and format queries ("X full course") fit window scoring badly (owner, 2026-10-01).** For `data structures and algorithms full course`, the owner preferred Sajjaad Khader's 15:51 overview (`O9v10jQkm5c`): Piqsy said Unsure (windows 0.24–0.54). The 4–12.5 h courses got Partial, mostly from one intro window that says "in this full course…" (e.g. `CBYHwZcbD-s`: 0.76 at 0:00, the rest ≤ 0.57). Jev is asked whether a 2-minute excerpt explains "<query>", so format words ("full course", "tutorial", "for beginners") are matched as if they were the topic, and no excerpt can explain a whole course. Also, which video teaches *better* (style, structure) is a preference Piqsy doesn't judge; it judges coverage and where. Options: strip format words before asking Jev; treat broad queries as whole-video questions; let the benchmark (slice 09, "broad queries") decide.
- **Timestamp error is asymmetric:** landing early is fine, landing late is bad.

## Deliberately cut from the audit (for now)

Intent normalisation, intents table, Postgres, Redis, `ContentSource` abstraction, format and freshness detection, "what it misses", LLM fallback routing, sort by fit, learning paths.
