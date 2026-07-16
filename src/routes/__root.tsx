import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useSheetAutoMigration } from "@/hooks/use-sheets";

function NotFoundComponent() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground">
          Error 404
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
          Page not found
        </h1>
        <p className="mt-2 text-sm text-muted-foreground text-pretty">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="font-mono text-2xs uppercase tracking-[0.14em] text-muted-foreground">
          Unexpected error
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground text-pretty">
          Something went wrong on our end. Try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-surface px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Verdiqx — The AI operating system for competitive programmers" },
      {
        name: "description",
        content:
          "Generate practice sheets from any Codeforces legend, get one-click AI explanations, and train with a mentor that knows your history. Verdiqx is the AI OS for CP.",
      },
      { name: "author", content: "Verdiqx Labs" },
      { name: "theme-color", content: "#3884FF" },
      { property: "og:title", content: "Verdiqx — The AI operating system for competitive programmers" },
      {
        property: "og:description",
        content: "Generate practice sheets from any Codeforces legend, get one-click AI explanations, and train with a mentor that knows your history. Verdiqx is the AI OS for CP.",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Verdiqx" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Verdiqx — The AI operating system for competitive programmers" },
      { name: "twitter:description", content: "Generate practice sheets from any Codeforces legend, get one-click AI explanations, and train with a mentor that knows your history. Verdiqx is the AI OS for CP." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/txESMfZbdXPGMVTJOjmvAS6Zyng1/social-images/social-1784165377071-CleanShot_2026-07-16_at_06.54.24_2x.webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/txESMfZbdXPGMVTJOjmvAS6Zyng1/social-images/social-1784165377071-CleanShot_2026-07-16_at_06.54.24_2x.webp" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", sizes: "any" },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon", sizes: "16x16" },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon", sizes: "32x32" },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon", sizes: "48x48" },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon", sizes: "192x192" },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon", sizes: "512x512" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png", sizes: "180x180" },
      { rel: "mask-icon", href: "/mask-icon.svg", color: "#3884FF" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Manrope:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});


function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('verdiqx-theme-v2');if(t==='dark'){document.documentElement.classList.add('dark');document.documentElement.style.colorScheme='dark';}else{document.documentElement.classList.remove('dark');document.documentElement.style.colorScheme='light';}}catch(e){}})();`,
          }}
        />
        <HeadContent />
      </head>

      <body className="bg-background text-foreground">
        {children}
        <Scripts />
      </body>
    </html>
  );
}


function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => sub.subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={150} skipDelayDuration={300}>
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <SheetMigrationRunner />
        <Outlet />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function SheetMigrationRunner() {
  // Auto-migrates legacy localStorage sheets to the database on sign-in.
  useSheetAutoMigration();
  return null;
}
