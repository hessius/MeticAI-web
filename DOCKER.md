# Docker Deployment Guide

This guide explains how to build, configure, and deploy the MeticAI web application using Docker.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Building the Docker Image](#building-the-docker-image)
- [Running the Container](#running-the-container)
- [Docker Compose Deployment](#docker-compose-deployment)
- [External Server Configuration](#external-server-configuration)
- [Networking Considerations](#networking-considerations)
- [Troubleshooting](#troubleshooting)
- [Production Deployment](#production-deployment)

## Overview

The MeticAI web application is containerized using Docker with a multi-stage build process:

1. **Build Stage**: Uses Node.js 20 Alpine to install dependencies and build the React application
2. **Production Stage**: Uses Nginx Alpine to serve the static files with optimized caching and routing

This approach results in a lightweight production image (~25-30MB) with excellent performance.

## Prerequisites

- Docker Engine 20.10 or higher
- Docker Compose 2.0 or higher (optional, for simplified deployment)
- Access to the backend server (if running separately)

Verify your Docker installation:

```bash
docker --version
docker-compose --version
```

## Quick Start

The fastest way to get started is using Docker Compose:

```bash
# 1. Configure your backend server URL (edit public/runtime.config.json)
# 2. Start the application
docker-compose up -d

# 3. Access the application at http://localhost:8080
```

To stop the application:

```bash
docker-compose down
```

## Configuration

### Runtime Configuration File

The application uses `public/runtime.config.json` to configure the backend server URL at runtime, allowing you to change the server configuration without rebuilding the Docker image.

**Default `public/runtime.config.json`:**

```json
{
  "app": "d714b953697bb20df0a3",
  "serverUrl": "http://localhost:5000"
}
```

**Configuration Options:**

- `app`: Application identifier (do not modify)
- `serverUrl`: The URL of your backend server (e.g., `http://192.168.1.100:5000`, `https://api.example.com`)

### Configuring the Backend Server URL

Before deploying, update `public/runtime.config.json` with your backend server URL:

```bash
# Example 1: Backend on the Docker host machine
# Use host.docker.internal (Mac/Windows) or host's IP (Linux)
{
  "app": "d714b953697bb20df0a3",
  "serverUrl": "http://host.docker.internal:5000"
}

# Example 2: Backend on a remote server
{
  "app": "d714b953697bb20df0a3",
  "serverUrl": "https://api.meticai.example.com"
}

# Example 3: Backend on the same Docker network
{
  "app": "d714b953697bb20df0a3",
  "serverUrl": "http://backend:5000"
}
```

**Important Notes:**

- On **Mac/Windows Docker Desktop**: Use `host.docker.internal` to access services on the host machine
- On **Linux**: Use the host's actual IP address (e.g., `192.168.1.100`) or Docker's bridge network gateway
- For **production**: Use your actual domain name with HTTPS

## Building the Docker Image

### Manual Build

Build the Docker image manually:

```bash
# Build with default tag
docker build -t meticai-web .

# Build with custom tag
docker build -t meticai-web:v1.0.0 .

# Build with build arguments (if needed)
docker build --build-arg NODE_VERSION=20 -t meticai-web .
```

### Build Process

The Dockerfile uses a multi-stage build:

1. **Builder stage**: Installs dependencies and builds the application
   - Uses `node:20-alpine` for smaller image size
   - Runs `npm ci` for reproducible builds
   - Executes `npm run build` to create production assets

2. **Production stage**: Creates the final image
   - Uses `nginx:alpine` as the base
   - Copies built assets from the builder stage
   - Includes optimized nginx configuration
   - Exposes port 80

## Running the Container

### Basic Run

Run the container with basic settings:

```bash
docker run -d \
  --name meticai-web \
  -p 8080:80 \
  meticai-web
```

Access the application at `http://localhost:8080`

### Run with Custom Configuration

Mount your custom `public/runtime.config.json` file:

```bash
docker run -d \
  --name meticai-web \
  -p 8080:80 \
  -v $(pwd)/public/runtime.config.json:/usr/share/nginx/html/public/runtime.config.json:ro \
  meticai-web
```

### Run with Environment-Specific Config

```bash
# For production environment
docker run -d \
  --name meticai-web \
  -p 80:80 \
  -v /path/to/prod-public/runtime.config.json:/usr/share/nginx/html/public/runtime.config.json:ro \
  --restart unless-stopped \
  meticai-web
```

### Container Management

```bash
# View logs
docker logs meticai-web

# Follow logs in real-time
docker logs -f meticai-web

# Stop the container
docker stop meticai-web

# Start the container
docker start meticai-web

# Remove the container
docker rm meticai-web

# Remove container and image
docker rm meticai-web
docker rmi meticai-web
```

## Docker Compose Deployment

Docker Compose simplifies deployment by managing configuration in a single file.

### Basic Deployment

Use the provided `docker-compose.yml`:

```bash
# Start in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the application
docker-compose down
```

### Custom Docker Compose Configuration

Create a custom `docker-compose.override.yml` for your environment:

```yaml
version: '3.8'

services:
  meticai-web:
    ports:
      - "80:80"  # Use port 80 instead of 8080
    environment:
      - NGINX_HOST=meticai.example.com
    volumes:
      - ./production-public/runtime.config.json:/usr/share/nginx/html/public/runtime.config.json:ro
```

Run with overrides:

```bash
docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d
```

### Integration with Backend Service

If your backend is also containerized, you can include it in the same Docker Compose setup:

```yaml
version: '3.8'

services:
  meticai-web:
    build: .
    ports:
      - "8080:80"
    volumes:
      - ./public/runtime.config.json:/usr/share/nginx/html/public/runtime.config.json:ro
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

Update `public/runtime.config.json` to point to the backend service:

```json
{
  "app": "d714b953697bb20df0a3",
  "serverUrl": "http://backend:5000"
}
```

## External Server Configuration

### Scenario 1: Backend on Host Machine

**Mac/Windows:**
```json
{
  "serverUrl": "http://host.docker.internal:5000"
}
```

**Linux:**
```json
{
  "serverUrl": "http://172.17.0.1:5000"
}
```

Or use the host's actual IP:
```bash
# Find your host IP
ip addr show docker0 | grep inet

# Update public/runtime.config.json
{
  "serverUrl": "http://192.168.1.100:5000"
}
```

### Scenario 2: Backend on Remote Server

```json
{
  "serverUrl": "https://api.meticai.example.com"
}
```

### Scenario 3: Backend in Same Docker Network

```json
{
  "serverUrl": "http://backend-service:5000"
}
```

### Dynamic Configuration Update

You can update the configuration without restarting the container by mounting the config file:

```bash
# 1. Edit public/runtime.config.json on the host
vim public/runtime.config.json

# 2. The changes are immediately available (config is fetched on each page load)
# No container restart needed!
```

## Networking Considerations

### Port Mapping

The container exposes port 80 internally. Map it to any available port on your host:

```bash
# Map to port 8080
docker run -p 8080:80 meticai-web

# Map to port 3000
docker run -p 3000:80 meticai-web

# Map to standard HTTP port (requires sudo on Linux)
docker run -p 80:80 meticai-web
```

### Docker Networks

#### Bridge Network (Default)

The default bridge network works for most scenarios:

```bash
docker network ls
docker network inspect bridge
```

#### Custom Network

Create a custom network for better isolation and service discovery:

```bash
# Create network
docker network create meticai-network

# Run containers on the network
docker run -d --name meticai-web --network meticai-network -p 8080:80 meticai-web
docker run -d --name backend --network meticai-network your-backend-image
```

Services on the same network can communicate using service names.

### CORS Considerations

If the web app and backend are on different origins, ensure your backend server has proper CORS headers configured:

```python
# Example for Flask backend
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  # Adjust for production
```

## Troubleshooting

### Cannot Connect to Backend Server

1. **Check the public/runtime.config.json:**
   ```bash
   docker exec meticai-web cat /usr/share/nginx/html/public/runtime.config.json
   ```

2. **Test connectivity from container:**
   ```bash
   docker exec meticai-web wget -O- http://your-backend:5000/health
   ```

3. **Check network connectivity:**
   ```bash
   docker exec meticai-web ping backend-host
   ```

### Configuration Not Updating

The configuration is cached by the browser. To force a reload:

1. Clear browser cache
2. Hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
3. Open browser DevTools → Network → Disable cache

### Container Won't Start

1. **Check logs:**
   ```bash
   docker logs meticai-web
   ```

2. **Verify nginx configuration:**
   ```bash
   docker run --rm meticai-web nginx -t
   ```

3. **Check if port is already in use:**
   ```bash
   # On Linux/Mac
   sudo netstat -tuln | grep 8080
   
   # Use a different port
   docker run -p 8081:80 meticai-web
   ```

### Static Files Not Loading

1. **Verify files are in the container:**
   ```bash
   docker exec meticai-web ls -la /usr/share/nginx/html
   ```

2. **Check nginx logs:**
   ```bash
   docker exec meticai-web tail -f /var/log/nginx/error.log
   ```

### API Calls Failing

1. **Check browser console** for CORS errors
2. **Verify serverUrl** in public/runtime.config.json
3. **Test backend directly:**
   ```bash
   curl http://your-backend:5000/health
   ```

## Production Deployment

### Security Best Practices

1. **Use HTTPS** with a reverse proxy (nginx, Traefik, Caddy)
2. **Set proper CORS** headers on the backend
3. **Use secrets management** for sensitive configuration
4. **Enable security headers** (already configured in nginx.conf)
5. **Regular updates** of base images and dependencies

### Reverse Proxy Setup (nginx)

Example nginx reverse proxy configuration:

```nginx
server {
    listen 80;
    server_name meticai.example.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name meticai.example.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Health Checks

Add health check to docker-compose.yml:

```yaml
services:
  meticai-web:
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

### Resource Limits

Set resource limits to prevent container from consuming too much:

```yaml
services:
  meticai-web:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M
        reservations:
          cpus: '0.25'
          memory: 128M
```

### Logging

Configure logging driver for production:

```yaml
services:
  meticai-web:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### Production Checklist

- [ ] Configure proper `serverUrl` in public/runtime.config.json
- [ ] Set up HTTPS with reverse proxy
- [ ] Configure CORS headers on backend
- [ ] Set resource limits
- [ ] Configure health checks
- [ ] Set up log rotation
- [ ] Use `--restart unless-stopped` or equivalent
- [ ] Regular image updates and security patches
- [ ] Monitor container health and logs
- [ ] Back up configuration files

## Example Production Deployment

Complete production-ready docker-compose.yml:

```yaml
version: '3.8'

services:
  meticai-web:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: meticai-web-prod
    ports:
      - "8080:80"
    volumes:
      - ./public/runtime.config.json:/usr/share/nginx/html/public/runtime.config.json:ro
    environment:
      - NGINX_HOST=meticai.example.com
      - NGINX_PORT=80
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    networks:
      - meticai-network

networks:
  meticai-network:
    driver: bridge
```

---

For questions or issues, please refer to the main [README.md](./README.md) or open an issue on GitHub.
