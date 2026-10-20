/**
 * Checks every semantic colour pair in both themes, and every accent pair for
 * each of the four accents in both themes, against WCAG 2.2 AA.
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ACCENT_NAMES, semanticColor, THEME_NAMES } from '../src/lib/tokens.ts';
import type { ContrastCheck, TokenFile } from '../src/lib/tokens.ts';
import { AA_MINIMUM, evaluateContrast } from '../src/lib/color.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const tokens = JSON.parse(readFileSync(resolve(root, 'tokens/tokens.json'), 'utf8')) as TokenFile;

let total = 0;
let failures = 0;
const run = (label: string, theme: string, accent: string, checks: ContrastCheck[]) => {
  console.log(`\n${label}`);
  for (const c of checks) {
    total++;
    const fg = semanticColor(tokens, theme, accent, c.fg);
    const bg = semanticColor(tokens, theme, accent, c.bg);
    const r = evaluateContrast(fg, bg, c.use);
    if (!r.passesAA) failures++;
    console.log(
      `  ${r.passesAA ? 'PASS' : 'FAIL'} ${r.ratio.toFixed(2).padStart(5)}:1 (needs ${AA_MINIMUM[c.use]}) ${c.fg} on ${c.bg} [${fg} / ${bg}]`,
    );
  }
};
for (const theme of THEME_NAMES) {
  run(`${theme}`, theme, 'tangerine', tokens.contrastChecks);
  for (const accent of ACCENT_NAMES)
    run(`${theme} + ${accent}`, theme, accent, tokens.accentChecks);
}
console.log(
  `\ncontrast: ${total - failures}/${total} pairs pass WCAG 2.2 AA (2 themes, 4 accents)`,
);
if (failures) {
  console.error(`contrast: ${failures} pair(s) fail`);
  process.exit(1);
}
