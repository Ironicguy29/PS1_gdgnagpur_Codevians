#!/bin/bash
echo "Starting ArogyaMitra Project..."
echo "This will use Docker Compose to start Frontend, Backend, AI Service, and MongoDB."

# Check if docker is running
if ! sudo docker info > /dev/null 2>&1; then
  echo "Error: Docker is not running. Please start Docker."
  exit 1
fi

# Build and start services
echo "Building and starting services..."
# Use -d for detached mode, but we can verify status separately
sudo docker-compose up -d --build

if [ $? -eq 0 ]; then
  echo "Services started successfully!"
  echo "Frontend: http://localhost:3000"
  echo "Backend: http://localhost:5000"
  echo "AI Service: http://localhost:8000"
  
  echo "Checking service status..."
  docker-compose ps
else
  echo "Failed to start services."
  exit 1
fi
