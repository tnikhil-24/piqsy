## Agent skills

### Issue tracker

Issues live as local markdown files under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one root `CONTEXT.md` plus `docs/adr/`. See `docs/agents/domain.md`.

## Project docs

- `docs/jev.md`: what Jev (our evaluator, TypeSafe AI) is and how Piqsy uses it. Read before touching evaluation code.
- `docs/prd/badge-v1.md`: current PRD (search chip + watch-page ranges). Slices in `.scratch/badge/issues/`.
- `docs/adr/`: why the big decisions were made (Jev window scoring, no backend, verified verdicts only).
- `docs/assessment.md`: open risks and concerns not yet resolved.
- `CONTEXT.md`: glossary; use its terms.
