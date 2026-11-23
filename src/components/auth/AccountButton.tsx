"use client";

import { ClerkFailed, SignInButton, UserButton, useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";

/** True if Clerk hasn't loaded after a few seconds (blocked script, wrong domain for the keys, offline). */
export function useClerkStuck(ms = 8000) {
  const { isLoaded } = useAuth();
  const [late, setLate] = useState(false);
  useEffect(() => {
    if (isLoaded) return;
    const t = setTimeout(() => setLate(true), ms);
    return () => clearTimeout(t);
  }, [isLoaded, ms]);
  return !isLoaded && late;
}

const UNAVAILABLE =
  "Sign-in could not load. If this keeps happening, the Clerk keys may not match this website's domain.";

/** Header control: "Sign in" (opens Clerk's modal) or the account menu. Only rendered when Clerk is configured. */
export function AccountButton() {
  const { isLoaded, isSignedIn } = useAuth();
  const stuck = useClerkStuck();
  if (!isLoaded)
    return stuck ? (
      <span title={UNAVAILABLE} className="text-xs text-bad">
        Sign-in unavailable
      </span>
    ) : (
      <>
        <span className="inline-block h-7 w-7" aria-hidden />
        <ClerkFailed>
          <span title={UNAVAILABLE} className="text-xs text-bad">
            Sign-in unavailable
          </span>
        </ClerkFailed>
      </>
    );
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
  const stuck = useClerkStuck();
  if (stuck) return <p className="text-sm text-bad">{UNAVAILABLE} Progress is still saved on this device.</p>;
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
