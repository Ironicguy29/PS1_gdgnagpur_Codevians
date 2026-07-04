#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [ -f "$SCRIPT_DIR/docker-compose.yml" ] || [ -f "$SCRIPT_DIR/compose.yaml" ]; then
  if command -v docker >/dev/null 2>&1 && (docker compose version >/dev/null 2>&1 || docker-compose --version >/dev/null 2>&1); then
    echo "Starting ArogyaMitra with Docker Compose..."
    if docker compose up -d --build 2>/dev/null || docker-compose up -d --build; then
      echo "Docker services started successfully."
      echo "Frontend: http://localhost:3000"
      echo "Backend: http://localhost:5000"
      echo "AI Service: http://localhost:8000"
      exit 0
    fi
  fi
fi

echo "Docker is unavailable or no compose file was found. Falling back to local startup."
exec "$SCRIPT_DIR/start_local.sh"

# --------------------------------------------------
# NOTE: Automated start script for local development environment.
# TODO: Ensure host port configurations match reverse-proxy routing.
# --------------------------------------------------
