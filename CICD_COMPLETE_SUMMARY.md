# 🎉 CI/CD Setup Complete - GenMeta Backend

## ✅ What Was Created

### 1. GitHub Actions Workflow

**File**: `.github/workflows/deploy-backend.yml`

- Triggers on push to `main` (only when `server/` changes)
- Manual trigger available
- Zero-downtime deployment with PM2
- Automatic backups (last 5 versions)
- Automatic rollback on failure
- Health check verification

### 2. PM2 Configuration

**File**: `server/ecosystem.config.cjs`

- App name: `genmeta-backend`
- Cluster mode with 1 instance
- Auto-restart on crash
- Memory limit: 500MB
- Logs in `logs/` directory

### 3. Documentation Files

| File                            | Purpose                           |
| ------------------------------- | --------------------------------- |
| `server/DEPLOYMENT_GUIDE.md`    | Complete step-by-step setup guide |
| `server/QUICK_SETUP.md`         | Quick reference commands          |
| `server/CICD_SETUP.md`          | Setup summary and overview        |
| `server/SERVER_REQUIREMENTS.md` | What must match on server         |
| `server/README_CICD.md`         | CI/CD pipeline documentation      |
| `server/EC2_SETUP_COMMANDS.sh`  | Automated setup script            |
| `server/.env.example`           | Environment variables template    |

### 4. Configuration Updates

- Updated `server/.gitignore` to exclude deployment artifacts

---

## 🚀 Quick Start Guide

### Step 1: Setup EC2 Server

**Option A: Automated Setup (Recommended)**

```bash
# Copy script to EC2
scp server/EC2_SETUP_COMMANDS.sh ubuntu@your-ec2-ip:~/

# SSH into EC2
ssh ubuntu@your-ec2-ip

# Run setup script
bash EC2_SETUP_COMMANDS.sh
```

**Option B: Manual Setup**
See `server/DEPLOYMENT_GUIDE.md` for detailed instructions.

### Step 2: Configure Environment Variables

```bash
# SSH into EC2
ssh ubuntu@your-ec2-ip

# Navigate to app directory
cd /var/www/genmeta-backend

# Create .env file
nano .env
```

Add your production values:

```env
NODE_ENV=production
PORT=8000
MONGODB_URI=your-mongodb-uri
JWT_SECRET=your-jwt-secret
# ... add all required variables
```

### Step 3: Setup SSH Keys

**On your local machine:**

```bash
# Generate SSH key pair
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_deploy_key

# View public key
cat ~/.ssh/github_deploy_key.pub
# Copy this output
```

**On EC2:**

```bash
# Add public key
echo "paste-your-public-key-here" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

**On your local machine:**

```bash
# View private key (for GitHub secret)
cat ~/.ssh/github_deploy_key
# Copy entire output including BEGIN/END lines
```

### Step 4: Configure GitHub Secrets

Go to: **GitHub Repository → Settings → Secrets and variables → Actions**

Add these secrets:

| Secret Name    | Value                    | Example                    |
| -------------- | ------------------------ | -------------------------- |
| `EC2_HOST`     | Your EC2 IP or domain    | `54.123.45.67`             |
| `EC2_USERNAME` | SSH username             | `ubuntu`                   |
| `EC2_SSH_KEY`  | Private SSH key          | Full key with BEGIN/END    |
| `APP_DIR`      | App directory (optional) | `/var/www/genmeta-backend` |

### Step 5: Deploy!

```bash
# Commit and push
git add .
git commit -m "Setup CI/CD pipeline"
git push origin main

