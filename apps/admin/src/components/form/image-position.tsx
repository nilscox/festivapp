import type { ImagePosition } from '@festivapp/contracts';
import { assert, formatImagePosition, roundPercent } from '@festivapp/utils';
import clsx from 'clsx';
import type { PointerEvent } from 'react';
import { useRef, useState } from 'react';

import { useFieldContext } from './context.ts';

type Drag = { x: number; y: number; position: ImagePosition };

export function ImagePositionInput({
  url,
  value,
  onValueChange,
  onBlur,
  className,
}: {
  url: string;
  value: ImagePosition;
  onValueChange: (value: ImagePosition) => void;
  onBlur?: () => void;
  className?: string;
}) {
  const imageRef = useRef<HTMLImageElement>(null);
  const [drag, setDrag] = useState<Drag>();

  const onPointerDown = (event: PointerEvent) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({ x: event.clientX, y: event.clientY, position: value });
  };

  const onPointerMove = (event: PointerEvent) => {
    if (!drag) {
      return;
    }

    assert(imageRef.current);

    const hidden = hiddenPixels(imageRef.current);

    onValueChange({
      x: shift(drag.position.x, drag.x - event.clientX, hidden.x),
      y: shift(drag.position.y, drag.y - event.clientY, hidden.y),
    });
  };

  const onPointerUp = () => {
    if (!drag) {
      return;
    }

    setDrag(undefined);
    onBlur?.();
  };

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className={clsx(
        'bg-subtle touch-none overflow-hidden rounded-lg border select-none',
        drag ? 'cursor-grabbing' : 'cursor-grab',
        className,
      )}
    >
      <img
        ref={imageRef}
        src={url}
        alt=""
        draggable={false}
        style={{ objectPosition: formatImagePosition(value) }}
        className="size-full object-cover"
      />
    </div>
  );
}

export function ImagePositionField({ url, className }: { url: string; className?: string }) {
  const field = useFieldContext<ImagePosition>();

  return (
    <ImagePositionInput
      url={url}
      value={field.state.value}
      onValueChange={field.handleChange}
      onBlur={field.handleBlur}
      className={className}
    />
  );
}

// what `object-fit: cover` crops away, and so the only travel a drag has on each axis
function hiddenPixels(image: HTMLImageElement) {
  const { width, height } = image.getBoundingClientRect();
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);

  return {
    x: image.naturalWidth * scale - width,
    y: image.naturalHeight * scale - height,
  };
}

function shift(percent: number, pixels: number, hidden: number): number {
  if (!(hidden > 1)) {
    return percent;
  }

  return roundPercent(percent + (pixels / hidden) * 100);
}
