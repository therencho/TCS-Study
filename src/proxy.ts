import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/**
 * Clerk's middleware runs only when Clerk is configured; otherwise requests pass straight through.
 * It only runs on /api, where `auth()` identifies the signed-in user. Pages stay static (and cacheable
 * offline); sign-in on pages is handled by Clerk's client components.
 */
const enabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY);

const passthrough = () => NextResponse.next();

export default enabled ? clerkMiddleware() : passthrough;

export const config = {
  // Pages are static and work offline; only the API needs to know who is signed in.
  matcher: ["/api/:path*"],
};
