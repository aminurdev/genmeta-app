# 📋 Setup Checklist - Print This!

Use this checklist to ensure everything is configured correctly.

---

## ✅ Phase 1: EC2 Server Setup

### Install Required Software

- [ ] Node.js 20.x installed
  ```bash
  node --version  # Should show v20.x.x
  ```
- [ ] PM2 installed globally
  ```bash
  pm2 --version
  ```
- [ ] Nginx installed
  ```bash
  nginx -v
  ```

### Create Application Directory

- [ ] Directory created: `/var/www/genmeta-backend`
- [ ] Ownership set to your user
  ```bash
  ls -la /var/www/ | grep genmeta-backend
  # Should show your username
  ```
- [ ] Subdirectories created: `logs/`, `backups/`

### Configure Nginx

- [ ] Config file created: `/etc/nginx/sites-available/genmeta-backend`
- [ ] Config file enabled (symlink in `sites-enabled/`)
- [ ] Nginx config test passes
  ```bash
  sudo nginx -t
  # Should show: syntax is ok
  ```
- [ ] Nginx restarted
  ```bash
  sudo systemctl status nginx
  # Should show: active (running)
  ```
- [ ] Proxies to `localhost:8000`

### Configure Firewall

- [ ] SSH allowed (port 22)
- [ ] HTTP allowed (port 80)
- [ ] HTTPS allowed (port 443)
- [ ] Firewall enabled
  ```bash
  sudo ufw status
  # Should show: Status: active
  ```

---

## ✅ Phase 2: Environment Configuration

### Create .env File

- [ ] File created: `/var/www/genmeta-backend/.env`
- [ ] `NODE_ENV=production` set
- [ ] `PORT=8000` set
- [ ] MongoDB URI configured
- [ ] JWT secrets configured
- [ ] All required variables added
- [ ] File permissions correct (readable by your user)

### Verify Configuration

- [ ] Can read .env file
  ```bash
  cat /var/www/genmeta-backend/.env | head -5
  ```
- [ ] No syntax errors in .env
- [ ] All secrets are production values (not examples)

---

## ✅ Phase 3: SSH Key Setup

### Generate SSH Key Pair (Local Machine)

- [ ] Key pair generated
  ```bash
  ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_deploy_key
  ```
- [ ] Public key copied
  ```bash
  cat ~/.ssh/github_deploy_key.pub
  ```
- [ ] Private key copied
  ```bash
  cat ~/.ssh/github_deploy_key
  ```

### Add Public Key to EC2

- [ ] Public key added to `~/.ssh/authorized_keys` on EC2
- [ ] Permissions set correctly
  ```bash
  chmod 600 ~/.ssh/authorized_keys
  ```
- [ ] Can SSH without password
  ```bash
  ssh -i ~/.ssh/github_deploy_key ubuntu@your-ec2-ip
  ```

---

## ✅ Phase 4: GitHub Configuration

### Add Repository Secrets

Go to: **Settings → Secrets and variables → Actions**

- [ ] `EC2_HOST` added
  - Value: Your EC2 IP or domain
  - Example: `54.123.45.67`

- [ ] `EC2_USERNAME` added
  - Value: SSH username
  - Example: `ubuntu` or `ec2-user`

- [ ] `EC2_SSH_KEY` added
  - Value: Full private key
  - Includes: `-----BEGIN OPENSSH PRIVATE KEY-----`
  - Includes: `-----END OPENSSH PRIVATE KEY-----`

- [ ] `APP_DIR` added (optional)
  - Value: `/var/www/genmeta-backend`

### Verify Secrets

