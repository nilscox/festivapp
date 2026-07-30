import type { UploadedFile } from '@festivapp/contracts';
import { matchesSearch } from '@festivapp/utils';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { listFilesOptions } from '../lib/files.ts';
import { Drawer } from './drawer.tsx';
import { QueryBoundary } from './query-boundary.tsx';
import { SearchInput } from './search-input.tsx';
import { Thumbnail } from './thumbnail.tsx';
import { UploadButton } from './upload-button.tsx';

export function FilePicker({
  tenantId,
  background,
  open,
  onOpenChange,
  onSelect,
}: {
  tenantId: string;
  background?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (file: UploadedFile) => void;
}) {
  const query = useQuery(listFilesOptions(tenantId));

  return (
    <Drawer open={open} onOpenChange={onOpenChange} eyebrow="File upload" title="Choose a file">
      <div className="col flex-1 gap-4 overflow-y-auto p-4">
        <QueryBoundary query={query}>
          {(files) => <FileList files={files} background={background} onSelect={onSelect} />}
        </QueryBoundary>
      </div>

      <div className="row border-t p-4">
        <UploadButton tenantId={tenantId} variant="secondary" onUploaded={([file]) => file && onSelect(file)}>
          Upload a new file
        </UploadButton>
      </div>
    </Drawer>
  );
}

function FileList({
  files,
  background,
  onSelect,
}: {
  files: UploadedFile[];
  background?: string;
  onSelect: (file: UploadedFile) => void;
}) {
  const [search, setSearch] = useState('');

  const matching = useMemo(() => {
    return files.filter((file) => matchesSearch(search, file.name));
  }, [files, search]);

  if (files.length === 0) {
    return <p className="text-muted text-sm">Nothing uploaded yet. Upload an image to use it here.</p>;
  }

  return (
    <>
      <SearchInput value={search} onValueChange={setSearch} placeholder="Search by file name" />

      {matching.length === 0 && <p className="text-muted text-sm">No file name matches "{search}".</p>}

      <div className="grid grid-cols-2 gap-3">
        {matching.map((file) => (
          <button
            key={file.id}
            type="button"
            onClick={() => onSelect(file)}
            className="hover:border-line-strong col cursor-pointer overflow-hidden rounded-lg border text-start"
          >
            <Thumbnail url={file.url} alt={file.name ?? 'Uploaded file'} background={background} className="h-24" />
            <span className="text-muted truncate border-t p-2 text-xs font-medium">{file.name ?? 'Untitled'}</span>
          </button>
        ))}
      </div>
    </>
  );
}
