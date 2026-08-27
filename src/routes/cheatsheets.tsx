import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  Circle,
  Copy,
  Eye,
  Flame,
  GitBranch,
  Layers,
  Lightbulb,
  Network,
  Repeat,
  RotateCcw,
  Search,
  Sparkles,
  Target,
  Trash2,
  Trophy,
  Waves,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app/app-shell";
import {
  useActiveSheets,
  useArchiveSheet,
  useDeleteSheet,
  useRestoreSheet,
  useSetFavorite,
  useTrashedSheets,
} from "@/hooks/use-sheets";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Kbd } from "@/components/ds/kbd";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/cheatsheets")({
  head: () => ({
    meta: [
      { title: "Cheat Library · Verdiqy" },
      {
        name: "description",
        content:
          "Your personal cheat library — saved custom practice sheets plus visual notes on core competitive programming techniques.",
      },
    ],
  }),
  component: CheatsheetsPage,
});

// ---------------- data ----------------

type SheetId =
  | "binary-search"
  | "segment-tree"
  | "dp-bitmask"
  | "dijkstra"
  | "two-pointers"
  | "kmp"
  | "union-find"
  | "sqrt-decomp";

interface Sheet {
  id: SheetId;
  title: string;
  category: "Search" | "Graphs" | "DP" | "Strings" | "Structures";
  mastery: number; // 0-100
  tagline: string;
  coreIdea: string;
  mentalModel: {
    title: string;
    diagram: "monotonic" | "tree" | "layers" | "graph";
    caption: string;
  };
  whenToReach: string[];
  mistakes: { danger: "high" | "med" | "low"; text: string }[];
  templates: { lang: "cpp" | "py"; label: string; code: string }[];
  ladder: { rating: number; label: string; done?: boolean }[];
  related: { title: string; rating: number; tag: string }[];
  roadmap: { day: number; task: string; minutes: number }[];
  revision: string[];
  interviewRelevance: number; // 0-5
  contestRelevance: number; // 0-5
}

