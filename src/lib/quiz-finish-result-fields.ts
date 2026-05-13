/** Safe display for `results.time_taken`: hide invalid or negative values. */
export function formatTimeTakenForDisplay(raw: unknown): number | null {
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}
