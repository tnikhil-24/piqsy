# 06 — Learning-query check and on/off switch

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
