import type { BootstrapResponse } from "@festivapp/contracts";

export async function fetchBootstrap(): Promise<BootstrapResponse> {
  const response = await fetch("/api/bootstrap");

  if (!response.ok) {
    throw new Error(`bootstrap failed: ${response.status}`);
  }

  return (await response.json()) as BootstrapResponse;
}
