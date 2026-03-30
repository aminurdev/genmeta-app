# Deployment Architecture

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      GITHUB REPOSITORY                       │
│                                                              │
│  ┌────────────────┐         ┌──────────────────┐           │
│  │  server/       │         │  .github/        │           │
│  │  - src/        │────────▶│  workflows/      │           │
│  │  - package.json│         │  deploy-backend  │           │
│  │  - ecosystem   │         │  .yml            │           │
│  └────────────────┘         └──────────────────┘           │
│                                      │                       │
└──────────────────────────────────────┼───────────────────────┘
                                       │
                                       │ Push to main
                                       │ (server/ changes)
                                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    GITHUB ACTIONS RUNNER                     │
│                                                              │
│  1. Checkout code                                           │
│  2. Setup Node.js 20.x                                      │
│  3. Install dependencies (npm ci)                           │
│  4. Create deployment package                               │
│  5. Upload artifact                                         │
│                                                              │
│  ┌──────────────────────────────────────────┐              │
│  │  deploy.tar.gz                           │              │
│  │  - src/                                  │              │
│  │  - package.json                          │              │
│  │  - ecosystem.config.cjs                  │              │
│  └──────────────────────────────────────────┘              │
│                       │                                      │
└───────────────────────┼──────────────────────────────────────┘
                        │
                        │ SCP via SSH
                        │ (using EC2_SSH_KEY)
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                      EC2 INSTANCE                            │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  /var/www/genmeta-backend/                         │    │
│  │                                                     │    │
│  │  ┌──────────────┐    ┌──────────────┐            │    │
│  │  │  src/        │    │  .env        │            │    │
│  │  │  index.js    │    │  (preserved) │            │    │
│  │  └──────────────┘    └──────────────┘            │    │
│  │                                                     │    │
│  │  ┌──────────────┐    ┌──────────────┐            │    │
│  │  │  node_modules│    │  logs/       │            │    │
│  │  │  (installed) │    │  - out.log   │            │    │
│  │  └──────────────┘    │  - error.log │            │    │
│  │                      └──────────────┘            │    │
│  │                                                     │    │
│  │  ┌──────────────┐    ┌──────────────┐            │    │
│  │  │  backups/    │    │  ecosystem   │            │    │
│  │  │  (last 5)    │    │  .config.cjs │            │    │
│  │  └──────────────┘    └──────────────┘            │    │
│  └────────────────────────────────────────────────────┘    │
│                            │                                │
│                            │ PM2 manages                    │
│                            ▼                                │
│  ┌────────────────────────────────────────────────────┐    │
│  │              PM2 PROCESS MANAGER                   │    │
│  │                                                     │    │
│  │  App: genmeta-backend                             │    │
│  │  Status: online                                    │    │
│  │  Instances: 1 (cluster mode)                      │    │
│  │  Port: 8000                                        │    │
│  │  Auto-restart: ✅                                  │    │
│  │  Memory limit: 500MB                              │    │
│  └────────────────────────────────────────────────────┘    │
│                            │                                │
│                            │ localhost:8000                 │
│                            ▼                                │
│  ┌────────────────────────────────────────────────────┐    │
│  │                 NGINX                              │    │
│  │                                                     │    │
│  │  Listen: 80 (HTTP) / 443 (HTTPS)                  │    │
│  │  Proxy to: http://localhost:8000                  │    │
│  │  Domain: your-domain.com                          │    │
│  │  SSL: Let's Encrypt (optional)                    │    │
│  └────────────────────────────────────────────────────┘    │
│                            │                                │
└────────────────────────────┼────────────────────────────────┘
                             │
                             │ HTTP/HTTPS
                             ▼
                    ┌─────────────────┐
                    │   INTERNET      │
                    │   Users         │
                    └─────────────────┘
```

---

## 🔄 Deployment Flow

```
┌──────────────┐
│ Developer    │
│ pushes code  │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────────────────┐
│ GitHub Actions Workflow Triggered                │
│ (only if server/ directory changed)              │
└──────┬───────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────┐
│ Build Phase                                      │
│ • Checkout code                                  │
│ • Setup Node.js 20.x                            │
│ • npm ci (install dependencies)                 │
│ • Create deployment package                     │
│ • Upload artifact                               │
└──────┬───────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────┐
│ Deploy Phase                                     │
│ • Download artifact                             │
│ • SCP to EC2 /tmp/deploy.tar.gz                │
└──────┬───────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────┐
│ On EC2 Server                                    │
│ • Backup current version                        │
│ • Extract new version                           │
│ • npm ci --omit=dev                            │
│ • PM2 reload (zero-downtime)                   │
└──────┬───────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────┐
│ Verification Phase                               │
│ • Check PM2 status                              │
│ • Check HTTP response                           │
│ • Verify app is online                          │
└──────┬───────────────────────────────────────────┘
       │
       ├─────────────┬─────────────┐
       │             │             │
       ▼             ▼             ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│ Success! │  │  Failed  │  │ Rollback │
