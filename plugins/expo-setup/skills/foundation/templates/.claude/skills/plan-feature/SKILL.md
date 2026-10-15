---
name: plan-feature
description: Create or update a work plan in docs/plans/ before building a feature or a multi-file change in {{APP_NAME}}. Use when the user asks to plan, design, or start a new feature, or before any change touching more than a couple of files.
---

# Plan a feature

1. **Gather context**
   - Read `docs/TODO.md`, `docs/modules/README.md`, and the module doc(s) this touches.
   - Read `docs/memos/README.md` and any memo relevant to the approach (don't re-decide settled questions).
   - Look at the existing code in `src/features/<slug>/` and `src/app/`.
   - If the feature belongs to a module with no doc yet, run the `new-module` skill first.

2. **Pick the ID** — the next number after the highest in `docs/plans/README.md`. File: `docs/plans/NNN-short-slug.md`.

3. **Write the plan** from `docs/plans/_template.md` with `status: draft`:
   - Goal, Context, Approach, Files, Checklist, Risks.
   - For any Expo / React Native API, verify it against the SDK docs for the version in `package.json` (see `AGENTS.md`) — don't plan from memory.
   - Keep the checklist concrete: each item is a verifiable step.

4. **Update indexes**
   - Add a row to `docs/plans/README.md`.
   - Add the plan ID to the `plans:` list in each affected module doc.
   - Add or link the item in `docs/TODO.md`.

5. **Ask for approval.** Summarize the plan in chat and stop. When the user approves, set `status: in-progress`, update `updated:` and the index row, and add a Log line.
