import { Field as BaseField } from '@base-ui/react/field';
import type { UploadedFile } from '@festivapp/contracts';
import { defined, has } from '@festivapp/utils';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeftRight } from 'lucide-react';

import { getThemeOptions, listFilesOptions } from '../../lib/queries.ts';
import { Button } from '../button.tsx';
import { useDrawer } from '../drawer.tsx';
import { FilePicker } from '../file-picker.tsx';
import { Thumbnail } from '../thumbnail.tsx';
import { UploadButton } from '../upload-button.tsx';

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
  const drawer = useDrawer();

  const { data: selected } = useQuery({
    ...listFilesOptions(tenantId),
    select: (files) => files.find(has('url', value)),
  });

  const onSelect = (file: UploadedFile) => {
    onValueChange(file.url);
    drawer.onClose();
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
            <BaseField.Control
              render={
                <UploadButton
                  variant="secondary"
                  size="sm"
                  tenantId={tenantId}
                  onUploaded={([file]) => onSelect(defined(file))}
                />
              }
            >
              Upload
            </BaseField.Control>

            {value !== null && (
              <BaseField.Control render={<Button variant="secondary" size="sm" />} onClick={drawer.onOpen}>
                <ArrowLeftRight className="size-4" />
                Change
              </BaseField.Control>
            )}

            {value !== null && (
              <Button variant="ghost" size="sm" onClick={() => onValueChange(null)}>
                Remove
              </Button>
            )}
          </div>
        </div>
      </div>

      <FilePicker tenantId={tenantId} background={theme?.backgroundColor} drawer={drawer} onSelect={onSelect} />
    </>
  );
}
