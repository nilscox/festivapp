import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { applyTenant } from "../theme.ts";
import { useBootstrap } from "../use-bootstrap.ts";
import { useClock } from "../use-clock.ts";

function formatClock(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

function RootLayout() {
  const query = useBootstrap();
  const now = useClock();
  const tenant = query.data?.tenant;

  useEffect(() => {
    if (tenant) {
      applyTenant(tenant);
    }
  }, [tenant]);

  const offline = query.isError || query.fetchStatus === "paused";

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-120 flex-col px-5.5 pb-[env(safe-area-inset-bottom)]">
      <header className="flex items-center justify-between py-4.5">
        <Link to="/" className="font-display text-lg font-extrabold tracking-tight">
          {tenant ? tenant.name : "Festival"}
        </Link>

        <span className="inline-flex items-center gap-2 font-mono text-sm text-muted tabular-nums">
          {offline ? <span className="text-accent/70">offline</span> : null}
          <span className="pulse size-2 rounded-full bg-accent" aria-hidden="true" />
          {formatClock(now)}
        </span>
      </header>

      {query.data ? (
        <Outlet />
      ) : (
        <p className="m-auto max-w-80 p-8 text-center text-sm leading-normal text-muted">
          {offline ? "Can't reach this festival. Check your connection and try again." : "Loading…"}
        </p>
      )}
    </div>
  );
}

export const rootRoute = createRootRoute({ component: RootLayout });
