"use client";

import { useActionState, useEffect, useState } from "react";
import {
  changePassword,
  updateProfile,
  type AccountFormState,
} from "@/app/actions/account";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { SectionLabel } from "@/components/ui/section-label";
import { useUser } from "@/components/providers/user-provider";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs font-medium text-red-400">{message}</p>;
}

function SuccessMessage({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mb-3 rounded-xl bg-proof-950/50 px-3 py-2 text-xs font-medium text-proof-400">
      {message}
    </p>
  );
}

export function AccountSettings() {
  const { refresh } = useUser();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loaded, setLoaded] = useState(false);

  const [profileState, profileAction, profilePending] = useActionState(
    updateProfile,
    {} as AccountFormState
  );
  const [passwordState, passwordAction, passwordPending] = useActionState(
    changePassword,
    {} as AccountFormState
  );

  useEffect(() => {
    fetch("/api/user")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setName(data.name ?? "");
          setEmail(data.email ?? "");
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (profileState.success) refresh();
  }, [profileState.success, refresh]);

  return (
    <Card className="mb-4">
      <SectionLabel>Account</SectionLabel>

      {!loaded ? (
        <p className="mt-3 text-sm text-charcoal-500">Loading account…</p>
      ) : (
        <>
          <form action={profileAction} className="mt-3 space-y-3">
            <SuccessMessage message={profileState.success} />
            {profileState.errors?.form && (
              <FieldError message={profileState.errors.form} />
            )}
            <div>
              <label
                htmlFor="account-name"
                className="text-xs font-bold uppercase tracking-wider text-charcoal-500"
              >
                Name
              </label>
              <Input
                id="account-name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
                className="mt-1"
              />
              <FieldError message={profileState.errors?.name} />
            </div>
            <div>
              <label
                htmlFor="account-email"
                className="text-xs font-bold uppercase tracking-wider text-charcoal-500"
              >
                Email
              </label>
              <Input
                id="account-email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                className="mt-1"
              />
              <FieldError message={profileState.errors?.email} />
            </div>
            <Button
              type="submit"
              variant="secondary"
              className="w-full"
              disabled={profilePending}
            >
              {profilePending ? "Saving…" : "Save profile"}
            </Button>
          </form>

          <div className="my-5 border-t border-charcoal-800" />

          <form action={passwordAction} className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-charcoal-500">
              Change password
            </p>
            <SuccessMessage message={passwordState.success} />
            {passwordState.errors?.form && (
              <FieldError message={passwordState.errors.form} />
            )}
            <div>
              <label
                htmlFor="current-password"
                className="text-xs font-medium text-charcoal-400"
              >
                Current password
              </label>
              <PasswordInput
                id="current-password"
                name="current_password"
                autoComplete="current-password"
                required
              />
              <FieldError message={passwordState.errors?.current_password} />
            </div>
            <div>
              <label
                htmlFor="new-password"
                className="text-xs font-medium text-charcoal-400"
              >
                New password
              </label>
              <PasswordInput
                id="new-password"
                name="new_password"
                autoComplete="new-password"
                minLength={8}
                required
              />
              <FieldError message={passwordState.errors?.new_password} />
            </div>
            <div>
              <label
                htmlFor="confirm-password"
                className="text-xs font-medium text-charcoal-400"
              >
                Confirm new password
              </label>
              <PasswordInput
                id="confirm-password"
                name="confirm_password"
                autoComplete="new-password"
                minLength={8}
                required
              />
              <FieldError message={passwordState.errors?.confirm_password} />
            </div>
            <Button
              type="submit"
              variant="secondary"
              className="w-full"
              disabled={passwordPending}
            >
              {passwordPending ? "Updating…" : "Update password"}
            </Button>
          </form>
        </>
      )}

      <div className="mt-4 border-t border-charcoal-800 pt-4">
        <SignOutButton />
      </div>
    </Card>
  );
}
