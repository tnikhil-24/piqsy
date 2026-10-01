# 08 — Hover snippet on the chip

Status: ready-for-agent
Type: AFK
Blocked by: 04

## Parent

`docs/prd/badge-v1.md`

## What to build

Hovering a verdict chip on the search page shows the caption text of the best-scoring window, so the owner can see the evidence behind the verdict.

## Acceptance criteria

- [ ] Hover on Great / Partial / Unsure shows the best window's caption text (trimmed to a readable length).
- [ ] Not covered, no captions and error show a short plain explanation instead.
- [ ] Hover card doesn't block clicking the result or YouTube's own hover preview controls.
- [ ] Legible on light and dark themes.
- [ ] Once issue 12 is in: one line saying which kind was assumed, "Judged as: whole subject" or "Judged as: one topic" (ADR 0005).

## Blocked by

- 04
