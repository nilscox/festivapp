import { useNavigate, useSearch } from '@tanstack/react-router';

type SearchableRoute = '/festivals/$tenantId/people' | '/festivals/$tenantId/files';

export function useSearchParam(from: SearchableRoute) {
  const { search = '' } = useSearch({ from });
  const navigate = useNavigate({ from });

  const setSearch = (value: string) => {
    navigate({ search: (prev) => ({ ...prev, search: value || undefined }), replace: true });
  };

  return [search, setSearch] as const;
}
