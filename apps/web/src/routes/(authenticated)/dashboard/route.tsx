import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/(authenticated)/dashboard")({
  component: DashboardLayout,
});

function DashboardLayout() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-10 p-2">
      <div className="flex flex-col items-center gap-2">
        <h1 className="font-bold text-3xl sm:text-4xl">Dashboard Layout</h1>
        <pre className="mb-4 rounded-md border bg-card p-1 text-card-foreground text-xs">
          routes/(authenticated)/dashboard/route.tsx
        </pre>
        <div className="mb-4 flex flex-col items-center gap-2 text-foreground/80 text-sm">
          This is a protected layout from the authenticated layout route:
          <pre className="rounded-md border bg-card p-1 text-card-foreground text-xs">
            routes/(authenticated)/route.tsx
          </pre>
        </div>

        <Button asChild className="w-fit" size="lg" type="button">
          <Link to="/">Back to home</Link>
        </Button>
      </div>

      <Outlet />
    </div>
  );
}
