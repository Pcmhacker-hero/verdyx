// Server-only Codeforces API helpers. Public endpoints, no auth key needed.

export interface CFProblem {
  contestId?: number;
  index: string;
  name: string;
  rating?: number;
  tags: string[];
}

export interface CFSubmission {
  id: number;
  verdict?: string;
  problem: CFProblem;
  creationTimeSeconds: number;
}

const UA = { "User-Agent": "Atlas-Coach/1.0" };

export async function fetchProblemset(): Promise<CFProblem[]> {
  const res = await fetch("https://codeforces.com/api/problemset.problems", { headers: UA });
  if (!res.ok) throw new Error(`Codeforces problemset ${res.status}`);
  const data = (await res.json()) as { status: string; comment?: string; result?: { problems: CFProblem[] } };
  if (data.status !== "OK" || !data.result) throw new Error(`Codeforces: ${data.comment ?? "unknown error"}`);
  return data.result.problems;
}

export async function fetchUserStatus(handle: string, count = 200): Promise<CFSubmission[]> {
  const res = await fetch(
    `https://codeforces.com/api/user.status?handle=${encodeURIComponent(handle)}&from=1&count=${count}`,
    { headers: UA },
  );
  if (!res.ok) throw new Error(`Codeforces user.status ${res.status}`);
  const data = (await res.json()) as { status: string; comment?: string; result?: CFSubmission[] };
  if (data.status !== "OK" || !data.result) throw new Error(`Codeforces: ${data.comment ?? "unknown error"}`);
  return data.result;
}

export async function fetchUserInfo(handle: string): Promise<{ rating?: number; handle: string } | null> {
  try {
    const res = await fetch(
      `https://codeforces.com/api/user.info?handles=${encodeURIComponent(handle)}`,
      { headers: UA },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      status: string;
      result?: Array<{ handle: string; rating?: number }>;
    };
    if (data.status !== "OK" || !data.result?.[0]) return null;
    return data.result[0];
  } catch {
    return null;
  }
}
