import { getServerEnv } from "@whispa/env";
import pino, { type LoggerOptions } from "pino";

type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal";

function baseOptions(): LoggerOptions {
  try {
    const env = getServerEnv();
    return {
      level: (process.env.LOG_LEVEL as LogLevel | undefined) ?? "info",
      formatters: {
        level: (label) => ({ level: label }),
      },
      timestamp: pino.stdTimeFunctions.isoTime,
      redact: {
        paths: [
          "req.headers.authorization",
          "req.body.password",
          "password",
          "token",
          "apiKey",
        ],
        censor: "[redacted]",
      },
      name: env.SERVER_URL ?? "whispa",
    };
  } catch {
    return { level: "info" };
  }
}

export function createLogger(bindings?: {
  level?: LogLevel;
  context?: string;
}) {
  const opts = baseOptions();
  return pino({
    ...opts,
    level: bindings?.level ?? opts.level,
    base: bindings?.context ? { context: bindings.context } : undefined,
  });
}

export const logger = createLogger();
