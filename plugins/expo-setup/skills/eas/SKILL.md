---
name: eas
description: Phase 6 (last) of the Kalpanix Expo setup — link the app to its EAS project (the user provides the project ID), install expo-updates and expo-dev-client, set the fingerprint runtime version, add eas.json with development / development-simulator / preview / production profiles and channels, add build and update npm scripts, and get the first development build onto a device or emulator. Use when configuring EAS Build/Update for a Kalpanix Expo app.
---

# Phase 6 — EAS builds and updates (last phase)

Templates: `${CLAUDE_PLUGIN_ROOT}/skills/eas/templates`. Ground rules: see `expo-setup:bootstrap`. Read the current EAS docs (`https://docs.expo.dev/llms.txt` → EAS Build, EAS Update) before changing config — EAS changes often.

## 1. Ask the user
- The **EAS project ID** (UUID from expo.dev → project → Overview) and the **account/owner** it belongs to. The user creates the project on expo.dev; never create accounts or log in for them.
- They must be logged in: `npx eas-cli@latest whoami`. If not, ask them to run `npx eas-cli@latest login` themselves.

## 2. Packages
```bash
npx expo install expo-updates expo-dev-client
```

## 3. Link the project
Preferred (checks access): `npx eas-cli@latest init --id <PROJECT_ID>` — writes `expo.extra.eas.projectId` and `expo.owner`. Then `npx eas-cli@latest update:configure` — writes `expo.updates.url`.
Then set in `app.json`:
```json
"runtimeVersion": { "policy": "fingerprint" }
```
(`fingerprint` stops OTA updates from reaching builds with different native code — no manual runtime bumps.)
Offline fallback: write `extra.eas.projectId`, `owner`, `updates.url` = `https://u.expo.dev/<PROJECT_ID>` and `runtimeVersion` by hand.

## 4. eas.json
```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/copyTemplates.mjs" --from "${CLAUDE_PLUGIN_ROOT}/skills/eas/templates" --to .
```
Profiles: `development` (dev client, internal, channel `development`, mock API), `development-simulator` (extends development, iOS simulator), `preview` (internal testers, channel `preview`, mock API), `production` (channel `production`, `autoIncrement`, live API). `appVersionSource: remote`.
Set `cli.version` to `>= <installed eas-cli major>.0.0` (`npx eas-cli@latest --version`). A global `eas` older than that fails with a version error — update it with `npm install -g eas-cli@latest` or use `npx eas-cli@latest`.

## 5. Scripts (`package.json`)
```json
"build:dev:android": "eas build --profile development --platform android",
"build:dev:ios": "eas build --profile development --platform ios",
"build:dev:ios-simulator": "eas build --profile development-simulator --platform ios",
"build:dev": "eas build --profile development --platform all",
"build:preview:android": "eas build --profile preview --platform android",
"build:preview:ios": "eas build --profile preview --platform ios",
"build:preview": "eas build --profile preview --platform all",
"build:prod:android": "eas build --profile production --platform android",
"build:prod:ios": "eas build --profile production --platform ios",
"build:prod": "eas build --profile production --platform all",
"update:preview": "eas update --channel preview --environment preview"
```
`eas update` needs `--environment` on recent SDKs. Add `update:prod` only after the production API URL is set (EAS environment variables).

## 6. Verify
`npx expo-doctor`; `npx expo config --type public` shows `runtimeVersion`, `updates.url`, `extra.eas.projectId`; `npx tsc --noEmit`, `npx expo lint`, `npm test`.

## 7. First development build
Cloud builds use the account's quota — **ask before starting one**.
- `npm run build:dev:android` → when finished, install on a running emulator/device with `npx eas-cli@latest build:run -p android --latest` (installs the existing build; it does not rebuild). Then `npx expo start --dev-client`.
- Downloading the APK in the emulator's browser often fails with "problem parsing the package" — use `build:run` or `adb install <apk>` instead.
- `INSTALL_FAILED_INSUFFICIENT_STORAGE` / "not enough space" → the emulator's internal storage is full: Device Manager → Edit AVD → Advanced → Internal Storage 8 GB → Wipe Data → Cold Boot (or `adb uninstall <BUNDLE_ID>` first); check with `adb shell df -h /data`.
- On the device, check: splash + icon, fonts (Inter/Sora), a toast, the confirm dialog, a bottom sheet with a text input and the keyboard.

## 8. Docs
- `CHANGELOG.md` → Added: `EAS: eas.json with development, development-simulator, preview, production profiles (channels + EXPO_PUBLIC_API_MODE per profile); runtimeVersion policy fingerprint; expo-updates + expo-dev-client.` and `npm scripts: build:dev[:android|:ios|:ios-simulator], build:preview[:android|:ios], build:prod[:android|:ios], update:preview.` Changed: `EAS project linked: owner <owner>, slug <slug>, updates.url set.`
- `docs/plans/001-project-foundation.md` → checklist `EAS setup (eas.json, expo-updates, project linked)` ticked + Log line.
- `docs/TODO.md` → Next: `Production API URL: set EXPO_PUBLIC_API_BASE_URL for the production EAS profile before the first production build`. Done: `EAS project linked, expo-updates configured`.
