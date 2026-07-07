# VoltMate — Roadmap & stratégie business

État : ✅ fait · 🟡 en cours / partiel · ⬜ à venir

Ce document complète le README (qui décrit le produit et l'installation) avec la direction
business : positionnement, stratégie de lancement, modèle de revenus phasé, métriques à suivre, et
risques. La todo technique reste dans le README ; ici, chaque phase associe **objectif business** et
**livrables produit**.

---

## 1. Positionnement

VoltMate n'est **pas** un énième agrégateur de paiement/roaming (Chargemap Pass, Freshmile Pass) ni
un simple annuaire de bornes (ChargeMap, PlugShare). Le pari : devenir le **signal de confiance
communautaire** sur l'état réel des bornes, à la « Waze » — les opérateurs annoncent un uptime
théorique, VoltMate montre ce qui se passe vraiment, signalé par les conducteurs qui viennent de
charger.

Différenciateur concret : le score de fiabilité recalculé à chaque signalement (voir
`backend/app/reliability.py`) et le sticker QR physique collé sur la borne — un point de contact
that les apps purement numériques n'ont pas. Le cadrage produit/marketing retenu est **« Borne
Reporter », le Waze des bornes de recharge** : on ne vend pas un produit QR (le QR est un canal
d'acquisition contrôlé par VoltMate, pas une fonctionnalité utilisateur, voir Phase 1), on vend le
geste de signalement communautaire. La copie de la landing page a été réécrite en ce sens (PR #13,
commit `883a06c`) — toute future page/feature doit rester cohérente avec ce cadrage plutôt que de
remettre le QR au centre du message.

**Non-objectifs assumés** : pas de paiement de recharge intégré, pas de guidage GPS turn-by-turn
(on renvoie vers Maps/Waze), pas de matériel (pas de bornes VoltMate). Rester un calque de
confiance au-dessus de l'écosystème existant.

## 2. Le problème du démarrage à froid

Un annuaire de bornes sans signalements récents est juste... un annuaire de plus (statut « inconnu »
partout = aucune valeur perçue). VoltMate est un marché à deux faces (conducteurs qui lisent /
conducteurs qui signalent) : la stratégie de lancement doit résoudre ça avant de penser croissance
nationale.

**Décision** : lancement **hyper-local** sur un bassin géographique restreint plutôt que national.
La carte couvre désormais la Seine-et-Marne / Essonne / Val-de-Marne avec les 1 956 bornes réelles du
jeu de données IRVE (data.gouv.fr), qui ont remplacé les anciennes données de seed de démo (Melun,
Fontainebleau, Lieusaint, Évry, Créteil) — voir Phase 1. Objectif de la Phase 1 : atteindre une
**densité de signalements critique sur ce bassin** (voir KPI plus bas) avant d'ouvrir d'autres villes,
ville par ville, plutôt que de diluer l'effort sur toute la France dès le jour 1.

## 3. Modèle de revenus (phasé, pas dès le jour 1)

| Phase | Source de revenu | Quand l'activer |
|-------|-------------------|------------------|
| 1 | Aucune — 100% gratuit | Tant que la densité de données n'est pas là, monétiser tuerait l'adoption |
| 2 | Premium B2C (~2-4€/mois ou ~20-25€/an) : historique illimité, alertes intelligentes (« ta borne favorite est de nouveau fiable »), planification de trajet avancée | Une fois qu'il y a une base d'utilisateurs actifs récurrents à convertir (prix volontairement bas, décision d'achat impulsive, aligné sur Chargemap Pass/ABRP Premium) |

**Ruling CEO (07/07) — champ véhicule vs Premium** : le fondateur a demandé, dans la même série de
demandes que le reste de ce cycle, que « les utilisateurs premium puissent ajouter la marque de leur
véhicule ». La session a livré le champ `vehicle` (profil utilisateur, PR #12) **gratuit pour tous**,
pas gated. Décision maintenue explicitement : il n'existe aujourd'hui **aucune infrastructure de
paiement/tiers Premium** dans le produit (0 lignes de code liées à `is_premium`/facturation) ; en
construire une pour gater un unique champ texte bas-valeur serait un coût d'opportunité pur contre la
séquence de la Phase 1 (§ 3 : « tant que la densité de données n'est pas là, monétiser tuerait
l'adoption ») et contre les KPI de sortie de Phase 1, qui ne sont pas atteints. Le champ véhicule
reste gratuit. Ce qui *peut* légitimement devenir un levier Premium en Phase 2, une fois les KPI de
rétention validés : pas le champ lui-même, mais des fonctionnalités construites dessus (garage
multi-véhicules, filtrage automatique des bornes par compatibilité de connecteur/puissance, alertes
liées au véhicule). `product-owner` : ne pas rouvrir ce sujet avant que les KPI de sortie de Phase 1
soient réellement atteints — c'est une redite de la même règle de séquencement que Premium au sens
large, pas une exception.
| 3 | Certification opérateur « VoltMate Vérifié » : badge/label payant pour les bornes qui maintiennent un score > 90 sur 90 jours, utilisable par l'opérateur en marketing | Une fois le score de fiabilité crédible statistiquement (assez de volume de signalements par borne) |
| 3 | Data B2B anonymisée/agrégée pour flottes d'entreprise (« quelles bornes sont fiables sur cet axe ») | Idem — nécessite du volume de données pour être vendable |
| 4 | API entreprise (accès programmatique aux données de fiabilité) pour apps tierces / constructeurs | Une fois qu'un vrai jeu de données propriétaire existe (pas juste un miroir d'OpenChargeMap) |
| 4 | Partenariats parkings/hôtels (mise en avant contre commission ou abonnement) | Nécessite une audience déjà établie pour avoir un pouvoir de négociation |

## 4. Feuille de route

### Phase 0 — MVP technique ✅ (livré, ce dépôt)
- ✅ Carte, fiches bornes, signalements, score de fiabilité, QR codes
- ✅ Assistant à règles simples, gamification légère, dashboard admin
- ✅ Stack Docker déployable sur Hetzner

### Phase 1 — Densité locale & confiance (0-6 mois) 🟡
Objectif business : prouver que la boucle signalement → confiance → nouvelle visite fonctionne sur
un bassin restreint, avant de dépenser un euro en acquisition nationale.
- ✅ Import initial de bornes réelles sur le bassin de lancement (Seine-et-Marne/Essonne/Val-de-Marne)
  pour éviter des cartes vides — **fait via le Fichier consolidé IRVE de data.gouv.fr/ODRE (licence
  Ouverte 2.0), pas OpenChargeMap** (voir §6 Risques pour le changement de source). 1 956 bornes
  réelles importées (adresse, opérateur, type de connecteur, puissance), remplaçant les 12 bornes de
  démo. Script `backend/import_irve.py`, idempotent (upsert par `external_ref`, donc ré-exécutable
  pour rafraîchir ou étendre à d'autres départements). Mergé via PR #8 (commit `5705b87`) ; les
  valeurs par défaut ont ensuite été revues en PR #11 (commit `6ae27dd`) — les bornes importées
  démarrent désormais à `current_status = "ok"` (présumées opérationnelles, façon Waze : on part du
  principe qu'une borne listée par l'État fonctionne jusqu'à preuve du contraire, plutôt que de
  laisser un statut « inconnu » indéfiniment) avec un tarif *estimé* quand la source n'a pas de
  donnée réelle.
  **Important — ceci ne couvre que la densité de localisation, pas le signal de confiance, et ne doit
  pas être confondu avec lui.** Le KPI « ≥ 60% des bornes avec un statut ≠ inconnu » (§ KPI de sortie
  de phase) est désormais quasi mécaniquement satisfait par ce défaut d'import, **avant même un seul
  signalement réel** — ce n'est donc plus un signal fiable de progression de la Phase 1 tel quel.
  `product-owner` doit piloter la sortie de phase sur les KPI qui restent gagnés à la main : volume de
  signalements actifs/semaine et rétention J30 des signaleurs, pas sur le % de statuts non-« inconnu »
  qui est maintenant un artefact du script d'import.
- 🟡 Campagne de stickers QR physiques sur le bassin de lancement — **posés uniquement par
  VoltMate/l'équipe**, pas par les utilisateurs : la génération de QR a été rendue admin-only (PR #11,
  commit `6ae27dd`) sur demande explicite du fondateur (« c'est uniquement à moi d'avoir des QR
  codes »). Le QR reste le point de contact physique différenciant décrit en § 1, mais c'est un canal
  d'acquisition contrôlé par VoltMate, pas une fonctionnalité self-service côté utilisateur — ne pas
  la réintroduire côté utilisateur sans une décision business explicite. Passé de ⬜ à 🟡 : le
  mécanisme admin-only existe et fonctionne (génération unitaire), mais reste bloqué pour une vraie
  campagne par un écart outillage identifié par `cto` — export en masse par département/zone avec
  feuille imprimable, pas encore livré. Suivi : issue #18.
- 🟡 Rebonte de la boucle de signalement pour la rendre viable en usage réel : le flux « signaler un
  problème » est passé d'un menu déroulant texte à une grille d'icônes/tags à sélection tactile
  (Fuel = thermique garée sur la place, Ban = hors service, PhoneOff = bug appli/paiement, etc.), avec
  en plus une bannière façon Waze « ce problème existe-t-il encore ? » en confirmation à un tap.
  Testé de bout en bout par le nouvel agent `test-user` (perspective conducteur réel, distincte de
  `qa-tester`) : fonctionne comme prévu. Seule remarque, non bloquante : les tags `ice_parked` (icône
  Fuel) et `payment_failed` (icône PhoneOff) sont les deux où un conducteur de première visite peut
  avoir besoin du libellé texte pour bien comprendre l'icône seule — pas un bug, pas d'action requise
  dans l'immédiat ; à surveiller si le volume réel de signalements sur ces deux tags s'avère
  anormalement bas une fois la Phase 1 en cours (signal indirect que l'icône n'est pas comprise).
- ⬜ Seeding communautaire : forums EV français (Automobile-Propre, groupes Facebook véhicule
  électrique régionaux), pas de pub payante à ce stade. C'est la priorité la plus urgente de la phase
  actuelle (priorité #1 confirmée par `ceo`) : la couverture cartographique et l'onboarding sont
  maintenant traités (voir ci-dessous), le vrai goulot d'étranglement restant est de faire venir les
  100-200 premiers conducteurs réels du bassin pour produire les premiers signalements — sans eux,
  les KPI qui comptent réellement (signalements/semaine, rétention J30 des signaleurs) restent à zéro
  indéfiniment.
  (Note : un onboarding « Borne Reporter » — bouton assistant + tutoriel de recharge/calculateur de
  coût sur chaque fiche borne, clarifiant que VoltMate trouve/note les bornes mais ne démarre pas la
  recharge — a été livré en PR #12 (`bc69e19`) et réduit un risque de confusion qui aurait pu casser
  la confiance dès la première visite.)
- ⬜ PWA installable (ajout à l'écran d'accueil) pour réduire la friction de retour. Priorité #2
  confirmée par `ceo`, juste après le seeding communautaire ci-dessus ; `cto` confirme que c'est un
  changement de taille réduite (aucun manifest/service worker existant, `next.config.js` déjà
  compatible `output: "standalone"`) — mise en backlog dès maintenant plutôt que reportée. Suivi :
  issue #19.
- ⬜ Notifications de base (borne favorite redevenue fiable)

**KPI de sortie de phase** (ne pas passer en Phase 2 sans ça) :
- ~~≥ 60% des bornes du bassin de lancement avec un statut ≠ « inconnu »~~ — **disqualifié comme
  signal de sortie de phase (ruling `ceo` du 07/07)** : l'import IRVE (PR #11) fait démarrer les
  bornes à `current_status = "ok"` par défaut, donc ce seuil est désormais satisfait quasi
  mécaniquement par le script d'import, avant même un seul signalement communautaire réel. Ne plus
  l'utiliser pour juger la sortie de Phase 1 ; conservé ci-dessus barré pour mémoire plutôt que
  supprimé, afin de ne pas perdre la trace de pourquoi il a été écarté.
- ≥ 30 signalements actifs/semaine sur le bassin — **seul KPI de volume qui gate désormais la sortie
  de phase**, actuellement à zéro
- Taux de rétention J30 des « signaleurs » (pas juste des visiteurs) ≥ 20% — **seul KPI de rétention
  qui gate désormais la sortie de phase**, actuellement à zéro (pas encore de cohorte de signaleurs à
  mesurer)

### Phase 2 — Croissance géographique + Premium (6-12 mois) ⬜
- ⬜ Réplication ville par ville de la mécanique Phase 1 (pas de big-bang national)
- ⬜ Lancement Premium (voir modèle de revenus) une fois les KPI de rétention validés
- ⬜ Favoris, itinéraires avec arrêts de recharge, statistiques personnelles
- ⬜ Alertes intelligentes (Premium)

**KPI de sortie de phase** :
- Taux de conversion Premium ≥ 2-3% des utilisateurs actifs mensuels
- Couverture nationale des grands axes (≥ 5 bassins actifs)

### Phase 3 — Monétisation B2B (12-24 mois) ⬜
- ⬜ Programme de certification « VoltMate Vérifié » pour opérateurs/installateurs
- ⬜ Offre data anonymisée pour flottes d'entreprise
- ⬜ Dashboard entreprise (fiabilité par zone géographique, comparaison d'opérateurs)

### Phase 4 — Plateforme (24+ mois) ⬜
- ⬜ API publique entreprise
- ⬜ Partenariats parkings/hôtels
- ⬜ Évaluation : rester indépendant et rentable vs discussion de rachat stratégique (appli de
  navigation, constructeur EV, réseau de recharge cherchant un signal de confiance communautaire)

## 5. Métriques à suivre en continu

| Catégorie | Métrique | Pourquoi |
|-----------|----------|----------|
| Santé des données | % de bornes avec statut ≠ inconnu | Mesure directe de la valeur perçue par un nouvel utilisateur |
| Engagement | Signalements par borne par mois | Fraîcheur des données, cœur de la proposition de valeur |
| Rétention | J7/J30 des utilisateurs qui ont signalé au moins une fois | Un « signaleur » retenu vaut infiniment plus qu'un visiteur passif |
| Croissance | Nouvelles bornes ajoutées par la communauté vs importées | Signal d'appropriation organique du produit |
| Revenu (Phase 2+) | Taux de conversion Premium, churn mensuel | Viabilité économique |
| Qualité | Signalements contestés/modérés (spam, vandalisme) | Coût de modération, risque de confiance |

## 6. Risques

- **Démarrage à froid** : sans masse critique de signalements, l'app ne vaut rien pour un nouvel
  utilisateur. Mitigé par le lancement hyper-local (section 2).
- **Vandalisme/spam** : un concurrent ou un opérateur mécontent pourrait signaler massivement
  « en panne » sur une borne saine. Nécessite modération (déjà présent : suppression de
  commentaires/photos, fusion de bornes) + limitation de débit (déjà en place, `REPORT_RATE_LIMIT`)
  — à surveiller et durcir si abus détecté.
- **Licence des données importées** : risque identifié initialement pour OpenChargeMap (licence
  ODbL, attribution + partage à l'identique obligatoires). En pratique, l'import Phase 1 a finalement
  utilisé le Fichier consolidé IRVE de data.gouv.fr/ODRE — licence Ouverte 2.0 (Etalab), sans
  obligation de partage à l'identique, alimenté quotidiennement par les opérateurs eux-mêmes sous
  obligation légale. OpenChargeMap n'a pas été utilisé ; ce risque est levé pour la source de données
  actuellement en place. Réévaluer si une autre source tierce est ajoutée plus tard.
- **Coût de modération** à l'échelle : la Phase 1 reste gérable manuellement sur un bassin restreint ;
  prévoir un outillage de modération plus riche avant la Phase 2.
- **Dépendance à un tiers gratuit** (OpenStreetMap/Nominatim, data.gouv.fr/ODRE pour l'import IRVE) :
  prévoir un plan B si les quotas/conditions changent. L'import IRVE étant idempotent et
  ré-exécutable, un refresh périodique ou une extension à d'autres départements reste peu coûteux.

---

*Dette technique reportée du README : migrations Alembic (actuellement `create_all` idempotent),
domaine + SSL réel, CI automatisée. Voir README § Stratégie MVP.*
