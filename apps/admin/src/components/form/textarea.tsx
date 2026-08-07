import { Field } from '@base-ui/react/field';
import clsx from 'clsx';

export function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <Field.Control
      render={
        <textarea
          {...props}
          className={clsx(
            'text-form bg-surface text-ink data-invalid:border-danger hover:border-line-strong w-full rounded-lg border px-3 py-2',
            className,
          )}
        />
      }
    />
  );
}
