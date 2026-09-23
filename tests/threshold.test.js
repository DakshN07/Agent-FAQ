const { normalizeThreshold, DEFAULT_THRESHOLD } = require('../utils/threshold');

describe('normalizeThreshold', () => {
  it('passes through valid thresholds in [0, 1]', () => {
    expect(normalizeThreshold(0.5)).toBe(0.5);
    expect(normalizeThreshold(1)).toBe(1);
    expect(normalizeThreshold(0)).toBe(0);
  });

  it('coerces numeric strings', () => {
    expect(normalizeThreshold('0.7')).toBe(0.7);
  });

  it('falls back to the default when the value is missing or invalid', () => {
    expect(normalizeThreshold(undefined)).toBe(DEFAULT_THRESHOLD);
    expect(normalizeThreshold(null)).toBe(DEFAULT_THRESHOLD);
    expect(normalizeThreshold(1.5)).toBe(DEFAULT_THRESHOLD);
    expect(normalizeThreshold(-0.1)).toBe(DEFAULT_THRESHOLD);
    expect(normalizeThreshold('not-a-number')).toBe(DEFAULT_THRESHOLD);
  });

  it('prefers the supplied fallback over the default', () => {
    expect(normalizeThreshold(undefined, 0.9)).toBe(0.9);
    // An invalid fallback still collapses to the default.
    expect(normalizeThreshold(undefined, 2.5)).toBe(DEFAULT_THRESHOLD);
  });

  it('exposes a sane DEFAULT_THRESHOLD', () => {
    expect(DEFAULT_THRESHOLD).toBe(0.85);
  });
});