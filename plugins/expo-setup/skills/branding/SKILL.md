---
name: branding
description: Phase 5 of the Kalpanix Expo setup — turn one logo image into the app icon, Android adaptive foreground/background, Android 13+ monochrome themed icon and the splash image, and point app.json at them. Use when the user gives a logo for an Expo app, or asks to set the app icon or splash screen.
---

# Phase 5 — Branding

Script: `${CLAUDE_PLUGIN_ROOT}/skills/branding/scripts/makeIcons.py` (Python 3 + Pillow: `pip install pillow` if `python -c "import PIL"` fails). Ground rules: see `expo-setup:bootstrap`.

## 1. Get the logo
Ask for the logo file (PNG, ideally transparent, ≥1024 px wide). Look at it (Read the image):
- **Square symbol only** → no crop needed.
- **Symbol + wordmark** (e.g. a mark on the left, the name on the right) → icons should use only the symbol. Find its crop box: open the image with Pillow and look at the alpha/colour columns to locate the gap between symbol and text, then confirm the box with the user.
- Note the brand colours (sample them with Pillow) for the Tamagui brand theme TODO.
- Ask for the icon background colour if the logo isn't meant for white (default `#FFFFFF`).

## 2. Generate
```bash
python "${CLAUDE_PLUGIN_ROOT}/skills/branding/scripts/makeIcons.py" --logo <logo.png> --out assets/images [--mark x0,y0,x1,y1] [--bg #FFFFFF]
```
Writes to `assets/images/`: `logo.png` (the original), `icon.png` (opaque — iOS forbids transparency), `android-icon-foreground.png` (mark inside the adaptive 66% safe zone), `android-icon-background.png`, `android-icon-monochrome.png` (white silhouette), `splash-icon.png` (full logo at 60% on transparent — Android 12+ crops the splash icon to a circle).

Look at every output image before moving on (Read them). The mark must not touch the edges of the adaptive foreground.

## 3. app.json
- `expo.icon` → `./assets/images/icon.png`; remove `ios.icon` if it still points at the template's `assets/expo.icon`.
- `android.adaptiveIcon` → `backgroundColor` (the `--bg`), `foregroundImage`, `backgroundImage`, `monochromeImage` → the three `android-icon-*.png` files.
- `expo-splash-screen` plugin → `{ "backgroundColor": "<bg>", "image": "./assets/images/splash-icon.png", "imageWidth": 240 }` (check the current SDK's splash-screen docs for the option names).
- Delete leftover template images (`favicon.png`, `assets/expo.icon/`, demo images) if phase 1 didn't.

## 4. Verify and record
- `npx expo-doctor`; `npx expo config --type public` shows the new paths.
- Icons and splash only change in a **new native build** (phase 6) — say so.
- `CHANGELOG.md` → Changed: `Branding: app icon, Android adaptive + monochrome icons and splash generated from the logo (assets/images/logo.png).` `docs/TODO.md` → Next: `Add the brand colours (<hex>, <hex>) as a Tamagui brand theme — PLAN-004`; Done: `App icon, Android adaptive/monochrome icons, and splash from the logo — PLAN-001`.
