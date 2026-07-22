import type { BootstrapResponse } from "@festivapp/contracts";
import { useClock } from "./use-clock.ts";

const FEATURES = [
  { key: "schedule", label: "Schedule" },
  { key: "saved", label: "Saved" },
  { key: "map", label: "Map" },
  { key: "updates", label: "Updates" },
];

type ShellProps = {
  bootstrap: BootstrapResponse;
  offline: boolean;
};

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function Shell({ bootstrap, offline }: ShellProps) {
  const now = useClock();
  const { tenant } = bootstrap;

  return (
    <div className="flex min-h-dvh w-full max-w-120 flex-col px-5.5 pb-[env(safe-area-inset-bottom)]">
      <header className="flex items-center justify-between py-4.5">
        <span className="size-2.5 rotate-45 rounded-xs bg-accent" aria-hidden="true" />

        <span className="inline-flex items-center gap-2 font-mono text-sm tabular-nums">
          <span className="pulse size-2 rounded-full bg-accent" aria-hidden="true" />
          {formatTime(now)}
        </span>
      </header>

      <main className="flex flex-1 flex-col justify-center gap-4.5 py-8">
        <p className="reveal font-mono text-xs tracking-widest text-muted uppercase [animation-delay:40ms]">
          Live programme · {tenant.domain}
        </p>

        <h1 className="wordmark reveal font-display text-[clamp(2.9rem,15vw,4.6rem)] leading-none font-extrabold tracking-tight [animation-delay:120ms]">
          <span>{tenant.name}</span>
        </h1>

        <p className="reveal max-w-88 text-base text-ink-soft [animation-delay:220ms]">
          Your pocket guide to the weekend — every set, saved and searchable, even with no signal.
        </p>
      </main>

      <section
        className="reveal flex justify-between gap-2 border-t border-line py-4 [animation-delay:300ms]"
        aria-label="What's inside"
      >
        {FEATURES.map((feature) => (
          <span className="flex flex-col gap-1" key={feature.key}>
            <span className="font-mono text-xs tracking-wider uppercase">{feature.label}</span>
            <span className="font-mono text-xs tracking-widest text-accent/70 uppercase">soon</span>
          </span>
        ))}
      </section>

      <footer className="reveal border-t border-line pt-3.5 pb-5.5 [animation-delay:380ms]">
        <span className="inline-flex items-center font-mono text-xs text-muted">
          {offline ? "Offline · showing your saved copy" : "Live · saved for offline"}
        </span>
      </footer>
    </div>
  );
}
