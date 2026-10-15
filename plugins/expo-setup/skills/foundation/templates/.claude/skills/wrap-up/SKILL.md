---
name: wrap-up
description: Finish a task in {{APP_NAME}} — run lint and typecheck, update CHANGELOG.md, plan/module statuses, TODO.md, and record memos. Use before declaring any code change done, or when the user says "wrap up", "finish", or "log this change".
---

# Wrap up a task

Do every step; report anything you couldn't complete.

1. **Verify**
   - `npx tsc --noEmit`
   - `npx expo lint`
   - `npm test` — run the existing suite. Don't write new tests unless the user asked for them (AGENTS.md → Testing). If an existing test now fails, report it to the user instead of editing the test.
   - Fix failures you introduced. If a failure pre-dates your change, say so instead of hiding it.

2. **CHANGELOG.md** — add entries under `## [Unreleased]` in the right section (Added / Changed / Fixed / Removed / Security). Write for a reader who didn't see the work; reference the plan ID and module slug. One line per user-visible or structural change, not per file.

3. **Plan** (if one exists)
   - Tick completed checklist items, add a dated Log line, update `updated:`.
   - If everything is done, set `status: done`.
   - Sync the row in `docs/plans/README.md`.

4. **Module docs** — update every affected `docs/modules/<slug>.md` so it describes the current behavior (screens, data, rules, features ticked). Adjust `status` (`planned` → `in-progress` → `stable`) and sync `docs/modules/README.md`.

5. **TODO.md** — tick finished items and move them to Done; add any follow-ups discovered.

6. **Memos** — if you made a decision someone might question later (library choice, trade-off, rejected approach), write `docs/memos/NNN-slug.md` from the template and add it to `docs/memos/README.md`. If it reverses an earlier memo, mark that one `superseded`.

7. **CLAUDE.md** — only if the stack table, folder map, or "Current state" changed. Keep it short.

8. **Summarize** in chat: what changed, verification results, docs updated. Don't commit unless the user asks.
