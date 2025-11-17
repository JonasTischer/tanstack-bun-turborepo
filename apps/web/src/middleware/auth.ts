// apps/web/src/middleware/auth.ts
import { createMiddleware } from "@tanstack/react-start";
import { getRequest, setResponseStatus } from "@tanstack/react-start/server";
import authClient from "@/lib/auth/auth-client";

/**
 * Middleware to force authentication on server requests
 */
export const authMiddleware = createMiddleware().server(async ({ next }) => {
  const session = await authClient.getSession({
    fetchOptions: {
      headers: getRequest().headers,
      throw: true,
    },
    query: {
      disableCookieCache: true, // Ensure session is fresh
    },
  });

  if (!session) {
    setResponseStatus(401);
    throw new Error("Unauthorized");
  }

  return next({
    context: {
      session, // ← Full session object
      user: session.user, // ← Convenience access to user
    },
  });
});
