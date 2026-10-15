---
name: foundation
description: Phase 1 of the Kalpanix Expo setup — remove the create-expo-app starter template, set the app identity (name, slug, scheme, bundle ID), and add the AI-agent project structure (AGENTS.md, CLAUDE.md, CHANGELOG.md, docs/ with plans, memos, modules and TODO, project skills plan-feature / new-module / wrap-up, feature folder and naming rules, ESLint). Use on a fresh Expo project, or when the user asks for the agent/docs structure.
---

# Phase 1 — Foundation

Templates: `${CLAUDE_PLUGIN_ROOT}/skills/foundation/templates`. Ground rules: see `expo-setup:bootstrap`.

## 0. Inputs
Needs `.claude/expo-setup.json` (written by `expo-setup:bootstrap`). Running alone? Ask for `APP_NAME`, `APP_DESCRIPTION`, `BUNDLE_ID`, `API_STYLE`, `AUTH` and write the file as shown in the bootstrap skill (versions read from `node_modules`).

## 1. Check the SDK
- `node -p "require('expo/package.json').version"` — confirm it's the latest SDK (`npm view expo version`). If the project is older, ask before upgrading.
- Skim `https://docs.expo.dev/llms.txt` for anything that changed in this SDK about the template, Expo Router, or `app.json`.

## 2. Remove the starter template
The default template changes per SDK, so inspect before deleting (`git status`, list `src/`, `assets/`, `scripts/`). Remove the **demo**, keep the **project**:
- **Delete:** every file under `src/` (demo screens, tabs, `components/`, `constants/`, `hooks/`, `global.css`, `*.web.tsx`, `*.module.css`); `scripts/reset-project.js` and the `reset-project` npm script; the `web` npm script; demo images (`expo-logo`, `react-logo*`, `tabIcons/`, `tutorial-web`, badges, `logo-glow`, `favicon.png`) and `assets/expo.icon/`.
- **Keep:** `assets/images/icon.png`, `android-icon-*.png`, `splash-icon.png` (until branding replaces them), `tsconfig.json`, `.gitignore`, `package.json`, `app.json`.
- `src/app/_layout.tsx` and `src/app/index.tsx` are recreated in step 3.

## 3. Copy the templates
```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/copyTemplates.mjs" --from "${CLAUDE_PLUGIN_ROOT}/skills/foundation/templates" --to . --force
```
`--force` is right here: it replaces the template's own `AGENTS.md`, `CLAUDE.md`, `README.md`, `.claude/settings.json` and `src/app/*`. Never use it on a project that already has real content in those files — merge instead.

This writes: `AGENTS.md` (agent rules: platform, workflow, folder structure, naming, UI, data layer, testing, git, Expo rules), `CLAUDE.md`, `CHANGELOG.md`, `README.md`, `docs/` (README, TODO, plans/memos/modules indexes + `_template.md`s, PLAN-001, MEMO-001), `.claude/skills/{plan-feature,new-module,wrap-up}`, `.claude/settings.json` (Expo plugin), `.vscode/`, `eslint.config.js`, and stub `src/app/_layout.tsx` + `index.tsx`.

## 4. App identity
Edit, don't overwrite (new SDKs add keys):
- `app.json` → `expo.name` = `APP_NAME`, `slug` = `APP_SLUG`, `scheme` = `SCHEME`, `ios.bundleIdentifier` = `BUNDLE_ID`, `android.package` = `BUNDLE_ID`. Remove the `web` block and `ios.icon` if it points at the deleted `assets/expo.icon`. Keep `experiments.typedRoutes` and `experiments.reactCompiler` = `true` (add them if missing), `orientation: portrait`, `userInterfaceStyle: automatic`.
- `package.json` → `name` = `APP_SLUG`.
- `tsconfig.json` → `"strict": true`; `paths`: `"@/*": ["./src/*"]`, `"@/assets/*": ["./assets/*"]`.

## 5. ESLint
`npx expo install eslint eslint-config-expo -- --save-dev` (skip if already present). The template's `eslint.config.js` uses the flat config from Expo's ESLint guide — if `npx expo lint` complains about the config shape on this SDK, regenerate it with `npx expo lint` and keep the `dist/*` ignore.

## 6. Verify
- `npx tsc --noEmit` and `npx expo lint` — clean.
- `grep -r "{{" AGENTS.md CLAUDE.md README.md CHANGELOG.md docs .claude src` → no unfilled placeholders.
- Nothing imports deleted template files.

## 7. Report
List removed files, the identity set, and the docs created. Don't commit unless asked (suggested message: `feat: project foundation — agent docs, folder structure, app identity`).
