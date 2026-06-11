"use client";

import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <AlertCircle className="h-12 w-12 text-destructive" />
      <h1 className="mt-4 text-2xl font-bold">Something went wrong</h1>
      <p className="mt-2 text-muted-foreground">
        An unexpected error occurred. Our team has been notified.
      </p>
      <Button className="mt-6" onClick={reset}>
        Try again
      </Button>
      {process.env.NODE_ENV === "development" && (
        <details className="mt-4 text-left text-sm text-muted-foreground">
          <summary className="cursor-pointer">Error details</summary>
          <pre className="mt-2 whitespace-pre-wrap rounded bg-muted p-4 text-xs">
            {error.message}
            {error.stack && `\n\n${error.stack}`}
          </pre>
        </details>
      )}
    </main>
  );
}
