import { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { Bell, Calendar, LucideIcon, Map, MessageCircle, Palette, Radio } from 'lucide-react';

export function Features() {
  const { t } = useLingui();

  return (
    <section className="bg-slate-50 px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900">
          <Trans>Everything in one app</Trans>
        </h2>

        <p className="mt-3 text-center text-slate-500">
          <Trans>Built for attendees. Designed for organisers.</Trans>
        </p>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <FeatureCard key={t(f.title)} icon={f.icon} title={t(f.title)} description={t(f.description)} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return (
    <div className="space-y-3 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-shadow duration-200 hover:shadow-md">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
        <Icon size={20} />
      </div>

      <h3 className="font-semibold text-slate-800">{title}</h3>

      <p className="text-sm leading-relaxed text-slate-500">{description}</p>
    </div>
  );
}

const features: { icon: LucideIcon; title: MessageDescriptor; description: MessageDescriptor }[] = [
  {
    icon: Radio,
    title: msg`Live view`,
    description: msg`See what's happening right now on each stage, and plan what's next.`,
  },
  {
    icon: Calendar,
    title: msg`Schedule`,
    description: msg`Browse the full programme and build your personalised agenda.`,
  },
  {
    icon: Map,
    title: msg`Interactive map`,
    description: msg`Navigate the venue, filter points of interest and never get lost.`,
  },
  {
    icon: MessageCircle,
    title: msg`Social feed`,
    description: msg`Share your reactions and connect with other attendees in real time.`,
  },
  {
    icon: Bell,
    title: msg`Notifications`,
    description: msg`Receive organiser announcements instantly — changes, alerts, practical info.`,
  },
  {
    icon: Palette,
    title: msg`White-label`,
    description: msg`Each event has its own visual identity. Colours, logo, content — everything is customisable.`,
  },
];
