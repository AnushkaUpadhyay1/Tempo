/**
 * Helpers for reading tokens/tokens.json. Pure functions (no imports) so the
 * Node scripts and the app share them.
 */

export type TokenTree = { [key: string]: string | TokenTree };

export interface ContrastCheck {
  fg: string;
  bg: string;
  use: 'text' | 'large-text' | 'ui';
}

export interface TokenFile {
  $meta: { name: string; version: string; description: string };
  color: TokenTree;
  themes: Record<string, TokenTree>;
  accents: Record<string, Record<string, Record<string, string>>>;
  font: TokenTree;
  space: Record<string, string>;
  radius: Record<string, string>;
  motion: TokenTree;
  size: Record<string, string>;
  contrastChecks: ContrastCheck[];
  accentChecks: ContrastCheck[];
}

export const THEME_NAMES = ['light', 'dark'] as const;
export type ThemeName = (typeof THEME_NAMES)[number];
export const ACCENT_NAMES = ['tangerine', 'violet', 'mint', 'sky'] as const;
export type AccentName = (typeof ACCENT_NAMES)[number];

export function getPath(tree: TokenTree, path: string): string | TokenTree | undefined {
  let node: string | TokenTree | undefined = tree;
  for (const part of path.split('.')) {
    if (node === undefined || typeof node === 'string') return undefined;
    node = node[part];
  }
  return node;
}

/** Resolve "{color.ink.50}" style references against the whole file. */
export function resolveValue(tokens: TokenFile, value: string, seen: string[] = []): string {
  const match = /^\{([^}]+)\}$/.exec(value.trim());
  if (!match) return value;
  const ref = match[1];
  if (seen.includes(ref))
    throw new Error(`Circular token reference: ${[...seen, ref].join(' -> ')}`);
  const target = getPath(tokens as unknown as TokenTree, ref);
  if (typeof target !== 'string') throw new Error(`Unknown token reference: {${ref}}`);
  return resolveValue(tokens, target, [...seen, ref]);
}

export function flatten(tree: TokenTree, prefix: string[] = []): Array<[string[], string]> {
  const out: Array<[string[], string]> = [];
  for (const [key, value] of Object.entries(tree)) {
    if (typeof value === 'string') out.push([[...prefix, key], value]);
    else out.push(...flatten(value, [...prefix, key]));
  }
  return out;
}

/** ["color","ink","50"] -> --t-color-ink-50 */
export function cssVar(path: string[]): string {
  return `--t-${path.join('-')}`;
}

/** A resolved semantic colour. "accent.*" paths read from the chosen accent. */
export function semanticColor(
  tokens: TokenFile,
  theme: string,
  accent: string,
  path: string,
): string {
  if (path.startsWith('accent.')) {
    const raw = tokens.accents[accent]?.[theme]?.[path.slice('accent.'.length)];
    if (!raw) throw new Error(`Accent "${accent}" (${theme}) has no token "${path}"`);
    return resolveValue(tokens, raw);
  }
  const raw = getPath(tokens.themes[theme], path);
  if (typeof raw !== 'string') throw new Error(`Theme "${theme}" has no token "${path}"`);
  return resolveValue(tokens, raw);
}
