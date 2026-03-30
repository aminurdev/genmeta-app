#!/bin/bash

# ============================================
# EC2 Server Setup Script for GenMeta Backend
# ============================================
# Run this script on your EC2 instance to prepare for automated deployments
# Usage: bash EC2_SETUP_COMMANDS.sh

set -e  # Exit on error

echo "🚀 Starting EC2 setup for GenMeta Backend..."
echo ""

# ============================================
# 1. Update System
# ============================================
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# ============================================
# 2. Install Node.js 20.x
# ============================================
echo ""
echo "📦 Installing Node.js 20.x..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
else
    echo "Node.js already installed: $(node --version)"
fi

# Verify Node.js version
NODE_VERSION=$(node --version)
echo "✅ Node.js version: $NODE_VERSION"

# ============================================
# 3. Install PM2
# ============================================
echo ""
echo "📦 Installing PM2..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
    
    # Setup PM2 startup script
    echo "Setting up PM2 startup..."
    pm2 startup | tail -n 1 | sudo bash
else
    echo "PM2 already installed: $(pm2 --version)"
fi

echo "✅ PM2 installed successfully"

# ============================================
# 4. Install Nginx
# ============================================
echo ""
echo "📦 Installing Nginx..."
if ! command -v nginx &> /dev/null; then
    sudo apt install -y nginx
else
    echo "Nginx already installed"
fi

echo "✅ Nginx installed successfully"

# ============================================
# 5. Create Application Directory
# ============================================
echo ""
echo "📁 Creating application directory..."
APP_DIR="/var/www/genmeta-backend"

if [ ! -d "$APP_DIR" ]; then
    sudo mkdir -p $APP_DIR
    echo "Created directory: $APP_DIR"
else
    echo "Directory already exists: $APP_DIR"
fi

# Set ownership
sudo chown -R $USER:$USER $APP_DIR
echo "✅ Set ownership to $USER"

# Create subdirectories
mkdir -p $APP_DIR/logs
mkdir -p $APP_DIR/backups

# ============================================
# 6. Configure Nginx
# ============================================
echo ""
echo "🔧 Configuring Nginx..."

# Prompt for domain
read -p "Enter your domain name (or press Enter to skip): " DOMAIN_NAME

if [ -z "$DOMAIN_NAME" ]; then
    DOMAIN_NAME="your-domain.com"
    echo "⚠️  Using placeholder domain. You'll need to edit the config later."
fi

# Create Nginx config
sudo tee /etc/nginx/sites-available/genmeta-backend > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN_NAME;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/genmeta-backend-access.log;
    error_log /var/log/nginx/genmeta-backend-error.log;

    # Proxy to Node.js app
    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint (optional)
    location /health {
        proxy_pass http://localhost:8000/health;
        access_log off;
    }
}
EOF

# Enable site
if [ ! -L /etc/nginx/sites-enabled/genmeta-backend ]; then
    sudo ln -s /etc/nginx/sites-available/genmeta-backend /etc/nginx/sites-enabled/
    echo "✅ Nginx site enabled"
fi

# Remove default site if exists
if [ -L /etc/nginx/sites-enabled/default ]; then
    sudo rm /etc/nginx/sites-enabled/default
    echo "Removed default Nginx site"
fi

# Test Nginx config
if sudo nginx -t; then
    echo "✅ Nginx configuration is valid"
    sudo systemctl restart nginx
    sudo systemctl enable nginx
    echo "✅ Nginx restarted and enabled"
else
    echo "❌ Nginx configuration has errors"
    exit 1
fi

# ============================================
# 7. Configure Firewall
# ============================================
echo ""
echo "🔥 Configuring firewall..."

if command -v ufw &> /dev/null; then
    sudo ufw allow 22/tcp   # SSH
    sudo ufw allow 80/tcp   # HTTP
    sudo ufw allow 443/tcp  # HTTPS
    
    # Enable firewall (with confirmation)
    echo "y" | sudo ufw enable
    
    echo "✅ Firewall configured"
    sudo ufw status
