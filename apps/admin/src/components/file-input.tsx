import { Field as BaseField } from '@base-ui/react/field';
import type { UploadedFile } from '@festivapp/contracts';
import { has } from '@festivapp/utils';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { listFilesOptions } from '../lib/files.ts';
import { getThemeOptions } from '../lib/theme.ts';
import { Button } from './button.tsx';
import { FilePicker } from './file-picker.tsx';
import { Thumbnail } from './thumbnail.tsx';

export function FileInput({
  tenantId,
  value,
  onValueChange,
}: {
  tenantId: string;
  value: string | null;
  onValueChange: (value: string | null) => void;
}) {
  const { data: theme } = useQuery(getThemeOptions(tenantId));
  const [open, setOpen] = useState(false);

  const { data: selected } = useQuery({
    ...listFilesOptions(tenantId),
    select: (files) => files.find(has('url', value)),
  });

  const onSelect = (file: UploadedFile) => {
    onValueChange(file.url);
    setOpen(false);
  };

  return (
    <>
      <div className="row items-center gap-3">
        <Thumbnail
          url={value}
          fit="cover"
          background={theme?.backgroundColor}
          className="size-16 shrink-0 rounded-lg border"
        />

        <div className="col min-w-0 flex-1 gap-2">
          <span className="text-faint text-xxs min-h-3 truncate font-mono">
            {selected?.name ?? value ?? 'No file set'}
          </span>

          <div className="row gap-2">
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

      <FilePicker
        tenantId={tenantId}
        background={theme?.backgroundColor}
        open={open}
        onOpenChange={setOpen}
        onSelect={onSelect}
      />
    </>
  );
}
