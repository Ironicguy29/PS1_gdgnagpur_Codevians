#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

PROJECT_ROOT="$SCRIPT_DIR"
AI_DIR="$PROJECT_ROOT/ai_service"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
LOG_DIR="$PROJECT_ROOT/.runtime-logs"

# Styling definitions
BOLD='\033[1m'
DIM='\033[2m'
UNDERLINE='\033[4m'
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

declare -a CHILD_PIDS=()

log() {
  local icon="$1"
  local color="$2"
  local message="$3"
  printf "  %b%s%b %s\n" "$color" "$icon" "$NC" "$message"
}

info()    { log "✦" "$CYAN" "$1"; }
success() { log "✔" "$GREEN" "$1"; }
warn()    { log "⚠" "$YELLOW" "$1"; }
error()   { log "✖" "$RED" "$1"; }
step()    { log "➔" "$BLUE" "$1"; }

show_banner() {
  clear || true
  printf "%b" "$CYAN"
  cat << "EOF"
    ___                             __  ___ _  __                
   /   |  _________  ____  ______ _/  |/  /(_)/ /__________ _    
  / /| | / ___/ __ \/ __ \/ __  / / /|_/ // // __/ ___/ __  /    
 / ___ |/ /  / /_/ / /_/ / /_/ / / /  / // // /_/ /  / /_/ /     
/_/  |_/_/   \____/\__, /\__, /_/_/  /_//_/ \__/_/   \__,_/      
                  /____//____/                                   
EOF
  printf "%b" "$NC"
  printf "  %b┌────────────────────────────────────────────────────────┐%b\n" "$DIM" "$NC"
  printf "  %b│%b  %bArogyaMitra%b | %bFuturistic AI Government Healthcare Platform%b  %b│%b\n" "$DIM" "$NC" "$BOLD$CYAN" "$NC" "$DIM" "$NC" "$DIM" "$NC"
  printf "  %b└────────────────────────────────────────────────────────┘%b\n" "$DIM" "$NC"
  printf "\n"
}

