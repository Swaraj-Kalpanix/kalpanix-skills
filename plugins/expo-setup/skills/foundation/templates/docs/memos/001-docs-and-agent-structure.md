---
id: MEMO-001
title: Docs and agent structure
status: active
superseded_by:
date: {{DATE}}
updated: {{DATE}}
---

# MEMO-001 — Docs and agent structure

## Context
{{APP_NAME}} will be developed largely with AI coding agents. Without a shared structure, context gets lost between sessions and agents re-decide things.

## Decision
- `AGENTS.md` holds the rules for any agent (workflow, conventions, Expo rules). It's the cross-tool standard, so Codex/Cursor/etc. read it too.
- `CLAUDE.md` imports `AGENTS.md` and adds a short project overview (what the app is, stack, where things are).
- The changelog lives in `CHANGELOG.md`, **not** in `CLAUDE.md`.
- `docs/` holds `modules/` (feature specs), `plans/` (work plans), `memos/` (decisions), and a single `TODO.md` board. Every doc has frontmatter with `status` and `updated`; each folder has an index table.
- Repeated workflows are project skills in `.claude/skills/`.

## Why
- `CLAUDE.md` is loaded into every session. A changelog grows forever and would waste context on every request; agents only need it occasionally, so it's linked instead.
- One `TODO.md` is easier to scan and keep current than a folder of todo files; larger items get a plan.
- Splitting modules (what a feature *is*) from plans (a change *to* it) keeps module docs accurate as the source of truth.

## Consequences
- Every task ends with doc upkeep (changelog, statuses, indexes) — the `wrap-up` skill makes this a single step.
- Index tables must be kept in sync by hand/agent.