# Watch deployment
# Go to: https://github.com/your-username/your-repo/actions
```

---

## 🎯 What Matches Your Setup Perfectly

### ✅ Your Requirements → Our Solution

| Your Requirement    | Our Implementation                           |
| ------------------- | -------------------------------------------- |
| Backend server only | ✅ Workflow only deploys `server/` directory |
| Already have .env   | ✅ Preserves existing .env file              |
| Nginx configured    | ✅ Proxies to localhost:8000                 |
| PM2 start index     | ✅ Uses `pm2 start ecosystem.config.cjs`     |
| Production ready    | ✅ Zero-downtime with `pm2 reload`           |
| Full code update    | ✅ Deploys entire codebase                   |
| Run only backend    | ✅ Only triggers on `server/` changes        |

### ✅ Key Differences from Your Example

| Aspect      | Your Example    | This Setup                 |
| ----------- | --------------- | -------------------------- |
| Language    | TypeScript      | JavaScript (ES Modules) ✅ |
| Build Step  | `npm run build` | None needed ✅             |
| App Name    | `express-app`   | `genmeta-backend` ✅       |
| Directory   | Root            | `server/` subdirectory ✅  |
| Trigger     | All changes     | Only `server/` changes ✅  |
| Entry Point | `index.js`      | `src/index.js` ✅          |

---

## 📋 Pre-Deployment Checklist

Before first deployment, ensure:

### On EC2 Server

- [ ] Node.js 20.x installed (`node --version`)
- [ ] PM2 installed globally (`pm2 --version`)
- [ ] Nginx installed and running (`sudo systemctl status nginx`)
- [ ] App directory exists: `/var/www/genmeta-backend`
- [ ] Directory has correct ownership (`sudo chown -R $USER:$USER /var/www/genmeta-backend`)
- [ ] `.env` file configured with production values
- [ ] Nginx config created: `/etc/nginx/sites-available/genmeta-backend`
- [ ] Nginx config enabled (symlink in `sites-enabled/`)
- [ ] Nginx proxies to `localhost:8000`
- [ ] Firewall allows HTTP/HTTPS (ports 80, 443)

### SSH Configuration

- [ ] SSH key pair generated
- [ ] Public key added to EC2 `~/.ssh/authorized_keys`
- [ ] Can SSH without password: `ssh ubuntu@your-ec2-ip`

### GitHub Configuration

- [ ] `EC2_HOST` secret added
- [ ] `EC2_USERNAME` secret added
- [ ] `EC2_SSH_KEY` secret added (full private key)
- [ ] `APP_DIR` secret added (optional)

### Test Connection

- [ ] Can SSH from local machine: `ssh ubuntu@your-ec2-ip`
- [ ] Can access app locally on EC2: `curl http://localhost:8000`
- [ ] Can access via Nginx: `curl http://your-domain.com`

---

## 🔧 Verification Commands

### On EC2 Server

```bash
# Check Node.js
node --version  # Should be v20.x.x

# Check PM2
pm2 --version

# Check Nginx
sudo nginx -t
sudo systemctl status nginx

# Check app directory
ls -la /var/www/genmeta-backend

# Check .env exists
cat /var/www/genmeta-backend/.env | head -5

# Check port 8000
sudo lsof -i :8000

# Test local connection
curl http://localhost:8000

# Test via Nginx
curl http://localhost
```

### From Local Machine

```bash
# Test SSH connection
ssh ubuntu@your-ec2-ip "echo 'SSH works!'"

# Test HTTP
curl http://your-ec2-ip
```

---

## 📊 Deployment Flow

```
Developer pushes to main
         ↓
GitHub Actions triggered
         ↓
Build & package code
         ↓
Upload artifact
         ↓
Download on runner
         ↓
SCP to EC2 /tmp/
         ↓
SSH into EC2
         ↓
Backup current version
         ↓
Extract new version
         ↓
Install dependencies
         ↓
PM2 reload (zero-downtime)
         ↓
Verify deployment
         ↓
    Success! ✅
    (or rollback ❌)
```

---

## 🛠️ Common Commands

### View Deployment Status

```bash
# GitHub Actions
# Go to: https://github.com/your-username/your-repo/actions

# On EC2
ssh ubuntu@your-ec2-ip
pm2 list
pm2 logs genmeta-backend
```

### Manual Deployment

```bash
# Trigger via GitHub UI
# Go to: Actions → Deploy Backend to EC2 → Run workflow
```

### Restart Application

```bash
ssh ubuntu@your-ec2-ip
pm2 restart genmeta-backend
```

### View Logs

```bash
# PM2 logs
pm2 logs genmeta-backend

# Nginx logs
sudo tail -f /var/log/nginx/genmeta-backend-access.log
sudo tail -f /var/log/nginx/genmeta-backend-error.log

# Application logs
tail -f /var/www/genmeta-backend/logs/out.log
tail -f /var/www/genmeta-backend/logs/error.log
```

### Rollback

```bash
cd /var/www/genmeta-backend
ls -lh backups/
tar -xzf backups/backup_YYYYMMDD_HHMMSS.tar.gz
npm ci --omit=dev
pm2 reload ecosystem.config.cjs
```

