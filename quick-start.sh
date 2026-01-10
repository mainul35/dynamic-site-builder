#!/bin/bash

# Quick Start Script for Visual Site Designer (VSD)
# This script helps you quickly deploy the VSD application

set -e

echo "================================================"
echo "Visual Site Designer - Quick Start"
echo "================================================"
echo ""

# Check if docker is installed
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "Error: Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create necessary directories
echo "Creating required directories..."
mkdir -p data plugins-runtime

# Check if .env file exists
if [ -f ".env" ]; then
    echo ""
    echo "Found existing .env file."
    read -p "Do you want to use it? (y/n): " use_existing_env
    if [ "$use_existing_env" != "y" ] && [ "$use_existing_env" != "Y" ]; then
        rm .env
    fi
fi

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    echo ""
    echo "Setting up environment configuration..."
    echo ""
    read -p "Enter your Cloudflare Tunnel Token: " tunnel_token

    if [ -z "$tunnel_token" ]; then
        echo "Error: Tunnel token is required!"
        echo ""
        echo "To get your tunnel token:"
        echo "1. Go to https://one.dash.cloudflare.com"
        echo "2. Navigate to Networks → Tunnels"
        echo "3. Create a tunnel named 'vsd-tunnel'"
        echo "4. Copy the tunnel token"
        echo ""
        echo "See CLOUDFLARE-TUNNEL-DEPLOYMENT.md for detailed instructions."
        exit 1
    fi

    # Create .env file
    cat > .env << EOF
# Visual Site Designer (VSD) Environment Configuration
DOMAIN=myvsd.mainul35.dev
CLOUDFLARE_TUNNEL_TOKEN=$tunnel_token
DB_NAME=vsd-db
DB_PATH=/app/data
SERVER_PORT=8080
PLUGIN_DIRECTORY=/app/plugins
SPRING_PROFILES_ACTIVE=prod
SERVER_FORWARD_HEADERS_STRATEGY=FRAMEWORK
SERVER_TOMCAT_REMOTEIP_REMOTE_IP_HEADER=CF-Connecting-IP
SERVER_TOMCAT_REMOTEIP_PROTOCOL_HEADER=X-Forwarded-Proto
LOGGING_LEVEL_ROOT=INFO
LOGGING_LEVEL_APP=DEBUG
MAX_FILE_SIZE=50MB
MAX_REQUEST_SIZE=50MB
EOF

    echo ""
    echo "✓ Environment configuration created"
fi

# Build and start services
echo ""
echo "Building Docker images..."
docker-compose build

echo ""
echo "Starting services..."
docker-compose up -d

echo ""
echo "Waiting for services to be ready..."
sleep 15

# Check service status
echo ""
echo "Service Status:"
docker-compose ps

# Check cloudflared connection
echo ""
echo "Checking Cloudflare Tunnel status..."
sleep 5
docker-compose logs cloudflared | tail -20

echo ""
echo "================================================"
echo "Deployment Complete!"
echo "================================================"
echo ""
echo "✓ Application: https://myvsd.mainul35.dev"
echo "✓ SSL: Automatic (via Cloudflare)"
echo "✓ Security: DDoS protection enabled"
echo ""
echo "Next Steps:"
echo "1. Wait 1-2 minutes for tunnel to fully connect"
echo "2. Verify tunnel status in Cloudflare dashboard:"
echo "   https://one.dash.cloudflare.com → Networks → Tunnels"
echo "3. Access your application: https://myvsd.mainul35.dev"
echo ""
echo "Useful commands:"
echo "  View logs: docker-compose logs -f"
echo "  View app logs: docker-compose logs -f vsd-app"
echo "  View tunnel logs: docker-compose logs -f cloudflared"
echo "  Stop services: docker-compose down"
echo "  Restart: docker-compose restart"
echo ""
echo "Documentation:"
echo "  Full guide: CLOUDFLARE-TUNNEL-DEPLOYMENT.md"
echo ""
