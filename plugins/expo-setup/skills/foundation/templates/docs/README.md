# Docs

The project's working memory. Humans and AI agents both read and write here.

| Folder / file | What goes in it | Status values |
|---|---|---|
| [`TODO.md`](TODO.md) | The task board — what's next, what's in progress | Now / Next / Later / Done sections |
| [`modules/`](modules/README.md) | One spec per feature module: what it does, screens, data, rules | `planned` · `in-progress` · `stable` · `deprecated` |
| [`plans/`](plans/README.md) | How we'll build a specific piece of work, with a checklist | `draft` · `approved` · `in-progress` · `done` · `dropped` |
| [`memos/`](memos/README.md) | Decisions and notes worth remembering (why we chose X) | `active` · `superseded` |

## How they fit together

- A **module** is long-lived: it describes a feature as it *is* (e.g. Leads).
- A **plan** is short-lived: it describes a change *to* one or more modules, and ends `done` or `dropped`.
- A **memo** records a decision so nobody re-litigates it later.
- **TODO.md** is the day-to-day queue; bigger items link to a plan.
- **`../CHANGELOG.md`** records what actually shipped.

## Rules

- Every doc starts with frontmatter containing at least `status` and `updated: YYYY-MM-DD`.
- New docs are copied from the folder's `_template.md`.
- Changing a doc's status → also update the index table in that folder's `README.md`.
- Never delete plans or memos; mark them `dropped` / `superseded`.
