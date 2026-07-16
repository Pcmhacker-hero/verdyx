import { useEffect, useState } from "react";

export interface Countdown {
  d: number;
  h: number;
  m: number;
  s: number;
  totalSec: number;
  isSoon: boolean;
  isPast: boolean;
}

/**
 * Live countdown to an ISO timestamp. Ticks every second while the target
 * is in the future; stops ticking once elapsed to avoid needless renders.
 */
export function useCountdown(iso: string, soonThresholdSec = 3600): Countdown {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const target = new Date(iso).getTime();
    if (Number.isNaN(target)) return;
    if (target - Date.now() <= 0) return;

    const id = window.setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (target - t <= 0) window.clearInterval(id);
    }, 1000);

    return () => window.clearInterval(id);
  }, [iso]);

  const target = new Date(iso).getTime();
  const diff = Math.max(0, target - now);
  const totalSec = Math.floor(diff / 1000);

  return {
    d: Math.floor(totalSec / 86400),
    h: Math.floor((totalSec % 86400) / 3600),
    m: Math.floor((totalSec % 3600) / 60),
    s: totalSec % 60,
    totalSec,
    isSoon: totalSec > 0 && totalSec < soonThresholdSec,
    isPast: target - now <= 0,
  };
}
