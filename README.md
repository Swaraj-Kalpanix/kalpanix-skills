# kalpanix-skills

Kalpanix's [Claude Code](https://code.claude.com) plugin marketplace — repeatable setups and conventions for our apps.

## Install

In Claude Code:

```
/plugin marketplace add Swaraj-Kalpanix/kalpanix-skills
/plugin install expo-setup@kalpanix-skills
```

Or from a shell:

```bash
claude plugin marketplace add Swaraj-Kalpanix/kalpanix-skills
claude plugin install expo-setup@kalpanix-skills
```

Update later with `/plugin marketplace update kalpanix-skills`.

## Plugins

| Plugin | What it does |
|---|---|
| [`expo-setup`](plugins/expo-setup/README.md) | Initial setup of a Kalpanix Expo (iOS/Android) app on the **latest** Expo SDK — agent docs, feature folders, a generic core data layer with mock server, Jest, Tamagui UI, branding, EAS. |

## Layout

```
.claude-plugin/marketplace.json   the catalog
plugins/<plugin>/
  .claude-plugin/plugin.json      plugin manifest (bump "version" on every release)
  skills/<skill>/SKILL.md         one folder per skill, plus its templates/ and scripts/
```

## Contributing

- One plugin per area (`expo-setup`, later e.g. `nextjs-ui`); skills inside it are namespaced `/<plugin>:<skill>`.
- Templates must stay **app-agnostic** — app names, IDs and dates are `{{PLACEHOLDERS}}`; no secrets, project IDs or brand colours.
- When a project finds a template that no longer fits the latest SDK or library, fix it here and bump the plugin `version`.

MIT © Kalpanix
