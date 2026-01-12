#!/bin/bash
set -e

echo "Building MeticAI web application for Docker..."

# Check for required dependencies
echo "Checking dependencies..."

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed."
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check for npm
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed."
    echo "Please install npm (usually comes with Node.js)"
    exit 1
fi

# Check for Docker
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed."
    echo "Please install Docker from https://docs.docker.com/get-docker/"
    exit 1
fi

# Check for docker compose (try both 'docker compose' and 'docker-compose')
DOCKER_COMPOSE_CMD=()
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE_CMD=(docker compose)
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_CMD=(docker-compose)
else
    echo "Error: Docker Compose is not installed."
    echo "Please install Docker Compose from https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✓ All dependencies found"
echo "  Node.js: $(node --version)"
echo "  npm: $(npm --version)"
echo "  Docker: $(docker --version)"
echo "  Docker Compose: $("${DOCKER_COMPOSE_CMD[@]}" version --short 2>/dev/null || echo 'installed')"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Build the application
echo "Building the application..."
npm run build

# Function to run docker compose with sudo fallback
run_docker_compose() {
    if "${DOCKER_COMPOSE_CMD[@]}" "$@" 2>/dev/null; then
        return 0
    else
        echo "Docker compose failed without sudo, trying with sudo..."
        if command -v sudo &> /dev/null; then
            sudo "${DOCKER_COMPOSE_CMD[@]}" "$@"
        else
            echo "Error: sudo is not available and docker compose requires elevated privileges"
            echo "Please run this script with appropriate permissions or install sudo"
            exit 1
        fi
    fi
}

# Build and start Docker containers
echo "Building Docker image and starting containers..."
run_docker_compose up -d --build

echo ""
echo "✓ Done! Application is running at http://localhost:3550"
echo ""
echo "IMPORTANT: API Configuration"
echo "----------------------------"
echo "To connect to your backend API, you need to create a config.json file."
echo "Replace 5000 with your actual API port if different."
echo ""
echo "If your API is running on the host machine:"
echo "  Linux:   echo '{\"serverUrl\":\"http://172.17.0.1:5000\"}' > config.json"
echo "  Mac/Win: echo '{\"serverUrl\":\"http://host.docker.internal:5000\"}' > config.json"
echo ""
echo "If your API is at a different location:"
echo "  echo '{\"serverUrl\":\"http://your-api-server:PORT\"}' > config.json"
echo ""
echo "After creating config.json, restart the container:"
echo "  ${DOCKER_COMPOSE_CMD[*]} restart"
echo ""
echo "To view logs: ${DOCKER_COMPOSE_CMD[*]} logs -f"
echo "To stop: ${DOCKER_COMPOSE_CMD[*]} down"
