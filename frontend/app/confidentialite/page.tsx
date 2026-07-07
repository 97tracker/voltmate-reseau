import Link from "next/link";

export const metadata = {
  title: "Confidentialité — VoltMate",
  description: "Politique de confidentialité de VoltMate : données collectées, finalités, droits RGPD.",
};

const ROWS = [
  {
    donnee: "Email, mot de passe (haché)",
    quand: "Création de compte",
    finalite: "Authentification",
  },
  {
    donnee: "Signalements (statut, prix estimé, commentaire)",
    quand: "Signalement d'une borne, connecté ou non",
    finalite: "Calcul du score de fiabilité, affichage aux autres utilisateurs",
  },
  {
    donnee: "Photos jointes à un signalement",
    quand: "Ajout d'une photo",
    finalite: "Illustrer l'état réel de la borne",
  },
  {
    donnee: "Position géographique",
    quand: "Recherche de bornes à proximité",
    finalite: "Afficher les bornes les plus proches sur la carte",
  },
  {
    donnee: "Points, badges",
    quand: "Utilisation de l'app avec un compte",
    finalite: "Gamification, valorisation des contributions",
  },
];

export default function ConfidentialitePage() {
  return (
    <div className="flex flex-col gap-6 py-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">Politique de confidentialité</h1>
        <p className="mt-1 text-sm text-ink-500">Dernière mise à jour : 7 juillet 2026</p>
      </div>

      <p className="text-sm text-ink-700">
        Testpilot, éditeur de VoltMate, attache une attention particulière à la protection de vos
        données personnelles. Cette page explique quelles données sont collectées, pourquoi, et
        comment exercer vos droits.
      </p>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold text-ink-900">Responsable du traitement</h2>
        <p className="text-sm text-ink-700">
          Testpilot —{" "}
          <a className="text-volt-600" href="mailto:contact@voltmate-reseau.com">
            contact@voltmate-reseau.com
          </a>
          .
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold text-ink-900">Données collectées</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-sm">
            <thead>
              <tr>
                <th className="border-b border-slate-200 py-2 pr-3 text-left text-xs font-bold uppercase tracking-wide text-ink-500">
                  Donnée
                </th>
                <th className="border-b border-slate-200 py-2 pr-3 text-left text-xs font-bold uppercase tracking-wide text-ink-500">
                  Quand
                </th>
                <th className="border-b border-slate-200 py-2 text-left text-xs font-bold uppercase tracking-wide text-ink-500">
                  Finalité
                </th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.donnee}>
                  <td className="border-b border-slate-100 py-2 pr-3 align-top text-ink-700">
                    {row.donnee}
                  </td>
                  <td className="border-b border-slate-100 py-2 pr-3 align-top text-ink-700">
                    {row.quand}
                  </td>
                  <td className="border-b border-slate-100 py-2 align-top text-ink-700">
                    {row.finalite}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-ink-700">
          Le mot de passe n&apos;est jamais stocké en clair (hachage bcrypt). Le signalement, l&apos;ajout
          d&apos;une borne et l&apos;envoi de photos ou commentaires sont possibles sans créer de
          compte : dans ce cas, aucune donnée d&apos;identification personnelle n&apos;est associée à la
          contribution.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold text-ink-900">Base légale</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-ink-700">
          <li>
            <strong>Exécution du contrat</strong> : création de compte, signalements, points, badges.
          </li>
          <li>
            <strong>Intérêt légitime</strong> : prévention des abus, fiabilité des signalements,
            amélioration du service.
          </li>
          <li>
            <strong>Consentement</strong> : géolocalisation, notifications optionnelles.
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold text-ink-900">Destinataires des données</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-ink-700">
          <li>
            <strong>Hetzner Online GmbH</strong> (hébergement, Allemagne, Union Européenne).
          </li>
        </ul>
        <p className="text-sm text-ink-700">Aucune donnée personnelle n&apos;est vendue à des tiers.</p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold text-ink-900">Durée de conservation</h2>
        <p className="text-sm text-ink-700">
          Les données de compte sont conservées tant que le compte est actif. En cas de suppression de
          compte, les données personnelles sont supprimées, à l&apos;exception de ce que la loi impose
          de conserver. Les signalements et photos déjà publiés peuvent être conservés sous forme
          anonymisée pour maintenir l&apos;historique de fiabilité d&apos;une borne.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold text-ink-900">Vos droits</h2>
        <p className="text-sm text-ink-700">
          Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez d&apos;un
          droit d&apos;accès, de rectification, d&apos;effacement, de limitation, d&apos;opposition et de
          portabilité de vos données. Vous pouvez exercer ces droits à tout moment en écrivant à{" "}
          <a className="text-volt-600" href="mailto:contact@voltmate-reseau.com">
            contact@voltmate-reseau.com
          </a>
          . Vous disposez également du droit d&apos;introduire une réclamation auprès de la CNIL (
          <a className="text-volt-600" href="https://www.cnil.fr" target="_blank" rel="noopener">
            cnil.fr
          </a>
          ).
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold text-ink-900">Cookies</h2>
        <p className="text-sm text-ink-700">
          Le site voltmate-reseau.com n&apos;utilise aucun cookie publicitaire ou de suivi tiers.
          L&apos;application utilise un stockage local technique (session de connexion, préférences
          d&apos;affichage) nécessaire au fonctionnement du service.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold text-ink-900">Sécurité</h2>
        <p className="text-sm text-ink-700">
          Les échanges entre l&apos;application et nos serveurs sont chiffrés (HTTPS). Les mots de
          passe sont hachés et jamais stockés en clair. L&apos;accès aux données est restreint aux
          besoins du service.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold text-ink-900">Contact</h2>
        <p className="text-sm text-ink-700">
          Pour toute question relative à cette politique ou à vos données personnelles :{" "}
          <a className="text-volt-600" href="mailto:contact@voltmate-reseau.com">
            contact@voltmate-reseau.com
          </a>
          .
        </p>
      </section>

      <nav className="flex flex-wrap gap-4 border-t border-slate-100 pt-4 text-sm font-medium text-ink-500">
        <Link className="hover:text-volt-600" href="/mentions-legales">
          Mentions légales
        </Link>
        <Link className="hover:text-volt-600" href="/contact">
          Contact
        </Link>
      </nav>
    </div>
  );
}
