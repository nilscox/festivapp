import type { TenantSummary, UploadedFile } from '@festivapp/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useRouteContext, useSearch } from '@tanstack/react-router';
import { format } from 'date-fns';
import { Image, SearchX, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import { Button, IconButton } from '../components/button.tsx';
import { ConfirmDialog } from '../components/confirm-dialog.tsx';
import { EmptyState } from '../components/empty-state.tsx';
import { Page, PageHeader } from '../components/page.tsx';
import { SearchInput } from '../components/search-input.tsx';
import { Spinner } from '../components/spinner.tsx';
import { Thumbnail } from '../components/thumbnail.tsx';
import { UploadButton } from '../components/upload-button.tsx';
import { ApiError } from '../lib/api.ts';
import { deleteFileOptions, listFilesOptions } from '../lib/files.ts';
import { getThemeOptions } from '../lib/theme.ts';
import { assert, formatBytes, matchesSearch } from '../utils.ts';

const from = '/festivals/$tenantId/files';

export function Files() {
  const { tenant } = useRouteContext({ from });

  const { isPending, isError, isSuccess, data, error } = useQuery(listFilesOptions(tenant.id));
  const theme = useQuery(getThemeOptions(tenant.id));
  const files = data ?? [];

  return (
    <Page header={<Header tenant={tenant} showUpload={files.length > 0} />}>
      {isPending && <Spinner className="mx-auto my-8 size-6" />}

      {isError && <>Error: {error.message}</>}

      {isSuccess &&
        (files.length === 0 ? (
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
        ) : (
          <FilesList tenant={tenant} files={files} background={theme.data?.backgroundColor} />
        ))}
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
    ...deleteFileOptions(tenant.id),
    onSuccess: () => queryClient.invalidateQueries(listFilesOptions(tenant.id)),
    onError: (error) => {
      if (ApiError.is(error, 409)) {
        toast.error('This file is used, change it first.');
      } else {
        toast.error(error.message);
      }
    },
  });

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmDeleteTarget, setConfirmDeleteTarget] = useState<UploadedFile | null>(null);

  const onDelete = (file: UploadedFile) => {
    setConfirmDeleteOpen(true);
    setConfirmDeleteTarget(file);
  };

  const { search = '' } = useSearch({ from });
  const navigate = useNavigate({ from });

  const onSearch = (value: string) => {
    navigate({ search: { search: value || undefined }, replace: true });
  };

  const matching = useMemo(() => {
    return files.filter((file) => matchesSearch(search, file.name));
  }, [files, search]);

  return (
    <div className="reveal">
      <SearchInput
        value={search}
        onValueChange={onSearch}
        placeholder="Search by file name"
        className="mb-4 md:max-w-96"
      />

      <p className="text-muted mb-3 font-mono text-xs tracking-wide">
        {search === '' ? (
          <>
            {files.length} file{files.length === 1 ? '' : 's'} &bull; served from your festival's own domain, so they
            work offline
          </>
        ) : (
          <>
            {matching.length} of {files.length} &bull; matching "{search}"
          </>
        )}
      </p>

      {matching.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No file matches that"
          description="No uploaded file has a name matching this search. Try a shorter or different term."
          cta={
            <Button variant="secondary" onClick={() => onSearch('')}>
              Clear search
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {matching.map((file) => (
            <FileCard key={file.id} file={file} background={background} onDelete={() => onDelete(file)} />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={(open) => !open && setConfirmDeleteOpen(false)}
        onOpenChangeComplete={(open) => !open && setConfirmDeleteTarget(null)}
        title={`Delete "${confirmDeleteTarget?.name ?? 'this file'}"?`}
        description="Anything still pointing at this file will show a broken image. This can't be undone."
        confirmLabel="Delete"
        pending={deleteMutation.isPending}
        onConfirm={() => {
          assert(confirmDeleteTarget);

          deleteMutation.mutate(confirmDeleteTarget.id, {
            onSettled: () => setConfirmDeleteOpen(false),
          });
        }}
      />
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
