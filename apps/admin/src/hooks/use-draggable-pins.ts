import type { Location, MapPin } from '@festivapp/contracts';
import { assert } from '@festivapp/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { PointerEvent, RefObject } from 'react';
import { useState } from 'react';

import { listLocationsOptions, updateLocationOptions } from '../lib/locations.ts';

export type PinHandlers = {
  onPointerDown: (event: PointerEvent) => void;
  onPointerMove: (event: PointerEvent) => void;
  onPointerUp: () => void;
  onPointerCancel: () => void;
};

type Drag = { id: string; offsetX: number; offsetY: number; moved: boolean };

export function useDraggablePins({
  tenantId,
  imageRef,
  onClick,
}: {
  tenantId: string;
  imageRef: RefObject<HTMLImageElement | null>;
  onClick: (location: Location) => void;
}) {
  const { pinOf, preview, save } = useOptimisticPins(tenantId);
  const [drag, setDrag] = useState<Drag>();

  const pointerPin = (event: PointerEvent) => {
    assert(imageRef.current);

    const rect = imageRef.current.getBoundingClientRect();

    return {
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    };
  };

  const onPointerDown = (event: PointerEvent, location: Location) => {
    const pointer = pointerPin(event);
    const pin = pinOf(location);

    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({ id: location.id, offsetX: pin.x - pointer.x, offsetY: pin.y - pointer.y, moved: false });
  };

  const onPointerMove = (event: PointerEvent, location: Location) => {
    if (drag?.id !== location.id) {
      return;
    }

    const pointer = pointerPin(event);
    const pin = pinOf(location);
    const moved = { ...pin, x: round(pointer.x + drag.offsetX), y: round(pointer.y + drag.offsetY) };

    if (moved.x === pin.x && moved.y === pin.y) {
      return;
    }

    if (!drag.moved) {
      setDrag({ ...drag, moved: true });
    }

    preview(location, moved);
  };

  const onPointerUp = (location: Location) => {
    if (drag?.id !== location.id) {
      return;
    }

    setDrag(undefined);

    if (!drag.moved) {
      return onClick(location);
    }

    save(location, pinOf(location));
  };

  return {
    pinOf,
    save,
    isDragging: (location: Location) => drag?.id === location.id,
    handlers: (location: Location): PinHandlers => ({
      onPointerDown: (event) => onPointerDown(event, location),
      onPointerMove: (event) => onPointerMove(event, location),
      onPointerUp: () => onPointerUp(location),
      onPointerCancel: () => onPointerUp(location),
    }),
  };
}

function useOptimisticPins(tenantId: string) {
  const queryClient = useQueryClient();
  const [pins, setPins] = useState<Record<string, MapPin>>({});

  const mutation = useMutation({
    ...updateLocationOptions(tenantId),
    onSuccess: async (location) => {
      await queryClient.invalidateQueries(listLocationsOptions(tenantId));

      setPins((pins) => (samePin(pins[location.id], location.mapPin) ? without(pins, location.id) : pins));
    },
  });

  const preview = (location: Location, mapPin: MapPin) => {
    setPins((pins) => ({ ...pins, [location.id]: mapPin }));
  };

  const save = (location: Location, mapPin: MapPin) => {
    preview(location, mapPin);

    mutation.mutate([location.id, { mapPin }], {
      onError: () => setPins((pins) => without(pins, location.id)),
    });
  };

  return {
    pinOf: (location: Location) => pins[location.id] ?? location.mapPin,
    preview,
    save,
  };
}

function samePin(a: MapPin | undefined, b: MapPin) {
  return a !== undefined && a.x === b.x && a.y === b.y && a.labelPosition === b.labelPosition;
}

function without(pins: Record<string, MapPin>, id: string) {
  const { [id]: _, ...rest } = pins;

  return rest;
}

function round(value: number): number {
  return Math.round(Math.min(Math.max(value, 0), 100) * 10) / 10;
}
