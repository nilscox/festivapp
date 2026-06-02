'use client';

import { useFieldId } from './field';

export function ImageInput({ name, currentRef }: { name: string; currentRef: string | null | undefined }) {
  const id = useFieldId();

  return (
    <div className="row items-start gap-3">
      {currentRef ? (
        <img src={`/uploads/${currentRef}`} alt="" className="size-30 rounded-md border border-gray-300 object-cover" />
      ) : (
        <div className="col size-30 items-center justify-center rounded-md border border-dashed border-gray-300 bg-gray-100 text-xs text-dim">
          No image
        </div>
      )}

      <input id={id} type="file" name={name} accept="image/*" className="flex-1 text-sm" />
    </div>
  );
}
