import { Field } from '@base-ui/react/field';
import clsx from 'clsx';

export function Input({ className, ...props }: React.ComponentProps<'input'>) {
  return (
    <Field.Control
      {...props}
      className={clsx(
        'text-form bg-surface text-ink data-invalid:border-danger hover:border-line-strong h-11 w-full rounded-lg border px-3',
        className,
      )}
    />
  );
}
