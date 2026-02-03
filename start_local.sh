#!/bin/bash

# Function to kill child processes on exit
cleanup() {
    echo "Stopping all services..."
    kill $(jobs -p) 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM

echo "Starting ArogyaMitra Project Locally..."

# Check backend .env
if [ ! -f "backend/.env" ]; then
    echo "Creating backend/.env..."
    echo "PORT=5000" > backend/.env
    echo "MONGO_URI=mongodb://localhost:27017/arogyamitra" >> backend/.env
    echo "AI_SERVICE_URL=http://localhost:8000" >> backend/.env
    echo "JWT_SECRET=supersecretkey123" >> backend/.env # Adding a default secret
fi

# Check frontend .env.local
if [ ! -f "frontend/.env.local" ]; then
    echo "Creating frontend/.env.local..."
    echo "NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1" > frontend/.env.local
fi

# Start AI Service
echo "Starting AI Service on port 8000..."
cd ai_service
# Try to install dependencies globally/user-level since venv might fail
if python3 -m pip --version > /dev/null 2>&1; then
    python3 -m pip install --user -r requirements.txt
    # Run using python -m to avoid path issues
    python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 &
    PID_AI=$!
else
    echo "WARNING: 'pip' not found. Cannot install AI Service dependencies."
    echo "AI Service will NOT be started. Some features may not work."
fi
cd ..

# Start Backend
echo "Starting Backend on port 5000..."
cd backend
npm install > /dev/null 2>&1
npm run dev &
PID_BACKEND=$!
cd ..

# Start Frontend
echo "Starting Frontend on port 3000..."
cd frontend
npm install > /dev/null 2>&1
npm run dev &
PID_FRONTEND=$!
cd ..

echo "All services started!"
echo "AI Service: http://localhost:8000"
echo "Backend:    http://localhost:5000"
echo "Frontend:   http://localhost:3000"
echo "Press Ctrl+C to stop all services."

wait
