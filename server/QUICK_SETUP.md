# Quick Setup Checklist ✅

## 1️⃣ EC2 Server Setup (One-time)

```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2
pm2 startup
# Run the command it outputs

# Create app directory
sudo mkdir -p /var/www/genmeta-backend
sudo chown -R $USER:$USER /var/www/genmeta-backend

# Install Nginx
sudo apt install -y nginx

# Configure firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## 2️⃣ Nginx Configuration

Create `/etc/nginx/sites-available/genmeta-backend`:

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

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/genmeta-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 3️⃣ Environment Variables

Create `/var/www/genmeta-backend/.env`:

```env
NODE_ENV=production
PORT=8000
MONGODB_URI=your-mongodb-uri
JWT_SECRET=your-jwt-secret
# ... add all required variables
```

## 4️⃣ GitHub Secrets

Add these in GitHub → Settings → Secrets:

| Secret Name    | Value                                 |
| -------------- | ------------------------------------- |
| `EC2_HOST`     | Your EC2 IP or domain                 |
| `EC2_USERNAME` | `ubuntu` or `ec2-user`                |
| `EC2_SSH_KEY`  | Your private SSH key                  |
| `APP_DIR`      | `/var/www/genmeta-backend` (optional) |

## 5️⃣ SSH Key Setup

```bash
# Generate key (local machine)
ssh-keygen -t ed25519 -C "github-deploy" -f ~/.ssh/github_deploy_key

# Add public key to EC2
cat ~/.ssh/github_deploy_key.pub
# Copy output and add to EC2: ~/.ssh/authorized_keys

# Add private key to GitHub Secrets as EC2_SSH_KEY
cat ~/.ssh/github_deploy_key
```

## 6️⃣ Test Deployment

```bash
# Push to main branch
git add .
git commit -m "Setup CI/CD"
git push origin main

# Watch GitHub Actions
# Go to: https://github.com/your-repo/actions
```

## 7️⃣ Verify

```bash
# Check PM2
ssh ubuntu@your-ec2-ip
pm2 list
pm2 logs genmeta-backend

# Check via browser
curl http://your-domain.com
```

---

## 🔧 Common Commands

```bash
# View logs
pm2 logs genmeta-backend

# Restart app
pm2 restart genmeta-backend

# View Nginx logs
sudo tail -f /var/log/nginx/error.log

# Reload Nginx
sudo systemctl reload nginx
```

---

## ✅ What Matches Your Setup

Your workflow is configured for:

- ✅ Node.js application (not TypeScript, pure JS)
- ✅ ES Modules (`import/export`)
- ✅ PM2 process manager
- ✅ Nginx reverse proxy
- ✅ Zero-downtime deployments
- ✅ Automatic backups (last 5 versions)
- ✅ Automatic rollback on failure
- ✅ Production environment with existing `.env`

---

## 🎯 Key Differences from Your Example

1. **App Name**: Changed from `express-app` to `genmeta-backend`
2. **No TypeScript Build**: Your app is pure JavaScript, no `npm run build` needed
3. **Working Directory**: Uses `server/` subdirectory
4. **Path Filtering**: Only deploys when `server/` changes
5. **PM2 Config**: Uses `ecosystem.config.cjs` (CommonJS for PM2)
6. **Dependencies**: Uses `npm ci --omit=dev` for production

---

**Ready to deploy! 🚀**
