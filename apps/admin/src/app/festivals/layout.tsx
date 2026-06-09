import { getAuthUser } from '@/server-utils';

export default async function Layout({ children }: LayoutProps<'/festivals'>) {
  await getAuthUser();

  return children;
}
