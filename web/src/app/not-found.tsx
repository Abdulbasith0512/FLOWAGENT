import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg px-8 text-center">
      <h1 className="text-2xl font-medium text-fg">Not found</h1>
      <p className="max-w-md text-sm text-fg-muted">
        This page or workflow does not exist, or you do not have access to it.
      </p>
      <Link href="/app">
        <Button>Back to workflows</Button>
      </Link>
    </main>
  );
}
