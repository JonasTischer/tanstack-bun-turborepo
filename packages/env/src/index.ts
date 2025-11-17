import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

const clientPrefix = "VITE_";

const serverDefinitions = {
  DATABASE_URL: z.string().url(),
  SERVER_URL: z.string().url().optional(),
  LOG_LEVEL: z
    .enum(["trace", "debug", "info", "warn", "error", "fatal"])
    .optional(),
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
};

const clientDefinitions = {
  VITE_APP_TITLE: z.string().optional(),
  VITE_BASE_URL: z.string().url(),
};

const serverObjectSchema = z.object(serverDefinitions);
const clientObjectSchema = z.object(clientDefinitions);

export type ServerEnv = z.infer<typeof serverObjectSchema>;
export type ClientEnv = z.infer<typeof clientObjectSchema>;

type RuntimeEnv = Record<string, string | boolean | undefined>;

export function createAppEnv({
  runtimeEnv,
  skipValidation = false,
}: {
  runtimeEnv: RuntimeEnv;
  skipValidation?: boolean;
}) {
  return createEnv({
    server: serverDefinitions,
    client: clientDefinitions,
    clientPrefix,
    runtimeEnv,
    skipValidation,
  });
}

export function getServerEnv(env: RuntimeEnv = process.env): ServerEnv {
  return serverObjectSchema.parse(env);
}

export function getClientEnv(env: RuntimeEnv): ClientEnv {
  return clientObjectSchema.parse(env);
}

export {
  clientPrefix,
  serverDefinitions as serverSchema,
  clientDefinitions as clientSchema,
};
