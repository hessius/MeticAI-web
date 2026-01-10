# Docker Deployment Guide

This guide provides detailed instructions for deploying the MeticAI web application using Docker.

## Table of Contents

- [Quick Start](#quick-start)
- [Building the Docker Image](#building-the-docker-image)
- [Running the Container](#running-the-container)
- [Server Configuration](#server-configuration)
- [Docker Compose](#docker-compose)
- [Networking](#networking)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)

## Quick Start

The fastest way to get started with Docker:

**Option 1: Using the helper script (easiest)**

```bash
./docker-build.sh
```

This automated script handles everything:
1. Installs npm dependencies if needed
2. Builds the application
3. Builds and starts Docker containers

**Option 2: Manual steps**

```bash
# Build the application first
npm run build

# Using Docker Compose (recommended)
docker compose up -d

# Or build and run manually with the simple Dockerfile
docker build -f Dockerfile.simple -t meticai-web .
docker run -p 8080:80 meticai-web
```

The application will be available at `http://localhost:8080`.

**Important:** The current Docker setup uses `Dockerfile.simple` which requires building the application first with `npm run build`. This approach is more reliable as it avoids potential npm issues during Docker build. An alternative multi-stage `Dockerfile` is provided for building inside Docker, but it may encounter npm installation issues in some environments.

## Building the Docker Image

### Prerequisites

Before building the Docker image, you need to build the application:

```bash
npm install
npm run build
```

This creates the `dist` directory with the production-ready files.

### Basic Build

```bash
docker build -f Dockerfile.simple -t meticai-web .
```

### Build with Custom Tag

```bash
docker build -f Dockerfile.simple -t meticai-web:v1.0.0 .
```

### Build Process

The Docker setup includes two Dockerfiles:

1. **Dockerfile.simple** (recommended): Uses a pre-built `dist` folder
   - Build the app first with `npm run build`
   - Then build the Docker image
   - Faster and more reliable

2. **Dockerfile** (multi-stage build): Builds the application inside Docker
   - No need to build locally
   - May require additional configuration in some environments
   - Useful for CI/CD pipelines

The production image:
- Uses `nginx:alpine` to serve the static files
- Includes nginx configuration for SPA routing
- Exposes port 80
- Includes health checks

## Running the Container

### Basic Run

```bash
docker run -d -p 8080:80 --name meticai meticai-web
```

This will:
- Run the container in detached mode (`-d`)
- Map port 8080 on your host to port 80 in the container
- Name the container "meticai"

### Run with Custom Port

```bash
docker run -d -p 3000:80 --name meticai meticai-web
```

Access the application at `http://localhost:3000`.

### View Logs

```bash
# View logs
docker logs meticai

# Follow logs in real-time
docker logs -f meticai
```

### Stop and Remove Container

```bash
# Stop the container
docker stop meticai

# Remove the container
docker rm meticai
```

## Server Configuration

The application needs to connect to a backend server for espresso profile generation. By default, it connects to `http://localhost:5000`, but you can configure this for different deployments.

### Option 1: Mount Configuration File (Recommended)

Create a `config.json` file on your host system:

```json
{
  "serverUrl": "http://your-backend-server:5000"
}
```

Then mount it when running the container:

```bash
docker run -d -p 8080:80 \
  -v $(pwd)/config.json:/usr/share/nginx/html/config.json:ro \
  --name meticai \
  meticai-web
```

The `:ro` flag mounts the file as read-only.

### Option 2: Use Docker Exec

If the container is already running, you can create the config file inside:

```bash
docker exec -it meticai sh -c 'echo "{\"serverUrl\":\"http://192.168.1.100:5000\"}" > /usr/share/nginx/html/config.json'
```

### Configuration Examples

#### Local Development Backend
```json
{
  "serverUrl": "http://localhost:5000"
}
```

#### Backend on Host Machine (from Docker)
When running in Docker and the backend is on the host machine:

**Linux:**
```json
{
  "serverUrl": "http://172.17.0.1:5000"
}
```

**macOS/Windows (Docker Desktop):**
```json
{
  "serverUrl": "http://host.docker.internal:5000"
}
```

#### Remote Backend Server
```json
{
  "serverUrl": "http://192.168.1.100:8080"
}
```

#### Production Backend
```json
{
  "serverUrl": "https://api.meticai.example.com"
}
```

## Docker Compose

Docker Compose provides an easier way to manage the container with all its configurations.

### Using Docker Compose

The included `docker-compose.yml` file provides a complete setup. Make sure you've built the application first:

```bash
# Build the application
npm run build

# Start the application
docker compose up -d

# View logs
docker compose logs -f

# Stop the application
docker compose down
```

### Custom Configuration with Docker Compose

1. **Create a `config.json` file** in the same directory as `docker-compose.yml`:

   ```json
   {
     "serverUrl": "http://your-backend:5000"
   }
   ```

2. **Start the application**:

   ```bash
   docker-compose up -d
   ```

The `docker-compose.yml` file automatically mounts `config.json` if it exists.

### Customizing docker-compose.yml

You can modify the `docker-compose.yml` file to suit your needs:

```yaml
services:
  web:
    build:
      context: .
      dockerfile: Dockerfile.simple  # or Dockerfile for multi-stage build
    ports:
      - "8080:80"  # Change the host port here
    volumes:
      - ./config.json:/usr/share/nginx/html/config.json:ro
    restart: unless-stopped
    environment:
      # Add environment variables if needed
      - TZ=America/New_York
```

## Networking

### Accessing External Servers

The containerized web application can communicate with backend servers outside the Docker network.

#### Same Host Network

To allow the container to access services on the host machine, use:

```bash
docker run -d -p 8080:80 --network host --name meticai meticai-web
```

**Note:** `--network host` is only available on Linux. On macOS/Windows, use `host.docker.internal`.

#### Custom Bridge Network

Create a custom bridge network for better isolation:

```bash
# Create network
docker network create meticai-network

# Run container on the network
docker run -d -p 8080:80 --network meticai-network --name meticai meticai-web
```

#### Connecting to Other Containers

If your backend server is also in a Docker container:

```yaml
services:
  web:
    build:
      context: .
      dockerfile: Dockerfile.simple
    ports:
      - "8080:80"
    depends_on:
      - backend
    networks:
      - meticai-network

  backend:
    image: your-backend-image:latest
    ports:
      - "5000:5000"
    networks:
      - meticai-network

networks:
  meticai-network:
    driver: bridge
```

Then configure the web app to use `http://backend:5000` as the server URL.

### Network Troubleshooting

#### Test Container Network Connectivity

```bash
# Enter the container
docker exec -it meticai sh

# Test connectivity (if wget is available)
wget -O- http://your-backend:5000/health

# Or use the healthcheck
docker inspect meticai | grep -A 5 Health
```

#### Check Container IP

```bash
docker inspect meticai | grep IPAddress
```

## Production Deployment

### Best Practices

1. **Use a specific version tag**:
   ```bash
   docker build -t meticai-web:1.0.0 .
   ```

2. **Use environment-specific configs**:
   - Development: `config.dev.json`
   - Staging: `config.staging.json`
   - Production: `config.prod.json`

3. **Enable HTTPS** (use a reverse proxy like nginx or Traefik):
   ```yaml
   version: '3.8'
   
   services:
     web:
       build: .
       expose:
         - "80"
       labels:
         - "traefik.enable=true"
         - "traefik.http.routers.meticai.rule=Host(`meticai.example.com`)"
         - "traefik.http.routers.meticai.tls=true"
   ```

4. **Set resource limits**:
   ```yaml
   services:
     web:
       build: .
       deploy:
         resources:
           limits:
             cpus: '0.5'
             memory: 512M
           reservations:
             cpus: '0.25'
             memory: 256M
   ```

5. **Use health checks**:
   The Dockerfile includes a health check that runs every 30 seconds.

### Deployment Checklist

- [ ] Build the Docker image with a version tag
- [ ] Create production `config.json` with correct backend URL
- [ ] Test the container locally
- [ ] Configure reverse proxy for HTTPS (if needed)
- [ ] Set up container orchestration (Kubernetes, Docker Swarm, etc.)
- [ ] Configure monitoring and logging
- [ ] Set up automated backups (if applicable)
- [ ] Document the deployment for your team

### Example Production Setup

```bash
# Build the application
npm run build

# Build with version tag
docker build -f Dockerfile.simple -t meticai-web:1.0.0 .

# Create production config
cat > config.production.json << EOF
{
  "serverUrl": "https://api.meticai.example.com"
}
EOF

# Run with production config
docker run -d \
  --name meticai-prod \
  -p 8080:80 \
  -v $(pwd)/config.production.json:/usr/share/nginx/html/config.json:ro \
  --restart unless-stopped \
  meticai-web:1.0.0

# Verify it's running
docker ps | grep meticai-prod
docker logs meticai-prod
```

## Troubleshooting

### "dist" Directory Not Found Error

If you encounter an error like `failed to compute cache key: "/dist": not found` when running `docker compose up`:

**Cause:** The application hasn't been built yet, so the `dist` directory doesn't exist.

**Solution:**

```bash
# Option 1: Use the helper script
./docker-build.sh

# Option 2: Build manually then run docker compose
npm run build
docker compose up -d
```

The `Dockerfile.simple` used by docker-compose requires a pre-built `dist` folder. Always run `npm run build` before `docker compose up`.

### Container Won't Start

```bash
# Check logs
docker logs meticai

# Check if port is already in use
netstat -tulpn | grep 8080

# Try running in foreground to see errors
docker run -p 8080:80 meticai-web
```

### Can't Access the Application

1. **Check if container is running**:
   ```bash
   docker ps
   ```

2. **Check port mapping**:
   ```bash
   docker port meticai
   ```

3. **Test from inside the container**:
   ```bash
   docker exec -it meticai sh
   wget -O- http://localhost
   ```

### Configuration Not Loading

1. **Verify config file exists in container**:
   ```bash
   docker exec -it meticai cat /usr/share/nginx/html/config.json
   ```

2. **Check browser console** for errors loading config

3. **Verify the config.json is valid JSON**:
   ```bash
   cat config.json | python -m json.tool
   ```

### Cannot Connect to Backend Server

1. **From the container, test backend connectivity**:
   ```bash
   docker exec -it meticai sh
   # Try to reach backend (install curl if needed)
   apk add --no-cache curl
   curl http://your-backend:5000/health
   ```

2. **Check network configuration**:
   ```bash
   docker network inspect meticai-network
   ```

3. **Verify server URL in config**:
   ```bash
   docker exec -it meticai cat /usr/share/nginx/html/config.json
   ```

### Rebuild After Changes

If you make changes to the application:

```bash
# Rebuild the application
npm run build

# Stop and remove the old container
docker compose down

# Rebuild the image (--no-cache ensures a fresh build)
docker compose build --no-cache

# Start with the new image
docker compose up -d
```

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [MeticAI README](./README.md)

## Support

If you encounter issues not covered in this guide:

1. Check the [main README](./README.md) for general application information
2. Review Docker logs: `docker logs meticai`
3. Open an issue on GitHub with:
   - Docker version: `docker --version`
   - Container logs
   - Configuration file contents
   - Steps to reproduce the issue
