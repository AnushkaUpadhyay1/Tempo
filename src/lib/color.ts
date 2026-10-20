/**
 * WCAG 2.2 contrast helpers. Pure functions with no imports so the Node
 * scripts in /scripts and the docs site share exactly the same maths.
 */

export type ContrastUse = 'text' | 'large-text' | 'ui';

export interface ContrastResult {
  ratio: number;
  /** Whether the pair meets WCAG 2.2 AA for its intended use. */
  passesAA: boolean;
  /** Whether the pair also meets AAA (text uses only). */
  passesAAA: boolean;
  level: 'AAA' | 'AA' | 'Fail';
}

/** Minimum AA ratios: 1.4.3 for text, 1.4.11 for UI components and graphics. */
export const AA_MINIMUM: Record<ContrastUse, number> = { text: 4.5, 'large-text': 3, ui: 3 };
const AAA_MINIMUM: Record<ContrastUse, number> = { text: 7, 'large-text': 4.5, ui: 3 };

export function parseHex(hex: string): [number, number, number] {
  const clean = hex.trim().replace(/^#/, '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) {
    throw new Error(`Not a hex colour: ${hex}`);
  }
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as [number, number, number];
}

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const [r, g, b] = parseHex(hex);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(foreground: string, background: string): number {
  const a = relativeLuminance(foreground);
  const b = relativeLuminance(background);
  const [light, dark] = a > b ? [a, b] : [b, a];
  return (light + 0.05) / (dark + 0.05);
}

export function evaluateContrast(
  foreground: string,
  background: string,
  use: ContrastUse = 'text',
): ContrastResult {
  // Round down to two decimals so 4.499 is never reported as passing 4.5.
  const ratio = Math.floor(contrastRatio(foreground, background) * 100) / 100;
  const passesAA = ratio >= AA_MINIMUM[use];
  const passesAAA = ratio >= AAA_MINIMUM[use];
  return {
    ratio,
    passesAA,
    passesAAA,
    level: passesAAA && use !== 'ui' ? 'AAA' : passesAA ? 'AA' : 'Fail',
  };
}

/** Pick black or white text, whichever reads better on the given colour. */
export function readableOn(background: string): '#000000' | '#FFFFFF' {
  return contrastRatio('#000000', background) >= contrastRatio('#FFFFFF', background)
    ? '#000000'
    : '#FFFFFF';
}
