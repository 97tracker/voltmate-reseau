import Link from "next/link";

export const metadata = {
  title: "Mentions légales — VoltMate",
  description: "Mentions légales du site et de l'application VoltMate, édités par Testpilot.",
};

export default function MentionsLegalesPage() {
  return (
    <div className="flex flex-col gap-6 py-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">Mentions légales</h1>
        <p className="mt-1 text-sm text-ink-500">Dernière mise à jour : 7 juillet 2026</p>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold text-ink-900">Éditeur du site</h2>
        <p className="text-sm text-ink-700">
          Le site voltmate-reseau.com et l&apos;application VoltMate sont édités par{" "}
          <strong>Testpilot</strong>, entreprise individuelle (micro-entrepreneur).
        </p>
        <div className="card">
          <p className="mb-1.5 text-sm text-ink-700">
            <strong>SIREN :</strong> 828 434 605
          </p>
          <p className="mb-1.5 text-sm text-ink-700">
            <strong>Contact :</strong>{" "}
            <a className="text-volt-600" href="mailto:contact@voltmate-reseau.com">
              contact@voltmate-reseau.com
            </a>
          </p>
          <p className="text-sm text-ink-700">
            <strong>Identité du responsable et adresse du siège social :</strong> communiquées sur
            simple demande écrite à{" "}
            <a className="text-volt-600" href="mailto:contact@voltmate-reseau.com">
              contact@voltmate-reseau.com
            </a>
            .
          </p>
        </div>
        <p className="text-xs italic text-ink-500">
          La loi pour la confiance dans l&apos;économie numérique (LCEN) impose en principe la
          publication du nom du responsable et de l&apos;adresse du siège social pour toute activité
          commerciale en ligne. Ces informations restent disponibles sans délai sur simple demande par
          email.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold text-ink-900">Directeur de la publication</h2>
        <p className="text-sm text-ink-700">
          Le responsable de la publication est le représentant légal de Testpilot ; son identité est
          communiquée sur demande à{" "}
          <a className="text-volt-600" href="mailto:contact@voltmate-reseau.com">
            contact@voltmate-reseau.com
          </a>
          .
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold text-ink-900">Hébergement</h2>
        <p className="text-sm text-ink-700">
          Le site et l&apos;application sont hébergés par :
          <br />
          Hetzner Online GmbH
          <br />
          Industriestr. 25, 91710 Gunzenhausen, Allemagne
          <br />
          <a
            className="text-volt-600"
            href="https://www.hetzner.com"
            target="_blank"
            rel="noopener"
          >
            www.hetzner.com
          </a>
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold text-ink-900">Propriété intellectuelle</h2>
        <p className="text-sm text-ink-700">
          L&apos;ensemble des contenus présents sur le site voltmate-reseau.com et l&apos;application
          VoltMate (textes, logo, charte graphique, structure) est la propriété de Testpilot, sauf
          mention contraire. Toute reproduction ou représentation, totale ou partielle, sans
          autorisation préalable est interdite.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold text-ink-900">Rôle de VoltMate et responsabilité</h2>
        <p className="text-sm text-ink-700">
          VoltMate est un service communautaire d&apos;information sur l&apos;état des bornes de
          recharge pour véhicules électriques. Les statuts, scores de fiabilité, prix estimés et
          commentaires affichés proviennent des signalements des utilisateurs et sont donnés à titre
          indicatif : ils peuvent ne plus refléter l&apos;état réel d&apos;une borne au moment de la
          consultation. VoltMate ne gère, n&apos;exploite ni ne loue aucune borne de recharge et
          n&apos;est pas partie prenante à la relation entre l&apos;utilisateur et l&apos;opérateur de
          la borne.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold text-ink-900">Contact</h2>
        <p className="text-sm text-ink-700">
          Pour toute question relative au site, à l&apos;application ou à ces mentions légales :{" "}
          <a className="text-volt-600" href="mailto:contact@voltmate-reseau.com">
            contact@voltmate-reseau.com
          </a>
          .
        </p>
      </section>

      <nav className="flex flex-wrap gap-4 border-t border-slate-100 pt-4 text-sm font-medium text-ink-500">
        <Link className="hover:text-volt-600" href="/confidentialite">
          Confidentialité
        </Link>
        <Link className="hover:text-volt-600" href="/contact">
          Contact
        </Link>
      </nav>
    </div>
  );
}
