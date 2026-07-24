"use client";

import { Button } from "@/components/ui/button";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg px-8 text-center">
      <h1 className="text-2xl font-medium text-fg">Something went wrong</h1>
      <p className="max-w-md text-sm text-fg-muted">
        An unexpected error occurred. You can try again, or head back to your workflows.
      </p>
      <div className="flex gap-2">
        <Button onClick={reset}>Try again</Button>
        <Button variant="secondary" onClick={() => (window.location.href = "/app")}>
          Back to workflows
        </Button>
      </div>
    </main>
  );
}
