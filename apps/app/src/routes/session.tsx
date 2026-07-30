import type { Location, Participant, Session } from '@festivapp/contracts';
import { defined, has } from '@festivapp/utils';
import { Link, useParams } from '@tanstack/react-router';
import { Calendar, ChevronLeft, Disc3, Map, MapPin } from 'lucide-react';

import { Chip } from '../components/chip.tsx';
import { SocialIcon } from '../components/social-icon.tsx';
import { useBootstrap, useTenant, type ResolvedSession } from '../lib/bootstrap.ts';
import { formatDayLabel, formatTime } from '../lib/datetime.ts';
import { formatSessionType, isMusicSession, sessionSubhead, sessionTitle } from '../lib/session.ts';

export function SessionDetail() {
  const { sessionId } = useParams({ from: '/session/$sessionId' });
  const { sessions } = useBootstrap();

  const session = sessions.find(has('id', sessionId));

  if (!session) {
    return <SessionNotFound />;
  }

  const participants = session.participants;
  const isMusic = isMusicSession(session.type);

  const content = () => {
    if (isMusic) {
      if (participants.length === 1) {
        return <SingleArtistDetails session={session} artist={defined(session.participants[0])} />;
      } else {
        return <>Multiple artists.</>;
      }
    }

    return <DefaultSessionDetails session={session} />;
  };

  return (
    <div className="col min-h-0 flex-1">
      <Header />
      <div className="reveal min-h-0 flex-1 overflow-y-auto pb-8">{content()}</div>
    </div>
  );
}

function SessionNotFound() {
  return (
    <div className="col flex-1 items-center justify-center gap-4 py-8 text-center">
      <p className="text-muted text-sm">This session was not found.</p>
      <Link to="/timetable" className="text-accent font-mono text-xs tracking-wider uppercase">
        Back to timetable
      </Link>
    </div>
  );
}

function Header() {
  return (
    <header className="border-line bg-app border-b p-4">
      <Link to="/timetable" className="row items-center gap-2">
        <ChevronLeft className="size-4 shrink-0" />
        <span className="leading-none font-semibold">Back</span>
      </Link>
    </header>
  );
}

function MainInfo({ session }: { session: ResolvedSession }) {
  const subhead = sessionSubhead(session);

  return (
    <div className="px-4 pt-5">
      <div className="flex items-center gap-2.5">
        <Chip>{formatSessionType(session.type)}</Chip>
      </div>

      <h1 className="font-display mt-3 text-3xl leading-tight font-bold tracking-tight">{sessionTitle(session)}</h1>

      {subhead && <p className="text-muted mt-2">{subhead}</p>}
    </div>
  );
}

function SingleArtistDetails({
  session,
  artist,
}: {
  session: Session & { location: Location; participants: Participant[] };
  artist: Participant;
}) {
  return (
    <>
      <ArtistImage artist={artist} />
      <MainInfo session={session} />

      <div className="px-4 pt-5">
        <MetaWhen session={session} />
        <MetaWhere location={session.location} />
        {artist.origin && <MetaRow icon={Map} label="Origin" value={artist.origin} />}
        {artist.label && <MetaRow icon={Disc3} label="Label" value={artist.label} />}
      </div>

      <Styles styles={artist.styles} />
      <About description={session.description ?? artist.description} />
      <Follow links={artist.socialLinks} />
    </>
  );
}

function ArtistImage({ artist }: { artist: Participant }) {
  if (artist?.imageUrl) {
    return (
      <img src={artist.imageUrl} alt={artist.name} className="border-line max-h-92 w-full border-b object-cover" />
    );
  }

  return (
    <div className="hatch-lg border-line flex h-56 items-end justify-center border-b">
      <span className="text-faint pb-4 font-mono text-xs tracking-widest uppercase">Artist image</span>
    </div>
  );
}

function MetaWhen({ session }: { session: Session }) {
  const { timezone } = useTenant();

  return (
    <MetaRow
      icon={Calendar}
      label="When"
      value={
        <span className="flex items-center gap-2">
          <span>{formatDayLabel(session.startsAt, timezone)}</span>
          <span>&bull;</span>
          <span className="flex items-center gap-2">
            {[formatTime(session.startsAt, timezone), formatTime(session.endsAt, timezone)].join(' - ')}
          </span>
        </span>
      }
    />
  );
}

function MetaWhere({ location }: { location: Location }) {
  return (
    <MetaRow
      icon={MapPin}
      label="Where"
      value={
        <Link to="/map" search={{ location: location.id }}>
          {location.name}
        </Link>
      }
    />
  );
}

function MetaRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: React.ReactNode;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      <Icon className="size-5" />
      <div className="flex flex-col gap-0.5">
        <span className="text-xxs text-muted shrink-0 pt-0.5 font-mono tracking-wider uppercase">{label}</span>
        <span className="font-medium">{value}</span>
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="px-4 pt-6">
      <h2 className="text-muted mb-3 font-mono text-xs tracking-widest uppercase">{label}</h2>
      {children}
    </section>
  );
}

function Styles({ styles }: { styles: string[] }) {
  if (styles.length === 0) {
    return null;
  }

  return <Section label="Styles">{styles.join(' / ')}</Section>;
}

function About({ description }: { description: React.ReactNode }) {
  if (!description) {
    return null;
  }

  return (
    <Section label="About">
      <p className="text-ink-soft text-sm leading-relaxed whitespace-pre-line">{description}</p>
    </Section>
  );
}

function Follow({ links }: { links: string[] }) {
  if (links.length === 0) {
    return null;
  }

  return (
    <Section label="Follow">
      <SocialLinks links={links} />
    </Section>
  );
}

function SocialLinks({ links }: { links: string[] }) {
  return (
    <div className="col">
      {links.map((link) => (
        <a
          key={link}
          href={link}
          target="_blank"
          rel="noreferrer"
          className="border-line row items-center gap-2 border-t py-2"
        >
          <div className="bg-chip rounded-md p-2">
            <SocialIcon url={link} className="fill-accent size-5" />
          </div>
          <span className="text-muted truncate text-sm font-medium">{link}</span>
        </a>
      ))}
    </div>
  );
}

function DefaultSessionDetails({
  session,
}: {
  session: Session & { location: Location; participants: Participant[] };
}) {
  return (
    <>
      <MainInfo session={session} />

      <div className="px-4 pt-5">
        <MetaWhen session={session} />
        <MetaWhere location={session.location} />
      </div>

      <About description={session.description} />
    </>
  );
}