else
    echo "⚠️  UFW not installed, skipping firewall configuration"
fi

# ============================================
# 8. Create Environment File Template
# ============================================
echo ""
echo "📝 Creating .env template..."

cat > $APP_DIR/.env.template <<EOF
# Server Configuration
NODE_ENV=production
PORT=8000

# Database
MONGODB_URI=mongodb://localhost:27017/genmeta

# JWT Configuration
JWT_SECRET=CHANGE_THIS_TO_SECURE_RANDOM_STRING
JWT_REFRESH_SECRET=CHANGE_THIS_TO_SECURE_RANDOM_STRING
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Email Service (Resend)
RESEND_API_KEY=your-resend-api-key

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://$DOMAIN_NAME/api/auth/google/callback

# Frontend URL
CLIENT_URL=https://$DOMAIN_NAME

# Session Configuration
SESSION_SECRET=CHANGE_THIS_TO_SECURE_RANDOM_STRING

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Origins (comma-separated)
CORS_ORIGINS=https://$DOMAIN_NAME,https://www.$DOMAIN_NAME
EOF

echo "✅ Created .env template at $APP_DIR/.env.template"
echo ""
echo "⚠️  IMPORTANT: Copy .env.template to .env and update with your actual values!"
echo "   Command: cd $APP_DIR && cp .env.template .env && nano .env"

# ============================================
# 9. Setup SSH for GitHub Actions
# ============================================
echo ""
echo "🔑 SSH Key Setup Instructions:"
echo ""
echo "On your LOCAL machine, run:"
echo "  ssh-keygen -t ed25519 -C 'github-actions' -f ~/.ssh/github_deploy_key"
echo ""
echo "Then copy the PUBLIC key to this server:"
echo "  cat ~/.ssh/github_deploy_key.pub"
echo ""
echo "And add it to ~/.ssh/authorized_keys on this server:"
echo "  echo 'YOUR_PUBLIC_KEY' >> ~/.ssh/authorized_keys"
echo "  chmod 600 ~/.ssh/authorized_keys"
echo ""
echo "Finally, add the PRIVATE key to GitHub Secrets as EC2_SSH_KEY"

# ============================================
# 10. Summary
# ============================================
echo ""
echo "============================================"
echo "✅ EC2 Setup Complete!"
echo "============================================"
echo ""
echo "📋 Summary:"
echo "  ✅ Node.js $NODE_VERSION installed"
echo "  ✅ PM2 installed and configured"
echo "  ✅ Nginx installed and configured"
echo "  ✅ Application directory: $APP_DIR"
echo "  ✅ Firewall configured (SSH, HTTP, HTTPS)"
echo "  ✅ .env template created"
echo ""
echo "📝 Next Steps:"
echo ""
echo "1. Configure environment variables:"
echo "   cd $APP_DIR"
echo "   cp .env.template .env"
echo "   nano .env"
echo "   # Update all values with your production credentials"
echo ""
echo "2. Setup SSH key for GitHub Actions (see instructions above)"
echo ""
echo "3. Add GitHub Secrets:"
echo "   - EC2_HOST: $(curl -s http://checkip.amazonaws.com || echo 'YOUR_EC2_IP')"
echo "   - EC2_USERNAME: $USER"
echo "   - EC2_SSH_KEY: (your private key)"
echo "   - APP_DIR: $APP_DIR"
echo ""
echo "4. (Optional) Setup SSL with Let's Encrypt:"
echo "   sudo apt install -y certbot python3-certbot-nginx"
echo "   sudo certbot --nginx -d $DOMAIN_NAME"
echo ""
echo "5. Push to main branch to trigger deployment!"
echo ""
echo "============================================"
echo "🚀 Ready for automated deployments!"
echo "============================================"
