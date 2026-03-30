# GenMeta Backend - CI/CD Pipeline

![Deploy Status](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/deploy-backend.yml/badge.svg)

## 🚀 Automated Deployment

This backend automatically deploys to EC2 when you push to the `main` branch.

### Deployment Status

- **Workflow**: `.github/workflows/deploy-backend.yml`
- **Triggers**: Push to `main` (when `server/` changes) or manual
- **Target**: EC2 via SSH
- **Process Manager**: PM2
- **Web Server**: Nginx

---

## 📋 Prerequisites Checklist

### GitHub Secrets Required

- [ ] `EC2_HOST` - Your EC2 IP or domain
- [ ] `EC2_USERNAME` - SSH username (ubuntu/ec2-user)
- [ ] `EC2_SSH_KEY` - Private SSH key
- [ ] `APP_DIR` - (Optional) Defaults to `/var/www/genmeta-backend`

### EC2 Server Requirements

- [ ] Node.js 20.x installed
- [ ] PM2 installed globally
- [ ] Nginx installed and configured
- [ ] Application directory created
- [ ] `.env` file configured
- [ ] SSH key authorized

---

## 🎯 Deployment Flow

```
┌─────────────────┐
│  Push to main   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  GitHub Actions │
│   - Build       │
│   - Package     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Deploy to EC2  │
│   - Backup      │
│   - Extract     │
│   - Install     │
│   - PM2 Reload  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Verify & Test  │
│   - PM2 Status  │
│   - HTTP Check  │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐ ┌──────────┐
│Success│ │Rollback  │
└───────┘ └──────────┘
```

---

## 🔧 Quick Commands

### View Deployment Logs

```bash
# On GitHub
Go to: Actions → Deploy Backend to EC2 → Latest run

# On EC2
ssh ubuntu@your-ec2-ip
pm2 logs genmeta-backend
```

### Manual Deployment

```bash
# Trigger via GitHub UI
Go to: Actions → Deploy Backend to EC2 → Run workflow
```

### Check Status

```bash
# SSH into server
ssh ubuntu@your-ec2-ip

# Check PM2
pm2 list
pm2 describe genmeta-backend

# Check Nginx
sudo systemctl status nginx
curl http://localhost:8000
```

---

## 📁 Files Overview

| File                                   | Purpose                        |
| -------------------------------------- | ------------------------------ |
| `.github/workflows/deploy-backend.yml` | GitHub Actions workflow        |
| `ecosystem.config.cjs`                 | PM2 configuration              |
| `.env.example`                         | Environment variables template |
| `DEPLOYMENT_GUIDE.md`                  | Complete setup guide           |
| `QUICK_SETUP.md`                       | Quick reference                |
| `CICD_SETUP.md`                        | Setup summary                  |

---

## 🛠️ Troubleshooting

### Deployment Failed

1. **Check GitHub Actions logs**
   - Go to Actions tab
   - Click on failed workflow
   - Review build/deploy steps

2. **Check PM2 on server**

   ```bash
   ssh ubuntu@your-ec2-ip
   pm2 logs genmeta-backend --lines 50
   ```

3. **Check Nginx**
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

### Manual Rollback

```bash
cd /var/www/genmeta-backend
ls -lh backups/
tar -xzf backups/backup_YYYYMMDD_HHMMSS.tar.gz
npm ci --omit=dev
pm2 reload ecosystem.config.cjs
```

---

## 🔐 Security Notes

- SSH keys are stored as GitHub secrets (encrypted)
- `.env` file is never committed or deployed
- Production dependencies only (`--omit=dev`)
- Nginx acts as reverse proxy (port 8000 not exposed)
- PM2 runs as non-root user

---

## 📊 Monitoring

### PM2 Dashboard

```bash
pm2 monit
```

### Application Logs

```bash
# Real-time logs
pm2 logs genmeta-backend

# Last 100 lines
pm2 logs genmeta-backend --lines 100

# Error logs only
pm2 logs genmeta-backend --err
```

### Nginx Logs

```bash
# Access logs
sudo tail -f /var/log/nginx/genmeta-backend-access.log

# Error logs
sudo tail -f /var/log/nginx/genmeta-backend-error.log
```

---

## 🎉 Features

✅ Zero-downtime deployments
✅ Automatic backups (last 5 versions)
✅ Automatic rollback on failure
✅ Health check verification
✅ PM2 cluster mode
✅ Nginx reverse proxy
✅ SSL-ready configuration
✅ Environment variable preservation
✅ Production-only dependencies

---

## 📚 Documentation

- **Full Setup Guide**: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- **Quick Reference**: [QUICK_SETUP.md](./QUICK_SETUP.md)
- **Setup Summary**: [CICD_SETUP.md](./CICD_SETUP.md)

---

## 🆘 Need Help?

1. Check the [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions
2. Review GitHub Actions logs for errors
3. SSH into EC2 and check PM2/Nginx logs
4. Verify all GitHub secrets are configured correctly

---

**Happy Deploying! 🚀**

Replace `YOUR_USERNAME/YOUR_REPO` in the badge URL with your actual GitHub username and repository name.
