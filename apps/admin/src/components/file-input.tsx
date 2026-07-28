import { Field as BaseField } from '@base-ui/react/field';
import type { UploadedFile } from '@festivapp/contracts';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'lucide-react';
import { useState } from 'react';

import { listFilesOptions } from '../lib/files.ts';
import { Button } from './button.tsx';
import { Drawer } from './drawer.tsx';
import { FileThumbnail } from './file-thumbnail.tsx';
import { Spinner } from './spinner.tsx';
import { UploadButton } from './upload-button.tsx';

export function FileInput({
  tenantId,
  background,
  value,
  onValueChange,
}: {
  tenantId: string;
  background: string;
  value: string | null;
  onValueChange: (value: string | null) => void;
}) {
  const [open, setOpen] = useState(false);

  const { data: selected } = useQuery({
    ...listFilesOptions(tenantId),
    select: (files) => files.find((file) => file.url === value),
  });

  const onSelect = (file: UploadedFile) => {
    onValueChange(file.url);
    setOpen(false);
  };

  return (
    <>
      <div className="row items-center gap-3">
        {value !== null ? (
          <FileThumbnail url={value} alt="" background={background} className="size-16 shrink-0 rounded-lg border" />
        ) : (
          <div className="bg-subtle text-faint flex size-16 shrink-0 items-center justify-center rounded-lg border border-dashed">
            <Image className="size-5" />
          </div>
        )}

        <div className="col min-w-0 flex-1 gap-2">
          <span className="text-faint text-xxs min-h-3 truncate font-mono">
            {value !== null && (selected?.name ?? value)}
          </span>

          <div className="row gap-2">
            {/* renders as the field's control so its <label for> resolves */}
            <BaseField.Control render={<Button variant="secondary" size="sm" />} onClick={() => setOpen(true)}>
              {value !== null ? 'Change' : 'Choose a file'}
            </BaseField.Control>

            {value !== null && (
              <Button variant="ghost" size="sm" onClick={() => onValueChange(null)}>
                Remove
              </Button>
            )}
          </div>
        </div>
      </div>

      <FilePicker tenantId={tenantId} background={background} open={open} onOpenChange={setOpen} onSelect={onSelect} />
    </>
  );
}

function FilePicker({
  tenantId,
  background,
  open,
  onOpenChange,
  onSelect,
}: {
  tenantId: string;
  background: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (file: UploadedFile) => void;
}) {
  const { isPending, data: files = [] } = useQuery(listFilesOptions(tenantId));

  return (
    <Drawer open={open} onOpenChange={onOpenChange} eyebrow="File upload" title="Choose a file">
      <div className="col flex-1 gap-4 overflow-y-auto p-4">
        {isPending && <Spinner className="mx-auto my-8 size-6" />}

        {!isPending && files.length === 0 && (
          <p className="text-muted text-sm">Nothing uploaded yet. Upload an image to use it here.</p>
        )}

        <div className="grid grid-cols-2 gap-3">
          {files.map((file) => (
            <button
              key={file.id}
              type="button"
              onClick={() => onSelect(file)}
              className="hover:border-line-strong col cursor-pointer overflow-hidden rounded-lg border text-start"
            >
              <FileThumbnail
                url={file.url}
                alt={file.name ?? 'Uploaded file'}
                background={background}
                className="h-24"
              />
              <span className="text-muted truncate border-t p-2 text-xs font-medium">{file.name ?? 'Untitled'}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="row border-t p-4">
        <UploadButton tenantId={tenantId} variant="secondary" onUploaded={([file]) => file && onSelect(file)}>
          Upload a new file
        </UploadButton>
      </div>
    </Drawer>
  );
}
