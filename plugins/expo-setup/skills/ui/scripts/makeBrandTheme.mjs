#!/usr/bin/env node
/**
 * Turns ONE brand hex into the app's Tamagui `brand` child theme and writes `src/theme/brand.ts`.
 *
 *   node makeBrandTheme.mjs --color "#2563EB" [--out src/theme/brand.ts] [--check]
 *
 * Why a script and not a by-eye ramp (lessons from the first Kalpanix app):
 * - A brand colour darker than the scale's own step 9 inverts 9→11 (hover lighter than the base). Steps 10–12 are
 *   derived *beneath* the brand, so lightness always descends.
 * - "Looks fine" is not "passes": white on a bright red measured 3.66:1 and failed AA, a dark label passed on paper
 *   but read as black-on-red on a phone. So the filled-button colours are **measured**, white label preferred, and
 *   the fill deepened just enough to carry it.
 * - The values are written as literals, so the colours that ship are readable in the diff.
 *
 * Steps (Radix scale, which Tamagui v5 follows): 1–2 app backgrounds · 3–5 component backgrounds · 6–8 borders ·
 * 9 solid · 10 solid hover/pressed · 11 low-contrast text · 12 high-contrast text.
 *
 * `--check` prints the ramp and the contrast report without writing.
 */
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? undefined : args[i + 1];
};
const input = (opt('color') ?? '').trim();
const out = opt('out') ?? path.join('src', 'theme', 'brand.ts');
const checkOnly = args.includes('--check');

if (!/^#?[0-9a-fA-F]{6}$/.test(input)) {
  console.error('usage: --color "#RRGGBB" [--out src/theme/brand.ts] [--check]');
  process.exit(1);
}
const brand = `#${input.replace('#', '').toLowerCase()}`;

// The neutral palette's ends — must match src/theme/palette.ts.
const LIGHT_CARD = '#ffffff';
const LIGHT_INK = '#16171c';
const DARK_PAGE = '#16171c';
const DARK_INK = '#f6f6f4';
const WHITE = '#ffffff';
const BLACK = '#000000';

// ── colour maths ───────────────────────────────────────────────────────────────
function rgb(hex) {
  const v = parseInt(hex.slice(1), 16);
  return [(v >> 16) & 0xff, (v >> 8) & 0xff, v & 0xff];
}
function mix(a, b, t) {
  const x = rgb(a);
  const y = rgb(b);
  return `#${[0, 1, 2].map((i) => Math.round(x[i] + (y[i] - x[i]) * t).toString(16).padStart(2, '0')).join('')}`;
}
function luminance(hex) {
  const [r, g, b] = rgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (hi + 0.05) / (lo + 0.05);
}
/** Move `from` toward `toward` in small steps until `ok(colour)` holds (or the limit is reached). */
function walk(from, toward, ok, limit = 0.9) {
  for (let t = 0; t <= limit + 1e-9; t += 0.01) {
    const c = mix(from, toward, t);
    if (ok(c)) return c;
  }
  return mix(from, toward, limit);
}
const r2 = (n) => Math.round(n * 100) / 100;

// ── light ramp ────────────────────────────────────────────────────────────────
function lightRamp() {
  // Step 9 must stand on the white card as a control (3:1); a very light brand (yellow, lime) is deepened.
  const s9 = walk(brand, BLACK, (c) => contrast(c, LIGHT_CARD) >= 3);
  const s3 = mix(LIGHT_CARD, s9, 0.1);
  const s11 = walk(s9, BLACK, (c) => contrast(c, s3) >= 7);
  return {
    brand1: mix(LIGHT_CARD, s3, 0.25),
    brand2: mix(LIGHT_CARD, s3, 0.55),
    brand3: s3,
    brand4: mix(s3, s9, 0.12),
    brand5: mix(s3, s9, 0.22),
    brand6: mix(s3, s9, 0.34),
    brand7: mix(s3, s9, 0.48),
    brand8: mix(s3, s9, 0.66),
    brand9: s9,
    brand10: mix(s9, BLACK, 0.15),
    brand11: s11,
    brand12: mix(s11, LIGHT_INK, 0.55),
  };
}

// ── dark ramp ─────────────────────────────────────────────────────────────────
function darkRamp() {
  // On a dark page the solid must be bright enough to read as an accent (icons, checks, 2px borders): 4.5:1.
  const s9 = walk(brand, WHITE, (c) => contrast(c, DARK_PAGE) >= 4.5);
  const s3 = mix(DARK_PAGE, s9, 0.2);
  const s11 = walk(s9, WHITE, (c) => contrast(c, s3) >= 7);
  return {
    brand1: mix(DARK_PAGE, s3, 0.25),
    brand2: mix(DARK_PAGE, s3, 0.5),
    brand3: s3,
    brand4: mix(s3, s9, 0.12),
    brand5: mix(s3, s9, 0.22),
    brand6: mix(s3, s9, 0.34),
    brand7: mix(s3, s9, 0.5),
    brand8: mix(s3, s9, 0.72),
    brand9: s9,
    brand10: mix(s9, WHITE, 0.12),
    brand11: s11,
    brand12: mix(s11, DARK_INK, 0.6),
  };
}

// ── filled button (primary Button, brand IconButton, count badge) ──────────────
/**
 * Prefer a white label: deepen the fill just enough to carry it at AA (4.5:1). In dark mode the fill must also stay
 * clear of the page (3:1, a control's minimum). A brand too light for that (yellow) gets the ink label instead.
 */
