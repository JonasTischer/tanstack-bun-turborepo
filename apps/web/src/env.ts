import { getClientEnv, getServerEnv } from "@whispa/env";

// Server-side env (only validated on server)
const serverEnv =
  typeof window === "undefined"
    ? getServerEnv(process.env)
    : ({} as ReturnType<typeof getServerEnv>);

// Client-side env (only validated on client)
const clientEnv =
  typeof window !== "undefined"
    ? getClientEnv({
        VITE_APP_TITLE: import.meta.env.VITE_APP_TITLE,
        VITE_BASE_URL: import.meta.env.VITE_BASE_URL,
      })
    : ({
        VITE_APP_TITLE: import.meta.env.VITE_APP_TITLE,
        VITE_BASE_URL: import.meta.env.VITE_BASE_URL,
      } as ReturnType<typeof getClientEnv>);

// Combine both for a unified env object
export const env = {
  ...serverEnv,
  ...clientEnv,
};
