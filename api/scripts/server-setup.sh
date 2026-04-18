#!/bin/bash
# ============================================
# IET Management System - Server Setup Script
# ============================================
# Run this on your production server to set up the deployment environment.
# Usage: bash scripts/server-setup.sh
#
# Prerequisites: Ubuntu 22.04+ with root/sudo access

set -e

echo "=== IET Management System - Server Setup ==="

# Update system
echo "[1/6] Updating system packages..."
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker
echo "[2/6] Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker $USER
    echo "Docker installed. You may need to log out and back in for group changes."
else
    echo "Docker already installed."
fi

# Install Docker Compose plugin
echo "[3/6] Installing Docker Compose..."
if ! docker compose version &> /dev/null; then
    sudo apt-get install -y docker-compose-plugin
else
    echo "Docker Compose already installed."
fi

# Create deployment directory
DEPLOY_DIR="/opt/iet-api"
echo "[4/6] Setting up deployment directory at $DEPLOY_DIR..."
sudo mkdir -p $DEPLOY_DIR
sudo chown $USER:$USER $DEPLOY_DIR

# Clone repo (skip if already exists)
if [ ! -d "$DEPLOY_DIR/.git" ]; then
    echo "[5/6] Cloning repository..."
    echo "Please run: git clone <your-repo-url> $DEPLOY_DIR"
else
    echo "[5/6] Repository already exists at $DEPLOY_DIR"
fi

# Create .env from example
if [ ! -f "$DEPLOY_DIR/.env" ]; then
    echo "[6/6] Creating .env file..."
    if [ -f "$DEPLOY_DIR/.env.example" ]; then
        cp "$DEPLOY_DIR/.env.example" "$DEPLOY_DIR/.env"
        echo "IMPORTANT: Edit $DEPLOY_DIR/.env with your production values!"
    fi
else
    echo "[6/6] .env file already exists"
fi

# Setup firewall
echo ""
echo "=== Firewall Setup ==="
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw --force enable
echo "Firewall configured (ports 22, 80, 443 open)"

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "  1. cd $DEPLOY_DIR"
echo "  2. Edit .env with production values (especially DB_PASSWORD, JWT_SECRET, etc.)"
echo "  3. docker compose up -d"
echo "  4. Verify: curl http://localhost:3000/health"
echo ""
echo "For SSL, place certificates in $DEPLOY_DIR/nginx/ssl/ and uncomment SSL lines in nginx.conf"