│    ✅    │  │    ❌    │  │    🔄    │
└──────────┘  └──────────┘  └──────────┘
```

---

## 🔐 Security Layers

```
┌─────────────────────────────────────────────────┐
│ Layer 1: GitHub Secrets (Encrypted)             │
│ • EC2_HOST                                      │
│ • EC2_USERNAME                                  │
│ • EC2_SSH_KEY (private key)                    │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│ Layer 2: SSH Authentication                     │
│ • Key-based authentication only                │
│ • No password authentication                   │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│ Layer 3: Firewall (UFW)                        │
│ • Port 22 (SSH) - restricted                   │
│ • Port 80 (HTTP) - open                        │
│ • Port 443 (HTTPS) - open                      │
│ • Port 8000 - blocked (internal only)          │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│ Layer 4: Nginx Reverse Proxy                   │
│ • Hides internal port 8000                     │
│ • Security headers                             │
│ • SSL/TLS termination                          │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│ Layer 5: Application                           │
│ • Environment variables (.env)                 │
│ • JWT authentication                           │
│ • Rate limiting                                │
│ • CORS configuration                           │
└─────────────────────────────────────────────────┘
```

---

## 📦 File Structure on EC2

```
/var/www/genmeta-backend/
│
├── src/                          # Application source code
│   ├── index.js                  # Entry point
│   ├── app.js                    # Express app
│   ├── config/                   # Configuration
│   ├── controllers/              # Route controllers
│   ├── models/                   # Database models
│   ├── routes/                   # API routes
│   ├── services/                 # Business logic
│   └── ...
│
├── node_modules/                 # Dependencies (installed on server)
│
├── logs/                         # PM2 logs
│   ├── out.log                   # Standard output
│   └── error.log                 # Error output
│
├── backups/                      # Deployment backups
│   ├── backup_20260330_120000.tar.gz
│   ├── backup_20260330_130000.tar.gz
│   └── ... (last 5 kept)
│
├── public/                       # Static files (if any)
│
├── .env                          # Environment variables (preserved)
├── package.json                  # Dependencies
├── package-lock.json             # Locked versions
└── ecosystem.config.cjs          # PM2 configuration
```

---

## 🔄 PM2 Process Lifecycle

```
┌─────────────────────────────────────────────────┐
│ Initial State: No Process                       │
└─────────────────┬───────────────────────────────┘
                  │
                  │ pm2 start ecosystem.config.cjs
                  ▼
┌─────────────────────────────────────────────────┐
│ Process Started                                 │
│ • Name: genmeta-backend                        │
│ • Status: online                               │
│ • PID: 12345                                   │
│ • Uptime: 0s                                   │
└─────────────────┬───────────────────────────────┘
                  │
                  │ Application running
                  │
┌─────────────────┴───────────────────────────────┐
│                                                 │
│  ┌──────────────┐      ┌──────────────┐       │
│  │ Crash?       │      │ New Deploy?  │       │
│  └──────┬───────┘      └──────┬───────┘       │
│         │                     │                │
│         │ Auto-restart        │ pm2 reload     │
│         ▼                     ▼                │
│  ┌──────────────┐      ┌──────────────┐       │
│  │ Restart      │      │ Zero-downtime│       │
│  │ immediately  │      │ reload       │       │
│  └──────┬───────┘      └──────┬───────┘       │
│         │                     │                │
│         └──────────┬──────────┘                │
│                    │                           │
└────────────────────┼───────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│ Process Online                                  │
│ • Handling requests                            │
│ • Logging to files                             │
│ • Memory monitored                             │
└─────────────────────────────────────────────────┘
```

---

## 🌐 Request Flow

```
User Request
     │
     ▼
┌─────────────────┐
│ Internet        │
└────────┬────────┘
         │
         │ HTTP/HTTPS
         ▼
┌─────────────────┐
│ EC2 Instance    │
│ (Public IP)     │
└────────┬────────┘
         │
         │ Port 80/443
         ▼
┌─────────────────────────────────┐
│ Nginx                           │
│ • SSL termination              │
│ • Security headers             │
│ • Request logging              │
└────────┬────────────────────────┘
         │
         │ Proxy to localhost:8000
         ▼
┌─────────────────────────────────┐
│ PM2                             │
│ • Load balancing (if multiple) │
│ • Process management           │
└────────┬────────────────────────┘
         │
         │ Forward to process
         ▼
┌─────────────────────────────────┐
│ Node.js Application             │
│ • Express server               │
│ • Route handling               │
│ • Business logic               │
└────────┬────────────────────────┘
         │
         │ Database queries
         ▼
┌─────────────────────────────────┐
│ MongoDB                         │
│ • Data storage                 │
│ • Query execution              │
└────────┬────────────────────────┘
         │
         │ Response
         ▼
     (Back up the chain)
         │
         ▼
    User receives response
```

---

## 🔧 Configuration Files

```
Project Root
│
├── .github/
│   └── workflows/
│       └── deploy-backend.yml        # GitHub Actions workflow
│
└── server/
    ├── src/
    │   └── index.js                  # Entry point
    │
    ├── ecosystem.config.cjs          # PM2 configuration
    ├── package.json                  # Dependencies
    ├── .env.example                  # Environment template
    │
    └── docs/
        ├── DEPLOYMENT_GUIDE.md       # Full setup guide
        ├── QUICK_SETUP.md            # Quick reference
        ├── CICD_SETUP.md             # Setup summary
        ├── SERVER_REQUIREMENTS.md    # Requirements
        ├── README_CICD.md            # CI/CD docs
        ├── ARCHITECTURE.md           # This file
        └── EC2_SETUP_COMMANDS.sh     # Setup script
```

---

## 🎯 Key Components

### 1. GitHub Actions

- **Purpose**: Automate build and deployment
- **Triggers**: Push to main (server/ changes) or manual
- **Secrets**: EC2_HOST, EC2_USERNAME, EC2_SSH_KEY, APP_DIR

### 2. PM2

- **Purpose**: Process management and monitoring
- **Features**: Auto-restart, clustering, logging, zero-downtime reload
- **Config**: ecosystem.config.cjs

### 3. Nginx

- **Purpose**: Reverse proxy and web server
- **Features**: SSL termination, security headers, load balancing
- **Config**: /etc/nginx/sites-available/genmeta-backend

### 4. Node.js Application

- **Purpose**: Backend API server
- **Framework**: Express.js
- **Entry**: src/index.js
- **Port**: 8000 (internal)

---

**This architecture provides a robust, scalable, and secure deployment pipeline! 🚀**
