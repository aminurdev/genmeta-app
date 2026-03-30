# Backend Deployment Guide - GitHub Actions CI/CD

This guide covers the complete setup for automated deployment of the GenMeta backend to EC2 using GitHub Actions.

## 📋 Prerequisites

### On Your EC2 Server

1. **Node.js & npm** (v20.13.1 or compatible)
2. **PM2** (Process Manager)
3. **Nginx** (Web Server/Reverse Proxy)
4. **Git** (Optional, for manual deployments)

### GitHub Repository Secrets

You need to configure these secrets in your GitHub repository:

- `EC2_HOST` - Your EC2 public IP or domain
- `EC2_USERNAME` - SSH username (usually `ubuntu` or `ec2-user`)
- `EC2_SSH_KEY` - Private SSH key for authentication
- `APP_DIR` - (Optional) Application directory, defaults to `/var/www/genmeta-backend`

---

## 🚀 Initial Server Setup

### 1. Install Node.js

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version
```

### 2. Install PM2

```bash
# Install PM2 globally
sudo npm install -g pm2

# Setup PM2 to start on system boot
pm2 startup
# Follow the command it outputs (usually starts with 'sudo env PATH=...')

# Verify PM2 installation
pm2 --version
```

### 3. Create Application Directory

```bash
# Create app directory
sudo mkdir -p /var/www/genmeta-backend

# Set ownership to your user
sudo chown -R $USER:$USER /var/www/genmeta-backend

# Navigate to directory
cd /var/www/genmeta-backend
```

### 4. Configure Environment Variables

Create your `.env` file with production values:

```bash
cd /var/www/genmeta-backend
nano .env
```

Add your environment variables:

```env
NODE_ENV=production
PORT=8000

# Database
MONGODB_URI=mongodb://localhost:27017/genmeta
# or MongoDB Atlas: mongodb+srv://user:pass@cluster.mongodb.net/genmeta

# JWT Secrets
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_REFRESH_SECRET=your-refresh-secret-change-this

# Email Service (Resend)
RESEND_API_KEY=your-resend-api-key

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://yourdomain.com/api/auth/google/callback

# Frontend URL
CLIENT_URL=https://yourdomain.com

# Session Secret
SESSION_SECRET=your-session-secret-change-this

# Other configurations as needed
```

Save and exit (Ctrl+X, then Y, then Enter).

### 5. Install and Configure Nginx

```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/genmeta-backend
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain or IP

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
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

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
```

Enable the site and restart Nginx:

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/genmeta-backend /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Enable Nginx to start on boot
sudo systemctl enable nginx
```

### 6. Configure Firewall

```bash
# Allow SSH, HTTP, and HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

### 7. Setup SSL with Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Certbot will automatically configure Nginx for HTTPS
# Certificates auto-renew via cron
```

---

## 🔐 GitHub Secrets Configuration

### 1. Generate SSH Key Pair (if you don't have one)

On your local machine:

```bash
# Generate new SSH key
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy_key

# This creates:
# - Private key: ~/.ssh/github_deploy_key
# - Public key: ~/.ssh/github_deploy_key.pub
```

### 2. Add Public Key to EC2

```bash
# Copy public key content
cat ~/.ssh/github_deploy_key.pub

# SSH into your EC2 instance
ssh your-user@your-ec2-ip

# Add public key to authorized_keys
echo "your-public-key-content" >> ~/.ssh/authorized_keys

# Set correct permissions
chmod 600 ~/.ssh/authorized_keys
```

### 3. Add Secrets to GitHub

Go to your GitHub repository:

1. Navigate to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add these secrets:

**EC2_HOST**

```
your-ec2-ip-or-domain.com
```

**EC2_USERNAME**

```
ubuntu
```

(or `ec2-user` for Amazon Linux)

**EC2_SSH_KEY**

```
-----BEGIN OPENSSH PRIVATE KEY-----
[paste entire private key content from ~/.ssh/github_deploy_key]
-----END OPENSSH PRIVATE KEY-----
```

**APP_DIR** (Optional)

```
/var/www/genmeta-backend
```

---

## 📦 Workflow Features

### Automatic Deployment Triggers

- **Push to main branch** with changes in `server/` directory
- **Manual trigger** via GitHub Actions UI

### Build Process

1. Checkout code
2. Setup Node.js 20.13.1
3. Install dependencies with `npm ci`
4. Run linting (optional)
5. Create deployment package
6. Upload artifact

### Deployment Process

1. Download build artifact
2. Copy to EC2 via SCP
3. Backup current version
4. Extract new version
5. Install production dependencies
6. Reload PM2 with zero-downtime
7. Verify deployment
8. Rollback on failure

