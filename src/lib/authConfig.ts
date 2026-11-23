/**
 * Clerk is optional. Sign-in (and with it sync) is switched on by setting
 * NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY in the environment.
 * The publishable key is inlined at build time, so this works on client and server.
 */
export const CLERK_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";

export const authEnabledClient = () => CLERK_PUBLISHABLE_KEY !== "";

/** Server side: both keys are needed to verify sessions. */
export const authEnabled = () => CLERK_PUBLISHABLE_KEY !== "" && Boolean(process.env.CLERK_SECRET_KEY);
