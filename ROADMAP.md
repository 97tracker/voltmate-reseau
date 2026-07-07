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
that les apps purement numériques n'ont pas.

**Non-objectifs assumés** : pas de paiement de recharge intégré, pas de guidage GPS turn-by-turn
(on renvoie vers Maps/Waze), pas de matériel (pas de bornes VoltMate). Rester un calque de
confiance au-dessus de l'écosystème existant.

## 2. Le problème du démarrage à froid

Un annuaire de bornes sans signalements récents est juste... un annuaire de plus (statut « inconnu »
partout = aucune valeur perçue). VoltMate est un marché à deux faces (conducteurs qui lisent /
conducteurs qui signalent) : la stratégie de lancement doit résoudre ça avant de penser croissance
nationale.

**Décision** : lancement **hyper-local** sur un bassin géographique restreint plutôt que national.
Les données de seed (Melun, Fontainebleau, Lieusaint, Évry, Créteil) couvrent déjà la Seine-et-Marne
/ Essonne / Val-de-Marne : c'est le bassin de lancement naturel. Objectif de la Phase 1 : atteindre
une **densité de signalements critique sur ce bassin** (voir KPI plus bas) avant d'ouvrir d'autres
villes, ville par ville, plutôt que de diluer l'effort sur toute la France dès le jour 1.

## 3. Modèle de revenus (phasé, pas dès le jour 1)

| Phase | Source de revenu | Quand l'activer |
|-------|-------------------|------------------|
| 1 | Aucune — 100% gratuit | Tant que la densité de données n'est pas là, monétiser tuerait l'adoption |
| 2 | Premium B2C (~2-4€/mois ou ~20-25€/an) : historique illimité, alertes intelligentes (« ta borne favorite est de nouveau fiable »), planification de trajet avancée | Une fois qu'il y a une base d'utilisateurs actifs récurrents à convertir (prix volontairement bas, décision d'achat impulsive, aligné sur Chargemap Pass/ABRP Premium) |
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
- 🟡 Import initial OpenChargeMap sur le bassin de lancement (Seine-et-Marne/Essonne/Val-de-Marne)
  pour éviter des cartes vides — **attention licence ODbL : attribution obligatoire, à valider avant
  import réel**
- ⬜ Campagne de stickers QR physiques sur le bassin de lancement (impression + pose manuelle par
  l'équipe et les premiers utilisateurs)
- ⬜ Seeding communautaire : forums EV français (Automobile-Propre, groupes Facebook véhicule
  électrique régionaux), pas de pub payante à ce stade
- ⬜ PWA installable (ajout à l'écran d'accueil) pour réduire la friction de retour
- ⬜ Notifications de base (borne favorite redevenue fiable)

**KPI de sortie de phase** (ne pas passer en Phase 2 sans ça) :
- ≥ 60% des bornes du bassin de lancement avec un statut ≠ « inconnu »
- ≥ 30 signalements actifs/semaine sur le bassin
- Taux de rétention J30 des « signaleurs » (pas juste des visiteurs) ≥ 20%

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
- **Licence des données importées** : OpenChargeMap est sous licence ODbL — attribution et partage à
  l'identique à respecter avant tout import en Phase 1.
- **Coût de modération** à l'échelle : la Phase 1 reste gérable manuellement sur un bassin restreint ;
  prévoir un outillage de modération plus riche avant la Phase 2.
- **Dépendance à un tiers gratuit** (OpenStreetMap/Nominatim, OpenChargeMap) : prévoir un plan B si
  les quotas/conditions changent.

---

*Dette technique reportée du README : migrations Alembic (actuellement `create_all` idempotent),
domaine + SSL réel, CI automatisée. Voir README § Stratégie MVP.*