const SHEETS: Sheet[] = [
  {
    id: "binary-search",
    title: "Binary Search",
    category: "Search",
    mastery: 78,
    tagline: "Collapse a search space by half — every single time.",
    coreIdea:
      "If a predicate is monotonic over an ordered range, the boundary can be located in O(log n) by repeatedly discarding the half that cannot contain the answer.",
    mentalModel: {
      title: "The monotonic frontier",
      diagram: "monotonic",
      caption:
        "Think of the range as F F F F T T T T. Every iteration keeps the frontier between F and T and shrinks the unknown gap.",
    },
    whenToReach: [
      "Answer is numeric and there's a monotone check(x)",
      "Sorted array + find-first / find-last",
      "Optimize a threshold that trades off two things",
    ],
    mistakes: [
      { danger: "high", text: "lo + (hi - lo) / 2 vs (lo+hi)/2 → overflow on large bounds" },
      {
        danger: "high",
        text: "Off-by-one when the answer is not in the array (upper vs lower bound)",
      },
      { danger: "med", text: "Predicate is only weakly monotone — verify F…FT…T actually holds" },
      { danger: "med", text: "Infinite loop when lo = mid instead of lo = mid + 1" },
      {
        danger: "low",
        text: "Using float BS without fixing iteration count (use 100 iters, not eps)",
      },
    ],
    templates: [
      {
        lang: "cpp",
        label: "Lower bound predicate",
        code: `int lo = 0, hi = n;
while (lo < hi) {
  int mid = lo + (hi - lo) / 2;
  if (check(mid)) hi = mid;   // keep the T side
  else            lo = mid+1; // discard F side
}
return lo; // first T, or n if none`,
      },
      {
        lang: "cpp",
        label: "Real-valued search",
        code: `double lo = 0, hi = 1e9;
for (int i = 0; i < 100; ++i) {
  double mid = (lo + hi) / 2;
  if (check(mid)) hi = mid;
  else            lo = mid;
}
return lo;`,
      },
    ],
    ladder: [
      { rating: 1200, label: "Guess the number", done: true },
      { rating: 1400, label: "Aggressive cows", done: true },
      { rating: 1600, label: "Median of two sorted arrays", done: true },
      { rating: 1800, label: "Painter's partition" },
      { rating: 2000, label: "Parametric search on trees" },
      { rating: 2200, label: "BS on the answer + DP check" },
    ],
    related: [
      { title: "Median of Two Sorted Arrays", rating: 2000, tag: "arrays" },
      { title: "Split Array Largest Sum", rating: 1800, tag: "parametric" },
      { title: "K-th Smallest in Matrix", rating: 1900, tag: "matrix" },
      { title: "Aggressive Cows", rating: 1400, tag: "classic" },
    ],
    roadmap: [
      { day: 1, task: "Re-derive lower_bound from scratch, twice", minutes: 25 },
      { day: 2, task: "Solve 3 parametric BS problems ≤ 1700", minutes: 45 },
      { day: 3, task: "Write a monotonic check for a 1900 problem", minutes: 40 },
      { day: 4, task: "Speed set: 6 problems, 12 min budget each", minutes: 72 },
      { day: 5, task: "One 2100 problem, no editorial", minutes: 60 },
      { day: 6, task: "Review notebook + failed attempts", minutes: 20 },
      { day: 7, task: "Mock contest with 1 BS problem", minutes: 120 },
    ],
    revision: [
      "Predicate is monotone over the search range",
      "lo/hi initial values include every valid answer",
      "Loop invariant: answer lives in [lo, hi]",
      "mid = lo + (hi - lo) / 2 to avoid overflow",
      "Exit condition matches: `lo < hi` vs `lo <= hi`",
      "Post-loop: verify lo is actually a solution",
    ],
    interviewRelevance: 5,
    contestRelevance: 5,
  },
  {
    id: "segment-tree",
    title: "Segment Tree",
    category: "Structures",
    mastery: 52,
    tagline: "Point updates, range queries — in log time, forever.",
    coreIdea:
      "Store a balanced binary tree over an array. Each node summarizes its interval, so any range query decomposes into O(log n) nodes.",
    mentalModel: {
      title: "Interval decomposition",
      diagram: "tree",
      caption:
        "A range [l, r] shatters into at most 2·log n canonical intervals — the path from root to l and to r, glued at the top.",
    },
    whenToReach: [
      "Range queries with point (or range) updates",
      "Any associative operation: sum, min, max, gcd, xor",
      "Need updates in log time; prefix sums are too static",
    ],
    mistakes: [
      {
        danger: "high",
        text: "Array sized 2n instead of 4n → index-out-of-range on non-power-of-2",
      },
      { danger: "high", text: "Forgetting to push lazy tags before descending" },
      { danger: "med", text: "Mixing 0-indexed and 1-indexed conventions mid-file" },
      { danger: "med", text: "Combining nodes in the wrong order for non-commutative ops" },
      { danger: "low", text: "Rebuilding instead of updating for hot paths" },
    ],
    templates: [
      {
        lang: "cpp",
        label: "Iterative sum tree",
        code: `int t[2*N]; int n;
void upd(int i, int v){
  for (t[i+=n]=v; i>>=1;)
    t[i] = t[2*i] + t[2*i+1];
}
int qry(int l, int r){
  int s=0;
  for (l+=n, r+=n; l<r; l>>=1, r>>=1) {
    if (l&1) s += t[l++];
    if (r&1) s += t[--r];
  }
  return s;
}`,
      },
    ],
    ladder: [
      { rating: 1500, label: "Range sum, point update", done: true },
      { rating: 1700, label: "Range max, point update", done: true },
      { rating: 1900, label: "Lazy range add + range sum" },
      { rating: 2100, label: "Kth-order on segment tree" },
      { rating: 2300, label: "Segment tree beats" },
    ],
    related: [
      { title: "Range Sum Query — Mutable", rating: 1600, tag: "classic" },
      { title: "Count of Smaller Numbers After Self", rating: 2000, tag: "order stat" },
      { title: "Falling Squares", rating: 2100, tag: "coord compression" },
    ],
    roadmap: [
      { day: 1, task: "Type the iterative template from memory", minutes: 20 },
      { day: 2, task: "Solve 3 point-update / range-query problems", minutes: 60 },
      { day: 3, task: "Add lazy propagation", minutes: 55 },
      { day: 4, task: "One order-statistic problem", minutes: 60 },
      { day: 5, task: "Refactor into class, add merge()", minutes: 40 },
      { day: 6, task: "Speed set — 5 problems ≤ 1900", minutes: 90 },
      { day: 7, task: "Mock with 2 structure problems", minutes: 120 },
    ],
    revision: [
      "Tree array is size 4n (or 2n for iterative)",
      "combine() is associative and correct on identity",
      "Lazy pushed before every descent",
      "Query decomposes into ≤ 2·log n canonical nodes",
      "Point update propagates upward correctly",
    ],
    interviewRelevance: 3,
    contestRelevance: 5,
  },
  {
    id: "dp-bitmask",
    title: "Bitmask DP",
    category: "DP",
    mastery: 34,
    tagline: "Small sets, huge power — carry a subset in 20 bits.",
    coreIdea:
      "When n ≤ 20, the set of chosen items fits in an int. Iterate masks in order; transitions add or remove one element.",
    mentalModel: {
      title: "Layered subsets",
      diagram: "layers",
      caption:
        "Group masks by popcount. Layer k only depends on layer k−1, so you can process them in order without recursion.",
    },
    whenToReach: [
      "n ≤ 20 and states depend on subset chosen",
      "TSP-like: shortest path visiting each node once",
      "Assignment problems / minimum-cost matching",
    ],
    mistakes: [
      { danger: "high", text: "Iterating masks in wrong order for subset-sum-over-subsets" },
      { danger: "high", text: "Using `int` for 1<<n when n could be 31+" },
      { danger: "med", text: "Forgetting the empty mask base case" },
      { danger: "med", text: "Confusing 'has bit i' (mask>>i&1) with 'add bit i' (mask|1<<i)" },
    ],
    templates: [
      {
        lang: "cpp",
        label: "TSP shell",
        code: `vector<vector<int>> dp(1<<n, vector<int>(n, INF));
dp[1][0] = 0;
for (int mask = 1; mask < (1<<n); ++mask)
  for (int u = 0; u < n; ++u) if (mask>>u & 1)
    for (int v = 0; v < n; ++v) if (!(mask>>v & 1))
      dp[mask|1<<v][v] = min(dp[mask|1<<v][v], dp[mask][u] + w[u][v]);`,
      },
    ],
    ladder: [
      { rating: 1800, label: "Assignment problem" },
      { rating: 1900, label: "Traveling salesman (n ≤ 18)" },
      { rating: 2100, label: "Subset sum over subsets (SOS DP)" },
      { rating: 2300, label: "Broken profile DP" },
    ],
    related: [
      { title: "Traveling Salesman", rating: 1900, tag: "graphs" },
      { title: "Partition to K Equal Sum Subsets", rating: 1800, tag: "partition" },
      { title: "Shortest Path Visiting All Nodes", rating: 2000, tag: "bfs+mask" },
    ],
    roadmap: [
      { day: 1, task: "Rewrite TSP from scratch", minutes: 40 },
      { day: 2, task: "Solve 2 assignment problems", minutes: 60 },
      { day: 3, task: "Study SOS DP, implement once", minutes: 60 },
      { day: 4, task: "Practice bit tricks (subset enumeration)", minutes: 30 },
      { day: 5, task: "One 2100 problem, no editorial", minutes: 90 },
      { day: 6, task: "Recap notebook", minutes: 20 },
      { day: 7, task: "Mock contest with bitmask problem", minutes: 120 },
    ],
    revision: [
      "n ≤ 20 (else revisit encoding)",
      "Transition adds/removes exactly one element",
      "Iterate masks in increasing order for forward DP",
      "Base case: empty mask or singleton set",
    ],
    interviewRelevance: 2,
    contestRelevance: 5,
  },
  {
    id: "dijkstra",
    title: "Dijkstra",
    category: "Graphs",
    mastery: 71,
    tagline: "Shortest paths, one relaxed frontier at a time.",
    coreIdea:
      "Grow a set of finalized nodes by repeatedly extracting the closest unfinalized node and relaxing its edges. Requires non-negative weights.",
    mentalModel: {
      title: "Expanding frontier",
      diagram: "graph",
      caption:
        "The priority queue holds tentative distances. Every pop finalizes a node; every relax may add a better tentative for its neighbors.",
    },
    whenToReach: [
      "Single-source shortest path with non-negative weights",
      "Grid shortest path with variable step cost",
      "Meta-graphs where states carry extra dimensions",
    ],
    mistakes: [
      { danger: "high", text: "Using Dijkstra with negative edges (use Bellman-Ford / SPFA)" },
      {
        danger: "high",
        text: "Not skipping stale entries when popping (`if (d > dist[u]) continue`)",
      },
      { danger: "med", text: "Priority queue direction wrong — need min-heap" },
      { danger: "low", text: "Rebuilding graph inside the loop" },
    ],
    templates: [
      {
        lang: "cpp",
        label: "Priority-queue Dijkstra",
        code: `vector<long long> dist(n, INF);
priority_queue<pair<long long,int>, vector<pair<long long,int>>, greater<>> pq;
dist[s] = 0; pq.push({0, s});
while (!pq.empty()) {
  auto [d, u] = pq.top(); pq.pop();
  if (d > dist[u]) continue;
  for (auto [v, w] : g[u]) if (d + w < dist[v]) {
    dist[v] = d + w;
    pq.push({dist[v], v});
  }
}`,
      },
    ],
    ladder: [
      { rating: 1400, label: "Shortest path on weighted graph", done: true },
      { rating: 1600, label: "Grid with variable costs", done: true },
      { rating: 1800, label: "Meta-state (Dijkstra + parity)" },
      { rating: 2000, label: "k-th shortest path" },
    ],
    related: [
      { title: "Network Delay Time", rating: 1500, tag: "classic" },
      { title: "Cheapest Flights K Stops", rating: 1700, tag: "meta-state" },
      { title: "Path With Minimum Effort", rating: 1600, tag: "grid" },
    ],
    roadmap: [
      { day: 1, task: "Type template from memory", minutes: 15 },
      { day: 2, task: "Solve 2 grid problems", minutes: 60 },
      { day: 3, task: "Meta-state Dijkstra (parity, colors)", minutes: 60 },
      { day: 4, task: "0/1 BFS as a variant", minutes: 40 },
      { day: 5, task: "One 2000 problem", minutes: 75 },
      { day: 6, task: "Notebook recap", minutes: 20 },
      { day: 7, task: "Mock contest", minutes: 120 },
    ],
    revision: [
      "All edge weights are ≥ 0",
      "Distances initialized to INF except source = 0",
      "Stale-entry skip is present",
      "Uses min-heap, not max-heap",
    ],
    interviewRelevance: 5,
    contestRelevance: 5,
  },
  {
    id: "two-pointers",
    title: "Two Pointers",
    category: "Search",
    mastery: 88,
    tagline: "Sweep once, remember what you've seen.",
    coreIdea:
      "Maintain a window with two indices that only move forward. Each advances at most n times, giving O(n) even though nested loops appear.",
    mentalModel: {
      title: "Amortized sweep",
      diagram: "monotonic",
      caption:
        "Left and right pointers monotonically increase — total work is bounded by their combined travel, not their product.",
    },
    whenToReach: [
      "Sorted array + pair sum / triplet sum",
      "Longest subarray with a monotone constraint",
      "Merge / partition style problems",
    ],
    mistakes: [
      { danger: "med", text: "Moving both pointers when only one should advance" },
      { danger: "med", text: "Forgetting to shrink the window when constraint breaks" },
      { danger: "low", text: "Recomputing window sum from scratch each step" },
    ],
    templates: [
      {
        lang: "cpp",
        label: "Sliding window skeleton",
        code: `int l = 0, best = 0;
for (int r = 0; r < n; ++r) {
  add(a[r]);
  while (!ok()) remove(a[l++]);
  best = max(best, r - l + 1);
}`,
      },
    ],
    ladder: [
      { rating: 1200, label: "Longest substring without repeat", done: true },
      { rating: 1400, label: "Minimum window substring", done: true },
      { rating: 1600, label: "Subarrays with K distinct" },
      { rating: 1800, label: "Two pointers on trees / linked lists" },
    ],
    related: [
      { title: "Longest Substring Without Repeat", rating: 1400, tag: "strings" },
      { title: "Minimum Window Substring", rating: 1800, tag: "hard classic" },
      { title: "3Sum Closest", rating: 1500, tag: "sorted" },
    ],
    roadmap: [
      { day: 1, task: "Template from memory", minutes: 10 },
      { day: 2, task: "3 easy window problems", minutes: 45 },
      { day: 3, task: "K-distinct family", minutes: 45 },
      { day: 4, task: "Merge-style two pointers", minutes: 40 },
      { day: 5, task: "One 1800 problem", minutes: 60 },
      { day: 6, task: "Recap", minutes: 15 },
      { day: 7, task: "Contest problem set", minutes: 90 },
    ],
    revision: [
      "Both pointers only ever move forward",
      "Window state supports add / remove in O(1)",
      "Constraint is monotone in the window",
    ],
    interviewRelevance: 5,
    contestRelevance: 4,
  },
  {
    id: "kmp",
    title: "KMP",
    category: "Strings",
    mastery: 22,
    tagline: "Never re-scan a character you've already read.",
    coreIdea:
      "Precompute the longest proper prefix of the pattern that is also a suffix (failure function). On a mismatch, jump the pattern by the failure link instead of restarting.",
    mentalModel: {
      title: "Fallback links",
      diagram: "graph",
      caption:
        "Failure function turns the pattern into a state machine. Every text character advances the state exactly once — total O(n+m).",
    },
    whenToReach: [
      "Pattern matching in a stream you can't rewind",
      "Counting occurrences of a pattern",
      "Prefix-function tricks (period detection, borders)",
    ],
    mistakes: [
      { danger: "high", text: "Failure function off-by-one at index 0" },
      { danger: "med", text: "Not resetting state when scanning multiple texts" },
      { danger: "med", text: "Reaching for KMP when Z-function or hashing is simpler" },
    ],
    templates: [
      {
        lang: "cpp",
        label: "Prefix function",
        code: `vector<int> pi(s.size());
for (int i = 1; i < (int)s.size(); ++i) {
  int j = pi[i-1];
  while (j > 0 && s[i] != s[j]) j = pi[j-1];
  if (s[i] == s[j]) ++j;
  pi[i] = j;
}`,
      },
    ],
    ladder: [
      { rating: 1500, label: "Substring search" },
      { rating: 1700, label: "Count distinct occurrences" },
      { rating: 1900, label: "Smallest period of a string" },
      { rating: 2100, label: "KMP automaton + DP" },
    ],
    related: [
      { title: "Implement strStr()", rating: 1400, tag: "classic" },
      { title: "Shortest Palindrome", rating: 1900, tag: "prefix trick" },
      { title: "Repeated Substring Pattern", rating: 1500, tag: "periods" },
    ],
    roadmap: [
      { day: 1, task: "Derive prefix function on paper", minutes: 30 },
      { day: 2, task: "Implement and test on 3 patterns", minutes: 45 },
      { day: 3, task: "Two occurrence-counting problems", minutes: 50 },
      { day: 4, task: "Learn Z-function and compare", minutes: 40 },
      { day: 5, task: "One 1900 problem", minutes: 70 },
      { day: 6, task: "Recap borders / periods", minutes: 20 },
      { day: 7, task: "String-heavy contest set", minutes: 90 },
    ],
    revision: [
      "pi[0] is 0 by convention",
      "Failure jump loops until match or j == 0",
      "State only advances by ≤ 1 per text character",
    ],
    interviewRelevance: 2,
    contestRelevance: 4,
  },
  {
    id: "union-find",
    title: "Union-Find",
    category: "Structures",
    mastery: 66,
    tagline: "Merge sets, ask 'same group?' — near-constant time.",
    coreIdea:
      "Each set is a tree; the root identifies the set. Path compression + union by rank make both operations effectively O(α(n)).",
    mentalModel: {
      title: "Forest of roots",
      diagram: "tree",
      caption:
        "Every find() flattens the path it walks. Every union() attaches the smaller tree under the larger.",
    },
    whenToReach: ["Dynamic connectivity", "Kruskal's MST", "Grouping / equivalence classes online"],
    mistakes: [
      { danger: "high", text: "Forgetting path compression → worst-case O(n) find" },
      { danger: "med", text: "Union without rank/size → tall trees" },
      { danger: "med", text: "Storing sizes on non-root nodes" },
    ],
    templates: [
      {
        lang: "cpp",
        label: "DSU with path compression + size",
        code: `struct DSU {
  vector<int> p, sz;
  DSU(int n): p(n), sz(n, 1) { iota(p.begin(), p.end(), 0); }
  int f(int x){ return p[x]==x ? x : p[x]=f(p[x]); }
  bool u(int a, int b){
    a=f(a); b=f(b); if (a==b) return false;
    if (sz[a]<sz[b]) swap(a,b);
    p[b]=a; sz[a]+=sz[b]; return true;
  }
};`,
      },
    ],
    ladder: [
      { rating: 1200, label: "Number of provinces", done: true },
      { rating: 1400, label: "Redundant connection", done: true },
      { rating: 1600, label: "Kruskal MST" },
      { rating: 1800, label: "Offline queries with DSU" },
      { rating: 2100, label: "DSU on tree (small-to-large)" },
    ],
    related: [
      { title: "Number of Islands II", rating: 1700, tag: "grid" },
      { title: "Accounts Merge", rating: 1600, tag: "groups" },
      { title: "Kruskal MST", rating: 1600, tag: "graphs" },
    ],
    roadmap: [
      { day: 1, task: "Type template from memory", minutes: 15 },
      { day: 2, task: "3 connectivity problems", minutes: 55 },
      { day: 3, task: "Kruskal MST from scratch", minutes: 50 },
      { day: 4, task: "Offline query problem", minutes: 60 },
      { day: 5, task: "One 1800 problem", minutes: 60 },
      { day: 6, task: "Recap notebook", minutes: 15 },
      { day: 7, task: "Contest set", minutes: 90 },
    ],
    revision: [
      "Path compression present in find()",
      "Union by size or rank present",
      "Only roots hold size/rank",
    ],
    interviewRelevance: 4,
    contestRelevance: 5,
  },
  {
    id: "sqrt-decomp",
    title: "Sqrt Decomposition",
    category: "Structures",
    mastery: 12,
    tagline: "Split the array into √n buckets — good enough, fast to write.",
    coreIdea:
      "Precompute an aggregate per bucket of size √n. Queries touch O(√n) buckets fully and O(√n) elements at the edges.",
    mentalModel: {
      title: "Bucket + edge",
      diagram: "layers",
      caption:
        "A range query walks the two partial edge buckets element-by-element and jumps over the middle buckets using aggregates.",
    },
    whenToReach: [
      "Range queries where a segment tree feels heavy",
      "Mo's algorithm on offline queries",
      "Updates + queries with weak constraints",
    ],
    mistakes: [
      { danger: "med", text: "Bucket size not tuned — try √n, √(n·q), or fixed 320" },
      { danger: "med", text: "Edge buckets double-counted" },
      { danger: "low", text: "Rebuilding bucket aggregate every update instead of delta" },
    ],
    templates: [
      {
        lang: "cpp",
        label: "Range-sum sqrt shell",
        code: `int B = (int)sqrt(n) + 1;
vector<long long> bucket(n/B + 1);
for (int i = 0; i < n; ++i) bucket[i/B] += a[i];

auto qry = [&](int l, int r){
  long long s = 0;
  while (l <= r && l % B) s += a[l++];
  while (l + B - 1 <= r) { s += bucket[l/B]; l += B; }
  while (l <= r) s += a[l++];
  return s;
};`,
      },
    ],
    ladder: [
      { rating: 1500, label: "Range sum with sqrt" },
      { rating: 1700, label: "Range assign + range sum" },
      { rating: 1900, label: "Mo's algorithm — distinct count" },
      { rating: 2100, label: "Mo's on tree" },
    ],
    related: [
      { title: "Distinct in Range", rating: 1900, tag: "Mo's" },
      { title: "Range Assign Range Sum", rating: 1700, tag: "sqrt" },
    ],
    roadmap: [
      { day: 1, task: "Write range-sum from scratch", minutes: 30 },
      { day: 2, task: "Practice tuning B", minutes: 30 },
      { day: 3, task: "One Mo's algorithm problem", minutes: 90 },
      { day: 4, task: "Range assign variant", minutes: 60 },
      { day: 5, task: "One 1900 problem", minutes: 70 },
      { day: 6, task: "Recap trade-offs vs segtree", minutes: 20 },
      { day: 7, task: "Contest set", minutes: 90 },
    ],
    revision: [
      "Bucket size B tuned to problem",
      "Edge buckets iterated element-by-element",
      "Middle buckets aggregated with precomputed value",
    ],
    interviewRelevance: 1,
    contestRelevance: 4,
  },
];

