import type { TenantSummary, UploadedFile } from '@festivapp/contracts';
import { formatBytes, matchesSearch } from '@festivapp/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouteContext } from '@tanstack/react-router';
import { format } from 'date-fns';
import { Image, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { IconButton } from '../components/button.tsx';
import { useConfirmDialog } from '../components/confirm-dialog.tsx';
import { EmptyState } from '../components/empty-state.tsx';
import { Page, PageHeader } from '../components/page.tsx';
import { QueryBoundary } from '../components/query-boundary.tsx';
import { NoMatch, SearchInput, SearchSummary } from '../components/search.tsx';
import { Thumbnail } from '../components/thumbnail.tsx';
import { UploadButton } from '../components/upload-button.tsx';
import { useSearchParam } from '../hooks/use-search-param.ts';
import { api, ApiError } from '../lib/api.ts';
import { getThemeOptions, listFilesOptions } from '../lib/queries.ts';

const from = '/festivals/$tenantId/files';

export function Files() {
  const { tenant } = useRouteContext({ from });

  const query = useQuery(listFilesOptions(tenant.id));
  const theme = useQuery(getThemeOptions(tenant.id));

  return (
    <Page header={<Header tenant={tenant} showUpload={Boolean(query.data?.length)} />}>
      <QueryBoundary query={query}>
        {(files) => <FilesList tenant={tenant} files={files} background={theme.data?.backgroundColor} />}
      </QueryBoundary>
    </Page>
  );
}

function Header({ tenant, showUpload }: { tenant: TenantSummary; showUpload: boolean }) {
  return (
    <PageHeader
      eyebrow={tenant.name}
      title="Files"
      end={showUpload && <UploadButton tenantId={tenant.id} multiple />}
    />
  );
}

function FilesList({
  tenant,
  files,
  background,
}: {
  tenant: TenantSummary;
  files: UploadedFile[];
  background?: string;
}) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete<void>(`/admin/tenants/${tenant.id}/files/${id}`),
    onSuccess: () => queryClient.invalidateQueries(listFilesOptions(tenant.id)),
    onError: (error) => {
      if (ApiError.is(error, 409)) {
        toast.error('This file is used, change it first.');
      } else {
        toast.error(error.message);
      }
    },
  });

  const confirm = useConfirmDialog();

  const onDelete = (file: UploadedFile) => {
    confirm({
      title: `Delete "${file.name ?? 'this file'}"?`,
      description: "Anything still pointing at this file will show a broken image. This can't be undone.",
      confirmLabel: 'Delete',
      onConfirm: () => deleteMutation.mutateAsync(file.id),
    });
  };

  const [search = '', setSearch] = useSearchParam({ from, name: 'search' });
  const matching = files.filter((file) => matchesSearch(search, file.name));

  if (files.length === 0) {
    return (
      <EmptyState
        icon={Image}
        title="No files yet"
        description="Upload the images this festival needs — a wordmark, a square icon, a background. Once uploaded, you can pick them straight from the theme page."
        cta={
          <UploadButton tenantId={tenant.id} multiple>
            Upload files
          </UploadButton>
        }
      />
    );
  }

  return (
    <div className="col gap-4">
      <SearchInput value={search} onValueChange={setSearch} placeholder="Search by file name" className="md:max-w-96" />

      <SearchSummary search={search} items={files} matching={matching}>
        {files.length} file{files.length === 1 ? '' : 's'} &bull; served from your festival's own domain, so they work
        offline
      </SearchSummary>

      {matching.length === 0 && (
        <NoMatch
          title="No file matches that"
          description="No uploaded file has a name matching this search. Try a shorter or different term."
          onClear={() => setSearch('')}
        />
      )}

      {matching.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {matching.map((file) => (
            <FileCard key={file.id} file={file} background={background} onDelete={() => onDelete(file)} />
          ))}
        </div>
      )}
    </div>
  );
}

function FileCard({ file, background, onDelete }: { file: UploadedFile; background?: string; onDelete: () => void }) {
  return (
    <div className="col overflow-hidden rounded-xl border">
      <Thumbnail
        url={file.url}
        alt={file.name ?? 'Uploaded file'}
        fit="cover"
        background={background}
        className="h-36 rounded-b-none"
      />

      <div className="row items-center justify-between gap-4 border-t p-3">
        <div className="col gap-1">
          <span className="truncate text-sm font-medium">{file.name ?? 'Untitled'}</span>
          <span className="text-faint text-xxs font-mono">
            {formatBytes(file.size)} &bull; {format(new Date(file.createdAt), 'd MMM yyyy')}
          </span>
        </div>

        <IconButton
          icon={Trash2}
          variant="ghost"
          aria-label={`Delete ${file.name ?? 'file'}`}
          onClick={onDelete}
          className="hover:text-danger"
        />
      </div>
    </div>
  );
}
