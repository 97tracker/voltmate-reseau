# ⚡ VoltMate

**Recharge smarter. Drive calmer.** — *Recharge mieux. Roule serein.*

VoltMate est un assistant communautaire pour conducteurs de voitures électriques. Scannez le QR code
collé près d'une borne (ou ouvrez le site sur mobile) pour signaler son état réel, consulter sa
fiabilité, connaître son prix estimé, et trouver une meilleure borne à proximité.

MVP web responsive, mobile-first, sans application native.

---

## Sommaire

- [Stack technique](#stack-technique)
- [Installation locale](#installation-locale)
- [Déploiement sur Hetzner](#déploiement-sur-hetzner)
- [Configuration DNS](#configuration-dns)
- [Nginx / SSL](#nginx--ssl)
- [Commandes Docker utiles](#commandes-docker-utiles)
- [Générer et imprimer les QR codes](#générer-et-imprimer-les-qr-codes)
- [Stratégie MVP](#stratégie-mvp)
- [Roadmap](#roadmap)
- [Monétisation](#idées-de-monétisation)

---

## Stack technique

| Composant       | Choix                                          |
|-----------------|-------------------------------------------------|
| Frontend        | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| Backend API     | FastAPI (Python), SQLAlchemy 2.0                |
| Base de données | PostgreSQL 16                                   |
| Cache / rate limit | Redis 7 (via slowapi)                        |
| Carte           | Leaflet + OpenStreetMap (react-leaflet)         |
| Auth            | JWT (email/password), bcrypt                    |
| Stockage images | Volume Docker local (`voltmate-uploads`), migration S3 possible plus tard |
| IA              | Assistant à règles simples par défaut (`USE_MOCK_AI=true`), abstraction prête pour brancher une API OpenAI-compatible |
| Reverse proxy   | Nginx (interne au stack, `voltmate-nginx`)      |
| Déploiement     | Docker Compose                                  |

Architecture : chaque service tourne dans son propre conteneur sur un réseau Docker isolé
(`voltmate-network`). Seul `voltmate-nginx` publie un port sur l'hôte — Postgres et Redis restent
internes.

```
Internet -> voltmate-nginx (seul port publié)
              ├─ /            -> voltmate-frontend (Next.js)
              ├─ /api/*       -> voltmate-backend (FastAPI)
              └─ /uploads/*   -> volume partagé (photos des bornes)

voltmate-backend -> voltmate-db (Postgres) + voltmate-redis (rate limiting)
```

## Installation locale

Prérequis : Docker + Docker Compose v2.

```bash
git clone <votre-repo> voltmate   # ou copiez simplement ce dossier
cd voltmate
cp .env.example .env
docker compose up -d --build
```

Puis chargez les données de démonstration (bornes à Melun, Paris, Fontainebleau, Lieusaint, Évry,
Créteil) :

```bash
docker compose exec voltmate-backend python seed.py
```

Ouvrez `http://localhost:8101` (port défini par `VOLTMATE_HTTP_PORT` dans `.env`).

Comptes de démonstration créés par le seed :
- `demo@voltmate.app` / `demo1234` (utilisateur)
- `admin@voltmate.app` / `admin1234` (admin — accès à `/admin`)

**⚠️ Changez ou supprimez ces comptes avant toute mise en production.**

### Lancer les tests backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
pytest app/tests -v
```

## Déploiement sur Hetzner

Le script `install.sh` audite le serveur, choisit un port libre, génère un `.env` avec des secrets
forts (sans jamais écraser un `.env` existant sans backup), puis build et démarre le stack :

```bash
scp -r voltmate/ user@votre-serveur:/opt/voltmate
ssh user@votre-serveur
cd /opt/voltmate
chmod +x install.sh deploy.sh scripts/backup-db.sh
./install.sh
```

Pour les mises à jour ultérieures :

```bash
./deploy.sh
```

Ce projet est conçu pour cohabiter avec d'autres stacks Docker Compose sur le même serveur : tous
les noms de conteneurs, volumes et réseaux sont préfixés `voltmate-`, et seul le port HTTP choisi
est publié sur l'hôte.

## Configuration DNS

1. Achetez/possédez un nom de domaine (ex. `voltmate.app`).
2. Créez un enregistrement `A` pointant vers l'IP publique du serveur Hetzner :
   ```
   voltmate.app.       A     <IP_DU_SERVEUR>
   www.voltmate.app.    CNAME voltmate.app.
   ```
3. Attendez la propagation DNS (`dig voltmate.app` pour vérifier).

## Nginx / SSL

VoltMate embarque son propre nginx interne (`voltmate-nginx`) qui expose un seul port HTTP sur
l'hôte (`VOLTMATE_HTTP_PORT`, 8101 par défaut). Deux options pour l'exposer publiquement :

**Option A — Accès direct** (le plus simple, pas de domaine nécessaire) :
```
http://<IP_DU_SERVEUR>:8101
```

**Option B — Domaine + SSL**, si votre serveur a déjà un reverse-proxy partagé (ex. un
`master-nginx` en frontal sur 80/443, comme documenté dans `nginx/voltmate.conf`) :

1. Sauvegardez la config existante de votre reverse-proxy partagé.
2. Ajoutez le réseau `voltmate-network` aux réseaux externes de ce reverse-proxy.
3. Ajoutez le `server {}` block de `nginx/voltmate.conf` (adaptez `server_name`).
4. Générez le certificat SSL :
   ```bash
   certbot --nginx -d voltmate.app -d www.voltmate.app
   ```
5. Rechargez le reverse-proxy partagé : `docker compose restart master-nginx` (ou équivalent).

**Option C — VoltMate seul sur le serveur** : ajoutez directement un bloc `server { listen 443 ssl; }`
avec vos certificats Let's Encrypt dans `nginx/voltmate-internal.conf`, montez les certificats en
volume dans `docker-compose.yml`, et publiez le port 443.

## Commandes Docker utiles

```bash
docker compose ps                                   # état des services
docker compose logs -f voltmate-backend              # logs backend en direct
docker compose exec voltmate-backend python seed.py  # (re)générer les données de démo
docker compose exec voltmate-db psql -U voltmate     # console Postgres
docker compose restart voltmate-frontend             # redémarrer un service
docker compose down                                  # arrêter le stack (garde les volumes)
docker compose down -v                               # arrêter et supprimer les volumes (⚠️ perte de données)
./scripts/backup-db.sh                                # sauvegarde de la base (conserve les 14 derniers dumps)
```

## Générer et imprimer les QR codes

Chaque borne a une URL publique unique : `https://votredomaine.app/station/{stationId}`.

1. Ouvrez la fiche d'une borne (`/station/{id}`) : un QR code est affiché directement, généré par
   l'API (`GET /api/stations/{id}/qrcode`), pointant vers `PUBLIC_BASE_URL` (à configurer dans `.env`).
2. Faites un clic droit → « Enregistrer l'image » ou imprimez la page.
3. Collez le sticker imprimé près de la borne, avec un message du type :

   > *« Cette borne fonctionne vraiment ? Scannez et dites-le aux autres. »*

**Important** : renseignez `PUBLIC_BASE_URL` dans `.env` avec votre vrai domaine avant de générer
les QR codes définitifs à imprimer (sinon ils pointeront vers `localhost`).

## Stratégie MVP

Priorité à une démo utilisable rapidement sur mobile, sans sur-complexifier :

- Pas de migrations Alembic : le schéma SQL (`db/init/001_schema.sql`) est appliqué au premier
  démarrage de Postgres, et `Base.metadata.create_all()` sert de filet de sécurité idempotent côté
  backend. Suffisant pour un MVP ; à faire évoluer vers de vraies migrations (Alembic) si le schéma
  doit évoluer fréquemment en production avec des données réelles.
- Assistant IA basé sur des règles simples (score de fiabilité, signalements récents, distance de
  trajet) — aucune clé API requise. L'abstraction (`app/ai.py`) est prête pour brancher une vraie
  API IA (OpenAI-compatible) en changeant deux variables d'environnement.
- Signalements anonymes autorisés (pas de compte obligatoire), mais points/badges encouragent la
  création de compte.
- Score de fiabilité recalculé entièrement à chaque signalement (pas de dérive incrémentale).

## Roadmap

La feuille de route technique **et** la stratégie business (positionnement, stratégie de lancement
hyper-local, modèle de revenus phasé, KPI, risques) sont dans **[ROADMAP.md](ROADMAP.md)**. Résumé :

- **Phase 0 — MVP technique** (ce dépôt) : carte, fiches bornes, signalements, score de fiabilité,
  QR codes, assistant à règles, gamification, dashboard admin.
- **Phase 1 — Densité locale & confiance** : lancement hyper-local (pas national), import initial des
  bornes réelles du bassin de lancement (IRVE/data.gouv.fr, ✅ fait — 1 956 bornes), campagne de
  stickers QR, seeding communautaire.
- **Phase 2 — Croissance géographique + Premium** : réplication ville par ville, lancement du
  compte Premium une fois la rétention validée.
- **Phase 3 — Monétisation B2B** : certification « VoltMate Vérifié », data anonymisée pour flottes.
- **Phase 4 — Plateforme** : API entreprise, partenariats parkings/hôtels.

---

## Structure du projet

```
voltmate/
├── docker-compose.yml
├── .env.example
├── install.sh / deploy.sh
├── scripts/backup-db.sh
├── db/init/001_schema.sql       # schéma Postgres (migration initiale)
├── nginx/
│   ├── voltmate-internal.conf   # nginx interne au stack (routing frontend/api/uploads)
│   └── voltmate.conf            # doc : intégration à un reverse-proxy partagé
├── backend/                     # FastAPI
│   ├── app/
│   │   ├── main.py, config.py, database.py, models.py, schemas.py
│   │   ├── security.py, reliability.py, gamification.py, ai.py, limiter.py
│   │   ├── routers/             # stations, reports, comments, photos, users, admin, assistant, qrcode
│   │   └── tests/
│   └── seed.py
└── frontend/                    # Next.js
    ├── app/                     # /, /map, /station/[id], /station/new, /station/[id]/report,
    │                             # /assistant, /login, /register, /profile, /admin
    ├── components/
    └── lib/
```

<!-- CI check registration -->
