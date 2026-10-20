/**
 * Generates src/styles/tokens.css from tokens/tokens.json.
 * Themes come from data-theme and accents from data-accent on <html>.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ACCENT_NAMES, cssVar, flatten, THEME_NAMES } from '../src/lib/tokens.ts';
import type { TokenFile, TokenTree } from '../src/lib/tokens.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const tokens = JSON.parse(readFileSync(resolve(root, 'tokens/tokens.json'), 'utf8')) as TokenFile;

const toCss = (value: string) => {
  const ref = /^\{([^}]+)\}$/.exec(value.trim());
  return ref ? `var(${cssVar(ref[1].split('.'))})` : value;
};
const decl = (path: string[], value: string) => `  ${cssVar(path)}: ${toCss(value)};`;

const primitives: string[] = [];
for (const group of ['color', 'space', 'radius', 'motion', 'size'] as const) {
  for (const [path, value] of flatten(tokens[group] as TokenTree, [group]))
    primitives.push(decl(path, value));
}
for (const [path, value] of flatten(tokens.font, ['font']).filter(([p]) => p[1] !== 'size')) {
  primitives.push(decl(path, value));
}
const fontSizes = flatten(tokens.font.size as TokenTree, ['font', 'size']).map(
  ([path, value]) => `  ${cssVar(path)}: calc(${value} * var(--t-text-scale, 1));`,
);
const theme = (name: string) => flatten(tokens.themes[name]).map(([p, v]) => decl(p, v));
const accent = (name: string, mode: string) =>
  Object.entries(tokens.accents[name][mode]).map(([k, v]) => decl(['accent', k], v));
const durations = flatten(tokens.motion.duration as TokenTree, ['motion', 'duration']);
const still = durations.map(([p]) => `  ${cssVar(p)}: 0ms;`);

const blocks: string[] = [];
blocks.push(`:root {\n  --t-text-scale: 1;\n${primitives.join('\n')}\n}`);
blocks.push(`:root,\n[data-text-scale] {\n${fontSizes.join('\n')}\n}`);
// Defaults: light + tangerine, then dark + tangerine.
blocks.push(
  `:root,\n[data-theme='light'] {\n  color-scheme: light;\n${theme('light').join('\n')}\n${accent('tangerine', 'light').join('\n')}\n}`,
);
blocks.push(
  `[data-theme='dark'] {\n  color-scheme: dark;\n${theme('dark').join('\n')}\n${accent('tangerine', 'dark').join('\n')}\n}`,
);
// Each accent in each theme. Two attribute selectors outrank the defaults above.
for (const a of ACCENT_NAMES) {
  for (const t of THEME_NAMES) {
    const sel =
      t === 'light'
        ? `[data-accent='${a}']:not([data-theme='dark'])`
        : `[data-theme='dark'][data-accent='${a}']`;
    blocks.push(`${sel} {\n${accent(a, t).join('\n')}\n}`);
  }
}
blocks.push(`[data-reduced-motion='true'] {\n${still.join('\n')}\n}`);
blocks.push(
  `@media (prefers-reduced-motion: reduce) {\n  :root:not([data-reduced-motion='false']) {\n${still.map((l) => '  ' + l).join('\n')}\n  }\n}`,
);

const css = `/*\n * Tempo UI tokens. GENERATED FILE, DO NOT EDIT.\n * Source: tokens/tokens.json. Regenerate with \`npm run tokens\`.\n */\n\n${blocks.join('\n\n')}\n`;
const out = resolve(root, 'src/styles/tokens.css');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, css);
console.log(
  `tokens: wrote src/styles/tokens.css (${THEME_NAMES.length} themes x ${ACCENT_NAMES.length} accents)`,
);
