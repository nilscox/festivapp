import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { fetchBootstrap } from "./api.ts";
import { Shell } from "./shell.tsx";
import { applyTenant } from "./theme.ts";

export function App() {
  const query = useQuery({ queryKey: ["bootstrap"], queryFn: fetchBootstrap });
  const tenant = query.data?.tenant;

  useEffect(() => {
    if (tenant) {
      applyTenant(tenant);
    }
  }, [tenant]);

  const offline = query.isError || query.fetchStatus === "paused";

  if (query.data) {
    return <Shell bootstrap={query.data} offline={offline} />;
  }

  if (offline) {
    return (
      <p className="m-auto max-w-80 p-8 text-center text-sm leading-normal text-muted">
        Can't reach this festival. Check your connection and try again.
      </p>
    );
  }

  return (
    <p className="m-auto max-w-80 p-8 text-center text-sm leading-normal text-muted">Loading…</p>
  );
}
