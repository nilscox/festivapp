import clsx from 'clsx';
import { Tabs as RadixTabs } from 'radix-ui';

export const Tabs = { Root, List, Trigger, Content };

function Root(props: React.ComponentProps<typeof RadixTabs.Root>) {
  return <RadixTabs.Root {...props} />;
}

function List({ className, ...props }: React.ComponentProps<typeof RadixTabs.List>) {
  return (
    <RadixTabs.List className={clsx(className, 'inline-flex flex-row gap-2 bg-gray-200 rounded-md p-1')} {...props} />
  );
}

function Trigger(props: React.ComponentProps<typeof RadixTabs.Trigger>) {
  return (
    <RadixTabs.Trigger
      className="px-2 py-1 data-[state=active]:bg-white data-[state=active]:shadow rounded-sm cursor-pointer font-medium text-dim"
      {...props}
    />
  );
}

function Content(props: React.ComponentProps<typeof RadixTabs.Content>) {
  return <RadixTabs.Content {...props} />;
}