function isSheetId(value: string): value is SheetId {
  return SHEETS.some((sheet) => sheet.id === value);
}

const CATEGORY_META: Record<Sheet["category"], { icon: typeof Search; hue: string }> = {
  Search: { icon: Search, hue: "var(--chart-1)" },
  Graphs: { icon: Network, hue: "var(--chart-2)" },
  DP: { icon: Layers, hue: "var(--chart-3)" },
  Strings: { icon: GitBranch, hue: "var(--chart-4)" },
  Structures: { icon: BookOpen, hue: "var(--chart-5)" },
};

// ---------------- page ----------------

function CheatsheetsPage() {
  return (
    <AppShell breadcrumb={[{ label: "Cheat Library" }]}>
      <div className="px-4 py-6 lg:px-6">
        <SavedSheetsBox />
      </div>
    </AppShell>
  );
}


// ---------------- library rail ----------------

function Library({
  sheets,
  activeId,
  onSelect,
  query,
  onQuery,
  category,
  onCategory,
}: {
  sheets: Sheet[];
  activeId: SheetId;
  onSelect: (id: SheetId) => void;
  query: string;
  onQuery: (q: string) => void;
  category: Sheet["category"] | "All";
  onCategory: (c: Sheet["category"] | "All") => void;
}) {
  const cats: (Sheet["category"] | "All")[] = [
    "All",
    "Search",
    "Graphs",
    "DP",
    "Strings",
    "Structures",
  ];

  return (
    <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] flex-col border-r border-border/70 bg-sidebar/50 lg:flex">
      <div className="border-b border-border/70 p-4">
        <div className="mb-3">
          <p className="font-mono text-2xs uppercase tracking-[0.16em] text-muted-foreground">
            Library
          </p>
          <h2 className="mt-0.5 text-lg font-semibold tracking-tight">Cheat Sheets</h2>
          <p className="mt-0.5 text-2xs text-muted-foreground">
            {SHEETS.length} sheets · rebuilt weekly
          </p>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Search sheets…"
            className="h-8 w-full rounded-md border border-border bg-background pl-8 pr-2 text-xs placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-1">
          {cats.map((c) => (
            <button
              key={c}
              onClick={() => onCategory(c)}
              className={cn(
                "rounded-full border px-2 py-0.5 font-mono text-2xs transition",
                category === c
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground",
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        {sheets.length === 0 ? (
          <p className="p-4 text-xs text-muted-foreground">No sheets match.</p>
        ) : (
          sheets.map((s) => {
            const meta = CATEGORY_META[s.category];
            const Icon = meta.icon;
            const active = s.id === activeId;
            return (
              <button
                key={s.id}
                onClick={() => onSelect(s.id)}
                className={cn(
                  "group mb-1 flex w-full items-start gap-3 rounded-lg border p-2.5 text-left transition",
                  active
                    ? "border-border bg-card shadow-sm"
                    : "border-transparent hover:bg-sidebar-accent/60",
                )}
              >
                <div
                  className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-md"
                  style={{
                    background: `color-mix(in oklab, ${meta.hue} 16%, transparent)`,
                    color: meta.hue,
                  }}
                >
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-medium">{s.title}</span>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-2xs text-muted-foreground">{s.tagline}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <MasteryRing value={s.mastery} hue={meta.hue} />
                    <span className="font-mono text-2xs text-muted-foreground">{s.mastery}</span>
                    <span className="text-2xs text-muted-foreground">·</span>
                    <span className="text-2xs text-muted-foreground">{s.category}</span>
                  </div>
                </div>
                <ChevronRight
                  className={cn(
                    "mt-2 size-3.5 shrink-0 text-muted-foreground transition",
                    active && "text-foreground",
                  )}
                />
              </button>
            );
          })
        )}
      </nav>
    </aside>
  );
}

function MasteryRing({ value, hue }: { value: number; hue: string }) {
  const r = 6;
  const c = 2 * Math.PI * r;
  const off = c - (value / 100) * c;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" className="shrink-0">
      <circle cx="8" cy="8" r={r} stroke="var(--border)" strokeWidth="2" fill="none" />
      <circle
        cx="8"
        cy="8"
        r={r}
        stroke={hue}
        strokeWidth="2"
        fill="none"
        strokeDasharray={c}
        strokeDashoffset={off}
        strokeLinecap="round"
        transform="rotate(-90 8 8)"
      />
    </svg>
  );
}

// ---------------- detail view ----------------

function SheetView({ sheet }: { sheet: Sheet }) {
  const meta = CATEGORY_META[sheet.category];
  const Icon = meta.icon;

  return (
    <div className="min-w-0">
      {/* Hero */}
      <header
        className="relative overflow-hidden border-b border-border/70 px-8 py-8"
        style={{
          background: `radial-gradient(1200px 300px at 10% -20%, color-mix(in oklab, ${meta.hue} 18%, transparent), transparent 60%)`,
        }}
      >
        <div className="flex items-start gap-4">
          <div
            className="grid size-12 shrink-0 place-items-center rounded-xl border"
            style={{
              borderColor: `color-mix(in oklab, ${meta.hue} 40%, transparent)`,
              background: `color-mix(in oklab, ${meta.hue} 12%, transparent)`,
              color: meta.hue,
            }}
          >
            <Icon className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 font-mono text-2xs uppercase tracking-[0.16em] text-muted-foreground">
              <span>{sheet.category}</span>
              <span>·</span>
              <span>Cheat sheet</span>
            </div>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">{sheet.title}</h1>
            <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{sheet.tagline}</p>
          </div>
          <div className="hidden shrink-0 items-center gap-2 md:flex">
            <RelevancePill
              label="Interview"
              value={sheet.interviewRelevance}
              icon={<Trophy className="size-3" />}
            />
            <RelevancePill
              label="Contest"
              value={sheet.contestRelevance}
              icon={<Flame className="size-3" />}
            />
          </div>
        </div>

        {/* mastery bar */}
        <div className="mt-6 flex items-center gap-4">
          <div className="flex-1">
            <div className="mb-1 flex items-baseline justify-between text-2xs text-muted-foreground">
              <span className="font-mono uppercase tracking-[0.14em]">Your mastery</span>
              <span className="font-mono">
                {sheet.mastery}/100 · {masteryLabel(sheet.mastery)}
              </span>
            </div>
            <div className="relative h-1.5 overflow-hidden rounded-full bg-surface-muted/60">
              <div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  width: `${sheet.mastery}%`,
                  background: `linear-gradient(90deg, ${meta.hue}, color-mix(in oklab, ${meta.hue} 55%, transparent))`,
                }}
              />
            </div>
          </div>
          <Button size="sm" variant="secondary" className="h-8 gap-1.5">
            <Repeat className="size-3.5" /> Revise
          </Button>
        </div>
      </header>

      {/* Body */}
      <div className="mx-auto max-w-[1120px] space-y-6 px-8 py-8">
        <div className="grid gap-6 lg:grid-cols-5">
          <CoreIdeaCard sheet={sheet} hue={meta.hue} className="lg:col-span-3" />
          <WhenToReachCard items={sheet.whenToReach} className="lg:col-span-2" />
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          <MentalModelCard sheet={sheet} hue={meta.hue} className="lg:col-span-3" />
          <MistakesCard mistakes={sheet.mistakes} className="lg:col-span-2" />
        </div>

        <TemplatesCard templates={sheet.templates} hue={meta.hue} />

        <div className="grid gap-6 lg:grid-cols-5">
          <LadderCard ladder={sheet.ladder} hue={meta.hue} className="lg:col-span-3" />
          <RelatedCard items={sheet.related} className="lg:col-span-2" />
        </div>

        <RoadmapCard roadmap={sheet.roadmap} hue={meta.hue} />

        <RevisionCard items={sheet.revision} />
      </div>
    </div>
  );
}

function masteryLabel(v: number) {
  if (v >= 85) return "Fluent";
  if (v >= 60) return "Comfortable";
  if (v >= 35) return "Building";
  return "New ground";
}

function RelevancePill({ label, value, icon }: { label: string; value: number; icon: ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-card px-2.5 py-1.5">
      <span className="text-muted-foreground">{icon}</span>
      <div className="leading-tight">
        <p className="font-mono text-2xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <div className="mt-0.5 flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              className={cn("block h-1 w-2 rounded-sm", i < value ? "bg-foreground" : "bg-border")}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------- cards ----------------

function Card({
  title,
  icon,
  action,
  children,
  className,
  hue,
}: {
  title: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  hue?: string;
}) {
  return (
    <section className={cn("flex flex-col rounded-xl border border-border/70 bg-card", className)}>
      <header className="flex items-center justify-between border-b border-border/70 px-5 py-3">
        <div className="flex items-center gap-2">
          {icon ? <span style={{ color: hue ?? "var(--primary)" }}>{icon}</span> : null}
          <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
        </div>
        {action}
      </header>
      <div className="min-h-0 flex-1 p-5">{children}</div>
    </section>
  );
}

function CoreIdeaCard({
  sheet,
  hue,
  className,
}: {
  sheet: Sheet;
  hue: string;
  className?: string;
}) {
  return (
    <Card title="Core idea" icon={<Lightbulb className="size-4" />} hue={hue} className={className}>
      <p className="text-sm leading-relaxed text-foreground/90">{sheet.coreIdea}</p>
      <div className="mt-4 flex items-center gap-2 rounded-md border border-dashed border-border p-3">
        <Sparkles className="size-3.5 text-primary" />
        <p className="text-2xs text-muted-foreground">
          If you had to teach this in one sentence — this is it.
        </p>
      </div>
    </Card>
  );
}

function WhenToReachCard({ items, className }: { items: string[]; className?: string }) {
  return (
    <Card title="When to reach for it" icon={<Target className="size-4" />} className={className}>
      <ul className="space-y-2.5">
        {items.map((t) => (
          <li key={t} className="flex items-start gap-2.5 text-sm">
            <Circle className="mt-1.5 size-1.5 shrink-0 fill-primary text-primary" />
            <span className="text-foreground/90">{t}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function MentalModelCard({
  sheet,
  hue,
  className,
}: {
  sheet: Sheet;
  hue: string;
  className?: string;
}) {
  return (
    <Card title="Mental model" icon={<Waves className="size-4" />} hue={hue} className={className}>
      <div className="mb-3">
        <p className="text-sm font-medium">{sheet.mentalModel.title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{sheet.mentalModel.caption}</p>
      </div>
      <div
        className="relative overflow-hidden rounded-lg border border-border/70 p-6"
        style={{
          background: `linear-gradient(180deg, color-mix(in oklab, ${hue} 8%, transparent), transparent)`,
        }}
      >
        <Diagram kind={sheet.mentalModel.diagram} hue={hue} />
      </div>
    </Card>
  );
}

function Diagram({ kind, hue }: { kind: Sheet["mentalModel"]["diagram"]; hue: string }) {
  if (kind === "monotonic") {
    return (
      <svg viewBox="0 0 400 100" className="w-full">
        {Array.from({ length: 20 }).map((_, i) => {
          const isT = i >= 12;
          const isFrontier = i === 11 || i === 12;
          return (
            <g key={i}>
              <rect
                x={i * 19 + 4}
                y={30}
                width={16}
                height={40}
                rx={2}
                fill={isT ? hue : "var(--muted)"}
                fillOpacity={isT ? 0.9 : 0.35}
                stroke={isFrontier ? "var(--foreground)" : "transparent"}
              />
              <text
                x={i * 19 + 12}
                y={86}
                textAnchor="middle"
                fontSize="9"
                fill="var(--muted-foreground)"
                fontFamily="ui-monospace, monospace"
              >
                {isT ? "T" : "F"}
              </text>
            </g>
          );
        })}
        <line
          x1={11 * 19 + 20}
          y1={20}
          x2={11 * 19 + 20}
          y2={78}
          stroke="var(--foreground)"
          strokeDasharray="3 3"
        />
        <text x={11 * 19 + 26} y={22} fontSize="10" fill="var(--foreground)">
          frontier
        </text>
      </svg>
    );
  }
  if (kind === "tree") {
    const nodes = [
      { x: 200, y: 20, l: "[1..8]" },
      { x: 100, y: 60, l: "[1..4]" },
      { x: 300, y: 60, l: "[5..8]" },
      { x: 50, y: 100, l: "[1..2]" },
      { x: 150, y: 100, l: "[3..4]" },
      { x: 250, y: 100, l: "[5..6]" },
      { x: 350, y: 100, l: "[7..8]" },
    ];
    const edges = [
      [0, 1],
      [0, 2],
      [1, 3],
      [1, 4],
      [2, 5],
      [2, 6],
    ];
    return (
      <svg viewBox="0 0 400 130" className="w-full">
        {edges.map(([a, b], i) => (
          <line
            key={i}
            x1={nodes[a].x}
            y1={nodes[a].y}
            x2={nodes[b].x}
            y2={nodes[b].y}
            stroke="var(--border)"
            strokeWidth="1.5"
          />
        ))}
        {nodes.map((n, i) => (
          <g key={i}>
            <rect
              x={n.x - 24}
              y={n.y - 10}
              width={48}
              height={18}
              rx={4}
              fill={i === 1 || i === 5 ? hue : "var(--card)"}
              fillOpacity={i === 1 || i === 5 ? 0.9 : 1}
              stroke={i === 1 || i === 5 ? "transparent" : "var(--border)"}
            />
            <text
              x={n.x}
              y={n.y + 3}
              textAnchor="middle"
              fontSize="9"
              fill={i === 1 || i === 5 ? "var(--background)" : "var(--foreground)"}
              fontFamily="ui-monospace, monospace"
            >
              {n.l}
            </text>
          </g>
        ))}
      </svg>
    );
  }
  if (kind === "layers") {
    const layers = [1, 3, 3, 1];
    return (
      <svg viewBox="0 0 400 130" className="w-full">
        {layers.map((count, layer) => {
          const width = count * 40;
          const start = 200 - width / 2;
          return Array.from({ length: count }).map((_, i) => (
            <g key={`${layer}-${i}`}>
              <rect
                x={start + i * 40 + 2}
                y={layer * 30 + 6}
                width={36}
                height={18}
                rx={4}
                fill={hue}
                fillOpacity={0.15 + layer * 0.18}
              />
            </g>
          ));
        })}
        <text
          x={10}
          y={16}
          fontSize="9"
          fill="var(--muted-foreground)"
          fontFamily="ui-monospace, monospace"
        >
          popcount 0
        </text>
        <text
          x={10}
          y={106}
          fontSize="9"
          fill="var(--muted-foreground)"
          fontFamily="ui-monospace, monospace"
        >
          popcount 3
        </text>
      </svg>
    );
  }
  // graph
  const g = [
    { x: 60, y: 60 },
    { x: 140, y: 30 },
    { x: 140, y: 100 },
    { x: 240, y: 30 },
    { x: 240, y: 100 },
    { x: 340, y: 60 },
  ];
  const edges: [number, number, boolean][] = [
    [0, 1, true],
    [0, 2, true],
    [1, 3, true],
    [2, 4, false],
    [3, 5, false],
    [4, 5, false],
    [1, 2, false],
  ];
  return (
    <svg viewBox="0 0 400 130" className="w-full">
      {edges.map(([a, b, on], i) => (
        <line
          key={i}
          x1={g[a].x}
          y1={g[a].y}
          x2={g[b].x}
          y2={g[b].y}
          stroke={on ? hue : "var(--border)"}
          strokeWidth={on ? 2 : 1}
        />
      ))}
      {g.map((n, i) => (
        <g key={i}>
          <circle
            cx={n.x}
            cy={n.y}
            r={i === 0 || i === 1 || i === 2 ? 10 : 8}
            fill={i === 0 || i === 1 || i === 2 ? hue : "var(--card)"}
            stroke={i === 0 || i === 1 || i === 2 ? "transparent" : "var(--border)"}
            strokeWidth={1.5}
          />
        </g>
      ))}
    </svg>
  );
}

function MistakesCard({
  mistakes,
  className,
}: {
  mistakes: Sheet["mistakes"];
  className?: string;
}) {
  const dangerBg: Record<string, string> = {
    high: "bg-red-500/12 text-red-400 border-red-500/30",
    med: "bg-amber-500/12 text-amber-400 border-amber-500/30",
    low: "bg-blue-500/12 text-blue-400 border-blue-500/30",
  };
  return (
    <Card title="Common mistakes" icon={<AlertTriangle className="size-4" />} className={className}>
      <ul className="space-y-2">
        {mistakes.map((m, i) => (
          <li
            key={i}
            className="group flex items-start gap-2.5 rounded-md p-2 transition hover:bg-surface-muted/50"
          >
            <span
              className={cn(
                "mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border font-mono text-[9px] uppercase",
                dangerBg[m.danger],
              )}
              title={`${m.danger} severity`}
            >
              {m.danger === "high" ? "!!" : m.danger === "med" ? "!" : "·"}
            </span>
            <span className="text-xs leading-relaxed text-foreground/90">{m.text}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function TemplatesCard({ templates, hue }: { templates: Sheet["templates"]; hue: string }) {
  const [idx, setIdx] = useState(0);
  const t = templates[idx];
  return (
    <Card
      title="Templates"
      icon={<Zap className="size-4" />}
      hue={hue}
      action={
        <div className="flex items-center gap-1">
          {templates.map((tt, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={cn(
                "rounded-md px-2 py-1 text-2xs font-medium transition",
                i === idx
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tt.label}
            </button>
          ))}
        </div>
      }
    >
      <div className="overflow-hidden rounded-md border border-border/70 bg-background">
        <div className="flex items-center justify-between border-b border-border/70 bg-surface-muted/40 px-3 py-1.5">
          <span className="font-mono text-2xs uppercase tracking-wider text-muted-foreground">
            {t.lang}
          </span>
          <button
            className="flex items-center gap-1 text-2xs text-muted-foreground hover:text-foreground"
            onClick={() => navigator.clipboard?.writeText(t.code)}
          >
            <Copy className="size-3" /> Copy
          </button>
        </div>
        <pre className="overflow-x-auto p-4 text-xs leading-relaxed">
          <code className="font-mono text-foreground/90">{t.code}</code>
        </pre>
      </div>
    </Card>
  );
}

function LadderCard({
  ladder,
  hue,
  className,
}: {
  ladder: Sheet["ladder"];
  hue: string;
  className?: string;
}) {
  const min = ladder[0].rating;
  const max = ladder[ladder.length - 1].rating;
  return (
    <Card
      title="Difficulty ladder"
      icon={<Layers className="size-4" />}
      hue={hue}
      className={className}
    >
      <div className="relative pl-14">
        <div className="absolute bottom-2 left-8 top-2 w-px bg-border" />
        <ul className="space-y-3">
          {ladder.map((step) => {
            const pos = ((step.rating - min) / (max - min || 1)) * 100;
            return (
              <li key={step.label} className="relative flex items-center gap-3">
                <span className="absolute -left-14 w-11 text-right font-mono text-2xs text-muted-foreground">
                  {step.rating}
                </span>
                <span
                  className={cn(
                    "absolute -left-[7px] size-3.5 rounded-full border-2",
                    step.done ? "border-transparent" : "border-border bg-background",
                  )}
                  style={step.done ? { background: hue } : undefined}
                >
                  {step.done ? (
                    <Check className="mx-auto mt-[1px] size-2.5 text-background" />
                  ) : null}
                </span>
                <div
                  className={cn(
                    "flex-1 rounded-md border p-2.5 transition",
                    step.done
                      ? "border-border/70 bg-surface-muted/30 text-muted-foreground line-through decoration-muted-foreground/40"
                      : "border-border/70 bg-card hover:border-border",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm">{step.label}</span>
                    <span
                      className="h-1 w-16 rounded-full"
                      style={{
                        background: `linear-gradient(90deg, ${hue} ${pos}%, var(--border) ${pos}%)`,
                      }}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </Card>
  );
}

function RelatedCard({ items, className }: { items: Sheet["related"]; className?: string }) {
  return (
    <Card title="Related problems" icon={<GitBranch className="size-4" />} className={className}>
      <ul className="space-y-1.5">
        {items.map((p) => (
          <li key={p.title}>
            <button className="group flex w-full items-center gap-2 rounded-md p-2 text-left transition hover:bg-surface-muted/50">
              <span className="font-mono text-2xs text-muted-foreground">{p.rating}</span>
              <span className="flex-1 truncate text-sm">{p.title}</span>
              <Badge
                variant="secondary"
                className="h-4 border-0 bg-surface-muted px-1.5 font-mono text-2xs text-muted-foreground"
              >
                {p.tag}
              </Badge>
              <ArrowRight className="size-3 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function RoadmapCard({ roadmap, hue }: { roadmap: Sheet["roadmap"]; hue: string }) {
  const totalMin = roadmap.reduce((s, r) => s + r.minutes, 0);
  return (
    <Card
      title="Practice roadmap"
      icon={<Sparkles className="size-4" />}
      hue={hue}
      action={
        <span className="font-mono text-2xs text-muted-foreground">
          7 days · {Math.round(totalMin / 60)}h {totalMin % 60}m
        </span>
      }
    >
      <div className="grid gap-3 md:grid-cols-7">
        {roadmap.map((r) => (
          <div
            key={r.day}
            className="flex flex-col rounded-lg border border-border/70 bg-surface-muted/30 p-3 transition hover:border-border"
          >
            <div className="flex items-center justify-between">
              <span
                className="grid size-6 place-items-center rounded-md text-2xs font-semibold"
                style={{
                  background: `color-mix(in oklab, ${hue} 20%, transparent)`,
                  color: hue,
                }}
              >
                {r.day}
              </span>
              <span className="font-mono text-2xs text-muted-foreground">{r.minutes}m</span>
            </div>
            <p className="mt-2 text-xs leading-snug text-foreground/90">{r.task}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function RevisionCard({ items }: { items: string[] }) {
  return (
    <Card title="Revision checklist" icon={<Check className="size-4" />}>
      <ul className="grid gap-2 md:grid-cols-2">
        {items.map((t, i) => (
          <li
            key={i}
            className="flex items-start gap-2.5 rounded-md border border-border/70 p-2.5 transition hover:bg-surface-muted/50"
          >
            <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded border border-border bg-background">
              <Check className="size-2.5 text-transparent" />
            </span>
            <span className="text-xs text-foreground/90">{t}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-center justify-between rounded-md border border-dashed border-border p-3">
        <p className="text-2xs text-muted-foreground">
          Run this checklist in <b className="text-foreground">Revision mode</b> before a contest.
        </p>
        <Button size="sm" variant="secondary" className="h-7 gap-1.5">
          <Repeat className="size-3" /> Schedule
        </Button>
      </div>
    </Card>
  );
}

// ---------------- Saved custom sheets box ----------------

function SavedSheetsBox() {
  const activeQ = useActiveSheets();
  const trashQ = useTrashedSheets();
  const archive = useArchiveSheet();
  const restore = useRestoreSheet();
  const purge = useDeleteSheet();
  const favorite = useSetFavorite();

  const sheets = activeQ.data;
  const trash = trashQ.data;
  const loading = activeQ.isLoading;

  const [confirmTarget, setConfirmTarget] = useState<{ id: string; name: string } | null>(null);
  const [trashOpen, setTrashOpen] = useState(false);

  const confirmDelete = () => {
    if (!confirmTarget) return;
    archive.mutate({ id: confirmTarget.id });
    toast.success("Sheet moved to trash");
    setConfirmTarget(null);
  };

  const doRestore = (id: string) => {
    restore.mutate({ id });
    toast.success("Sheet restored");
  };

  const doPurge = (id: string) => {
    purge.mutate({ id });
  };

  const emptyTrash = () => {
    trash.forEach((t) => purge.mutate({ id: t.id }));
    toast.success("Trash emptied");
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-background/60 p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-2xs font-medium uppercase tracking-widest text-muted-foreground">
            Your saved sheets
          </div>
          <h2 className="font-display text-lg font-semibold">
            My Cheat Library {sheets.length ? <span className="text-muted-foreground">({sheets.length})</span> : null}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5"
            onClick={() => setTrashOpen(true)}
          >
            <Trash2 className="size-3.5" /> Trash
            {trash.length ? (
              <span className="ml-0.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] tabular-nums text-muted-foreground">
                {trash.length}
              </span>
            ) : null}
          </Button>
          <Button asChild size="sm" variant="outline" className="h-8 gap-1.5">
            <a href="/problems">
              <Sparkles className="size-3.5" /> Create new sheet
            </a>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-surface/30 p-5 text-center text-xs text-muted-foreground">
          Loading your sheets…
        </div>
      ) : sheets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-surface/30 p-5 text-center">
          <BookOpen className="mx-auto mb-2 size-5 text-muted-foreground" />
          <p className="text-sm font-medium">No saved sheets yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Head to Codeforces Intelligence, filter problems by rating / tag / contest,
            and click <span className="font-medium text-foreground">Create sheet</span> to save one here.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sheets.map((s) => (
            <Link
              key={s.id}
              to="/sheets/$sheetId"
              params={{ sheetId: s.id }}
              className="group relative flex flex-col rounded-xl border border-border/60 bg-surface/40 p-3 transition hover:border-primary/50 hover:bg-surface/60"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold" title={s.name}>
                    {s.name}
                  </div>
                  <div className="mt-0.5 text-2xs text-muted-foreground">
                    {new Date(s.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      favorite.mutate({ id: s.id, isFavorite: !s.isFavorite });
                    }}
                    aria-label={s.isFavorite ? "Unfavorite" : "Favorite"}
                    title={s.isFavorite ? "Unfavorite" : "Favorite"}
                    className={`rounded p-1 transition ${
                      s.isFavorite
                        ? "text-amber-500 hover:bg-amber-500/10"
                        : "text-muted-foreground/60 opacity-0 hover:bg-muted/60 hover:text-foreground group-hover:opacity-100"
                    }`}
                  >
                    <Sparkles className="size-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setConfirmTarget({ id: s.id, name: s.name });
                    }}
                    aria-label="Delete sheet"
                    className="rounded p-1 text-muted-foreground/60 opacity-0 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5 text-2xs">
                <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 font-medium text-primary">
                  {s.minRating}–{s.maxRating}
                </span>
                <span className="rounded-full border border-border/60 px-2 py-0.5 text-muted-foreground">
                  {s.problemCount} problems
                </span>
                {s.contest ? (
                  <span className="rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-muted-foreground">
                    Contest: {s.contest}
                  </span>
                ) : null}
              </div>

              {s.tags.length ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  {s.tags.slice(0, 4).map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-muted/50 px-1.5 py-0.5 text-[10px] text-muted-foreground"
                    >
                      {t}
                    </span>
                  ))}
                  {s.tags.length > 4 ? (
                    <span className="text-[10px] text-muted-foreground">
                      +{s.tags.length - 4}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </Link>
          ))}
        </div>
      )}

      {/* Confirm delete dialog */}
      <Dialog open={!!confirmTarget} onOpenChange={(o) => !o && setConfirmTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete this sheet?</DialogTitle>
            <DialogDescription>
              <span className="font-medium text-foreground">{confirmTarget?.name}</span> will be
              moved to your Trash. You can restore it any time.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setConfirmTarget(null)} className="gap-1.5">
              <span className="text-base leading-none">😊</span> No, keep it
            </Button>
            <Button variant="destructive" onClick={confirmDelete} className="gap-1.5">
              <span className="text-base leading-none">😢</span> Yes, delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Trash side panel */}
      {trashOpen ? (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm"
          onClick={() => setTrashOpen(false)}
        >
          <aside
            className="flex h-full w-full max-w-sm flex-col border-l border-border bg-background shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
              <div className="flex items-center gap-2">
                <Trash2 className="size-4 text-muted-foreground" />
                <div>
                  <div className="text-sm font-semibold">Trash</div>
                  <div className="text-2xs text-muted-foreground">
                    {trash.length} deleted sheet{trash.length === 1 ? "" : "s"}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setTrashOpen(false)}
                aria-label="Close trash"
                className="rounded p-1 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              {trash.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/60 bg-surface/30 p-6 text-center text-xs text-muted-foreground">
                  Trash is empty.
                </div>
              ) : (
                <ul className="space-y-2">
                  {trash.map((t) => (
                    <li
                      key={t.id}
                      className="rounded-lg border border-border/60 bg-surface/40 p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium" title={t.name}>
                            {t.name}
                          </div>
                          <div className="mt-0.5 text-2xs text-muted-foreground">
                            Deleted{" "}
                            {t.archivedAt
                              ? new Date(t.archivedAt).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                })
                              : "—"}{" "}
                            · {t.problemCount} problems
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1.5 text-xs"
                          onClick={() => doRestore(t.id)}
                        >
                          <RotateCcw className="size-3" /> Restore
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-destructive"
                          onClick={() => doPurge(t.id)}
                        >
                          <Trash2 className="size-3" /> Delete forever
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {trash.length > 0 ? (
              <div className="border-t border-border/70 p-3">
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full gap-1.5 text-xs text-muted-foreground hover:text-destructive"
                  onClick={emptyTrash}
                >
                  <Trash2 className="size-3.5" /> Empty trash
                </Button>
              </div>
            ) : null}
          </aside>
        </div>
      ) : null}
    </div>
  );
}


