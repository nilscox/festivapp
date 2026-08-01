import type { Location, MapPinLabelPosition } from '@festivapp/contracts';
import { has } from '@festivapp/utils';
import { useNavigate, useSearch } from '@tanstack/react-router';
import clsx from 'clsx';
import { Download, Map as MapIcon } from 'lucide-react';

import { PageHeader } from '../../components/page-header.tsx';
import { useBootstrap } from '../../lib/bootstrap.ts';

export function MapPage() {
  const { tenant, locations } = useBootstrap();
  const { location: selected } = useSearch({ from: '/map' });
  const navigate = useNavigate({ from: '/map' });

  const select = (id: string) => {
    void navigate({ search: selected === id ? {} : { location: id }, replace: true });
  };

  return (
    <div className="col min-h-0 flex-1">
      <PageHeader
        title="Map"
        subtitle={
          <div className="text-faint font-mono text-xs uppercase">
            {locations.length} location{locations.length === 1 ? '' : 's'}
          </div>
        }
        end={
          tenant.mapUrl && (
            <a
              href={tenant.mapUrl}
              download={`${tenant.name} map`}
              className="bg-chip text-accent inline-flex flex-row items-center gap-2 self-center rounded-full px-4 py-2 text-sm font-medium"
            >
              <Download className="size-4" />
              Download
            </a>
          )
        }
      />

      <div className="reveal col min-h-0 flex-1 overflow-y-auto pb-8">
        {tenant.mapUrl === null ? (
          <NoMap />
        ) : (
          <>
            <MapImage
              url={tenant.mapUrl}
              alt={`Map of ${tenant.name}`}
              locations={locations}
              selected={selected}
              onSelect={select}
            />

            <SelectedLocation location={locations.find(has('id', selected))} />
          </>
        )}
      </div>
    </div>
  );
}

function MapImage({
  url,
  alt,
  locations,
  selected,
  onSelect,
}: {
  url: string;
  alt: string;
  locations: Location[];
  selected?: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="border-line relative border-b">
      <img src={url} alt={alt} className="block w-full" />

      {locations.map((location) => (
        <Pin
          key={location.id}
          location={location}
          selected={location.id === selected}
          onSelect={() => onSelect(location.id)}
        />
      ))}
    </div>
  );
}

const labelClassNames: Record<MapPinLabelPosition, string> = {
  top: clsx('bottom-full left-1/2 -translate-x-1/2 translate-y-1'),
  bottom: clsx('top-full left-1/2 -translate-x-1/2 -translate-y-1'),
  left: clsx('right-full top-1/2 -translate-y-1/2 translate-x-1'),
  right: clsx('left-full top-1/2 -translate-y-1/2 -translate-x-1'),
};

function Pin({ location, selected, onSelect }: { location: Location; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      style={{ left: `${location.mapPin.x}%`, top: `${location.mapPin.y}%` }}
      className={clsx('absolute -translate-x-1/2 -translate-y-1/2 p-2', selected && 'z-10')}
    >
      <div
        data-selected={selected}
        className={clsx(
          'ring-app relative rounded-full bg-accent ring-2 transition-all',
          selected ? 'size-4' : 'size-3',
        )}
      >
        {selected && <span className="ping bg-accent absolute inset-0 rounded-full" />}
      </div>

      <span
        className={clsx(
          'absolute rounded px-1 py-0.5 whitespace-nowrap',
          labelClassNames[location.mapPin.labelPosition],
          selected ? 'bg-accent text-app text-xs font-bold' : 'bg-app/85 text-ink text-xxs font-medium',
        )}
      >
        {location.name}
      </span>
    </button>
  );
}

function SelectedLocation({ location }: { location?: Location }) {
  if (!location) {
    return null;
  }

  return (
    <section className="reveal px-4 pt-4">
      <h2 className="font-display text-accent text-lg font-bold tracking-tight">{location.name}</h2>

      {location.description && (
        <p className="text-ink-soft mt-1 text-sm leading-relaxed whitespace-pre-line">{location.description}</p>
      )}
    </section>
  );
}

function NoMap() {
  return (
    <div className="hatch-lg border-line col h-40 items-center justify-center gap-3 border-b">
      <MapIcon className="text-faint size-6" strokeWidth={1.5} />
      <span className="text-faint font-mono text-xs tracking-widest uppercase">No map yet</span>
    </div>
  );
}
