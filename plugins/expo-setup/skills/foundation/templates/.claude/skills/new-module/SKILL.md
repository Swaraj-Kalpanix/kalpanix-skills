---
name: new-module
description: Create a new feature module spec in docs/modules/ (and optionally its src/features/ folder) for {{APP_NAME}}. Use when the user introduces a new feature area (e.g. leads, orders, invoices, tasks, reports) or asks to define/document a module.
---

# New module

1. **Confirm the basics with the user** if not already clear: module name, purpose, who uses it. Don't invent business rules — leave them in "Open questions".

2. **Choose the slug** — lowercase, camelCase when multi-word (`leads`, `followUps`); it is also the folder name in `src/features/`. Check `docs/modules/README.md` that it isn't taken.

3. **Create `docs/modules/<slug>.md`** from `docs/modules/_template.md`:
   - `status: planned`, today's date in `updated:`.
   - Fill Purpose, Users & permissions, Screens & routes, Data, Business rules, Features as far as known.

4. **Add a row** to the table in `docs/modules/README.md` (replace the `_none yet_` row if present). Keep rows alphabetical.

5. **Code folder — only when implementation starts.** Follow the feature layout in `AGENTS.md` → "Folder structure" (`screens/`, `components/`, `hooks/`, `services/`, `queries/`, `schemas/`, `types/`, …, `index.ts`). Create each subfolder only when writing its first file — never empty scaffolding.

6. If the module needs building now, continue with the `plan-feature` skill.
