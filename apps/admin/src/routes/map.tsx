import type { Location, MapPin, TenantSummary } from '@festivapp/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouteContext } from '@tanstack/react-router';
import clsx from 'clsx';
import { Circle, Map, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import toast from 'react-hot-toast';

import { Button } from '../components/button.tsx';
import { EmptyState } from '../components/empty-state.tsx';
import { FilePicker } from '../components/file-picker.tsx';
import { Page, PageHeader } from '../components/page.tsx';
import { Spinner } from '../components/spinner.tsx';
import { UploadButton } from '../components/upload-button.tsx';
import { useLocations, useUpdateLocation } from '../lib/locations.ts';
import { getTenantOptions, updateTenantOptions } from '../lib/tenant.ts';
import { getThemeOptions } from '../lib/theme.ts';
import { assert } from '../utils.ts';

const from = '/festivals/$tenantId/map';

export function FestivalMap() {
  const { tenant } = useRouteContext({ from });
  const [picking, setPicking] = useState(false);

  const tenantQuery = useQuery(getTenantOptions(tenant.id));
  const locationsQuery = useLocations(tenant.id);
  const themeQuery = useQuery(getThemeOptions(tenant.id));

  const mutation = useSetMapUrl(tenant.id);
  const mapUrl = tenantQuery.data?.mapUrl ?? null;

  const setMapUrl = (mapUrl: string | null) => {
    setPicking(false);
    mutation.mutate({ mapUrl }, { onSuccess: () => toast.success(mapUrl ? 'Map updated' : 'Map removed') });
  };

  const isPending = tenantQuery.isPending || locationsQuery.isPending;
  const error = tenantQuery.error ?? locationsQuery.error;

  return (
    <Page
      header={
        <Header
          tenant={tenant}
          mapUrl={mapUrl}
          pending={mutation.isPending}
          onChange={() => setPicking(true)}
          onRemove={() => setMapUrl(null)}
        />
      }
    >
      {isPending && <Spinner className="mx-auto my-8 size-6" />}

      {error && <>Error: {error.message}</>}

      {tenantQuery.isSuccess && locationsQuery.isSuccess && (
        <>
          {mapUrl === null ? (
            <EmptyState
              icon={Map}
              title="No map yet"
              description="Upload a picture of the festival grounds, then drag a pin onto it for each location to show attendees where things are."
              cta={
                <UploadButton tenantId={tenant.id} onUploaded={([file]) => file && setMapUrl(file.url)}>
                  Upload a map
                </UploadButton>
              }
            />
          ) : (
            <Board tenantId={tenant.id} mapUrl={mapUrl} locations={locationsQuery.data} />
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
    </Page>
  );
}

function Header({
  tenant,
  mapUrl,
  pending,
  onChange,
  onRemove,
}: {
  tenant: TenantSummary;
  mapUrl: string | null;
  pending: boolean;
  onChange: () => void;
  onRemove: () => void;
}) {
  return (
    <PageHeader
      eyebrow={tenant.name}
      title="Map"
      end={
        mapUrl !== null && (
          <div className="row mt-auto gap-2">
            <Button variant="ghost" disabled={pending} onClick={onRemove} className="max-md:hidden">
              Remove
            </Button>

            <Button disabled={pending} onClick={onChange}>
              <Upload className="size-4" />
              <span className="max-md:hidden">Change map</span>
            </Button>
          </div>
        )
      }
    />
  );
}

function Board({ tenantId, mapUrl, locations }: { tenantId: string; mapUrl: string; locations: Location[] }) {
  const imageRef = useRef<HTMLImageElement>(null);
  const [pins, setPins] = useState<Record<string, MapPin>>({});
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number }>();

  const mutation = useUpdateLocation(tenantId);

  const pinOf = (location: Location) => pins[location.id] ?? location.mapPin;

  const pointerPin = (event: React.PointerEvent): MapPin => {
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
      [location.id]: { x: round(pointer.x + dragging.offsetX), y: round(pointer.y + dragging.offsetY) },
    }));
  };

  const onPointerUp = (location: Location) => {
    if (dragging?.id !== location.id) {
      return;
    }

    setDragging(undefined);

    const mapPin = pins[location.id];

    if (!mapPin || (mapPin.x === location.mapPin.x && mapPin.y === location.mapPin.y)) {
      return;
    }

    mutation.mutate(
      { id: location.id, mapPin },
      {
        onError: () => {
          setPins(({ [location.id]: _, ...pins }) => pins);
        },
      },
    );
  };

  return (
    <div className="reveal col gap-4">
      <p className="text-muted font-mono text-xs tracking-wide">
        {locations.length} pin{locations.length === 1 ? '' : 's'} &bull; drag one to move it, it saves as you drop it
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
              onPointerDown={(event) => onPointerDown(event, location)}
              onPointerMove={(event) => onPointerMove(event, location)}
              onPointerUp={() => onPointerUp(location)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Pin({
  location,
  pin,
  dragging,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: {
  location: Location;
  pin: MapPin;
  dragging: boolean;
  onPointerDown: (event: React.PointerEvent) => void;
  onPointerMove: (event: React.PointerEvent) => void;
  onPointerUp: () => void;
}) {
  return (
    <div
      style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
      className={clsx('absolute -translate-x-1/2 -translate-y-1/2', dragging && 'z-10')}
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
          dragging && 'scale-110 cursor-grabbing',
        )}
      >
        <Circle strokeWidth={2} className="fill-accent stroke-surface size-6 drop-shadow-md" />
      </button>

      <span className="bg-surface pointer-events-none absolute top-full left-1/2 mt-0.5 -translate-x-1/2 rounded-md border px-1.5 py-0.5 text-sm font-semibold whitespace-nowrap shadow-lg">
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
