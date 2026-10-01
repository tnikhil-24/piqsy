---
name: session-close
description: End-of-session documentation sweep for Piqsy. Finds what the session learned or decided that isn't yet in the repo docs, writes each item where it belongs, commits, and reports. Use when the owner says they're closing, ending or wrapping up the session, or asks "is there anything to document" / "anything left to write down".
---

# Session close

Goal: a fresh session can continue from `AGENTS.md` and the docs alone. Nothing learned in this conversation may live only in the conversation.

## Workflow

1. `git status --short`. Uncommitted work: finish, commit, or name it in the report. Never leave it silent.
2. Go through the conversation and list every finding not yet in a file:
   - owner check results (searches, verdicts, scores, what looked right or wrong)
   - measurements (latency, sizes, probabilities, run-log numbers)
   - decisions and owner preferences ("too plain, fine for now", "relevant from is good")
   - bugs or oddities noticed but not fixed (small to-dos)
   - YouTube blocks: when, which network, what triggered them
   - ideas deliberately postponed
3. For each item, check whether its home already says it (grep). Only write what's missing.
4. Write each item to its home (table below), dated, in the doc's existing style.
5. Update the status line in `AGENTS.md` ("Code and status") so it gives each slice's state and **the next steps in order**.
6. Commit the docs (one commit; message starts `Docs:`), then `git status --short` must be clean.
7. Report in a few bullets: what was added where, and the next step. If nothing was missing, say so in one line. Don't invent findings.

## Where things go

| Finding | Home |
|---|---|
| Slice progress, owner check results, small to-dos for a slice | `.scratch/badge/issues/NN-*.md`, under `## Comments`; update its `Status:` line |
| Slice finished (all criteria met and checked by the owner) | `Status: done`, tick `- [x]` boxes, `AGENTS.md` status |
| How a module was actually built, when it differs from the plan | `docs/prd/badge-v1.md`, italic `*As built (slice NN): …*` on that module |
| Caption fetching behaviour, latency, what breaks | `docs/captions-spike.md` |
| Jev request shapes, wording, thresholds | `docs/jev.md` |
| Open risks (blocks, cost, accuracy) | `docs/assessment.md` |
| Postponed ideas and what brings them back | `docs/future-plans.md` (`*Added <date>, owner.*` + "Revisit when:") |
| A hard-to-reverse decision with alternatives considered | new `docs/adr/NNNN-*.md` |
| New or changed domain term | `CONTEXT.md` glossary |
| How to run, test or inspect; repo-wide rules | `AGENTS.md` |
| Benchmark cases to add | `.scratch/badge/issues/09-mini-benchmark.md` |

## Rules

- Documents are markdown in the repo (owner preference).
- Dates are absolute (`2026-10-01`), never "today". Run-log `ts` values are UTC; say so when quoting them.
- Use the glossary's terms (`CONTEXT.md`).
- Record numbers as measured, with the video ID and query, not as impressions.
- Don't duplicate: a fact lives in one doc; others point to it.
- Never mark a slice done without the owner's check; write what's left instead.

## Example

Session ended after the owner checked the strip on the kafka search:

- issue 07: "owner check 2: `udJ0ZJf97w8` → Relevant from 7:50, seek works; left: a Partial with real ranges"
- `CONTEXT.md`: added **Relevant from**
- PRD module 7: *As built (slice 07): ratings in `chrome.storage.session` …*
- `AGENTS.md`: "07 built, mostly checked; next: close 07, then 11, then 09"
