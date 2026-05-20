"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { AuthFormState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { cn } from "@/lib/utils";

const TRAINING_LEVELS = [
  {
    value: "beginner",
    label: "Beginner",
    hint: "New to lifting or returning after a long break",
  },
  {
    value: "intermediate",
    label: "Intermediate",
    hint: "Training consistently for 6+ months",
  },
  {
    value: "advanced",
    label: "Advanced",
    hint: "2+ years of structured programming",
  },
] as const;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs font-medium text-red-400">{message}</p>;
}

export function SignInForm({
  action,
}: {
  action: (
    prev: AuthFormState,
    formData: FormData
  ) => Promise<AuthFormState>;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-zinc-500">
          Email
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="mt-1"
        />
        <FieldError message={state.errors?.email} />
      </div>
      <div>
        <label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-zinc-500">
          Password
        </label>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          required
        />
        <FieldError message={state.errors?.password} />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
      <p className="text-center text-sm text-zinc-500">
        No account?{" "}
        <Link href="/signup" className="font-semibold text-emerald-400">
          Sign up
        </Link>
      </p>
    </form>
  );
}

export function SignUpForm({
  action,
}: {
  action: (
    prev: AuthFormState,
    formData: FormData
  ) => Promise<AuthFormState>;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-zinc-500">
          Name
        </label>
        <Input id="name" name="name" required autoComplete="name" className="mt-1" />
        <FieldError message={state.errors?.name} />
      </div>
      <div>
        <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-zinc-500">
          Email
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="mt-1"
        />
        <FieldError message={state.errors?.email} />
      </div>
      <div>
        <label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-zinc-500">
          Password
        </label>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
        <FieldError message={state.errors?.password} />
      </div>
      <fieldset>
        <legend className="text-xs font-bold uppercase tracking-wider text-zinc-500">
          Training level
        </legend>
        <div className="mt-2 space-y-2">
          {TRAINING_LEVELS.map((level) => (
            <label
              key={level.value}
              className={cn(
                "flex cursor-pointer gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 has-[:checked]:border-emerald-600/60 has-[:checked]:bg-emerald-950/30"
              )}
            >
              <input
                type="radio"
                name="training_level"
                value={level.value}
                defaultChecked={level.value === "beginner"}
                className="mt-1 accent-emerald-500"
              />
              <span>
                <span className="block text-sm font-bold">{level.label}</span>
                <span className="block text-xs text-zinc-500">{level.hint}</span>
              </span>
            </label>
          ))}
        </div>
        <FieldError message={state.errors?.training_level} />
      </fieldset>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </Button>
      <p className="text-center text-sm text-zinc-500">
        Already have an account?{" "}
        <Link href="/signin" className="font-semibold text-emerald-400">
          Sign in
        </Link>
      </p>
    </form>
  );
}
