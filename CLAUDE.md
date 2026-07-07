# VoltMate — instructions for Claude

VoltMate is a community reliability app for EV charging stations ("Recharge smarter. Drive
calmer."). Full product description: `README.md`. Business strategy, launch sequencing, revenue
model, and KPIs: `ROADMAP.md` — **read `ROADMAP.md` before proposing new features or scope**; it
defines which phase we're in and what's explicitly out of scope until its predecessor's KPIs are met.

## Stack & structure

- Backend: FastAPI + SQLAlchemy 2.0, `backend/app/` — `main.py` (app + lifespan), `config.py`
  (pydantic-settings), `models.py`, `schemas.py`, `security.py` (JWT/bcrypt), `reliability.py` (score
  engine), `gamification.py` (points/badges), `ai.py` (rule-based assistant, OpenAI-compatible hook
  ready), `limiter.py` (slowapi/Redis), `routers/` (one file per resource).
- Frontend: Next.js 14 App Router + TypeScript + Tailwind, `frontend/app/` (one folder per route),
  `frontend/components/`, `frontend/lib/` (`api.ts` fetch client, `auth.tsx` context,
  `geolocation.ts` shared geolocation helper, `types.ts`).
- DB: PostgreSQL, schema in `db/init/001_schema.sql` (runs on first container start) +
  `Base.metadata.create_all()` as an idempotent safety net in the backend lifespan. No Alembic yet —
  intentional MVP simplification, see README § Stratégie MVP.
- Docker: `docker-compose.yml`, services/network/volumes all prefixed `voltmate-`. Only
  `voltmate-nginx` publishes a host port (`VOLTMATE_HTTP_PORT` in `.env`); Postgres/Redis stay
  internal. `install.sh` / `deploy.sh` / `scripts/backup-db.sh` handle bring-up, updates, backups.

## Running things

```bash
cp .env.example .env && docker compose up -d --build   # first bring-up
docker compose exec voltmate-backend python seed.py     # demo data (12 stations, FR)
cd backend && pip install -r requirements.txt && pytest app/tests -v   # 17 tests, sqlite in-memory, no real DB needed
cd frontend && npm install && npm run build              # type-checks + builds
```

## Known gotchas (already fixed once, don't reintroduce)

- **Next.js standalone + Docker**: Docker sets `HOSTNAME` to the container ID; the Next standalone
  `server.js` binds to `$HOSTNAME` by default, so without `ENV HOSTNAME=0.0.0.0` in
  `frontend/Dockerfile` it silently listens only on the container's own IP (breaks the healthcheck
  and nginx routing). Already fixed — don't drop that line.
- **Geolocation requires a secure context**: browsers refuse `navigator.geolocation` outright on
  non-HTTPS, non-localhost origins. Every call site must go through `lib/geolocation.ts`
  (`getCurrentPosition()`), which surfaces this as a real error message instead of failing silently.
  Don't call `navigator.geolocation` directly in a new page.
- **Anonymous usage is a core requirement, not an afterthought**: reporting, adding a station,
  commenting, and photo upload all use `get_current_user_optional`, never `get_current_user`. Don't
  gate these behind login in the frontend either.
- **Shared Hetzner host**: this box also runs Radyn, testai, and puzzleflow behind one
  `master-nginx` (`/opt/reverse-proxy`). Never touch containers outside `voltmate-*`, and never
  restart/reconfigure `master-nginx` without explicit user confirmation — it carries other live
  projects' traffic. If disk space looks tight, check `docker system df` first — it's usually build
  cache, not project files.

## The project team (subagents)

Three role-scoped subagents live in `.claude/agents/`: `qa-tester` (finds and files real bugs by
driving the running app, doesn't fix), `product-owner` (owns `ROADMAP.md` and backlog priority,
doesn't write code), `devops` (git/GitHub workflow, deploys, backups — ready to take over repo setup
the moment the user creates the GitHub repo). The `.claude/skills/qa-cycle/SKILL.md` skill
orchestrates all three into one release-cycle loop. Use the agents directly for a single task in
their lane; use the skill for a full prioritize → test → fix → ship cycle.

## Git status

No GitHub repo yet as of this writing — the user said they'll create one. Don't assume a remote
exists; check `git remote -v` first. Once it exists, default to feature-branch + PR, not direct push
to `main`, unless the user explicitly authorizes direct push for this repo (that authorization is
per-repo, doesn't carry over from other projects on this host).

## Test deployment

The stack has been run on port `3010` (one of a few ports the user had pre-opened in `ufw`:
`8000`, `5173`, `3010`) for manual testing at `http://65.109.171.183:3010` — this is a borrowed port
for convenience, not the permanent production allocation. A real deploy should get a proper domain +
TLS (see `nginx/voltmate.conf`) or its own dedicated firewall rule.
