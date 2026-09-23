/**
 * Sanitize a similarity-confidence threshold.
 *
 * The answering threshold can be configured per-event (`Event.faqThreshold`)
 * or globally (`Settings.similarityThreshold`). This helper guarantees the
 * value used in the LangGraph pipeline is always a finite number in [0, 1],
 * falling back to `DEFAULT_THRESHOLD` (0.85) when missing/invalid.
 */
const DEFAULT_THRESHOLD = 0.85;

function normalizeThreshold(value, fallback = DEFAULT_THRESHOLD) {
  // Number(null) === 0, so treat null/undefined/empty explicitly as "missing".
  if (value === null || value === undefined || value === '') {
    const f = Number(fallback);
    return Number.isFinite(f) && f >= 0 && f <= 1 ? f : DEFAULT_THRESHOLD;
  }
  const n = Number(value);
  if (Number.isFinite(n) && n >= 0 && n <= 1) return n;
  const f = Number(fallback);
  return Number.isFinite(f) && f >= 0 && f <= 1 ? f : DEFAULT_THRESHOLD;
}

module.exports = { normalizeThreshold, DEFAULT_THRESHOLD };