import clsx from 'clsx';
import { Tabs as RadixTabs } from 'radix-ui';

export const Tabs = { Root, List, Trigger, Content };

function Root(props: React.ComponentProps<typeof RadixTabs.Root>) {
  return <RadixTabs.Root {...props} />;
}

function List({ className, ...props }: React.ComponentProps<typeof RadixTabs.List>) {
  return (
    <RadixTabs.List className={clsx(className, 'inline-flex flex-row gap-2 rounded-md bg-gray-200 p-1')} {...props} />
  );
}

function Trigger(props: React.ComponentProps<typeof RadixTabs.Trigger>) {
  return (
    <RadixTabs.Trigger
      className={clsx(
        'cursor-pointer rounded-sm px-2 py-1 font-medium text-dim transition-colors',
        'data-[state=active]:bg-white data-[state=active]:shadow',
        'not-data-[state=active]:hover:bg-white/50',
      )}
      {...props}
    />
  );
}

function Content(props: React.ComponentProps<typeof RadixTabs.Content>) {
  return <RadixTabs.Content {...props} />;
}
