export function Placeholder({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="reveal flex flex-1 flex-col items-center justify-center gap-3.5 p-10 text-center">
      <div className="border-line text-muted flex size-14 items-center justify-center rounded-2xl border">{icon}</div>
      <div>
        <div className="font-display text-lg font-semibold">{title}</div>
        <div className="text-muted mt-1 text-sm">Coming soon</div>
      </div>
    </div>
  );
}