cleanup() {
  local exit_code=$?
  printf "\n"
  warn "Termination signal received. Shutting down all active processes..."
  if [ ${#CHILD_PIDS[@]} -gt 0 ]; then
    kill "${CHILD_PIDS[@]}" 2>/dev/null || true
  fi
  success "Goodbye! Services stopped cleanly."
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
    warn "Port $port is in use by PID(s): $pids"
    for pid in $pids; do
      if ps -p "$pid" -o comm= 2>/dev/null | grep -E 'node|python|uvicorn|next' >/dev/null 2>&1; then
        step "Killing matching local development process PID $pid..."
        kill "$pid" 2>/dev/null || true
      else
        warn "Skipping PID $pid (not identified as a next/node/python/uvicorn dev server)."
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
      success "$name is responsive at $url"
      return 0
    fi
    attempts=$((attempts - 1))
    sleep 1
  done
  error "$name did not become ready in time."
  return 1
}

# Run the setup
show_banner

require_dir "$PROJECT_ROOT"
require_dir "$AI_DIR"
require_dir "$BACKEND_DIR"
require_dir "$FRONTEND_DIR"
mkdir -p "$LOG_DIR"

info "Initializing local environment configuration..."

if [ ! -f "$BACKEND_DIR/.env" ]; then
  step "Generating backend environment config (.env)..."
  cat > "$BACKEND_DIR/.env" <<'EOF'
PORT=5000
MONGO_URI=mongodb+srv://codevians_db_user:H9hli37vb5Y8lQFZ@cluster0.yupgcvd.mongodb.net/arogyamitra?retryWrites=true&w=majority&appName=Cluster0
AI_SERVICE_URL=http://localhost:8000
JWT_SECRET=supersecretkey123
EOF
  success "Backend environment configured."
fi

if [ ! -f "$FRONTEND_DIR/.env.local" ]; then
  step "Generating frontend environment config (.env.local)..."
  cat > "$FRONTEND_DIR/.env.local" <<'EOF'
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_AI_URL=http://localhost:8000
EOF
  success "Frontend environment configured."
fi


info "Checking ports and freeing resources..."
ensure_port_available 8000
ensure_port_available 5000
ensure_port_available 3000

# Python virtual environment checks
VENV_DIR=""
for candidate in "$PROJECT_ROOT/.venv" "$PROJECT_ROOT/../.venv" "$HOME/.venv" "$AI_DIR/.venv"; do
  if [ -x "$candidate/bin/python" ]; then
    VENV_DIR="$candidate"
    break
  fi
done

if [ -z "$VENV_DIR" ]; then
  step "Virtual environment not detected. Creating one at $PROJECT_ROOT/.venv..."
  python3 -m venv "$PROJECT_ROOT/.venv"
  VENV_DIR="$PROJECT_ROOT/.venv"
  success "Virtual environment created successfully."
fi

VENV_PYTHON="$VENV_DIR/bin/python"
VENV_PIP="$VENV_DIR/bin/pip"
VENV_ACTIVATE="$VENV_DIR/bin/activate"

if [ ! -x "$VENV_PYTHON" ]; then
  error "Virtual environment Python binary missing at $VENV_PYTHON"
  exit 1
fi

info "Activating virtual environment: $VENV_DIR"
# shellcheck disable=SC1090
source "$VENV_ACTIVATE"

step "Updating packages and installing Python requirements..."
python -m pip install --upgrade pip >/dev/null 2>&1 || true
python -m pip install -r "$AI_DIR/requirements.txt" >/dev/null 2>&1
success "Python package setup complete."

step "Starting AI Service on port 8000..."
(
  cd "$AI_DIR"
  "$VENV_PYTHON" -m uvicorn app.main:app --host 0.0.0.0 --port 8000
) > "$LOG_DIR/ai.log" 2>&1 &
CHILD_PIDS+=("$!")
PID_AI=$!

if [ ! -d "$BACKEND_DIR/node_modules" ]; then
  step "Installing backend dependencies (npm install)..."
  (cd "$BACKEND_DIR" && npm install --no-audit --no-fund) >/dev/null 2>&1
  success "Backend Node dependencies installed."
else
  info "Backend Node dependencies already installed."
fi

step "Starting Express Backend API on port 5000..."
(
  cd "$BACKEND_DIR"
  npm run dev
) > "$LOG_DIR/backend.log" 2>&1 &
CHILD_PIDS+=("$!")
PID_BACKEND=$!

if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
  step "Installing frontend dependencies (npm install)..."
  (cd "$FRONTEND_DIR" && npm install --no-audit --no-fund) >/dev/null 2>&1
  success "Frontend Node dependencies installed."
else
  info "Frontend Node dependencies already installed."
fi

step "Starting Next.js Frontend App on port 3000..."
(
  cd "$FRONTEND_DIR"
  npm run dev -- --hostname 0.0.0.0 --port 3000
) > "$LOG_DIR/frontend.log" 2>&1 &
CHILD_PIDS+=("$!")
PID_FRONTEND=$!

info "Waiting for services to become responsive..."
wait_for_http "http://localhost:8000/" "AI Service" || true
wait_for_http "http://localhost:5000/" "Backend API" || true
wait_for_http "http://localhost:3000/" "Frontend App" || true

printf "\n"
printf "  %b━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━%b\n" "$GREEN" "$NC"
printf "  %b✔  ALL SERVICES ACTIVE AND HEALTHY%b\n" "$BOLD$GREEN" "$NC"
printf "  %b━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━%b\n" "$GREEN" "$NC"
printf "  %b✦  AI Service:   %b%bhttp://localhost:8000%b\n" "$CYAN" "$NC$UNDERLINE" "http://localhost:8000" "$NC"
printf "  %b✦  Backend API:  %b%bhttp://localhost:5000%b\n" "$CYAN" "$NC$UNDERLINE" "http://localhost:5000" "$NC"
printf "  %b✦  Frontend App: %b%bhttp://localhost:3000%b\n" "$CYAN" "$NC$UNDERLINE" "http://localhost:3000" "$NC"
printf "\n"
printf "  %b🗎  Runtime logs are stored in: %b%s\n" "$DIM" "$NC$DIM" "$LOG_DIR"
printf "  %b⚡ Press Ctrl+C to safely terminate all background processes.%b\n" "$BOLD$YELLOW" "$NC"
printf "  %b━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━%b\n" "$GREEN" "$NC"
printf "\n"

wait "$PID_AI" "$PID_BACKEND" "$PID_FRONTEND"
