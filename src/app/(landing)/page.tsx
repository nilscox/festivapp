import { Bell, Calendar, LucideIcon, Map, MessageCircle, Palette, Radio } from 'lucide-react';

const features: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: Radio,
    title: 'Vue en direct',
    description: 'Consultez ce qui se passe en ce moment sur chaque scène, et anticipez la suite.',
  },
  {
    icon: Calendar,
    title: 'Programme',
    description: 'Parcourez le planning complet et construisez votre agenda personnalisé.',
  },
  {
    icon: Map,
    title: 'Carte interactive',
    description: "Naviguez sur le site, filtrez les points d'intérêt et ne vous perdez plus.",
  },
  {
    icon: MessageCircle,
    title: 'Fil social',
    description: 'Partagez vos réactions et échangez avec les autres participants en temps réel.',
  },
  {
    icon: Bell,
    title: 'Notifications',
    description: 'Recevez les annonces des organisateurs instantanément — changements, alertes, infos pratiques.',
  },
  {
    icon: Palette,
    title: 'White-label',
    description:
      'Chaque événement dispose de sa propre identité visuelle. Couleurs, logo, contenu — tout est personnalisable.',
  },
];

function Button({
  href,
  variant = 'primary',
  children,
}: {
  href: string;
  variant?: 'primary' | 'outline';
  children: React.ReactNode;
}) {
  const base =
    'inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer active:scale-95';
  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm',
    outline: 'border border-slate-300 text-slate-700 hover:border-indigo-400 hover:text-indigo-600',
  };
  return (
    <a href={href} className={`${base} ${variants[variant]}`}>
      {children}
    </a>
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

function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <span className="text-xl font-extrabold tracking-tight text-indigo-600">FestivApp</span>
        <Button href="#contact" variant="outline">
          Nous contacter
        </Button>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="bg-linear-to-b from-indigo-50 to-white px-6 py-28 text-center">
      <div className="mx-auto max-w-3xl">
        <span className="text-xs font-semibold tracking-widest text-indigo-500 uppercase">
          Festivals, conférences, ateliers &amp; plus
        </span>
        <h1 className="mt-4 text-5xl leading-tight font-extrabold tracking-tight text-slate-900">
          Votre événement,
          <br />
          dans votre poche.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-slate-500">
          FestivApp est une application mobile white-label qui donne à vos participants tout ce dont ils ont besoin —
          programme, carte, fil social et mises à jour en direct.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Button href="#contact">Démarrer</Button>
          <Button href="#demo" variant="outline">
            Voir la démo
          </Button>
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section className="bg-slate-50 px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900">Tout en une seule app</h2>
        <p className="mt-3 text-center text-slate-500">Conçue pour les participants. Pensée pour les organisateurs.</p>
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Organizers() {
  return (
    <section className="px-6 py-24 text-center">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Une plateforme, tous vos événements</h2>
        <p className="mx-auto mt-4 max-w-xl leading-relaxed text-slate-500">
          FestivApp est une plateforme multi-tenant. Chaque événement bénéficie de sa propre expérience de marque, gérée
          depuis un back-office dédié. Un événement ou cent — l'architecture s'adapte.
        </p>
        <div className="mt-10">
          <Button href="#contact">Parlons-en</Button>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6 text-sm text-slate-400">
        <span>© 2025 FestivApp</span>
        <span>Fait pour les créateurs d'événements</span>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900 antialiased">
      <Nav />
      <Hero />
      <Features />
      <Organizers />
      <Footer />
    </div>
  );
}
