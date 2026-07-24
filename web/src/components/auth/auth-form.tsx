"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  EyeIcon as Eye,
  EyeSlashIcon as EyeSlash,
  CircleNotchIcon as CircleNotch,
} from "@phosphor-icons/react";
import { signIn, signUp } from "@/lib/auth-client";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const isSignup = mode === "signup";
  const destination = params.get("from") ?? "/app";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const result = isSignup
      ? await signUp.email({ email, password, name })
      : await signIn.email({ email, password });

    setPending(false);
    if (result.error) {
      setError(result.error.message ?? "Something went wrong");
      return;
    }
    router.push(destination);
    router.refresh();
  }

  return (
    <div className="relative flex flex-1 items-center justify-center px-6 py-12">
      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm">
        <Link href="/" className="mb-10 inline-flex items-center gap-2 lg:hidden">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-accent-fg">
            <span className="h-2.5 w-2.5 rounded-[3px] bg-accent-fg" />
          </span>
          <span className="text-base font-bold tracking-tight">flowagent</span>
        </Link>

        <h1 className="serif-display text-4xl">
          {isSignup ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-3 text-sm text-fg-muted">
          {isSignup
            ? "Start building workflows in a minute."
            : "Sign in to your workspace."}
        </p>

        <form onSubmit={onSubmit} className="mt-9 space-y-4">
          {isSignup && (
            <Field label="Name">
              <Input
                placeholder="Ada Lovelace"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
                className="h-11"
              />
            </Field>
          )}

          <Field label="Email">
            <Input
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              className="h-11"
            />
          </Field>

          <Field
            label="Password"
            action={
              !isSignup ? (
                <Link
                  href="/login"
                  className="text-xs text-fg-muted transition-colors hover:text-fg"
                >
                  Forgot?
                </Link>
              ) : undefined
            }
          >
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder={isSignup ? "At least 8 characters" : "Your password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isSignup ? "new-password" : "current-password"}
                minLength={8}
                required
                className="h-11 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-fg-muted transition-colors hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              >
                {showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </Field>

          {error && (
            <p className="rounded-md border border-err/30 bg-err/5 px-3 py-2 text-sm text-err">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="cta-glow inline-flex h-11 w-full items-center justify-center gap-2 rounded-md text-sm font-medium text-accent-fg transition-transform hover:-translate-y-0.5 hover:cta-glow-hover active:scale-[0.99] disabled:pointer-events-none disabled:opacity-70"
          >
            {pending && <CircleNotch size={16} weight="bold" className="animate-spin" />}
            {pending
              ? isSignup
                ? "Creating account"
                : "Signing in"
              : isSignup
                ? "Create account"
                : "Sign in"}
          </button>
        </form>

        <p className="mt-8 text-sm text-fg-muted">
          {isSignup ? "Already have an account? " : "No account yet? "}
          <Link
            href={isSignup ? "/login" : "/signup"}
            className="font-medium text-accent transition-colors hover:text-accent-hover"
          >
            {isSignup ? "Sign in" : "Sign up"}
          </Link>
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  action,
  children,
}: {
  label: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between">
        <span className="text-sm font-medium text-fg">{label}</span>
        {action}
      </span>
      {children}
    </label>
  );
}
