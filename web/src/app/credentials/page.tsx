export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/session";
import { listCredentials } from "@/lib/credentials/actions";
import { Kicker } from "@/components/brand/kicker";
import { HatchDivider } from "@/components/brand/hatch-divider";
import { CredentialManager } from "@/components/credentials/credential-manager";

export default async function CredentialsPage() {
  await requireUser();
  const credentials = await listCredentials();

  return (
    <main className="mx-auto w-full max-w-3xl px-8 py-16">
      <Kicker>Credentials</Kicker>
      <h1 className="mt-2 text-2xl font-medium tracking-tight">
        Stored secrets
      </h1>
      <p className="mt-2 text-sm text-fg-muted">
        Reference these in any node as{" "}
        <code className="font-mono text-xs">{`{{credentials.slug}}`}</code>. Values
        are encrypted at rest and never shown again.
      </p>

      <HatchDivider className="my-8" />

      <CredentialManager initial={credentials} />
    </main>
  );
}
