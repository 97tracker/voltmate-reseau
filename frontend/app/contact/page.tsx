import Link from "next/link";
import { Mail } from "lucide-react";

export const metadata = {
  title: "Contact — VoltMate",
  description: "Contactez l'équipe VoltMate.",
};

export default function ContactPage() {
  return (
    <div className="flex flex-col items-center gap-4 py-10 text-center">
      <h1 className="text-2xl font-bold tracking-tight text-ink-900">Une question, une suggestion ?</h1>
      <p className="max-w-sm text-sm text-ink-500">
        L&apos;équipe VoltMate vous répond directement — pas de formulaire, pas de robot.
      </p>

      <div className="card mt-2 flex w-full max-w-sm flex-col items-center gap-3 py-8">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-volt-100 text-volt-700">
          <Mail className="h-5 w-5" />
        </span>
        <p className="text-sm text-ink-500">Écrivez-nous à</p>
        <a className="btn-primary" href="mailto:contact@voltmate-reseau.com">
          contact@voltmate-reseau.com
        </a>
      </div>

      <p className="max-w-sm text-xs text-ink-500">
        Support, partenariats, suggestions produit : c&apos;est la même adresse pour tout. Nous
        répondons généralement sous 48h ouvrées.
      </p>

      <nav className="mt-6 flex flex-wrap justify-center gap-4 text-sm font-medium text-ink-500">
        <Link className="hover:text-volt-600" href="/mentions-legales">
          Mentions légales
        </Link>
        <Link className="hover:text-volt-600" href="/confidentialite">
          Confidentialité
        </Link>
      </nav>
    </div>
  );
}
