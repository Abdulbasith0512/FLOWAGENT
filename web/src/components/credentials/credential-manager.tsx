"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import {
  createCredential,
  deleteCredential,
} from "@/lib/credentials/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Frame } from "@/components/brand/frame";

interface Credential {
  id: string;
  name: string;
  slug: string;
  type: string;
  lastUsedAt: Date | null;
}

export function CredentialManager({ initial }: { initial: Credential[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState("api_key");
  const [value, setValue] = useState("");
  const [pending, startTransition] = useTransition();

  function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !value) return;
    startTransition(async () => {
      await createCredential({ name, type, value });
      setName("");
      setValue("");
      router.refresh();
    });
  }

  function onDelete(id: string) {
    startTransition(async () => {
      await deleteCredential(id);
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <Frame className="rounded-md p-5">
        <form onSubmit={onCreate} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder="Name (e.g. Tavily key)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="h-9 rounded-md border border-border bg-bg px-3 text-sm"
            >
              <option value="api_key">API key</option>
              <option value="bearer">Bearer token</option>
              <option value="basic">Basic auth</option>
            </select>
          </div>
          <Input
            type="password"
            placeholder="Secret value"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <Button type="submit" size="sm" disabled={pending}>
            Add credential
          </Button>
        </form>
      </Frame>

      <div className="space-y-2">
        {initial.length === 0 ? (
          <p className="text-sm text-fg-muted">No credentials yet.</p>
        ) : (
          initial.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between rounded-md border border-border bg-surface px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium">{c.name}</p>
                <p className="font-mono text-xs text-fg-muted">
                  {`{{credentials.${c.slug}}}`}
                </p>
              </div>
              <button
                onClick={() => onDelete(c.id)}
                className="text-fg-muted transition-colors hover:text-err"
                aria-label="Delete"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
