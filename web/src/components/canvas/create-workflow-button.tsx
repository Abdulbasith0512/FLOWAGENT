"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { createWorkflow } from "@/lib/workflow/actions";
import { Button } from "@/components/ui/button";

export function CreateWorkflowButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState(false);

  function onClick() {
    setError(false);
    startTransition(async () => {
      try {
        const id = await createWorkflow("Untitled workflow");
        router.push(`/app/${id}`);
      } catch {
        setError(true);
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-xs text-err">Could not create. Try again.</span>}
      <Button size="sm" onClick={onClick} disabled={pending}>
        <Plus size={14} />
        New workflow
      </Button>
    </div>
  );
}
