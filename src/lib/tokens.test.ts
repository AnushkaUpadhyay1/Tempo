import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import tokens from '../../tokens/tokens.json';
import { evaluateContrast } from './color';
import { ACCENT_NAMES, flatten, semanticColor, THEME_NAMES } from './tokens';
import type { TokenFile, TokenTree } from './tokens';

const file = tokens as unknown as TokenFile;

describe('Tempo tokens', () => {
  it('gives both themes the same semantic names', () => {
    const names = (t: string) =>
      flatten(file.themes[t] as TokenTree)
        .map(([p]) => p.join('.'))
        .sort();
    expect(names('dark')).toEqual(names('light'));
  });

  it('passes WCAG 2.2 AA for every pair, theme and accent', () => {
    const failures: string[] = [];
    for (const theme of THEME_NAMES) {
      for (const c of file.contrastChecks) {
        const r = evaluateContrast(
          semanticColor(file, theme, 'tangerine', c.fg),
          semanticColor(file, theme, 'tangerine', c.bg),
          c.use,
        );
        if (!r.passesAA) failures.push(`${theme} ${c.fg}/${c.bg} ${r.ratio}`);
      }
      for (const accent of ACCENT_NAMES) {
        for (const c of file.accentChecks) {
          const r = evaluateContrast(
            semanticColor(file, theme, accent, c.fg),
            semanticColor(file, theme, accent, c.bg),
            c.use,
          );
          if (!r.passesAA) failures.push(`${theme}/${accent} ${c.fg}/${c.bg} ${r.ratio}`);
        }
      }
    }
    expect(failures).toEqual([]);
  });

  it('keeps touch targets at 44px or more', () => {
    expect(parseInt(file.size['target-min'], 10)).toBeGreaterThanOrEqual(44);
  });

  it('generates CSS for every accent in both themes', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/styles/tokens.css'), 'utf8');
    for (const a of ACCENT_NAMES) {
      expect(css).toContain(`[data-theme='dark'][data-accent='${a}']`);
      expect(css).toContain(`[data-accent='${a}']:not([data-theme='dark'])`);
    }
  });
});
