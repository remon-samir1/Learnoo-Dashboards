export function clampPercentage(value: unknown): number | null {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) return null;
  return Math.min(100, Math.max(0, numeric));
}

export function percentageFromScore(score: unknown, total: unknown): number | null {
  const numericScore = typeof score === 'number' ? score : Number(score);
  const numericTotal = typeof total === 'number' ? total : Number(total);
  if (!Number.isFinite(numericScore) || !Number.isFinite(numericTotal) || numericTotal <= 0) {
    return null;
  }
  return clampPercentage((numericScore / numericTotal) * 100);
}

export function readPercentageWithScoreFallback(
  percentage: unknown,
  score: unknown,
  total: unknown,
): number | null {
  return clampPercentage(percentage) ?? percentageFromScore(score, total);
}

export function passingMarksPercentage(passingMarks: unknown, totalMarks: unknown): number | null {
  return percentageFromScore(passingMarks, totalMarks);
}
