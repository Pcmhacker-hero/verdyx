import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const imageSchema = z.object({
  // data URL, e.g. "data:image/png;base64,...."
  dataUrl: z.string().startsWith("data:").max(6_000_000),
});

const fileSchema = z.object({
  filename: z.string().min(1).max(200),
  // data URL, e.g. "data:application/pdf;base64,...."
  dataUrl: z.string().startsWith("data:").max(12_000_000),
});

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().max(4000),
  images: z.array(imageSchema).max(4).optional(),
  files: z.array(fileSchema).max(2).optional(),
});

const inputSchema = z.object({
  messages: z.array(messageSchema).min(1).max(30),
});

const SYSTEM = `You are Verdiqy, an expert mentor for Data Structures & Algorithms (DSA)
and competitive programming (Codeforces, AtCoder, CodeChef, LeetCode, ICPC, IOI).

You can and should answer questions on:
- DSA topics: arrays, strings, hashing, two pointers, sliding window, stacks, queues,
  linked lists, trees, tries, heaps, DSU, segment trees / BIT, sparse tables,
  graph algorithms (BFS, DFS, Dijkstra, Bellman-Ford, Floyd, MST, SCC, topo sort,
  bridges/articulation), DP (knapsack, LIS, digit DP, bitmask DP, tree DP, DP on
  DAG, SOS), greedy, divide & conquer, binary search / ternary search, number
  theory (mod arithmetic, sieve, gcd, CRT, Fermat), combinatorics, geometry,
  strings (KMP, Z, hashing, suffix array/automaton), game theory, flows.
- Competitive programming: rating/roadmap advice, problem-picking, debugging a WA/TLE/MLE,
  reading a Codeforces problem, editorial-style explanations, complexity analysis,
  C++/Python idioms, contest strategy, upsolving plans.
- Code review: if the student pastes code or a screenshot, read it carefully and give
  concrete fixes (line-level when possible) with the correct approach and complexity.
- Images: screenshots of problems, submissions, standings, or plots — extract details
  from the image and reference them explicitly.
- PDFs: problem statements, editorials, lecture notes — read the attached document
  and cite the relevant part when answering.

Style: direct, specific, practical. Short paragraphs, simple markdown, small code
blocks when helpful. Mention concrete Codeforces problems by contest+index (e.g. 1547E)
when useful. Keep replies under ~220 words unless the student asks for depth.

If a question is clearly outside DSA / competitive programming (e.g. dating advice,
politics, unrelated general chit-chat), politely say you're focused on DSA and CP
and offer to help with a related topic instead.`;

type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } }
  | { type: "file"; file: { filename: string; file_data: string } };

export const askMentor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    const { callLovableAI } = await import("./ai-gateway.server");

    const last = data.messages[data.messages.length - 1];
    const hasImages = last?.role === "user" && last.images && last.images.length > 0;
    const hasFiles = last?.role === "user" && last.files && last.files.length > 0;
    const hasAttachments = hasImages || hasFiles;

    // Fold prior turns into a transcript for context. Send the latest user turn
    // as structured multimodal content so images/files reach the model.
    const priorTranscript = data.messages
      .slice(0, hasAttachments ? -1 : data.messages.length)
      .map((m) => `${m.role === "user" ? "Student" : "Verdiqy"}: ${m.content}`)
      .join("\n\n");

    let user: string | ContentPart[];
    if (hasAttachments && last) {
      const parts: ContentPart[] = [];
      const attachmentNote = [
        hasImages ? `${last.images!.length} image${last.images!.length > 1 ? "s" : ""}` : null,
        hasFiles ? `${last.files!.length} file${last.files!.length > 1 ? "s" : ""}` : null,
      ]
        .filter(Boolean)
        .join(" + ");
      const preface = priorTranscript
        ? `${priorTranscript}\n\nStudent (latest, with ${attachmentNote}): ${last.content || "(see attachment)"}`
        : last.content || `Please review the attached ${attachmentNote}.`;
      parts.push({ type: "text", text: preface });
      if (hasImages) {
        for (const img of last.images!) {
          parts.push({ type: "image_url", image_url: { url: img.dataUrl } });
        }
      }
      if (hasFiles) {
        for (const f of last.files!) {
          parts.push({
            type: "file",
            file: { filename: f.filename, file_data: f.dataUrl },
          });
        }
      }
      user = parts;
    } else {
      user = priorTranscript;
    }

    const reply = await callLovableAI({
      system: SYSTEM,
      user,
      temperature: 0.5,
    });

    return { reply };
  });