- [ ] All 3-4 secrets show in GitHub
- [ ] No typos in secret names
- [ ] Values are correct (can't view, but double-check)

---

## ✅ Phase 5: Verification Tests

### Test SSH Connection

- [ ] Can SSH from local machine
  ```bash
  ssh ubuntu@your-ec2-ip "echo 'SSH works!'"
  ```

### Test Node.js

- [ ] Node.js runs
  ```bash
  ssh ubuntu@your-ec2-ip "node --version"
  ```

### Test PM2

- [ ] PM2 is accessible
  ```bash
  ssh ubuntu@your-ec2-ip "pm2 --version"
  ```

### Test Nginx

- [ ] Nginx is running
  ```bash
  ssh ubuntu@your-ec2-ip "sudo systemctl status nginx"
  ```
- [ ] Can access Nginx
  ```bash
  curl http://your-ec2-ip
  ```

### Test Application Directory

- [ ] Directory exists
  ```bash
  ssh ubuntu@your-ec2-ip "ls -la /var/www/genmeta-backend"
  ```
- [ ] .env file exists
  ```bash
  ssh ubuntu@your-ec2-ip "ls -la /var/www/genmeta-backend/.env"
  ```

---

## ✅ Phase 6: First Deployment

### Commit and Push

- [ ] All CI/CD files committed
  ```bash
  git add .
  git commit -m "Setup CI/CD pipeline"
  ```
- [ ] Pushed to main branch
  ```bash
  git push origin main
  ```

### Monitor Deployment

- [ ] GitHub Actions workflow started
  - Go to: **Actions** tab
- [ ] Build phase completed
- [ ] Deploy phase completed
- [ ] Verification passed

### Verify on Server

- [ ] PM2 process is running
  ```bash
  ssh ubuntu@your-ec2-ip "pm2 list"
  # Should show: genmeta-backend | online
  ```
- [ ] Application responds
  ```bash
  curl http://your-ec2-ip
  # Should return response
  ```
- [ ] Logs look good
  ```bash
  ssh ubuntu@your-ec2-ip "pm2 logs genmeta-backend --lines 20"
  ```

---

## ✅ Phase 7: Post-Deployment

### SSL Certificate (Optional but Recommended)

- [ ] Certbot installed
  ```bash
  sudo apt install -y certbot python3-certbot-nginx
  ```
- [ ] SSL certificate obtained
  ```bash
  sudo certbot --nginx -d your-domain.com
  ```
- [ ] HTTPS works
  ```bash
  curl https://your-domain.com
  ```

### Monitoring Setup

- [ ] Can view PM2 logs
  ```bash
  pm2 logs genmeta-backend
  ```
- [ ] Can view Nginx logs
  ```bash
  sudo tail -f /var/log/nginx/genmeta-backend-access.log
  ```
- [ ] PM2 saved for auto-start
  ```bash
  pm2 save
  ```

### Documentation

- [ ] Team knows how to trigger manual deployment
- [ ] Team knows how to view logs
- [ ] Team knows how to rollback
- [ ] Emergency contacts documented

---

## 🎯 Quick Reference

### View Deployment Status

```bash
# GitHub
https://github.com/your-username/your-repo/actions

# Server
ssh ubuntu@your-ec2-ip
pm2 list
pm2 logs genmeta-backend
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
sudo tail -f /var/log/nginx/genmeta-backend-error.log
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

## 🚨 Troubleshooting Checklist

If deployment fails, check:

- [ ] GitHub Actions logs for error messages
- [ ] PM2 logs: `pm2 logs genmeta-backend --lines 50`
- [ ] Nginx logs: `sudo tail -f /var/log/nginx/error.log`
- [ ] .env file exists and is correct
- [ ] Port 8000 is not in use by another process
- [ ] Nginx proxies to correct port
- [ ] All GitHub secrets are correct
- [ ] SSH key works manually
- [ ] Firewall allows HTTP/HTTPS

---

## ✅ Success Criteria

You're done when:

- [ ] ✅ Push to main triggers automatic deployment
- [ ] ✅ Deployment completes without errors
- [ ] ✅ Application is accessible via domain/IP
- [ ] ✅ PM2 shows process as "online"
- [ ] ✅ Logs show no errors
- [ ] ✅ Can trigger manual deployment
- [ ] ✅ Zero-downtime reload works
- [ ] ✅ Automatic rollback works (test by breaking something)

---

## 📞 Emergency Contacts

- **GitHub Actions**: https://github.com/your-username/your-repo/actions
- **Server SSH**: `ssh ubuntu@your-ec2-ip`
- **PM2 Logs**: `pm2 logs genmeta-backend`
- **Nginx Logs**: `/var/log/nginx/genmeta-backend-*.log`

---

## 📚 Documentation Files

- [ ] Read: `DEPLOYMENT_GUIDE.md` (full guide)
- [ ] Read: `QUICK_SETUP.md` (quick commands)
- [ ] Read: `SERVER_REQUIREMENTS.md` (what must match)
- [ ] Read: `ARCHITECTURE.md` (system overview)

---

**Print this checklist and check off items as you complete them! ✅**

---

## 🎉 Completion

Date completed: ******\_\_\_******

Deployed by: ******\_\_\_******

Notes:

---

---

---

**Congratulations! Your CI/CD pipeline is live! 🚀**