---

## 🔐 Security Features

- ✅ SSH keys stored as encrypted GitHub secrets
- ✅ `.env` file never committed or deployed
- ✅ Production dependencies only (`--omit=dev`)
- ✅ Nginx reverse proxy (port 8000 not exposed)
- ✅ PM2 runs as non-root user
- ✅ Firewall configured (SSH, HTTP, HTTPS only)
- ✅ Security headers in Nginx config
- ✅ SSL-ready configuration

---

## 🎉 Features

- ✅ Zero-downtime deployments
- ✅ Automatic backups (last 5 versions)
- ✅ Automatic rollback on failure
- ✅ Health check verification
- ✅ PM2 cluster mode
- ✅ Auto-restart on crash
- ✅ Memory limit protection
- ✅ Structured logging
- ✅ Environment variable preservation
- ✅ Path-based triggering (only `server/` changes)

---

## 📚 Documentation

| Document                 | Purpose                     |
| ------------------------ | --------------------------- |
| `DEPLOYMENT_GUIDE.md`    | Complete setup instructions |
| `QUICK_SETUP.md`         | Quick reference commands    |
| `CICD_SETUP.md`          | Setup summary               |
| `SERVER_REQUIREMENTS.md` | What must match on server   |
| `README_CICD.md`         | CI/CD pipeline docs         |
| `EC2_SETUP_COMMANDS.sh`  | Automated setup script      |

---

## 🆘 Troubleshooting

### Deployment Fails

1. **Check GitHub Actions logs**
   - Go to Actions tab
   - Click failed workflow
   - Review error messages

2. **Check PM2 on server**

   ```bash
   ssh ubuntu@your-ec2-ip
   pm2 logs genmeta-backend --lines 50
   ```

3. **Check Nginx**
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

### Can't Connect via SSH

1. Verify public key is in `~/.ssh/authorized_keys` on EC2
2. Check permissions: `chmod 600 ~/.ssh/authorized_keys`
3. Verify private key in GitHub secret includes BEGIN/END lines
4. Test manually: `ssh -i ~/.ssh/github_deploy_key ubuntu@your-ec2-ip`

### App Won't Start

1. Check PM2 logs: `pm2 logs genmeta-backend`
2. Verify .env file exists and is correct
3. Check if port 8000 is in use: `sudo lsof -i :8000`
4. Try starting manually: `cd /var/www/genmeta-backend && node src/index.js`

### Nginx 502 Bad Gateway

1. Check if app is running: `pm2 list`
2. Check if port matches: `.env` has `PORT=8000` and Nginx proxies to `localhost:8000`
3. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
4. Restart Nginx: `sudo systemctl restart nginx`

---

## 📞 Support Resources

1. **Full Setup Guide**: `server/DEPLOYMENT_GUIDE.md`
2. **Quick Commands**: `server/QUICK_SETUP.md`
3. **Requirements**: `server/SERVER_REQUIREMENTS.md`
4. **GitHub Actions Logs**: Repository → Actions tab
5. **PM2 Logs**: `pm2 logs genmeta-backend`
6. **Nginx Logs**: `/var/log/nginx/genmeta-backend-*.log`

---

## 🎯 Next Steps

1. ✅ Files created and committed
2. ⏳ Run `server/EC2_SETUP_COMMANDS.sh` on EC2
3. ⏳ Configure `.env` file on EC2
4. ⏳ Setup SSH keys
5. ⏳ Add GitHub secrets
6. ⏳ Push to `main` branch
7. ⏳ Watch deployment succeed! 🚀

---

## 📝 Notes

- Workflow only runs when `server/` directory changes
- Backups are kept for last 5 deployments
- PM2 automatically restarts app if it crashes
- Logs are stored in `/var/www/genmeta-backend/logs/`
- Zero-downtime deployment using PM2 reload
- Automatic rollback if deployment fails

---

**Everything is ready! Follow the Quick Start Guide above to deploy. 🚀**

---

## 🔗 Quick Links

- **Workflow File**: `.github/workflows/deploy-backend.yml`
- **PM2 Config**: `server/ecosystem.config.cjs`
- **Setup Script**: `server/EC2_SETUP_COMMANDS.sh`
- **Full Guide**: `server/DEPLOYMENT_GUIDE.md`

---

**Happy Deploying! 🎉**
