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

## Unknowns to check in the official docs / by measurement

- Maximum input size per call (matters for window size and 24-hr videos).
- Rate limits and concurrency (window scoring fans out many calls per search).
- Exact endpoint, auth header, request schema.
- Quality on noisy auto-generated captions.

## Sources

- [innfactory: Jev — classifier, not LLM](https://innfactory.ai/en/blog/jev-system-one-model-classifier-not-llm/)
- [Browserbase: What is Jev?](https://browserbase.com/blog/what-is-jev)
- [Eden AI: built for decisions not conversation](https://www.edenai.co/post/jev-a-new-kind-of-ai-model-built-for-decisions-not-conversation)
- [Stork.ai: Jev](https://www.stork.ai/en/jev)
- [OpenTweet: Choice / Score / Noul](https://opentweet.io/jev/choice-score-noul)
- [go-jev SDK](https://pkg.go.dev/github.com/shanehull/go-jev), [jev-cli (PyPI)](https://pypi.org/project/jev-cli/)
