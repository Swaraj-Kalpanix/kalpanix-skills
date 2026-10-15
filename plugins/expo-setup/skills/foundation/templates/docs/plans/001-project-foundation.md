---
id: PLAN-001
title: Project foundation
status: in-progress    # draft | approved | in-progress | done | dropped
modules: []
created: {{DATE}}
updated: {{DATE}}
---

# PLAN-001 — Project foundation

## Goal
Turn the fresh Expo template into a clean base for {{APP_NAME}}: a documented structure for agents and humans, a real app identity, and the core technical decisions made before feature work starts.

## Context
The repo starts as an untouched `create-expo-app` template (SDK {{SDK}}). Before building features we want a consistent way to plan, track, and log work (see MEMO-001).

## Approach
1. Agent + docs structure.
2. Clean the template and set app identity.
3. Core data layer, testing, UI foundation, branding, EAS — each its own plan.
4. Define the product: fill `CLAUDE.md` overview, list modules, one module doc each.

## Checklist
- [x] `AGENTS.md`, `CLAUDE.md`, `CHANGELOG.md`
- [x] `docs/` with plans, memos, modules, TODO + templates
- [x] Project skills: `plan-feature`, `new-module`, `wrap-up`
- [x] Remove the Expo starter template (screens, components, hooks, constants, demo assets, reset script)
- [x] App identity in `app.json` (`{{BUNDLE_ID}}`)
- [x] ESLint (Prettier still open)
- [ ] App overview filled in `CLAUDE.md`
- [ ] Module list + module docs
- [ ] Auth decision (custom login vs Clerk)

## Risks & open questions
- Backend style: {{API_STYLE}}.
- Auth: {{AUTH}}.

## Log
- {{DATE}} — created; docs/agent structure done; Expo starter template removed; app identity set
