import type { Message } from '@festivapp/contracts';
import { Bell, BellOff, Megaphone } from 'lucide-react';

import { Banner, BannerButton } from '../../components/banner.tsx';
import { PageHeader } from '../../components/page-header.tsx';
import { useMessages, useTenant } from '../../lib/bootstrap.ts';
import { formatMessageDate } from '../../lib/datetime.ts';
import { usePushSubscription } from '../../lib/push.ts';

export function InfoPage() {
  const messages = useMessages();

  return (
    <div className="col min-h-0 flex-1">
      <PageHeader
        title="Info"
        subtitle={<div className="text-faint font-mono text-xs uppercase">Word from the organizers</div>}
      />

      <div className="reveal min-h-0 flex-1 overflow-y-auto pb-6">
        <NotificationSetting />

        {messages.length === 0 ? (
          <NoMessages />
        ) : (
          messages.map((message) => <Message key={message.id} message={message} />)
        )}
      </div>
    </div>
  );
}

function NotificationSetting() {
  const { supported, permission, subscribed, enable, disable } = usePushSubscription();

  if (!supported || permission === 'denied') {
    return null;
  }

  return (
    <Banner
      variant="secondary"
      inline
      icon={subscribed ? Bell : BellOff}
      title="Notifications"
      description={
        subscribed ? 'This device gets a notification for every message.' : 'Get notified when a message is posted.'
      }
      actions={
        <BannerButton onClick={() => void (subscribed ? disable() : enable())}>
          {subscribed ? 'Turn off' : 'Turn on'}
        </BannerButton>
      }
    />
  );
}

function Message({ message }: { message: Message }) {
  const { timezone } = useTenant();

  return (
    <article className="p-4">
      <div className="text-faint mb-2 font-mono text-xs">{formatMessageDate(message.createdAt, timezone)}</div>
      <h2 className="font-display text-accent mb-1 text-lg font-bold tracking-tight">{message.title}</h2>
      <p className="text-ink-soft text-sm leading-relaxed whitespace-pre-line">{message.body}</p>
    </article>
  );
}

function NoMessages() {
  return (
    <div className="col mx-auto max-w-64 items-center justify-center gap-4 px-4 py-10 text-center">
      <div className="border-line text-muted bg-surface flex size-16 items-center justify-center rounded-2xl border">
        <Megaphone className="size-8" />
      </div>

      <div>
        <div className="font-display mb-1 text-lg font-semibold">Nothing yet</div>
        <div className="text-muted text-sm">Messages from the organizers will show up here.</div>
      </div>
    </div>
  );
}
