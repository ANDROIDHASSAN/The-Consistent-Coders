import { useAuth as useClerkAuth, useUser as useClerkUser } from '@clerk/react';

// Clerk is only mounted in the browser with a key. During build-time prerender
// (and when the key is missing) these hooks fall back to a signed-out stub so
// every page still renders.
export const CLERK_ENABLED = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY) && typeof window !== 'undefined';

const signedOut = { isLoaded: true, isSignedIn: false, userId: null, getToken: async () => null };
const noUser = { isLoaded: true, isSignedIn: false, user: null };

export const useSession = CLERK_ENABLED ? useClerkAuth : () => signedOut;
export const useClerkProfile = CLERK_ENABLED ? useClerkUser : () => noUser;
