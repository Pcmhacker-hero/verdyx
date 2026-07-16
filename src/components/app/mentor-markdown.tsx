import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

// Remembers which assistant message ids have already finished their typewriter
// reveal so re-mounts (scroll, history load) don't replay the animation.
const ANIMATED = new Set<string>();

function CodeBlock({ language, value }: { language: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  };
  return (
    <div className="group relative my-3 overflow-hidden rounded-lg border border-border bg-[#282c34]">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-1.5">
        <span className="font-mono text-2xs uppercase tracking-wider text-white/60">
          {language || "code"}
        </span>
        <button
          onClick={copy}
          className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-2xs text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Copy code"
        >
          {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <SyntaxHighlighter
        language={language || "text"}
        style={oneDark}
        customStyle={{
          margin: 0,
          padding: "0.85rem 1rem",
          background: "transparent",
          fontSize: "0.8125rem",
          lineHeight: 1.55,
        }}
        codeTagProps={{ style: { fontFamily: "var(--font-mono, ui-monospace, monospace)" } }}
      >
        {value.replace(/\n$/, "")}
      </SyntaxHighlighter>
    </div>
  );
}

export function MentorMarkdown({ content }: { content: string }) {
  return (
    <div className="text-[15px] leading-relaxed text-foreground [&_p]:my-2 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-0.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_strong]:font-semibold [&_h1]:mt-4 [&_h1]:mb-2 [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:text-base [&_h2]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1.5 [&_h3]:text-sm [&_h3]:font-semibold [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ inline, className, children, ...props }: {
            inline?: boolean;
            className?: string;
            children?: React.ReactNode;
          }) {
            const match = /language-(\w+)/.exec(className || "");
            const value = String(children ?? "");
            if (!inline && (match || value.includes("\n"))) {
              return <CodeBlock language={match?.[1] ?? ""} value={value} />;
            }
            return (
              <code
                className="rounded bg-surface-muted px-1 py-0.5 font-mono text-[0.85em] text-foreground"
                {...props}
              >
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export function TypewriterMarkdown({
  id,
  content,
  charsPerTick = 3,
  tickMs = 14,
}: {
  id: string;
  content: string;
  charsPerTick?: number;
  tickMs?: number;
}) {
  const alreadyDone = ANIMATED.has(id);
  const [shown, setShown] = useState(alreadyDone ? content.length : 0);
  const idRef = useRef(id);

  useEffect(() => {
    // If the id or content changed to something already fully animated, snap.
    if (ANIMATED.has(id)) {
      setShown(content.length);
      return;
    }
    idRef.current = id;
    setShown(0);
    let i = 0;
    const timer = window.setInterval(() => {
      i = Math.min(content.length, i + charsPerTick);
      setShown(i);
      if (i >= content.length) {
        window.clearInterval(timer);
        ANIMATED.add(id);
      }
    }, tickMs);
    return () => window.clearInterval(timer);
  }, [id, content, charsPerTick, tickMs]);

  const done = shown >= content.length;
  const visible = done ? content : content.slice(0, shown);

  return (
    <div className="relative">
      <MentorMarkdown content={visible} />
      {!done && (
        <span
          aria-hidden
          className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-pulse bg-primary align-middle"
        />
      )}
    </div>
  );
}
