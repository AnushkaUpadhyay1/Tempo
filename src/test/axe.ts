import { expect } from 'vitest';
import { configureAxe } from 'vitest-axe';

/**
 * axe runs inside jsdom, which cannot compute rendered colours or layout.
 * Colour contrast is therefore verified by `npm run contrast` against the
 * real token values instead; every other rule stays on.
 */
const axe = configureAxe({
  rules: { 'color-contrast': { enabled: false } },
});

export async function expectNoAxeViolations(container: Element) {
  const results = await axe(container);
  const summary = results.violations.map(
    (v) => `${v.id}: ${v.help}\n  ${v.nodes.map((n) => n.html).join('\n  ')}`,
  );
  expect(summary, 'axe violations').toEqual([]);
}
