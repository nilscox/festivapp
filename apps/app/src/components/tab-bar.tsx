import { Link } from '@tanstack/react-router';
import { CalendarDays, Info, Map as MapIcon, Radio } from 'lucide-react';
import type { ComponentType } from 'react';

type Tab = {
  to: string;
  label: string;
  icon: ComponentType<React.SVGProps<SVGSVGElement>>;
  exact: boolean;
};

const tabs: Tab[] = [
  { to: '/', label: 'Now', icon: Radio, exact: true },
  { to: '/timetable', label: 'Timetable', icon: CalendarDays, exact: false },
  { to: '/map', label: 'Map', icon: MapIcon, exact: false },
  { to: '/info', label: 'Info', icon: Info, exact: false },
];

export function TabBar() {
  return (
    <nav
      aria-label="Main navigation"
      className="border-line bg-app z-50 flex flex-none border-t px-1.5 pb-[env(safe-area-inset-bottom)]"
    >
      {tabs.map(({ to, label, icon: Icon, exact }) => (
        <Link
          key={to}
          to={to}
          activeOptions={{ exact, includeSearch: false }}
          activeProps={{ className: 'text-accent', 'aria-current': 'page' }}
          inactiveProps={{ className: 'text-muted' }}
          className="flex min-h-14 flex-1 flex-col items-center justify-center gap-1.5 rounded-xl"
        >
          <Icon className="size-5" strokeWidth={1.5} />
          <span className="font-mono text-xs tracking-wide">{label}</span>
        </Link>
      ))}
    </nav>
  );
}
