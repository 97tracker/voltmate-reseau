#!/usr/bin/env bash
# ==========================================================================
# VoltMate deploy — pulls latest code (if a git repo), rebuilds changed
# images, and restarts the stack with zero manual steps.
#
# Usage: ./deploy.sh
# ==========================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

if [ -d .git ]; then
  echo "[i] Pulling latest changes..."
  git pull --ff-only
fi

[ -f .env ] || { echo "[x] .env not found. Run ./install.sh first."; exit 1; }

echo "[i] Building images..."
docker compose build

echo "[i] Restarting stack..."
docker compose up -d --remove-orphans

echo "[i] Pruning dangling images from the rebuild..."
docker image prune -f >/dev/null

echo "[✓] Deploy complete. Status:"
docker compose ps
