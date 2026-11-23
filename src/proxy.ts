import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/**
 * Clerk's middleware runs only when Clerk is configured; otherwise requests pass straight through.
 * - /api: `auth()` identifies the signed-in user.
 * - /__clerk: Clerk's Frontend API is served through our own domain, so ad/tracker blockers that block
 *   clerk.* subdomains don't break sign-in. (Needs the proxy URL set in the Clerk dashboard and
 *   NEXT_PUBLIC_CLERK_PROXY_URL; until then the route simply isn't used.)
 * Pages stay static (and cacheable offline); sign-in on pages is handled by Clerk's client components.
 */
const enabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY);

const passthrough = () => NextResponse.next();

export default enabled ? clerkMiddleware({ frontendApiProxy: { enabled: true } }) : passthrough;

export const config = {
  matcher: ["/api/:path*", "/__clerk/(.*)"],
};
