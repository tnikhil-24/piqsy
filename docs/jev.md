# Jev (TypeSafe AI)

Piqsy's primary evaluator. Jev is new (released 2026-09-15), so most models won't know it from training. Read this before designing anything that calls it.

## What it is

- A **"System One" decision model** by TypeSafe AI. Not an LLM: it **generates no text**.
- You send **state** (any text) plus **typed questions**; it returns one typed answer per question with a probability.
- Hosted API only (proprietary, no weights, no on-prem). Early-access waitlist; **we have API access**.
- Vendor claims: 70–500 ms end-to-end, 20–200× faster and 40–400× cheaper than LLMs on structured decisions. Unverified by us.
- Price: **$0.042 per 1M input tokens**, output free.

## Question types

| Type | Answers | Returns |
|---|---|---|
| `noul` | Yes/no statement | float 0–1 (probability true) |
| `choice` | One of up to 255 options you enumerate | chosen option + distribution |
| `score` | Ordered scale of 2–10 levels | probability-weighted float |

The response is one JSON object keyed by question id; each answer carries a `type` matching its question.

## What it's good for in Piqsy

"Complicated text in, simple choice out." The intended pattern:

```
transcript → ~2-min windows → per window: noul "this window explains <query>" → probabilities
```

- Verdict comes from the window probabilities (how many windows are relevant, and how strongly).
- Watch ranges come from runs of consecutive high-scoring windows (supports several ranges per video).
- The top window's caption text is the evidence shown to the user.

Rough cost: ~12k tokens per hour of speech → 1-hr video ≈ $0.0005, 24-hr video ≈ $0.013 per query.

## What it can't do

- Write summaries, explanations, "what it misses", or generate sub-topic lists. Those need an LLM.
- Its probabilities are vendor-described as calibrated; **calibrate them on our own benchmark** before trusting thresholds.

## API facts (official docs, checked 2026-10-01)

- `POST https://api.typesafe.ai/v1/systemone`, headers `Authorization: Bearer <key>`, `Content-Type: application/json`. Keys from console.typesafe.ai (SDK env var `TYPESAFE_API_KEY`). New signups were paused from 2026-09-22.
- Request: `{ "state": <string | object | array of text>, "model": "jev-latest" | "jev-1.13.0", "questions": { "<id>": { "type", "instructions", "criteria"? } } }`. **`questions` is an object keyed by id, not an array.**
  - `choice` criteria: `{label: description}`, up to 255 options. `score` criteria: ordered array, 2–10 levels. `noul` criteria: optional.
- Response: `{ "model", "answers": { "<id>": ... }, "usage": { "input_tokens", "output_tokens" } }`
  - noul: `{"type":"noul","noul":0.95}` (no `confidence` field)
  - choice: `{"type":"choice","choice":"x","confidence":1.0,"probabilities":{...}}`
  - score: `{"type":"score","score":1.43,"confidence":0.35,"legend":{...},"probabilities":{...}}`
- Example: state `"Help! My payouts have been failing for 3 days."` + one noul question → `{"answers":{"is_urgent":{"type":"noul","noul":0.95}},"usage":{"input_tokens":296,"output_tokens":20}}`. Note ~280 tokens fixed overhead per request.
- **Limits:** 64k tokens per request, but effectively **32k tokens for `state` + longest question**. No published max questions per request; docs recommend batching all questions about one state in one request (evaluated in parallel).
- **Rate limits:** docs say 100K tokens/s and 40 req/s, "dynamic" (third parties report other numbers). Handle 429 using `Retry-After` / `retry-after-ms`.
- Errors: 401 auth, 422 bad body, 429 rate limit, 529 overloaded. Retry 429/529/5xx with exponential backoff.
- **Browser use:** CORS only allows `console.typesafe.ai`. A Chrome extension service worker with `host_permissions` for `https://api.typesafe.ai/*` should bypass CORS (server didn't reject a `chrome-extension://` origin; untested with a real key). Official JS SDK refuses browsers unless `dangerouslyAllowBrowser: true`. Fine for a single user's own key; a shipped extension needs a server proxy.
- **Calibration:** "trained with RLCD to return calibrated decisions; outcomes assigned 0.8 should occur about 80% of the time" (for groups of predictions, not single answers). No published calibration metrics.
- Weaker on step-by-step reasoning and specialised domains (third-party).

## How Piqsy asks (slice 04)

`extension/jev.js`: one request per window, `state` = the window's caption text, one question `{ explains: { type: "noul", instructions: "This transcript excerpt explains \"<query>\"." } }`, model `jev-latest`. Empty windows score 0 without a request. Concurrency 8 shared by all tabs (background worker). The wording is a first guess; the benchmark (slice 09) can test alternatives.

## Query check (slice 06)

`checkQuery`: one request per search, state `YouTube search: "<query>"`, two `noul` questions: `learning` ("This YouTube search is to learn a concept or skill (not music, entertainment, news or shopping).") and `broad` ("This YouTube search asks for a whole subject, not one specific concept." plus the format words found, as a hint). Thresholds `LEARNING_MIN` 0.5, `BROAD_MIN` 0.65. Window questions use the topic (query minus format words, `topicOf`), not the raw query (ADR 0005). Broad queries (slice 12) ask `This transcript excerpt teaches part of "<topic>"` instead of `explains`.

## Unknowns to check by measurement

- Whether one request can score many windows at once (state holds several windows, one question per window) as accurately as one window per request.
- Real rate limits under our fan-out.
- Quality on noisy auto-generated captions.

## Sources

- [innfactory: Jev — classifier, not LLM](https://innfactory.ai/en/blog/jev-system-one-model-classifier-not-llm/)
- [Browserbase: What is Jev?](https://browserbase.com/blog/what-is-jev)
- [Eden AI: built for decisions not conversation](https://www.edenai.co/post/jev-a-new-kind-of-ai-model-built-for-decisions-not-conversation)
- [Stork.ai: Jev](https://www.stork.ai/en/jev)
- [OpenTweet: Choice / Score / Noul](https://opentweet.io/jev/choice-score-noul)
- [Official docs: API](https://docs.typesafe.ai/api), [primitives](https://docs.typesafe.ai/primitives), [models & limits](https://docs.typesafe.ai/models)
- [flaviocopes: Jev API key](https://flaviocopes.com/jev-api-key/), [OpenTweet: limits](https://opentweet.io/jev/limits)
- [go-jev SDK](https://pkg.go.dev/github.com/shanehull/go-jev), [jev-cli (PyPI)](https://pypi.org/project/jev-cli/)
