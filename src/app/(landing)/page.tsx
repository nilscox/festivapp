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
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow duration-200 space-y-3">
      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
        <Icon size={20} />
      </div>
      <h3 className="font-semibold text-slate-800">{title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
    </div>
  );
}

function Nav() {
  return (
    <header className="border-b border-slate-200 sticky top-0 bg-white/90 backdrop-blur z-50">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
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
    <section className="py-28 px-6 text-center bg-linear-to-b from-indigo-50 to-white">
      <div className="max-w-3xl mx-auto">
        <span className="text-xs font-semibold uppercase tracking-widest text-indigo-500">
          Festivals, conférences, ateliers &amp; plus
        </span>
        <h1 className="mt-4 text-5xl font-extrabold tracking-tight leading-tight text-slate-900">
          Votre événement,
          <br />
          dans votre poche.
        </h1>
        <p className="mt-6 text-lg text-slate-500 max-w-xl mx-auto leading-relaxed">
          FestivApp est une application mobile white-label qui donne à vos participants tout ce dont ils ont besoin —
          programme, carte, fil social et mises à jour en direct.
        </p>
        <div className="mt-10 flex justify-center gap-4 flex-wrap">
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
    <section className="py-24 px-6 bg-slate-50">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 text-center">Tout en une seule app</h2>
        <p className="mt-3 text-slate-500 text-center">Conçue pour les participants. Pensée pour les organisateurs.</p>
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
    <section className="py-24 px-6 text-center">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Une plateforme, tous vos événements</h2>
        <p className="mt-4 text-slate-500 max-w-xl mx-auto leading-relaxed">
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
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between text-sm text-slate-400">
        <span>© 2025 FestivApp</span>
        <span>Fait pour les créateurs d'événements</span>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 antialiased">
      <Nav />
      <Hero />
      <Features />
      <Organizers />
      <Footer />
    </div>
  );
}
