# Piqsy — Assessment and open risks (2026-10-01)

Summary of the initial founding-engineer review of `piqsy_product_audit (1).md`. Decisions that came out of it are in `docs/prd/badge-v1.md` and `docs/adr/`. This file keeps the risks and concerns that are **not yet resolved**.

## Where the value is

- Strongest for buried topics in long videos (1–24 hr); weakest for picking between five similar short explainers.
- The ranges ("watch 12:30–18:40") may be the real product; the verdict is the supporting signal.
- Piqsy only helps when its verdict *differs* from what YouTube's ranking + the title already suggest. Measure against that baseline.

## Existential risks

1. **Caption access from the search page.** No official API for other people's captions. Fetching for results the player hasn't loaded means extra requests from the user's logged-in session; YouTube has been tightening this (proof-of-origin tokens since 2024–25). Gate: slice 02. Plan B options recorded there: watch-page-only, server-side fetch (worse), metadata/chapters only, or stop.
2. **First-search latency.** A verdict that arrives after the click is no verdict. Target p50 < 4 s, p95 < 8 s for the top 5.
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
- **Timestamp error is asymmetric:** landing early is fine, landing late is bad.

## Deliberately cut from the audit (for now)

Intent normalisation, intents table, Postgres, Redis, `ContentSource` abstraction, format and freshness detection, "what it misses", LLM fallback routing, sort by fit, learning paths.
