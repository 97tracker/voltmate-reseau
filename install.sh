#!/usr/bin/env bash
# ==========================================================================
# VoltMate installer — idempotent, non-destructive.
#
# Picks a free host port, generates a .env with strong secrets (only if one
# does not already exist), then builds & starts the stack. It never touches
# other apps on the box and never overwrites an existing .env without a
# timestamped backup.
#
# Usage:
#   chmod +x install.sh
#   ./install.sh              # configure + build + up
#   ./install.sh --no-start   # configure only (no docker build/up)
# ==========================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

c_reset='\033[0m'; c_green='\033[0;32m'; c_yellow='\033[0;33m'; c_red='\033[0;31m'; c_cyan='\033[0;36m'
info() { echo -e "${c_cyan}[i]${c_reset} $*"; }
ok()   { echo -e "${c_green}[✓]${c_reset} $*"; }
warn() { echo -e "${c_yellow}[!]${c_reset} $*"; }
err()  { echo -e "${c_red}[x]${c_reset} $*" >&2; }

NO_START=false
for arg in "$@"; do
  case "$arg" in
    --no-start) NO_START=true ;;
    -h|--help)  grep '^#' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
  esac
done

command -v docker >/dev/null 2>&1 || { err "docker is required"; exit 1; }
docker compose version >/dev/null 2>&1 || { err "docker compose v2 is required"; exit 1; }

# ---- pick a free host port for voltmate-nginx -----------------------------
ALL_USED_PORTS="$(ss -tulpnH 2>/dev/null | awk '{print $5}' | sed -E 's/.*:([0-9]+)$/\1/' | sort -un | tr '\n' ' ')"
VOLTMATE_OWNED_PORTS="$(docker ps --filter 'name=^voltmate-' --format '{{.Ports}}' 2>/dev/null | grep -oE ':[0-9]+->' | tr -d ':->' | sort -un | tr '\n' ' ')"
USED_PORTS=""
for p in $ALL_USED_PORTS; do
  case " ${VOLTMATE_OWNED_PORTS} " in
    *" ${p} "*) ;;
    *) USED_PORTS="${USED_PORTS}${p} " ;;
  esac
done
port_free() { ! echo " ${USED_PORTS} " | grep -q " $1 "; }
next_free_port() { local p="$1"; while ! port_free "$p"; do p=$((p+1)); done; echo "$p"; }

HTTP_PORT="$(next_free_port 8101)"

# ---- generate .env if missing ---------------------------------------------
if [ -f .env ]; then
  BACKUP=".env.backup.$(date +%Y%m%d-%H%M%S)"
  cp .env "$BACKUP"
  warn "An existing .env was found — backed up to $BACKUP. It will NOT be overwritten."
else
  info "Generating .env ..."
  cp .env.example .env
  JWT_SECRET="$(openssl rand -hex 32)"
  DB_PASSWORD="$(openssl rand -hex 16)"
  sed -i "s#^JWT_SECRET=.*#JWT_SECRET=${JWT_SECRET}#" .env
  sed -i "s#^POSTGRES_PASSWORD=.*#POSTGRES_PASSWORD=${DB_PASSWORD}#" .env
  sed -i "s#^VOLTMATE_HTTP_PORT=.*#VOLTMATE_HTTP_PORT=${HTTP_PORT}#" .env
  ok ".env generated with a random JWT secret, DB password, and port ${HTTP_PORT}."
fi

if $NO_START; then
  info "--no-start passed: skipping docker build/up."
  exit 0
fi

info "Building and starting the stack ..."
docker compose up -d --build

ok "VoltMate is starting. Check status with: docker compose ps"
ok "Once healthy, open: http://<server-ip>:$(grep '^VOLTMATE_HTTP_PORT=' .env | cut -d= -f2)"
