/**
 * Generic application error reporter.
 * Can be connected to Sentry, LogRocket, or any telemetry service.
 */

type ErrorContext = Record<string, unknown>;

export function reportLovableError(error: unknown, context: ErrorContext = {}) {
  if (typeof window === "undefined") return;

  // Log in development / client console
  if (import.meta.env.DEV) {
    console.error("[Application Error]", error, context);
  }

  // If a global monitoring hook is configured (e.g. Sentry/custom telemetry), invoke it
  const win = window as unknown as {
    __lovableEvents?: {
      captureException?: (
        err: unknown,
        ctx?: Record<string, unknown>,
        opts?: Record<string, unknown>,
      ) => void;
    };
    Sentry?: {
      captureException?: (err: unknown, ctx?: Record<string, unknown>) => void;
    };
  };

  win.__lovableEvents?.captureException?.(
    error,
    {
      source: "react_error_boundary",
      route: window.location.pathname,
      ...context,
    },
    {
      mechanism: "react_error_boundary",
      handled: false,
      severity: "error",
    },
  );

  win.Sentry?.captureException?.(error, { extra: context });
}

export const reportError = reportLovableError;
