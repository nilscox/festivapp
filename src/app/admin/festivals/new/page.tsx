import { Breadcrumb } from '../../components/breadcrumb';
import { CreateFestivalForm } from './create-festival-form';

export default function NewFestivalPage() {
  return (
    <>
      <Breadcrumb parts={[{ label: 'Festivals', href: '/admin' }, { label: 'New' }]} />

      <h1 className="my-4">New festival</h1>

      <CreateFestivalForm />
    </>
  );
}
