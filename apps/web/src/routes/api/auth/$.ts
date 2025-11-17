// biome-ignore lint/style/useFilenamingConvention: TanStack Router convention requires $.ts
import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@whispa/auth";

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: async ({ request }) => auth.handler(request),
      POST: async ({ request }) => auth.handler(request),
    },
  },
});
