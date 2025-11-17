import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useWebSocket } from "@/lib/hooks/use-web-socket";

export const Route = createFileRoute("/(authenticated)/ws-demo")({
  component: WebSocketDemo,
});

type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
};

type Todo = {
  id: string;
  title: string;
  completed: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
};

// Regex constants
const HTTP_PROTOCOL_REGEX = /^http/;

// Helper function to get status className
function getStatusClassName(status: string): string {
  if (status === "connected") {
    return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
  }
  if (status === "connecting") {
    return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
  }
  if (status === "error") {
    return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
  }
  return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
}

function WebSocketDemo() {
  const [todoTitle, setTodoTitle] = useState("");
  const [authenticatedUser, setAuthenticatedUser] =
    useState<AuthenticatedUser | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);

  // Connect directly to backend WebSocket
  const backendUrl =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
  const wsUrl = `${backendUrl.replace(HTTP_PROTOCOL_REGEX, "ws")}/ws`;

  const { status, messages, sendMessage } = useWebSocket({
    url: wsUrl,
    onMessage: (message) => {
      console.log("Received message:", message);

      if (message.type === "authenticated") {
        setAuthenticatedUser(message.user as AuthenticatedUser);
      }

      if (message.type === "todo_created") {
        setTodos((prev) => [...prev, message.todo as Todo]);
      }
    },
    onOpen: () => {
      console.log("WebSocket connected");
    },
    onClose: () => {
      console.log("WebSocket disconnected");
      setAuthenticatedUser(null);
    },
    reconnect: true,
  });

  const handleCreateTodo = () => {
    if (todoTitle.trim()) {
      sendMessage({ type: "create_todo", title: todoTitle });
      setTodoTitle("");
    }
  };

  return (
    <div className="container mx-auto flex min-h-screen flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-3xl">WebSocket Demo - Authenticated</h1>
        <Button asChild variant="outline">
          <Link to="/">← Back to Home</Link>
        </Button>
      </div>

      {authenticatedUser && (
        <div className="rounded-lg border bg-card p-4 text-card-foreground">
          <h2 className="mb-2 font-semibold text-lg">Authenticated User</h2>
          <p className="text-sm">
            Logged in as:{" "}
            <span className="font-medium">{authenticatedUser.name}</span> (
            {authenticatedUser.email})
          </p>
        </div>
      )}

      <div className="rounded-lg border bg-card p-4 text-card-foreground">
        <div className="mb-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">Status:</span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-medium text-xs ${getStatusClassName(status)}`}
            >
              {status === "connected" && (
                <span className="h-2 w-2 rounded-full bg-current" />
              )}
              {status}
            </span>
          </div>
          <div className="text-muted-foreground text-sm">
            Connected to:{" "}
            <code className="rounded bg-muted px-1.5 py-0.5">{wsUrl}</code>
          </div>
        </div>

        <div className="mb-4">
          <h2 className="mb-2 font-semibold text-lg">
            Create Todo (Authenticated)
          </h2>
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-md border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={status !== "connected"}
              onChange={(e) => setTodoTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleCreateTodo();
                }
              }}
              placeholder="Enter todo title..."
              type="text"
              value={todoTitle}
            />
            <Button
              disabled={status !== "connected"}
              onClick={handleCreateTodo}
            >
              Create Todo
            </Button>
          </div>
          <p className="mt-2 text-muted-foreground text-xs">
            This will create a todo for the currently authenticated user via
            WebSocket
          </p>
        </div>

        {todos.length > 0 && (
          <div className="mb-4">
            <h2 className="mb-2 font-semibold text-lg">
              Created Todos ({todos.length})
            </h2>
            <div className="space-y-2">
              {todos.map((todo) => (
                <div
                  className="flex items-center gap-3 rounded-md bg-muted p-3"
                  key={todo.id}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-medium text-primary text-xs">
                    {todos.indexOf(todo) + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{todo.title}</p>
                    <p className="text-muted-foreground text-xs">
                      Created: {new Date(todo.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="mb-2 font-semibold text-lg">
            All Messages ({messages.length})
          </h2>
          <div className="max-h-96 space-y-2 overflow-y-auto rounded-md bg-muted p-4">
            {messages.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No messages yet. Create a todo to get started!
              </p>
            ) : (
              messages.map((message, index) => (
                <div
                  className="rounded-md border bg-background p-3 text-sm"
                  key={`${index}-${message.timestamp || Date.now()}`}
                >
                  <div className="mb-1 flex items-center gap-2">
                    <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-primary text-xs">
                      {message.type}
                    </span>
                    {typeof message.timestamp === "string" && (
                      <span className="text-muted-foreground text-xs">
                        {new Date(
                          message.timestamp as string
                        ).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                  <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-xs">
                    {JSON.stringify(message, null, 2)}
                  </pre>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-muted/50 p-4 text-sm">
        <h3 className="mb-2 font-semibold">How it works:</h3>
        <ul className="space-y-1 text-muted-foreground">
          <li>
            • This page is <strong>protected</strong> - you must be logged in to
            access it
          </li>
          <li>
            • The WebSocket connection validates your session cookie on
            connection
          </li>
          <li>
            • The backend knows who you are and creates todos for YOUR user
            account
          </li>
          <li>
            • Try creating a todo - it will be saved to the database with your
            user ID!
          </li>
          <li>• The connection automatically reconnects if it drops</li>
        </ul>
      </div>
    </div>
  );
}
