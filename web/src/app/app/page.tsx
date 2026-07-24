export const dynamic = "force-dynamic";

import Link from "next/link";
import { FlaskConical } from "lucide-react";
import { listWorkflows } from "@/lib/workflow/actions";
import { requireUser } from "@/lib/session";
import { Kicker } from "@/components/brand/kicker";
import { Frame } from "@/components/brand/frame";
import { HatchDivider } from "@/components/brand/hatch-divider";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { CreateWorkflowButton } from "@/components/canvas/create-workflow-button";
import { GenerateBar } from "@/components/canvas/generate-bar";

export default async function AppPage() {
  const user = await requireUser();
  const workflows = await listWorkflows();

  return (
    <main className="mx-auto w-full max-w-4xl px-8 py-16">
      <header className="flex items-center justify-between">
        <Kicker>Workflows</Kicker>
        <div className="flex items-center gap-2">
          <Link
            href="/playground"
            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
          >
            <FlaskConical size={14} />
            Playground
          </Link>
          <div className="mx-1 h-5 w-px bg-border" />
          <span className="text-sm text-fg-muted">{user.email}</span>
          <ThemeToggle />
          <SignOutButton />
        </div>
      </header>

      <HatchDivider className="my-10" />

      <GenerateBar />

      <div className="mb-6 mt-10 flex items-center justify-between">
        <h1 className="text-2xl font-medium">Your workflows</h1>
        <CreateWorkflowButton />
      </div>

      {workflows.length === 0 ? (
        <p className="text-fg-muted">No workflows yet. Create one to start.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {workflows.map((wf) => (
            <Link key={wf.id} href={`/app/${wf.id}`} className="group">
              <Frame className="rounded-md p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.4)]">
                <div className="flex items-center justify-between">
                  <h2 className="font-medium">{wf.name}</h2>
                  <span className="text-xs text-accent opacity-0 transition-opacity group-hover:opacity-100">
                    Open →
                  </span>
                </div>
                <p className="mt-1 text-xs text-fg-muted">
                  Updated {new Date(wf.updatedAt!).toLocaleDateString()}
                </p>
              </Frame>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
