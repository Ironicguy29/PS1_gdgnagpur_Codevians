#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

PROJECT_ROOT="$SCRIPT_DIR"
AI_DIR="$PROJECT_ROOT/ai_service"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
LOG_DIR="$PROJECT_ROOT/.runtime-logs"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'
declare -a CHILD_PIDS=()

log() {
  local color="$1"
  local message="$2"
  local level="$3"
  printf '%b[%s]%b %s\n' "$color" "$level" "$NC" "$message"
}

info() { log "$GREEN" "$1" "INFO"; }
warn() { log "$YELLOW" "$1" "WARN"; }
error() { log "$RED" "$1" "ERROR"; }

cleanup() {
  local exit_code=$?
  info "Stopping services..."
  if [ ${#CHILD_PIDS[@]} -gt 0 ]; then
    kill "${CHILD_PIDS[@]}" 2>/dev/null || true
  fi
  exit "$exit_code"
}

trap cleanup SIGINT SIGTERM EXIT

require_dir() {
  local path="$1"
  if [ ! -d "$path" ]; then
    error "Required folder not found: $path"
    exit 1
  fi
}

ensure_port_available() {
  local port="$1"
  local pids=""

  if command -v lsof >/dev/null 2>&1; then
    pids="$(lsof -t -iTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
  elif command -v ss >/dev/null 2>&1; then
    pids="$(ss -ltnp 2>/dev/null | awk -v port=":$port" '$4 ~ port {print $NF}' | sed -E 's/.*pid=([0-9]+).*/\1/' | tr -d ' ' | sort -u || true)"
  fi

  if [ -n "$pids" ]; then
    warn "Port $port is already in use by PID(s): $pids"
    for pid in $pids; do
      if ps -p "$pid" -o comm= 2>/dev/null | grep -E 'node|python|uvicorn|next' >/dev/null 2>&1; then
        kill "$pid" 2>/dev/null || true
      else
        warn "Skipping PID $pid because it does not look like a local development process."
      fi
    done
  fi
}

wait_for_http() {
  local url="$1"
  local name="$2"
  local attempts=60
  while [ "$attempts" -gt 0 ]; do
    if curl -fsS "$url" >/dev/null 2>&1; then
      info "$name is responding at $url"
      return 0
    fi
    attempts=$((attempts - 1))
    sleep 1
  done
  error "$name did not become ready in time."
  return 1
}

require_dir "$PROJECT_ROOT"
require_dir "$AI_DIR"
require_dir "$BACKEND_DIR"
require_dir "$FRONTEND_DIR"
mkdir -p "$LOG_DIR"

info "Starting ArogyaMitra locally from $PROJECT_ROOT"

if [ ! -f "$BACKEND_DIR/.env" ]; then
  info "Creating backend environment file"
  cat > "$BACKEND_DIR/.env" <<'EOF'
PORT=5000
MONGO_URI=mongodb+srv://codevians_db_user:H9hli37vb5Y8lQFZ@cluster0.yupgcvd.mongodb.net/arogyamitra?retryWrites=true&w=majority&appName=Cluster0
AI_SERVICE_URL=http://localhost:8000
JWT_SECRET=supersecretkey123
EOF
fi

if [ ! -f "$FRONTEND_DIR/.env.local" ]; then
  info "Creating frontend environment file"
  cat > "$FRONTEND_DIR/.env.local" <<'EOF'
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
EOF
fi

ensure_port_available 8000
ensure_port_available 5000
ensure_port_available 3000

VENV_DIR=""
for candidate in "$PROJECT_ROOT/.venv" "$PROJECT_ROOT/../.venv" "$HOME/.venv" "$AI_DIR/.venv"; do
  if [ -x "$candidate/bin/python" ]; then
    VENV_DIR="$candidate"
    break
  fi
done

if [ -z "$VENV_DIR" ]; then
  info "No virtual environment detected; creating one at $PROJECT_ROOT/.venv"
  python3 -m venv "$PROJECT_ROOT/.venv"
  VENV_DIR="$PROJECT_ROOT/.venv"
fi

VENV_PYTHON="$VENV_DIR/bin/python"
VENV_PIP="$VENV_DIR/bin/pip"
VENV_ACTIVATE="$VENV_DIR/bin/activate"

if [ ! -x "$VENV_PYTHON" ]; then
  error "Virtual environment Python not found at $VENV_PYTHON"
  exit 1
fi

info "Using Python environment: $VENV_DIR"
# shellcheck disable=SC1090
source "$VENV_ACTIVATE"
python -m pip install --upgrade pip >/dev/null 2>&1 || true
python -m pip install -r "$AI_DIR/requirements.txt" >/dev/null 2>&1

info "Starting AI service on port 8000"
(
  cd "$AI_DIR"
  "$VENV_PYTHON" -m uvicorn app.main:app --host 0.0.0.0 --port 8000
) > "$LOG_DIR/ai.log" 2>&1 &
CHILD_PIDS+=("$!")
PID_AI=$!

if [ ! -d "$BACKEND_DIR/node_modules" ]; then
  info "Installing backend dependencies"
  (cd "$BACKEND_DIR" && npm install --no-audit --no-fund) >/dev/null 2>&1
else
  info "Backend dependencies already installed"
fi

info "Starting backend on port 5000"
(
  cd "$BACKEND_DIR"
  npm run dev
) > "$LOG_DIR/backend.log" 2>&1 &
CHILD_PIDS+=("$!")
PID_BACKEND=$!

if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
  info "Installing frontend dependencies"
  (cd "$FRONTEND_DIR" && npm install --no-audit --no-fund) >/dev/null 2>&1
else
  info "Frontend dependencies already installed"
fi

info "Starting frontend on port 3000"
(
  cd "$FRONTEND_DIR"
  npm run dev -- --hostname 0.0.0.0 --port 3000
) > "$LOG_DIR/frontend.log" 2>&1 &
CHILD_PIDS+=("$!")
PID_FRONTEND=$!

wait_for_http "http://localhost:8000/" "AI service" || true
wait_for_http "http://localhost:5000/" "Backend" || true
wait_for_http "http://localhost:3000/" "Frontend" || true

printf '\n'
info "All services launched."
printf '  AI Service: http://localhost:8000\n'
printf '  Backend:    http://localhost:5000\n'
printf '  Frontend:   http://localhost:3000\n'
printf '  Logs:       %s\n' "$LOG_DIR"
printf 'Press Ctrl+C to stop all services.\n'

wait "$PID_AI" "$PID_BACKEND" "$PID_FRONTEND"
