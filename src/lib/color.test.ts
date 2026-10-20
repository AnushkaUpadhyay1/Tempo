import { describe, expect, it } from 'vitest';
import { contrastRatio, evaluateContrast, parseHex, readableOn } from './color';

describe('contrast maths', () => {
  it('matches the WCAG reference values', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(contrastRatio('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5);
    // #767676 is the well-known lightest grey that passes 4.5:1 on white.
    expect(evaluateContrast('#767676', '#FFFFFF').passesAA).toBe(true);
    expect(evaluateContrast('#777777', '#FFFFFF').passesAA).toBe(false);
  });

  it('is symmetric', () => {
    expect(contrastRatio('#0B514D', '#F7F6F3')).toBeCloseTo(
      contrastRatio('#F7F6F3', '#0B514D'),
      10,
    );
  });

  it('uses the 3:1 threshold for interface colours', () => {
    const grey = evaluateContrast('#949494', '#FFFFFF', 'ui');
    expect(grey.ratio).toBeGreaterThanOrEqual(3);
    expect(grey.passesAA).toBe(true);
    expect(evaluateContrast('#949494', '#FFFFFF', 'text').passesAA).toBe(false);
  });

  it('rounds down so borderline pairs never pass by rounding', () => {
    const r = evaluateContrast('#777777', '#FFFFFF');
    expect(r.ratio).toBeLessThan(4.5);
    expect(r.level).toBe('Fail');
  });

  it('parses short hex and rejects junk', () => {
    expect(parseHex('#fff')).toEqual([255, 255, 255]);
    expect(() => parseHex('blue')).toThrow();
  });

  it('picks readable text', () => {
    expect(readableOn('#FFE600')).toBe('#000000');
    expect(readableOn('#0B514D')).toBe('#FFFFFF');
  });
});
