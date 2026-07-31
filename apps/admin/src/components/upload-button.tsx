import type { UploadedFile } from '@festivapp/contracts';
import { defined, has } from '@festivapp/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload } from 'lucide-react';
import { useRef } from 'react';
import { toast, type Renderable } from 'react-hot-toast';

import { ApiError } from '../lib/api.ts';
import { listFilesOptions, uploadFilesOptions } from '../lib/files.ts';
import { Button } from './button.tsx';
import { Spinner } from './spinner.tsx';

export const acceptedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/svg+xml'];

export function UploadButton({
  tenantId,
  variant,
  children,
  multiple,
  onUploaded,
}: {
  tenantId: string;
  variant?: 'primary' | 'secondary';
  multiple?: boolean;
  onUploaded?: (files: UploadedFile[]) => void;
  children?: React.ReactNode;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const upload = useMutation({
    ...uploadFilesOptions(tenantId),
    onSuccess: async (results, files) => {
      for (const [index, result] of results.entries()) {
        if (result.status === 'rejected') {
          toast.error(uploadErrorMessage(result.reason, defined(files[index])));
        }
      }

      await queryClient.invalidateQueries(listFilesOptions(tenantId));

      onUploaded?.(results.filter(has('status', 'fulfilled')).map((result) => result.value));
    },
    onSettled: () => {
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    },
  });

  const onChange = (input: HTMLInputElement) => {
    upload.mutate(Array.from(input.files ?? []));
  };

  return (
    <>
      <Button variant={variant} disabled={upload.isPending} onClick={() => inputRef.current?.click()}>
        {upload.isPending ? <Spinner className="size-4" /> : <Upload className="size-4" />}
        {children ?? 'Upload'}
      </Button>

      <input
        ref={inputRef}
        type="file"
        multiple={multiple}
        accept={acceptedTypes.join(',')}
        onChange={(event) => onChange(event.currentTarget)}
        className="hidden"
      />
    </>
  );
}

function uploadErrorMessage(error: unknown, file: File): Renderable {
  if (ApiError.is(error, 413)) {
    return `${file.name} is too large.`;
  }

  if (ApiError.is(error, 415)) {
    return (
      <Toast
        message={`${file.name} is not a supported image.`}
        description={
          <>
            Supported types:
            <ul>
              {acceptedTypes.map((type, index) => (
                <li key={index}>{type}</li>
              ))}
            </ul>
          </>
        }
      />
    );
  }

  return (
    <Toast
      message={`Could not upload ${file.name}.`}
      description={error instanceof Error && <div className="text-muted text-sm">{error.message}</div>}
    />
  );
}

export function Toast({ message, description }: { message: React.ReactNode; description?: React.ReactNode }) {
  if (!description) {
    return message;
  }

  return (
    <div>
      <div className="font-medium">{message}</div>
      <div className="text-muted text-sm">{description}</div>
    </div>
  );
}
