import type { Location, MapPin, MapPinLabelPosition } from '@festivapp/contracts';
import { assert, has } from '@festivapp/utils';
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
import { listLocationsOptions, updateLocationOptions } from '../lib/locations.ts';
import { getTenantOptions, updateTenantOptions } from '../lib/tenant.ts';
import { getThemeOptions } from '../lib/theme.ts';

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
  const [pins, setPins] = useState<Record<string, MapPin>>({});
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number }>();
  const [selected, setSelected] = useState<string>();

  const queryClient = useQueryClient();

  const mutation = useMutation({
    ...updateLocationOptions(tenantId),
    onSuccess: () => queryClient.invalidateQueries(listLocationsOptions(tenantId)),
  });

  const pinOf = (location: Location) => pins[location.id] ?? location.mapPin;

  const save = (location: Location, mapPin: MapPin) => {
    setPins((pins) => ({ ...pins, [location.id]: mapPin }));

    mutation.mutate([location.id, { mapPin }], {
      onError: () => {
        setPins(({ [location.id]: _, ...pins }) => pins);
      },
    });
  };

  const pointerPin = (event: React.PointerEvent) => {
    assert(imageRef.current);

    const rect = imageRef.current.getBoundingClientRect();

    return {
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    };
  };

  const onPointerDown = (event: React.PointerEvent, location: Location) => {
    const pointer = pointerPin(event);
    const pin = pinOf(location);

    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging({ id: location.id, offsetX: pin.x - pointer.x, offsetY: pin.y - pointer.y });
  };

  const onPointerMove = (event: React.PointerEvent, location: Location) => {
    if (dragging?.id !== location.id) {
      return;
    }

    const pointer = pointerPin(event);

    setPins((pins) => ({
      ...pins,
      [location.id]: {
        ...pinOf(location),
        x: round(pointer.x + dragging.offsetX),
        y: round(pointer.y + dragging.offsetY),
      },
    }));
  };

  const onPointerUp = (location: Location) => {
    if (dragging?.id !== location.id) {
      return;
    }

    setDragging(undefined);

    const mapPin = pins[location.id];

    if (!mapPin || (mapPin.x === location.mapPin.x && mapPin.y === location.mapPin.y)) {
      return setSelected(selected === location.id ? undefined : location.id);
    }

    save(location, mapPin);
  };

  const selectedLocation = locations.find(has('id', selected));

  return (
    <div className="reveal col gap-4">
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
              pin={pinOf(location)}
              dragging={dragging?.id === location.id}
              selected={selected === location.id}
              onPointerDown={(event) => onPointerDown(event, location)}
              onPointerMove={(event) => onPointerMove(event, location)}
              onPointerUp={() => onPointerUp(location)}
            />
          ))}
        </div>
      </div>

      {selectedLocation && (
        <LabelPositionPicker
          pin={pinOf(selectedLocation)}
          onChange={(labelPosition) => save(selectedLocation, { ...pinOf(selectedLocation), labelPosition })}
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
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: {
  location: Location;
  pin: MapPin;
  dragging: boolean;
  selected: boolean;
  onPointerDown: (event: React.PointerEvent) => void;
  onPointerMove: (event: React.PointerEvent) => void;
  onPointerUp: () => void;
}) {
  return (
    <div
      style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
      className={clsx('absolute -translate-x-1/2 -translate-y-1/2', (dragging || selected) && 'z-10')}
    >
      <button
        type="button"
        aria-label={`Move ${location.name}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
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
    ...updateTenantOptions(tenantId),
    onSuccess: () => queryClient.invalidateQueries(getTenantOptions(tenantId)),
  });
}

function round(value: number): number {
  return Math.round(Math.min(Math.max(value, 0), 100) * 10) / 10;
}
