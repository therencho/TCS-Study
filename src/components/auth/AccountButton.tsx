"use client";

import { SignInButton, UserButton, useAuth } from "@clerk/nextjs";

/** Header control: "Sign in" (opens Clerk's modal) or the account menu. Only rendered when Clerk is configured. */
export function AccountButton() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <span className="inline-block h-7 w-7" aria-hidden />;
  if (isSignedIn) return <UserButton />;
  return (
    <SignInButton mode="modal">
      <button type="button" className="h-8 rounded-full border border-line px-3 text-sm text-ink">
        Sign in
      </button>
    </SignInButton>
  );
}

/** A one-line nudge for signed-out users. */
export function SignInNudge() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded || isSignedIn) return null;
  return (
    <p className="text-sm text-muted">
      Progress is saved on this device.{" "}
      <SignInButton mode="modal">
        <button type="button" className="font-medium text-accent underline underline-offset-4">
          Sign in
        </button>
      </SignInButton>{" "}
      to keep it in sync across your phone and laptop.
    </p>
  );
}
