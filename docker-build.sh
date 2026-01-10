#!/bin/bash
set -e

echo "Building MeticAI web application for Docker..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Build the application
echo "Building the application..."
npm run build

# Build and start Docker containers
echo "Building Docker image and starting containers..."
docker compose up -d --build

echo "Done! Application is running at http://localhost:8080"
echo "To view logs: docker compose logs -f"
echo "To stop: docker compose down"
