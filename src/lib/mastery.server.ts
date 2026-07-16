// EMA-based topic mastery. outcome ∈ {0,1}; alpha controls learning rate.
export function updateMasteryScore(prev: number, outcome: number, alpha = 0.25): number {
  const next = alpha * outcome + (1 - alpha) * prev;
  return Math.max(0, Math.min(1, Number(next.toFixed(3))));
}
