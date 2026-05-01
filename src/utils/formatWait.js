// ── Wait-time formatter & sanitizer ──────────────────
// Centralises how minute values are displayed across the app so the
// student/tutor dashboards never show a runaway "1289m" again, and so a
// single bad sample can't dominate the average.

// Sane upper bound for any individual recorded wait time (minutes). Anything
// above this is treated as a dev/test outlier (e.g. someone joined yesterday
// and was served today). Caps each sample BEFORE averaging — does not change
// what's persisted in the database.
export const MAX_WAIT_MIN = 300;

/**
 * Format a wait time (in minutes) for display.
 *
 *  null / NaN / negative  →  fallback (default '—')
 *  0                      →  fallback
 *  0 < v < 1              →  '<1m'
 *  1 ≤ v < 60             →  'Mm'           (e.g. '25m')
 *  v ≥ 60                 →  'H:MM'         (clock-style with the colon
 *                                            — e.g. 1289 → '21:29',
 *                                            90 → '1:30')
 *
 * Values above MAX_WAIT_MIN are clamped first so the UI stays readable even
 * if upstream data is bad.
 *
 * Pass `prefix: '~'` when rendering an *estimate* (e.g. '~25m', '~1:30').
 */
export function formatWait(rawMin, { fallback = '—', prefix = '' } = {}) {
    const n = Number(rawMin);
    if (!Number.isFinite(n) || n <= 0) return fallback;

    const clamped = Math.min(MAX_WAIT_MIN, n);
    if (clamped < 1) return `${prefix}<1m`;

    const total = Math.round(clamped);
    if (total < 60) return `${prefix}${total}m`;

    const h = Math.floor(total / 60);
    const m = total % 60;
    return `${prefix}${h}:${String(m).padStart(2, '0')}`;
}

/**
 * Compute a robust average of wait-time samples (in minutes), capping each
 * sample at `cap` so a single 1289-minute outlier can't dominate the result.
 * Returns 0 when there are no usable samples.
 */
export function averageWaitMinutes(samples, { cap = MAX_WAIT_MIN } = {}) {
    const cleaned = (samples || [])
        .map((v) => Number(v))
        .filter((v) => Number.isFinite(v) && v > 0)
        .map((v) => Math.min(cap, v));
    if (cleaned.length === 0) return 0;
    const total = cleaned.reduce((sum, v) => sum + v, 0);
    return total / cleaned.length;
}
