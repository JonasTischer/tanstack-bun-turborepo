import { auth } from "@whispa/auth";
import { db, todo, user } from "@whispa/db";
import { getServerEnv } from "@whispa/env";
import { logger } from "@whispa/logger";
import type { ServerWebSocket } from "bun";

type WebSocketData = {
  upgradeRequest: Request;
  userId?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
};

// Regex constants
const PASSWORD_MASK_REGEX = /:[^:@]*@/;

const port = Number(process.env.PORT ?? 3001);
const hostname = process.env.HOST ?? "0.0.0.0";

const server = Bun.serve<WebSocketData>({
  port,
  hostname,
  fetch: async (request, bunServer) => {
    const { pathname } = new URL(request.url);
    const origin = request.headers.get("origin");

    // CORS headers for cross-origin requests
    const corsHeaders = {
      "Access-Control-Allow-Origin": origin || "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Credentials": "true",
    };

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // WebSocket upgrade endpoint
    if (pathname === "/ws") {
      const upgraded = bunServer.upgrade(request, {
        data: {
          upgradeRequest: request,
        },
      });
      if (upgraded) {
        logger.info("WebSocket connection upgraded");
        return;
      }
      return new Response("WebSocket upgrade failed", { status: 500 });
    }

    // Health check endpoint
    if (pathname === "/" || pathname === "/health") {
      return new Response("ok", { headers: corsHeaders });
    }

    // Validate env for API endpoints
    try {
      getServerEnv();
    } catch (error) {
      logger.error({ err: error }, "Environment validation failed");
      return new Response("Server configuration error", { status: 500 });
    }

    if (pathname === "/api/user") {
      try {
        const env = getServerEnv();
        // Log connection string (with password masked)
        logger.info(
          {
            dbUrl: env.DATABASE_URL.replace(PASSWORD_MASK_REGEX, ":***@"),
          },
          "Connecting to database"
        );

        // Try to query
        const users = await db.select().from(user).limit(1);

        logger.info({ count: users.length }, "Successfully fetched users");
        return Response.json(users, { headers: corsHeaders });
      } catch (error) {
        logger.error({ err: error }, "Database query failed");

        // Return detailed error
        return Response.json(
          {
            error: "Database query failed",
            message: error instanceof Error ? error.message : String(error),
            type: error?.constructor?.name,
          },
          { status: 500, headers: corsHeaders }
        );
      }
    }

    return new Response("Not found", { status: 404, headers: corsHeaders });
  },
  websocket: {
    async open(ws) {
      try {
        logger.info("WebSocket connection attempt");

        // Debug: Log headers
        const headers = ws.data.upgradeRequest.headers;
        const cookies = headers.get("cookie");
        logger.info(
          {
            origin: headers.get("origin"),
            host: headers.get("host"),
            hasCookies: !!cookies,
            cookiePreview: cookies ? cookies.substring(0, 100) : "none",
          },
          "WebSocket headers"
        );

        // Validate session from upgrade request
        const userSession = await auth.api.getSession({
          headers: ws.data.upgradeRequest.headers,
        });

        logger.info(
          { session: !!userSession, user: !!userSession?.user },
          "Session validation result"
        );

        if (!userSession?.user) {
          logger.warn("Unauthorized WebSocket connection attempt");
          ws.send(JSON.stringify({ type: "error", message: "Unauthorized" }));
          ws.close(1008, "Unauthorized");
          return;
        }

        // Store user info with the connection
        ws.data.userId = userSession.user.id;
        ws.data.user = userSession.user;

        logger.info({ userId: userSession.user.id }, "WebSocket authenticated");
        ws.send(
          JSON.stringify({
            type: "authenticated",
            user: {
              id: userSession.user.id,
              name: userSession.user.name,
              email: userSession.user.email,
            },
          })
        );
        logger.info("WebSocket open handler completed successfully");
      } catch (error) {
        logger.error({ err: error }, "Error in WebSocket open handler");
        ws.close(1011, "Internal error");
      }
    },
    async message(ws, message) {
      const userId = ws.data.userId;

      // Ensure user is still authenticated
      if (!userId) {
        ws.send(
          JSON.stringify({ type: "error", message: "Not authenticated" })
        );
        return;
      }

      try {
        const data = JSON.parse(message.toString());
        logger.info({ type: data.type, userId }, "Received WebSocket message");

        switch (data.type) {
          case "create_todo": {
            if (!data.title || typeof data.title !== "string") {
              ws.send(
                JSON.stringify({
                  type: "error",
                  message: "Invalid todo title",
                })
              );
              return;
            }

            // Create todo for the authenticated user
            const newTodos = await db
              .insert(todo)
              .values({
                title: data.title,
                userId,
                completed: false,
              })
              .returning();

            const newTodo = newTodos[0];
            if (!newTodo) {
              ws.send(
                JSON.stringify({
                  type: "error",
                  message: "Failed to create todo",
                })
              );
              return;
            }

            logger.info({ todoId: newTodo.id, userId }, "Todo created");

            ws.send(
              JSON.stringify({
                type: "todo_created",
                todo: newTodo,
              })
            );
            break;
          }

          case "ping": {
            ws.send(
              JSON.stringify({
                type: "pong",
                timestamp: new Date().toISOString(),
              })
            );
            break;
          }

          default: {
            // Echo unknown messages
            ws.send(
              JSON.stringify({
                type: "echo",
                original: data,
                timestamp: new Date().toISOString(),
              })
            );
          }
        }
      } catch (error) {
        logger.error(
          { err: error, userId },
          "Error processing WebSocket message"
        );
        ws.send(
          JSON.stringify({
            type: "error",
            message: "Failed to process message",
          })
        );
      }
    },
    close(_ws: ServerWebSocket<WebSocketData>, code, reason) {
      logger.info({ code, reason }, "WebSocket connection closed");
    },
  },
});

logger.info(`backend listening on http://${server.hostname}:${server.port}`);