### Zero-Downtime Deployment

The workflow uses PM2's `reload` command which:

- Starts new instances
- Waits for them to be ready
- Gracefully shuts down old instances
- No dropped connections

---

## 🧪 Testing the Deployment

### 1. Manual First Deployment

Before using GitHub Actions, test manually:

```bash
# SSH into EC2
ssh ubuntu@your-ec2-ip

# Navigate to app directory
cd /var/www/genmeta-backend

# Clone or copy your code
# (GitHub Actions will handle this automatically later)

# Install dependencies
npm ci --omit=dev

# Start with PM2
pm2 start ecosystem.config.cjs

# Save PM2 process list
pm2 save

# Check status
pm2 list
pm2 logs genmeta-backend
```

### 2. Test Nginx Proxy

```bash
# Check if app is running
curl http://localhost:8000

# Check via Nginx
curl http://your-domain.com
```

### 3. Trigger GitHub Actions

1. Make a small change in `server/` directory
2. Commit and push to `main` branch
3. Go to GitHub → Actions tab
4. Watch the deployment workflow

---

## 📊 Monitoring & Maintenance

### PM2 Commands

```bash
# View all processes
pm2 list

# View logs
pm2 logs genmeta-backend

# View specific log lines
pm2 logs genmeta-backend --lines 100

# Monitor in real-time
pm2 monit

# Restart app
pm2 restart genmeta-backend

# Stop app
pm2 stop genmeta-backend

# Delete app from PM2
pm2 delete genmeta-backend

# Save current PM2 process list
pm2 save
```

### Nginx Commands

```bash
# Test configuration
sudo nginx -t

# Reload configuration
sudo systemctl reload nginx

# Restart Nginx
sudo systemctl restart nginx

# View logs
sudo tail -f /var/log/nginx/genmeta-backend-access.log
sudo tail -f /var/log/nginx/genmeta-backend-error.log
```

### Application Logs

```bash
# View PM2 logs
pm2 logs genmeta-backend

# View log files directly
tail -f /var/www/genmeta-backend/logs/out.log
tail -f /var/www/genmeta-backend/logs/error.log
```

---

## 🔧 Troubleshooting

### Deployment Fails

1. **Check GitHub Actions logs** - View detailed error messages
2. **SSH into EC2** - Check PM2 and application logs
3. **Verify secrets** - Ensure all GitHub secrets are correct
4. **Check permissions** - Ensure user owns app directory

### App Won't Start

```bash
# Check PM2 logs
pm2 logs genmeta-backend --lines 50

# Check if port is in use
sudo lsof -i :8000

# Verify .env file exists and is correct
cat /var/www/genmeta-backend/.env

# Try starting manually
cd /var/www/genmeta-backend
node src/index.js
```

### Nginx Issues

```bash
# Test configuration
sudo nginx -t

# Check if Nginx is running
sudo systemctl status nginx

# View error logs
sudo tail -f /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

### Rollback Manually

```bash
cd /var/www/genmeta-backend

# List backups
ls -lh backups/

# Restore from backup
tar -xzf backups/backup_YYYYMMDD_HHMMSS.tar.gz -C /var/www/genmeta-backend

# Reinstall dependencies
npm ci --omit=dev

# Reload PM2
pm2 reload ecosystem.config.cjs
```

---

## 🎯 Checklist

Before first deployment, ensure:

- [ ] EC2 instance is running and accessible via SSH
- [ ] Node.js 20.x is installed
- [ ] PM2 is installed globally
- [ ] Nginx is installed and configured
- [ ] Application directory exists with correct permissions
- [ ] `.env` file is configured with production values
- [ ] GitHub secrets are added (EC2_HOST, EC2_USERNAME, EC2_SSH_KEY)
- [ ] SSH key pair is generated and public key is on EC2
- [ ] Firewall allows HTTP/HTTPS traffic
- [ ] (Optional) SSL certificate is configured

---

## 📝 Notes

- The workflow only deploys when changes are made to the `server/` directory
- Backups are kept for the last 5 deployments
- PM2 automatically restarts the app if it crashes
- Logs are stored in `/var/www/genmeta-backend/logs/`
- The workflow includes automatic rollback on failure

---

## 🆘 Support

If you encounter issues:

1. Check GitHub Actions logs for build/deployment errors
2. SSH into EC2 and check PM2 logs: `pm2 logs genmeta-backend`
3. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
4. Verify all environment variables are set correctly
5. Ensure all GitHub secrets are configured properly

---

**Happy Deploying! 🚀**
