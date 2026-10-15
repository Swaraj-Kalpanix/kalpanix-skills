---
module: <Module Name>
slug: <slug>          # lowercase / camelCase, same as src/features/<slug>
status: planned        # planned | in-progress | stable | deprecated
owner: <name>
updated: YYYY-MM-DD
plans: []              # e.g. [PLAN-002, PLAN-005]
---

# <Module Name>

## Purpose
One or two sentences: what this module lets the user do and why it matters.

## Users & permissions
Who uses it, and what each role can see or do.

## Screens & routes
| Screen | Route (`src/app/…`) | Notes |
|---|---|---|
| | | |

## Data
Entities, key fields, where the data comes from (API endpoint / local storage).

## Business rules
Validation, calculations, state transitions — the rules that must hold.

## Features
- [ ] Feature — short description

## Out of scope
What this module deliberately does not do.

## Open questions
-
