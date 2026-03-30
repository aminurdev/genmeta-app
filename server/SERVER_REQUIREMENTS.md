# Server Requirements - What Must Match

## ✅ Critical Matches Required

### 1. Application Directory

```bash
# Default location (can be changed via APP_DIR secret)
/var/www/genmeta-backend
```

**Must have**:

- Correct ownership: `sudo chown -R $USER:$USER /var/www/genmeta-backend`
- Write permissions for your user
- `.env` file with production values

### 2. PM2 Configuration

**App Name**: `genmeta-backend`

```bash
# Check if PM2 app exists
pm2 describe genmeta-backend

# Should show:
# - name: genmeta-backend
# - status: online
# - script: ./src/index.js
```

### 3. Node.js Version

**Required**: Node.js 20.x (matches workflow)

```bash
node --version
# Should output: v20.x.x
```

### 4. Port Configuration

**Default**: Port 8000

Your `.env` file must have:

```env
PORT=8000
```

Nginx must proxy to:

```nginx
proxy_pass http://localhost:8000;
```

### 5. Environment Variables

**Location**: `/var/www/genmeta-backend/.env`

**Must include** (at minimum):

```env
NODE_ENV=production
PORT=8000
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-jwt-secret
# ... other required variables
```

### 6. SSH Access

**Username**: Must match `EC2_USERNAME` secret

- Common: `ubuntu` (Ubuntu)
- Or: `ec2-user` (Amazon Linux)

**SSH Key**: Public key must be in `~/.ssh/authorized_keys`

```bash
# Verify SSH access
ssh ubuntu@your-ec2-ip
# Should connect without password
```

### 7. Nginx Configuration

**Config file**: `/etc/nginx/sites-available/genmeta-backend`

**Must proxy to**: `http://localhost:8000`

**Enabled**: Symlink in `/etc/nginx/sites-enabled/`

```bash
# Verify
sudo nginx -t
# Should output: syntax is ok
```

---

## 🔍 Verification Checklist

Run these commands on your EC2 server:

```bash
# 1. Check Node.js version
node --version
# Expected: v20.x.x

# 2. Check PM2 installation
pm2 --version
# Should show version number

# 3. Check app directory
ls -la /var/www/genmeta-backend
# Should show: src/, node_modules/, package.json, .env

# 4. Check .env file exists
cat /var/www/genmeta-backend/.env | head -5
# Should show your environment variables

# 5. Check Nginx config
sudo nginx -t
# Expected: syntax is ok, test is successful

# 6. Check if port 8000 is listening
sudo lsof -i :8000
# Should show node process (if app is running)

# 7. Check PM2 process
pm2 list
# Should show genmeta-backend (if deployed)

# 8. Test local connection
curl http://localhost:8000
# Should return response from your app

# 9. Test via Nginx
curl http://localhost
# Should return response through Nginx
```

---

## 🚨 Common Mismatches

### Issue: Wrong App Name

**Symptom**: PM2 can't find app

```bash
pm2 describe genmeta-backend
# Error: Process not found
```

**Fix**: Check `ecosystem.config.cjs`:

```javascript
name: "genmeta-backend"; // Must match
```

### Issue: Wrong Port

**Symptom**: Nginx can't connect to app

```bash
curl http://localhost
# 502 Bad Gateway
```

**Fix**: Ensure `.env` has `PORT=8000` and Nginx proxies to `localhost:8000`

### Issue: Wrong Directory

**Symptom**: Deployment fails with "directory not found"

**Fix**:

1. Create directory: `sudo mkdir -p /var/www/genmeta-backend`
2. Set ownership: `sudo chown -R $USER:$USER /var/www/genmeta-backend`
3. Or update `APP_DIR` secret in GitHub

### Issue: Permission Denied

**Symptom**: Can't write files during deployment

**Fix**:

```bash
sudo chown -R $USER:$USER /var/www/genmeta-backend
chmod 755 /var/www/genmeta-backend
```

### Issue: SSH Key Not Working

**Symptom**: GitHub Actions can't connect to EC2

**Fix**:

1. Verify public key is in `~/.ssh/authorized_keys`
2. Check permissions: `chmod 600 ~/.ssh/authorized_keys`
3. Verify private key in GitHub secret includes BEGIN/END lines

---

## 📝 GitHub Secrets Must Match

| Secret         | Must Match                                    |
| -------------- | --------------------------------------------- |
| `EC2_HOST`     | Your actual EC2 IP or domain                  |
| `EC2_USERNAME` | Actual SSH username on EC2                    |
| `EC2_SSH_KEY`  | Private key that pairs with public key on EC2 |
| `APP_DIR`      | Actual app directory (or omit for default)    |

---

## 🎯 Pre-Deployment Test

Before running GitHub Actions, test manually:

```bash
# 1. SSH into EC2
ssh ubuntu@your-ec2-ip

# 2. Navigate to app directory
cd /var/www/genmeta-backend

# 3. Create test deployment
mkdir -p test-deploy
cd test-deploy

# 4. Copy your code
# (manually or via git clone)

# 5. Install dependencies
npm ci --omit=dev

# 6. Test PM2 start
pm2 start ecosystem.config.cjs

# 7. Check status
pm2 list
pm2 logs genmeta-backend

# 8. Test via curl
curl http://localhost:8000

# 9. If successful, clean up
pm2 delete genmeta-backend
cd ..
rm -rf test-deploy
```

If this works, GitHub Actions will work too!

---

## ✅ Final Checklist

Before first automated deployment:

- [ ] Node.js 20.x installed
- [ ] PM2 installed globally (`npm list -g pm2`)
- [ ] Nginx installed and running (`sudo systemctl status nginx`)
- [ ] App directory exists with correct permissions
- [ ] `.env` file configured with all required variables
- [ ] Nginx config file created and enabled
- [ ] Nginx proxies to correct port (8000)
- [ ] SSH key pair generated
- [ ] Public key added to EC2 `~/.ssh/authorized_keys`
- [ ] Private key added to GitHub secret `EC2_SSH_KEY`
- [ ] All GitHub secrets configured
- [ ] Firewall allows HTTP/HTTPS (ports 80/443)
- [ ] Manual test deployment successful

---

## 🔄 What Happens During Deployment

1. **GitHub Actions** packages your code
2. **SCP** copies package to `/tmp/deploy.tar.gz`
3. **SSH** connects and runs deployment script
4. **Backup** current version to `backups/`
5. **Extract** new version to app directory
6. **Install** production dependencies
7. **PM2 reload** restarts app with zero-downtime
8. **Verify** app is running
9. **Rollback** if anything fails

---

## 📞 Support

If deployment fails:

1. Check GitHub Actions logs (detailed error messages)
2. SSH into EC2: `pm2 logs genmeta-backend --lines 50`
3. Check Nginx: `sudo tail -f /var/log/nginx/error.log`
4. Verify all items in checklist above
5. Try manual deployment test

---

**Everything must match exactly for automated deployment to work!**
