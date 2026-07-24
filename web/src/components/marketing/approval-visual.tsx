import {
  UserCheckIcon as UserCheck,
  EnvelopeIcon as Envelope,
  CheckIcon as Check,
  XIcon as X,
} from "@phosphor-icons/react/dist/ssr";

export function ApprovalVisual() {
  return (
    <div className="relative">
      <div className="rounded-xl border border-border bg-bg p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent-tint text-accent">
              <UserCheck size={17} weight="duotone" />
            </span>
            <div>
              <p className="text-sm font-medium">Human approve</p>
              <p className="text-xs text-fg-muted">waiting for sign-off</p>
            </div>
          </div>
          <span className="flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent-tint px-2.5 py-1 text-[11px] font-medium text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-accent [animation:live-pulse_1.8s_ease-out_infinite]" />
            paused
          </span>
        </div>
      </div>

      <div className="mx-auto my-3 h-6 w-px bg-border" />

      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <Envelope size={15} weight="duotone" className="text-fg-muted" />
          <span className="text-xs text-fg-muted">to you@team.com</span>
        </div>
        <p className="mt-3 text-sm font-medium">Approve this run?</p>
        <p className="mt-1 text-xs text-fg-muted">
          Send the summary to the customer.
        </p>
        <div className="mt-4 flex gap-2">
          <span className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-fg">
            <Check size={12} weight="bold" /> Approve
          </span>
          <span className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-fg-muted">
            <X size={12} weight="bold" /> Deny
          </span>
        </div>
      </div>
    </div>
  );
}
