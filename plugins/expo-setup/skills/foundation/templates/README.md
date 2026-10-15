# {{APP_NAME}}

{{APP_DESCRIPTION}} — Expo (SDK {{SDK}}) · React Native · TypeScript · Expo Router.

## Getting started

```bash
npm install
cp .env.example .env.local   # runs on the in-memory mock API by default
npm run build:dev:android    # once: install the development build on your phone/emulator
npx expo start --dev-client
```

iOS and Android only — the app runs in an EAS development build (not Expo Go).

## Scripts

| Command | What it does |
|---|---|
| `npm start` | Start the dev server (use the development build) |
| `npm run android` / `ios` | Start and open a platform |
| `npm run lint` | ESLint |
| `npm test` | Unit tests (`test:watch`, `test:coverage`) |
| `npx tsc --noEmit` | Typecheck |

### EAS builds (`eas.json` profiles)

| Command | Profile | Platform |
|---|---|---|
| `npm run build:dev:android` / `build:dev:ios` / `build:dev` | development (dev client, mock API) | Android / iOS device / both |
| `npm run build:dev:ios-simulator` | development-simulator | iOS Simulator (Mac) |
| `npm run build:preview:android` / `build:preview:ios` / `build:preview` | preview (internal testers, mock API) | Android / iOS / both |
| `npm run build:prod:android` / `build:prod:ios` / `build:prod` | production (store, live API) | Android / iOS / both |

Install an existing build on a running emulator/device without rebuilding: `eas build:run -p android --latest`.

### OTA updates

| Command | What it does |
|---|---|
| `npm run update:preview` | Publish the current JS to the `preview` channel (asks for a message). Reaches installed preview builds with the same native fingerprint. |

## Where to read next

- `AGENTS.md` — rules for developers and AI agents: folder structure, naming, data layer, testing
- `CLAUDE.md` — project overview and tech stack
- `docs/` — module specs, plans, decisions (memos), TODO board
- `src/lib/core/USAGE.md` — data layer (services, React Query hooks, auth, toasts/confirm)
- `src/lib/core/mock/USAGE.md` — building features on mock data
- `CHANGELOG.md` — what changed
