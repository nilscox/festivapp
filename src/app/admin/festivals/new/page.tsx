import Link from 'next/link';

import { CreateFestivalForm } from './create-festival-form';

export default function NewFestivalPage() {
  return (
    <>
      <div className="row items-center gap-2 text-sm text-dim">
        <Link href="/admin">Festivals</Link>
        <span>/</span>
        <span>New</span>
      </div>

      <h1 className="my-4">New festival</h1>

      <CreateFestivalForm />
    </>
  );
}
