# 06 — Learning-query check (and broad vs narrow) and on/off switch

Status: ready-for-agent
Type: AFK
Blocked by: 04

## Parent

`docs/prd/badge-v1.md`

## What to build

Before chipping a search, ask Jev one question about the query: is this a search to learn a concept or skill? Non-learning searches (music, entertainment) get no chips at all. The check runs in parallel with caption fetching so it adds no delay. A popup on/off switch lets the owner override the automatic decision.

## Acceptance criteria

- [ ] "lofi music" and "funny cats" get no chips; "kafka consumer group rebalancing" and "adv java interview questions" do.
- [ ] The check runs alongside caption fetches; total time to verdict doesn't increase.
- [ ] Learning-query threshold is a named constant; the probability is logged.
- [ ] Popup switch: off = no Piqsy on any search; on = automatic check applies. Setting persists.
- [ ] If the check itself fails, fall back to chipping (don't silently hide Piqsy).

## Blocked by

- 04

## Added 2026-10-01 (ADR 0005): broad vs narrow

The same Jev request also asks whether the query is broad (a whole subject) or narrow (one concept).

- [ ] One request, two `noul` questions (learning, broad); both probabilities logged; broad threshold is a named constant.
- [ ] Format words ("full course", "tutorial", "for beginners", "explained", "crash course", "in one video") are removed to make the topic used for window scoring; if nothing is left, the original query. A pure, tested function.
- [ ] The format words found are passed to the broad question as a hint.
- [ ] Unsure (near threshold) or failed check → narrow.
- [ ] Window scoring waits for the check (it runs while captions download, so normally no added delay); the topic, not the raw query, is sent to Jev. Narrow verdicts unchanged.
