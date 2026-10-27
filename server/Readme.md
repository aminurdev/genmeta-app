# GenMeta API Server - Enterprise Architecture

## Overview

High-performance backend API powering the GenMeta platform for AI-assisted image tag, title, and metadata generation. Built with Node.js, Express, MongoDB (Mongoose), and secured with JWT, Helmet, and Zod runtime schema validation.

---

## Key Architecture & Features

- **Robust Multi-Layered Architecture**: Clean separation between routing, input validation, controllers, transactional business services, and database schemas.
- **Database Normalization & Zero-Data-Loss Scalability**:
  - Eliminated unbounded embedded arrays on `Referral` and `PromoCode` documents.
  - Normalized ledger collections: `ReferralEarning`, `ReferralWithdrawal`, `PromoCodeRedemption`, and `DailyApiUsage`.
  - Atomically protected balance deductions ensuring prevention of concurrent race conditions / double withdrawals.
- **Comprehensive Database Migration System**:
  - Native database migration engine located at `src/database/migrations/migrator.js`.
  - Batch tracking inside `_migrations` collection.
  - Compound indexing and schema evolution with safe up/down rollbacks.
- **Unified Billing & Subscription Engine**: Single source of truth in `PlanService` preventing duplicate payment verification and plan assignment logic.
- **Hardened Security & Validation**:
  - Request payload validation on all routes via `Zod`.
  - `Helmet` HTTP security headers, CORS protection, proxy awareness.
  - Role-based authorization supporting `user`, `admin`, and `superAdmin`.
  - `AES-256-CBC` encryption for AI keys and credentials.
- **Resilience & Observability**:
  - Graceful shutdown handlers for `SIGTERM` / `SIGINT` with connection pooling drain.
  - Global centralized error handler differentiating operational vs programming errors.
  - Request correlation tracing via `X-Request-Id`.
  - Background scheduler for automated daily maintenance and weekly backups.

---

## Getting Started

### 1. Prerequisites
- Node.js (v18+ recommended, compatible with v20 and v24)
- MongoDB instance (v6.0+ recommended)

### 2. Installation
```bash
npm install
```

### 3. Environment Configuration
Create your `.env` file from the example:
```bash
cp .env.example .env
```
Configure your database URI, JWT secrets, and gateway credentials.

### 4. Database Migrations
Run the automated database migrations before starting the server:
```bash
# Apply pending migrations
npm run migrate:up

# Check migration status
npm run migrate:status

# Rollback last batch (if needed)
npm run migrate:down
```

### 5. Running the Application
```bash
# Production mode
npm start

# Development mode (with nodemon)
npm run dev
```

---

## Database Architecture

| Collection | Description | Primary Indexes |
| :--- | :--- | :--- |
| `users` | User accounts & credentials | `email` (unique), `googleId` (sparse), `(role, isVerified, createdAt)` |
| `appkeys` | Client API keys & quotas | `key` (unique), `userId`, `("plan.type", expiresAt)`, `("plan.type", credit)` |
| `apppricings` | Subscription & Credit tiers | `(isActive, type, basePrice)` |
| `apppayments` | Verified payment audit logs | `paymentID` (unique), `trxID` (unique), `(userId, createdAt)` |
| `orders` | Purchases & order history | `(userId, createdAt)`, `(status, createdAt)`, `planId` |
| `promocodes` | Promotional discount codes | `code` (unique), `(isActive, validFrom, validUntil)` |
| `promocoderedemptions` | **NEW** Normalized promo ledger | `(promoCodeId, userId)` (unique), `(userId, createdAt)` |
| `referrals` | Referral programs & balances | `referralCode` (unique), `referrer` (unique), `availableBalance` |
| `referralearnings` | **NEW** Commission reward ledger | `(referralId, referredUserId)` (unique), `(referrerId, createdAt)` |
| `referralwithdrawals`| **NEW** Withdrawal request ledger| `(status, requestedAt)`, `(userId, requestedAt)` |
| `dailyapiusages` | **NEW** Daily rollups & stats | `(appKeyId, date)` (unique), `(userId, date)`, `date` |
| `aiapis` | Encrypted Gemini AI keys | `isActive`, `createdAt` |
| `bkashtokens` | bKash OAuth token cache | `expires_at` |
| `_migrations` | Migration version tracking | `name` (unique), `batch` |

---

## API Documentation

### Base URL: `/api/v1`

- **Authentication & Users**: `/api/v1/users`
  - `POST /register` - Register new user (domain verified)
  - `POST /login` - Password login
  - `POST /verify-email` - Verify email via 6-digit OTP
  - `POST /refresh-token` - Refresh access token
  - `GET /google-login` / `GET /google/callback` - OAuth 2.0 flow
  - `GET /me` - Authenticated profile

- **Desktop & Mobile App Client**: `/api/v1/app`
  - `POST /appkey/validate` - Authorize device & verify version
  - `POST /appkey/usage` - Report usage & process counts
  - `GET /appkey/stats` - Quotas & status

- **Payment Gateways**: `/api/v1/payment`
  - `POST /create-app-payment` - Initiate bKash checkout
  - `GET /bkash-callback` - bKash webhook / verification
  - `POST /create-paystation-payment` - Initiate PayStation checkout
  - `GET /paystation-callback` - PayStation webhook / verification

- **Orders & Subscriptions**: `/api/v1/orders`
  - `POST /create` - Create order with promo/referral
  - `GET /my-orders` - User order history
  - `PATCH /:orderId/status` - Admin fulfillment (with plan synchronization)

- **Referrals**: `/api/v1/referral`
  - `GET /getDetails` - Referral metrics & code
  - `POST /request-withdraw` - Atomic withdrawal submission

- **Admin Management**: `/api/v1/admin`
  - `GET /dashboard/stats` - High-performance aggregation pipeline
  - `GET /users/all` - Paginated user management
  - `GET /paymentHistory/download` - CSV payments export
  - `PATCH /referral/:userId/withdrawals/:withdrawalId` - Fulfill/reject withdrawals

- **Maintenance & Schedulers**:
  - Daily plan maintenance at 00:00 UTC (credit refreshes, subscription downgrades)
  - Weekly backup at Friday 12:00 UTC (automated DB synchronization)
