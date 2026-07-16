/**
 * Deterministic pseudo-random helpers for module-level mock data.
 *
 * WHY: `Math.random()` at module scope produces different values on the SSR
 * server than on the client, causing React hydration mismatches when the
 * data is rendered into HTML. A seeded PRNG makes both sides agree.
 */

/** mulberry32 — small, fast, well-distributed 32-bit PRNG. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
