import clsx from 'clsx';

export function Input({ className, ...props }: React.ComponentProps<'input'>) {
  return <input className={clsx(className, 'rounded-md border border-gray-400 px-2 py-1')} {...props} />;
}
