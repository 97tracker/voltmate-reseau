import Link from "next/link";
import { Bot, Camera, MapPin, MessageCircle, QrCode, Radar, TrendingUp, Zap } from "lucide-react";

const REASONS = [
  {
    icon: Radar,
    title: "Signalements en temps réel",
    text: "Bornes occupées, lentes ou en panne : la communauté partage l'état réel, pas seulement la théorie.",
  },
  {
    icon: TrendingUp,
    title: "Score de fiabilité",
    text: "Chaque borne a un score calculé à partir des derniers signalements, pour savoir en un coup d'œil si elle tient ses promesses.",
  },
  {
    icon: Bot,
    title: "Assistant intelligent",
    text: "Posez vos questions : Puis-je charger ici ? Combien de batterie pour 120 km ?",
  },
  {
    icon: QrCode,
    title: "Un QR code par borne",
    text: "Scannez le sticker collé près d'une borne pour accéder directement à sa fiche et la noter.",
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col gap-10">
      <section className="hero-shell px-6 py-14">
        <div className="hero-grid" />
        <div className="hero-scanline animate-scan" />
        <div className="hero-blob left-[-10%] top-[-10%] h-64 w-64 bg-volt-500 animate-drift" />
        <div className="hero-blob right-[-15%] bottom-[-15%] h-72 w-72 bg-cyan-400 animate-drift-slow" />

        <div className="relative flex flex-col items-center gap-5 text-center">
          <div className="relative flex h-20 w-20 items-center justify-center">
            <span className="hero-ring absolute inset-0 animate-pulse-ring" />
            <span className="hero-ring absolute inset-0 animate-pulse-ring [animation-delay:0.8s]" />
            <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-volt-500 text-white shadow-[0_0_30px_rgba(34,197,94,0.65)]">
              <Zap className="h-8 w-8" strokeWidth={2.25} />
            </span>
          </div>

          <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
            VoltMate
          </h1>
          <p className="text-lg font-medium text-volt-400">Recharge smarter. Drive calmer.</p>
          <p className="max-w-md text-sm text-slate-300">
            L&apos;assistant communautaire des conducteurs de voitures électriques. Signalez l&apos;état
            réel des bornes, consultez leur fiabilité, et trouvez toujours une meilleure solution pour
            charger.
          </p>

          <div className="mt-2 flex w-full max-w-sm flex-col gap-3">
            <Link href="/map" className="btn-primary w-full">
              <MapPin className="h-5 w-5" />
              Trouver une borne
            </Link>
            <Link
              href="/station/new"
              className="btn w-full border border-white/15 bg-white/5 text-white backdrop-blur hover:bg-white/10"
            >
              <Radar className="h-5 w-5" />
              Signaler une borne
            </Link>
          </div>
        </div>
      </section>

      <section className="card flex items-center gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-volt-100 text-volt-700">
          <Camera className="h-5 w-5" />
        </span>
        <p className="text-sm font-medium text-ink-700">
          Scannez le QR code près d&apos;une borne et aidez les autres conducteurs à savoir si elle
          fonctionne vraiment.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold text-ink-900">Pourquoi utiliser VoltMate ?</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {REASONS.map((reason) => (
            <div key={reason.title} className="card">
              <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-volt-100 text-volt-700">
                <reason.icon className="h-5 w-5" />
              </span>
              <h3 className="font-semibold text-ink-900">{reason.title}</h3>
              <p className="mt-1 text-sm text-ink-500">{reason.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card flex flex-col items-center gap-3 text-center">
        <h2 className="text-lg font-bold text-ink-900">Envie d&apos;aller plus loin ?</h2>
        <p className="text-sm text-ink-500">
          Demandez conseil à l&apos;assistant VoltMate : fiabilité d&apos;une borne, autonomie
          nécessaire pour un trajet, ou meilleure stratégie de charge.
        </p>
        <Link href="/assistant" className="btn-primary">
          <MessageCircle className="h-5 w-5" />
          Parler à l&apos;assistant
        </Link>
      </section>

      <footer className="flex flex-wrap justify-center gap-4 border-t border-slate-100 pt-4 text-xs font-medium text-ink-500">
        <Link className="hover:text-volt-600" href="/mentions-legales">
          Mentions légales
        </Link>
        <Link className="hover:text-volt-600" href="/confidentialite">
          Confidentialité
        </Link>
        <Link className="hover:text-volt-600" href="/contact">
          Contact
        </Link>
      </footer>
    </div>
  );
}
