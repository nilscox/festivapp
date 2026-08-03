import type { Location, MapPin, MapPinLabelPosition, Tenant, TenantInput } from '@festivapp/contracts';
import { has } from '@festivapp/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouteContext } from '@tanstack/react-router';
import clsx from 'clsx';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Circle, Map, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'react-hot-toast';

import { Button, IconButton } from '../components/button.tsx';
import { EmptyState } from '../components/empty-state.tsx';
import { FilePicker } from '../components/file-picker.tsx';
import { Page, PageHeader } from '../components/page.tsx';
import { QueryBoundary } from '../components/query-boundary.tsx';
import { useDraggablePins, type PinHandlers } from '../hooks/use-draggable-pins.ts';
import { api } from '../lib/api.ts';
import { getTenantOptions, getThemeOptions, listLocationsOptions } from '../lib/queries.ts';

const from = '/festivals/$tenantId/map';

export function FestivalMap() {
  const { tenant } = useRouteContext({ from });
  const [picking, setPicking] = useState(false);

  const tenantQuery = useQuery(getTenantOptions(tenant.id));
  const locationsQuery = useQuery(listLocationsOptions(tenant.id));
  const themeQuery = useQuery(getThemeOptions(tenant.id));

  const mutation = useSetMapUrl(tenant.id);
  const mapUrl = tenantQuery.data?.mapUrl ?? null;

  const setMapUrl = (mapUrl: string | null) => {
    setPicking(false);
    mutation.mutate({ mapUrl }, { onSuccess: () => toast.success(mapUrl ? 'Map updated' : 'Map removed') });
  };

  return (
    <Page
      header={
        <PageHeader
          eyebrow={tenant.name}
          title="Map"
          end={
            tenantQuery.isSuccess &&
            locationsQuery.isSuccess &&
            mapUrl && (
              <HeaderActions
                pending={mutation.isPending}
                onChange={() => setPicking(true)}
                onRemove={() => setMapUrl(null)}
              />
            )
          }
        />
      }
    >
      <QueryBoundary query={[tenantQuery, locationsQuery]}>
        {({ mapUrl }, locations) => (
          <>
            {mapUrl === null ? (
              <EmptyState
                icon={Map}
                title="No map yet"
                description="Upload a picture of the festival grounds, then drag a pin onto it for each location to show attendees where things are."
                cta={
                  <Button onClick={() => setPicking(true)}>
                    <Upload className="size-4" /> Set a map
                  </Button>
                }
              />
            ) : (
              <Board tenantId={tenant.id} mapUrl={mapUrl} locations={locations} />
            )}

            <FilePicker
              tenantId={tenant.id}
              background={themeQuery.data?.backgroundColor}
              open={picking}
              onOpenChange={setPicking}
              onSelect={(file) => setMapUrl(file.url)}
            />
          </>
        )}
      </QueryBoundary>
    </Page>
  );
}

function HeaderActions({
  pending,
  onChange,
  onRemove,
}: {
  pending: boolean;
  onChange: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="row mt-auto gap-2">
      <Button variant="ghost" disabled={pending} onClick={onRemove} className="max-md:hidden">
        Remove
      </Button>

      <Button disabled={pending} onClick={onChange}>
        <Upload className="size-4" />
        <span className="max-md:hidden">Change map</span>
      </Button>
    </div>
  );
}

function Board({ tenantId, mapUrl, locations }: { tenantId: string; mapUrl: string; locations: Location[] }) {
  const imageRef = useRef<HTMLImageElement>(null);
  const [selected, setSelected] = useState<string>();

  const pins = useDraggablePins({
    tenantId,
    imageRef,
    onClick: (location) => setSelected(selected === location.id ? undefined : location.id),
  });

  const selectedLocation = locations.find(has('id', selected));

  return (
    <div className="col gap-4">
      <p className="text-muted font-mono text-xs tracking-wide">
        {locations.length} pin{locations.length === 1 ? '' : 's'} &bull; drag one to move it, click one to label it
      </p>

      <div className="row justify-center">
        <div className="relative w-fit select-none">
          <img ref={imageRef} src={mapUrl} alt="Festival map" className="block max-h-[70dvh] rounded-lg border" />

          {locations.map((location) => (
            <Pin
              key={location.id}
              location={location}
              pin={pins.pinOf(location)}
              dragging={pins.isDragging(location)}
              selected={selected === location.id}
              handlers={pins.handlers(location)}
            />
          ))}
        </div>
      </div>

      {selectedLocation && (
        <LabelPositionPicker
          pin={pins.pinOf(selectedLocation)}
          onChange={(labelPosition) => pins.save(selectedLocation, { ...pins.pinOf(selectedLocation), labelPosition })}
        />
      )}
    </div>
  );
}

const labelPositions = [
  { value: 'top', icon: ArrowUp },
  { value: 'bottom', icon: ArrowDown },
  { value: 'left', icon: ArrowLeft },
  { value: 'right', icon: ArrowRight },
] as const;

function LabelPositionPicker({
  pin,
  onChange,
}: {
  pin: MapPin;
  onChange: (labelPosition: MapPinLabelPosition) => void;
}) {
  return (
    <div className="row items-center justify-center gap-2">
      <span className="text-muted text-xs">Label position</span>

      <div className="row gap-1">
        {labelPositions.map(({ value, icon }) => (
          <IconButton
            key={value}
            icon={icon}
            variant={pin.labelPosition === value ? 'primary' : 'secondary'}
            aria-label={`Put the label on the ${value}`}
            aria-pressed={pin.labelPosition === value}
            onClick={() => onChange(value)}
          />
        ))}
      </div>
    </div>
  );
}

const labelClassNames: Record<MapPinLabelPosition, string> = {
  top: clsx('bottom-full left-1/2 mb-0.5 -translate-x-1/2'),
  bottom: clsx('top-full left-1/2 mt-0.5 -translate-x-1/2'),
  left: clsx('top-1/2 right-full me-0.5 -translate-y-1/2'),
  right: clsx('top-1/2 left-full ms-0.5 -translate-y-1/2'),
};

function Pin({
  location,
  pin,
  dragging,
  selected,
  handlers,
}: {
  location: Location;
  pin: MapPin;
  dragging: boolean;
  selected: boolean;
  handlers: PinHandlers;
}) {
  return (
    <div
      style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
      className={clsx('absolute -translate-x-1/2 -translate-y-1/2', (dragging || selected) && 'z-10')}
    >
      <button
        type="button"
        aria-label={`Move ${location.name}`}
        {...handlers}
        className={clsx(
          'block cursor-grab touch-none transition-transform hover:scale-110',
          (dragging || selected) && 'scale-110 cursor-grabbing',
        )}
      >
        <Circle strokeWidth={2} className="fill-accent stroke-surface size-6 drop-shadow-md" />
      </button>

      <span
        className={clsx(
          'bg-surface pointer-events-none absolute rounded-md px-1.5 py-0.5 text-sm font-semibold whitespace-nowrap shadow-lg',
          labelClassNames[pin.labelPosition],
          selected && 'text-accent ring-2',
        )}
      >
        {location.name}
      </span>
    </div>
  );
}

function useSetMapUrl(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Partial<TenantInput>) => api.patch<Tenant>(`/admin/tenants/${tenantId}`, input),
    onSuccess: () => queryClient.invalidateQueries(getTenantOptions(tenantId)),
  });
}
