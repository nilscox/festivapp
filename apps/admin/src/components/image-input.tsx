'use client';

import { defined } from '@festivapp/utils';
import assert from 'assert';
import { XIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { useFieldId } from './field';

export function ImageInput({ name, src }: { name: string; src: string | null | undefined }) {
  const id = useFieldId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(src);

  useEffect(() => {
    setPreview(src);
  }, [src]);

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    if (event.target.files?.length === 1) {
      setPreview(URL.createObjectURL(defined(event.target.files[0])));
    }
  };

  const handleClear = () => {
    assert(inputRef.current);

    inputRef.current.value = '';
    setPreview('');
  };

  return (
    <div className="row items-start gap-3">
      <div className="relative">
        <button type="button" onClick={() => inputRef.current?.click()} className="cursor-pointer">
          {preview ? (
            <img
              alt=""
              src={preview.match(/(https?|blob):\/\//) ? preview : `/uploads/${src}`}
              className="size-30 rounded-md border object-cover"
            />
          ) : (
            <div className="col size-30 items-center justify-center rounded-md border border-dashed bg-gray-100 text-xs text-dim">
              No image
            </div>
          )}
        </button>

        {preview && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute top-0 right-0 m-2 cursor-pointer rounded-sm bg-white"
          >
            <XIcon className="size-4" />
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        id={id}
        aria-labelledby={`${id}-label`}
        type="file"
        name={name}
        accept="image/*"
        onChange={handleChange}
        className="sr-only flex-1 text-sm"
      />
    </div>
  );
}
