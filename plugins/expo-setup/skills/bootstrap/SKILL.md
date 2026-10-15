---
name: bootstrap
description: Set up a new Kalpanix Expo (iOS/Android) app from scratch on the latest Expo SDK — agent docs, feature folder structure, the generic core data layer with mock server, Jest, Tamagui UI stack, branding and EAS — by running the expo-setup phase skills in order. Use when the user wants to start a new mobile app, "do the initial setup", "set up like Crystal CRM", or run the whole expo-setup kit.
---

# Expo app bootstrap — run every phase in order

This kit reproduces the **initial setup** Kalpanix uses for its Expo apps (first done for Crystal CRM's `feat/init-setup` branch), on whatever Expo SDK is **latest today**. Each phase is its own skill and can also run alone.

| # | Skill | Result |
|---|---|---|
| 1 | `expo-setup:foundation` | Template removed, app identity, `AGENTS.md` / `CLAUDE.md` / `CHANGELOG.md`, `docs/`, project skills, folder + naming rules, ESLint |
| 2 | `expo-setup:core` | `src/lib/core` (services, query builders, React Query hooks, auth adapter, toast/confirm bridges, mock server), `env.ts`, `setupCore.ts` |
| 3 | `expo-setup:testing` | Jest + jest-expo + Testing Library, the core's test suite green, coverage floor |
| 4 | `expo-setup:ui` | Tamagui v2 + config v5, Inter/Sora fonts, gorhom sheets, keyboard-controller, FlashList, toasts, confirm dialog, providers |
| 5 | `expo-setup:branding` | Icons, adaptive/monochrome icons and splash from one logo |
| 6 | `expo-setup:eas` | **Last.** expo-updates, dev client, `eas.json` profiles, build/update scripts — needs the EAS project ID |

## Ground rules (apply to every phase)

- **Latest SDK, never pinned.** Create projects with `npx create-expo-app@latest`; add packages with `npx expo install <pkg>` (no versions) so they match the project's SDK. The one deliberate exception is **Tamagui, pinned to major v2** until the UI templates are migrated (see `expo-setup:ui`). Before touching an Expo/EAS API, read `https://docs.expo.dev/llms.txt` and the versioned docs for the SDK in `package.json` — never trust memory.
- **iOS and Android only.** Never run or verify on web. Verify with `npx tsc --noEmit`, `npx expo lint`, `npm test`, and `npx expo export --platform android --output-dir <scratch dir>`.
- **Templates are copied, not retyped.** Every phase copies its `templates/` with:
  ```bash
  node "${CLAUDE_PLUGIN_ROOT}/scripts/copyTemplates.mjs" --from "${CLAUDE_PLUGIN_ROOT}/skills/<phase>/templates" --to . [--force]
  ```
  It fills `{{PLACEHOLDERS}}` from `.claude/expo-setup.json`, skips files that already exist (unless `--force`), and lists any placeholder it couldn't fill — fix those by hand.
- **If a template no longer fits the latest SDK or library version** (typecheck/lint fails, an API moved), fix it in the project, then tell the user which template in `kalpanix-skills` needs the same fix.
- Don't commit unless the user asks. A good rhythm is one commit per phase on a `feat/init-setup` branch.
- Sub-agents, if any, run on `haiku` (or `sonnet` for precise research) — pass `model` explicitly.

## Steps

1. **Project.** If the current folder has no `package.json`, ask for the folder name and run `npx create-expo-app@latest <folder> --yes` (default template, latest SDK), then work inside it. If it already is an Expo project, check it's close to a fresh template (`git log`, `src/app`) — on an existing app, run phases individually instead and merge carefully.

2. **Collect inputs** (one AskUserQuestion round; offer sensible defaults):
   - App display name (`APP_NAME`), e.g. `Crystal Cash`
   - One-line description (`APP_DESCRIPTION`)
   - Bundle ID / Android package (`BUNDLE_ID`), e.g. `com.kalpanix.crystalcash`
   - API style (`API_STYLE`): `NestJS + @nestjsx/crud` · plain REST · not decided
   - Auth (`AUTH`): `_not decided_ — custom login or Clerk` · Clerk · custom login
   - Logo file for phase 5 (can come later)
   - The EAS project ID is asked for **only in phase 6**.

3. **Write `.claude/expo-setup.json`** — the vars file every phase reads (kept in the repo as a record of the setup):
   ```json
   {
     "APP_NAME": "Crystal Cash",
     "APP_SLUG": "crystal-cash",
     "APP_DESCRIPTION": "…",
     "BUNDLE_ID": "com.kalpanix.crystalcash",
     "SCHEME": "crystalcash",
     "SDK": "<expo major, from node_modules/expo/package.json>",
     "RN_VERSION": "<react-native major.minor>",
     "REACT_VERSION": "<react major.minor>",
     "API_STYLE": "NestJS + @nestjsx/crud",
     "AUTH": "_not decided_ — custom login or Clerk",
     "DATE": "<today, YYYY-MM-DD>",
     "CURRENT_STATE": "Initial setup in progress (expo-setup kit) — see docs/plans/.",
     "TEST_SUMMARY": "filled by the testing phase"
   }
   ```
   `APP_SLUG` = kebab-case name; `SCHEME` = lowercase letters only. Read versions with `node -p "require('expo/package.json').version"` (same for `react-native`, `react`).

4. **Run the phases in order** with the Skill tool: `expo-setup:foundation` → `expo-setup:core` → `expo-setup:testing` → `expo-setup:ui` → `expo-setup:branding` → `expo-setup:eas`. Finish each phase's verification before starting the next; stop and report if one fails.

5. **Finish:**
   - Replace the "Current state" section of `CLAUDE.md` with a short paragraph: template removed, core in place (mock mode by default), UI foundation wired, iOS/Android only, runs in an EAS development build; next step is filling the app overview and module docs.
   - `npx tsc --noEmit`, `npx expo lint`, `npm test`, `npx expo-doctor`, Android export — all green.
   - Report to the user: what each phase did, verification results, open TODO items (`docs/TODO.md` → Now/Next), and the next step: `npm run build:dev:android`, then `npx expo start --dev-client`.
