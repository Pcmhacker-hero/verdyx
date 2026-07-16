import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const bugReportSchema = z.object({
  title: z.string().trim().min(3, "Add a short title.").max(120),
  description: z.string().trim().min(10, "Tell us what happened.").max(2000),
  pageUrl: z.string().trim().max(600).optional(),
  severity: z.enum(["low", "normal", "high"]).default("normal"),
  browser: z
    .object({
      userAgent: z.string().max(500).optional(),
      viewport: z.string().max(40).optional(),
    })
    .optional(),
});

export const submitBugReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => bugReportSchema.parse(data))
  .handler(async ({ data, context }) => {
    const db = context.supabase as unknown as {
      from: (table: string) => {
        insert: (value: Record<string, unknown>) => {
          select: (cols: string) => {
            single: () => Promise<{ data: { id: string } | null; error: { message: string } | null }>;
          };
        };
      };
    };

    const { data: row, error } = await db
      .from("bug_reports")
      .insert({
        user_id: context.userId,
        title: data.title,
        description: data.description,
        page_url: data.pageUrl ?? null,
        severity: data.severity,
        browser: data.browser ?? {},
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);

    // Send email notification via Resend with automatic retry
    let emailStatus: { sent: boolean; error?: string } = { sent: false };
    const resendKey = process.env.RESEND_API_KEY;

    if (!resendKey) {
      console.warn("RESEND_API_KEY not configured; skipping bug report email");
      emailStatus = { sent: false, error: "Email service is not configured." };
    } else {
      const sevColor =
        data.severity === "high" ? "#dc2626" : data.severity === "low" ? "#6b7280" : "#f59e0b";
      const esc = (s: string) =>
        s.replace(/[&<>"']/g, (c) =>
          ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
        );
      const html = `
          <div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:640px;margin:0 auto;padding:24px;color:#111">
            <h2 style="margin:0 0 8px">🐞 New Bug Report</h2>
            <p style="margin:0 0 16px;color:#555">
              <span style="display:inline-block;padding:2px 10px;border-radius:999px;background:${sevColor};color:#fff;font-size:12px;font-weight:600;text-transform:uppercase">${data.severity}</span>
            </p>
            <h3 style="margin:16px 0 4px">${esc(data.title)}</h3>
            <pre style="white-space:pre-wrap;background:#f6f7f9;padding:12px;border-radius:8px;font-family:inherit;font-size:14px;margin:0 0 16px">${esc(data.description)}</pre>
            <table style="font-size:13px;color:#333;border-collapse:collapse">
              <tr><td style="padding:4px 12px 4px 0;color:#666">Reporter</td><td>${esc(context.claims?.email ?? context.userId)}</td></tr>
              <tr><td style="padding:4px 12px 4px 0;color:#666">Page</td><td>${esc(data.pageUrl ?? "—")}</td></tr>
              <tr><td style="padding:4px 12px 4px 0;color:#666">Viewport</td><td>${esc(data.browser?.viewport ?? "—")}</td></tr>
              <tr><td style="padding:4px 12px 4px 0;color:#666">User Agent</td><td>${esc(data.browser?.userAgent ?? "—")}</td></tr>
              <tr><td style="padding:4px 12px 4px 0;color:#666">Report ID</td><td>${esc(row?.id ?? "")}</td></tr>
            </table>
          </div>`;

      const payload = JSON.stringify({
        from: "Bug Reports <onboarding@resend.dev>",
        to: ["pcmhacker511@gmail.com"],
        subject: `[Bug · ${data.severity}] ${data.title}`,
        html,
        reply_to: context.claims?.email ? [context.claims.email as string] : undefined,
      });

      const MAX_ATTEMPTS = 3;
      let lastError = "";

      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${resendKey}`,
            },
            body: payload,
          });

          if (res.ok) {
            emailStatus = { sent: true };
            lastError = "";
            break;
          }

          const body = await res.text();
          lastError = `Resend ${res.status}: ${body.slice(0, 300)}`;
          console.error(`Resend send failed (attempt ${attempt}/${MAX_ATTEMPTS})`, lastError);

          // Don't retry client errors except 429 (rate limit)
          if (res.status >= 400 && res.status < 500 && res.status !== 429) break;
        } catch (e) {
          lastError = e instanceof Error ? e.message : String(e);
          console.error(`Resend network error (attempt ${attempt}/${MAX_ATTEMPTS})`, lastError);
        }

        if (attempt < MAX_ATTEMPTS) {
          // Exponential backoff: 500ms, 1500ms
          await new Promise((r) => setTimeout(r, 500 * Math.pow(3, attempt - 1)));
        }
      }

      if (!emailStatus.sent) {
        emailStatus = {
          sent: false,
          error: `We couldn't email the bug report after ${MAX_ATTEMPTS} attempts. It has been saved (ID: ${row?.id ?? "n/a"}). ${lastError ? `Details: ${lastError}` : ""}`.trim(),
        };
      }
    }

    return {
      ok: true as const,
      id: row?.id ?? null,
      emailSent: emailStatus.sent,
      emailError: emailStatus.error ?? null,
    };
  });