function buttonFor(mode, s9) {
  const page = mode === 'light' ? LIGHT_CARD : DARK_PAGE;
  for (let t = 0; t <= 0.4 + 1e-9; t += 0.01) {
    const bg = mix(s9, BLACK, t);
    if (contrast(WHITE, bg) >= 4.5 && contrast(bg, page) >= 3) {
      return { bg, pressed: mix(bg, BLACK, 0.12), label: WHITE };
    }
  }
  const label = LIGHT_INK;
  const bg = walk(s9, WHITE, (c) => contrast(label, c) >= 4.5, 0.6);
  return { bg, pressed: mix(bg, BLACK, 0.1), label };
}

const light = lightRamp();
const dark = darkRamp();
const button = { light: buttonFor('light', light.brand9), dark: buttonFor('dark', dark.brand9) };

const report = {
  'button label on fill': [contrast(button.light.label, button.light.bg), contrast(button.dark.label, button.dark.bg)],
  'button fill on the page': [contrast(button.light.bg, LIGHT_CARD), contrast(button.dark.bg, DARK_PAGE)],
  'step 9 on the page': [contrast(light.brand9, LIGHT_CARD), contrast(dark.brand9, DARK_PAGE)],
  'step 11 on step 3 (tinted chip text)': [contrast(light.brand11, light.brand3), contrast(dark.brand11, dark.brand3)],
  'step 11 on the page': [contrast(light.brand11, LIGHT_CARD), contrast(dark.brand11, DARK_PAGE)],
};
const NEEDS = {
  'button label on fill': 4.5,
  'button fill on the page': 3,
  'step 9 on the page': 3,
  'step 11 on step 3 (tinted chip text)': 4.5,
  'step 11 on the page': 4.5,
};

let failed = false;
const rows = Object.entries(report).map(([name, [l, d]]) => {
  const need = NEEDS[name];
  if (l < need || d < need) failed = true;
  return ` * | ${name} | ${r2(l)} | ${r2(d)} | ≥ ${need} |`;
});

const notes = [];
if (button.light.bg !== light.brand9) notes.push(` * - Light: the button fill is deepened from step 9 (${light.brand9} → ${button.light.bg}) so a white label passes AA.`);
if (button.dark.bg !== dark.brand9) notes.push(` * - Dark: the button fill is ${button.dark.bg}, not step 9 (${dark.brand9}); step 9 stays bright for accents on the dark page.`);
if (light.brand9 !== brand) notes.push(` * - Light step 9 is deepened from the brand (${brand}) so it stands on a white card at 3:1.`);
if (dark.brand9 !== brand) notes.push(` * - Dark step 9 is brightened from the brand (${brand}) so it reads on the dark page.`);
if (button.light.label !== WHITE || button.dark.label !== WHITE) notes.push(' * - The brand is too light to carry a white label; filled controls use the ink label.');

const fmt = (o) => Object.entries(o).map(([k, v]) => `  ${k}: '${v}',`).join('\n');

const file = `/**
 * The brand palette, as a Tamagui child theme — GENERATED from one colour, ${brand}, by
 * \`makeBrandTheme.mjs\` (expo-setup kit, ui phase). Regenerate rather than hand-edit:
 *
 *   node "<kit>/skills/ui/scripts/makeBrandTheme.mjs" --color "${brand}"
 *
 * Used as \`theme="brand"\` — the primary action, the selected item, focus rings, the active nav row. **Not** headers
 * or large surfaces: a brand-coloured app bar in a tool used all day reads as loud, and keeping the brand rare is
 * what keeps a primary action findable. See the design-system skill.
 *
 * A child theme is **twelve values in order** (\`createV5Theme\` reads them with \`Object.values\`; the key names are
 * documentation): 1–2 app backgrounds · 3–5 component backgrounds · 6–8 borders · 9 solid · 10 hover/pressed ·
 * 11 low-contrast text · 12 high-contrast text. Steps 10–12 are derived beneath step 9 so lightness always descends.
 *
 * Measured (WCAG 2.1):
 *
 * | | light | dark | needs |
 * |---|---|---|---|
${rows.join('\n')}
${notes.length ? ' *\n' + notes.join('\n') + '\n' : ''} *
 * The values are literals on purpose: the colours that ship are visible in the diff.
 */

/** Light mode. */
export const brandLight = {
${fmt(light)}
} as const;

/** Dark mode. */
export const brandDark = {
${fmt(dark)}
} as const;

/** The pair \`createV5Theme\` takes as a child theme. */
export const brandTheme = { light: brandLight, dark: brandDark };

/**
 * A **filled brand control** — the primary \`Button\`, the \`brand\` \`IconButton\` and its count badge — per scheme.
 * Read through \`useBrandSolid()\`, never directly: \`bg="$color9"\` with \`$color1\` text is how a dark label on a
 * bright fill comes back.
 */
export const BRAND_BUTTON = {
  light: { bg: '${button.light.bg}', pressed: '${button.light.pressed}', label: '${button.light.label}' },
  dark: { bg: '${button.dark.bg}', pressed: '${button.dark.pressed}', label: '${button.dark.label}' },
} as const;
`;

console.log(`brand ${brand}`);
console.log('light', light);
console.log('dark ', dark);
console.log('button', button);
for (const [name, [l, d]] of Object.entries(report)) {
  const need = NEEDS[name];
  console.log(`${l >= need && d >= need ? 'ok  ' : 'FAIL'} ${name}: light ${r2(l)} · dark ${r2(d)} (needs ${need})`);
}
if (failed) console.log('⚠ some pairs fall short — pick a deeper or more saturated brand colour, or adjust by hand and say why.');

if (!checkOnly) {
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, file);
  console.log(`written ${out}`);
}
