# CI/CD Setup Complete ✅

## 📁 Files Created

1. **`.github/workflows/deploy-backend.yml`** - GitHub Actions workflow
2. **`server/ecosystem.config.cjs`** - PM2 configuration
3. **`server/.env.example`** - Environment variables template
4. **`server/DEPLOYMENT_GUIDE.md`** - Complete deployment guide
5. **`server/QUICK_SETUP.md`** - Quick reference checklist

---

## 🎯 What This Setup Does

### Automated Deployment Pipeline

1. **Triggers on**:
   - Push to `main` branch (only when `server/` files change)
   - Manual trigger via GitHub Actions UI

2. **Build Process**:
   - Installs dependencies with `npm ci`
   - Runs linting (optional)
   - Creates deployment package
   - Uploads artifact

3. **Deployment Process**:
   - Backs up current version (keeps last 5)
   - Deploys new version to EC2
   - Installs production dependencies
   - Zero-downtime reload with PM2
   - Verifies deployment
   - Auto-rollback on failure

---

## ⚙️ Configuration Matches Your Setup

✅ **Node.js Application** (JavaScript, not TypeScript)

- No build step needed
- Uses ES modules (`import/export`)
- Entry point: `src/index.js`

✅ **PM2 Process Manager**

- App name: `genmeta-backend`
- Cluster mode with 1 instance
- Auto-restart on crash
- Logs in `logs/` directory

✅ **Nginx Reverse Proxy**

- Proxies to `localhost:8000`
- Includes security headers
- SSL-ready configuration

✅ **Production Environment**

- Uses existing `.env` file
- Preserves environment variables
- Production dependencies only

---

## 🚀 Quick Start

### 1. Setup GitHub Secrets

Go to: **GitHub Repository → Settings → Secrets and variables → Actions**

Add these secrets:

| Secret         | Description              | Example                                |
| -------------- | ------------------------ | -------------------------------------- |
| `EC2_HOST`     | Your EC2 IP or domain    | `54.123.45.67` or `api.yourdomain.com` |
| `EC2_USERNAME` | SSH username             | `ubuntu` or `ec2-user`                 |
| `EC2_SSH_KEY`  | Private SSH key          | Full private key content               |
| `APP_DIR`      | App directory (optional) | `/var/www/genmeta-backend`             |

### 2. Prepare EC2 Server

```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2
pm2 startup

# Create app directory
sudo mkdir -p /var/www/genmeta-backend
sudo chown -R $USER:$USER /var/www/genmeta-backend

# Create .env file
cd /var/www/genmeta-backend
nano .env
# Add your production environment variables
```

### 3. Configure Nginx

```bash
# Install Nginx
sudo apt install -y nginx

# Create config
sudo nano /etc/nginx/sites-available/genmeta-backend
```

Paste this configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;

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
    }
}
```

Enable and restart:

```bash
sudo ln -s /etc/nginx/sites-available/genmeta-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4. Deploy

```bash
# Commit and push
git add .
git commit -m "Setup CI/CD pipeline"
git push origin main

# Watch deployment
# Go to: https://github.com/your-username/your-repo/actions
```

---

## 🔐 SSH Key Setup

### Generate SSH Key Pair

```bash
# On your local machine
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_deploy_key

# View public key
cat ~/.ssh/github_deploy_key.pub
```

### Add to EC2

```bash
# SSH into EC2
ssh ubuntu@your-ec2-ip

# Add public key
echo "paste-your-public-key-here" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### Add to GitHub

```bash
# View private key
cat ~/.ssh/github_deploy_key

# Copy entire output (including BEGIN/END lines)
# Add to GitHub as EC2_SSH_KEY secret
```

---

## 📊 Monitoring

### PM2 Commands

```bash
# View all processes
pm2 list

# View logs
pm2 logs genmeta-backend

# Monitor in real-time
pm2 monit

# Restart
pm2 restart genmeta-backend
```

### Check Deployment

```bash
# Via curl
curl http://your-domain.com

# Check PM2 status
ssh ubuntu@your-ec2-ip
pm2 list
pm2 logs genmeta-backend --lines 50
```

---

## 🔧 Troubleshooting

### Deployment Fails

1. Check GitHub Actions logs
2. SSH into EC2: `pm2 logs genmeta-backend`
3. Check Nginx: `sudo tail -f /var/log/nginx/error.log`
4. Verify secrets are correct

### Manual Rollback

```bash
cd /var/www/genmeta-backend
ls -lh backups/
tar -xzf backups/backup_YYYYMMDD_HHMMSS.tar.gz
npm ci --omit=dev
pm2 reload ecosystem.config.cjs
```

---

## 📝 Key Differences from Your Example

| Aspect       | Your Example           | This Setup                |
| ------------ | ---------------------- | ------------------------- |
| Language     | TypeScript             | JavaScript (ES Modules)   |
| Build Step   | `npm run build`        | None needed               |
| App Name     | `express-app`          | `genmeta-backend`         |
| Directory    | Root                   | `server/` subdirectory    |
| Trigger      | All changes            | Only `server/` changes    |
| PM2 Config   | `ecosystem.config.cjs` | `ecosystem.config.cjs` ✅ |
| Dependencies | `npm ci`               | `npm ci --omit=dev`       |

---

## ✅ What's Perfectly Matched

- ✅ PM2 process manager with `pm2 start index` → `pm2 start ecosystem.config.cjs`
- ✅ Nginx reverse proxy configuration
- ✅ Zero-downtime deployments with `pm2 reload`
- ✅ Automatic backups (last 5 versions)
- ✅ Automatic rollback on failure
- ✅ Production `.env` file preserved
- ✅ SSH-based deployment
- ✅ Health check verification

---

## 📚 Documentation

- **Full Guide**: See `DEPLOYMENT_GUIDE.md` for detailed instructions
- **Quick Reference**: See `QUICK_SETUP.md` for command cheatsheet
- **Environment**: See `.env.example` for required variables

---

## 🎉 You're Ready!

Everything is configured and ready to deploy. Just:

1. Add GitHub secrets
2. Setup EC2 server (one-time)
3. Push to `main` branch
4. Watch it deploy automatically! 🚀

---

**Need help?** Check the troubleshooting section in `DEPLOYMENT_GUIDE.md`
