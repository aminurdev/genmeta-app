# Image Tag and Title Generator

## Description

This application generates tags and titles for images using machine learning algorithms.

## Features

- Automatic tag generation
- Title suggestion
- User-friendly interface
- Automated database backup system
- Scheduled maintenance tasks
- **Payment integration (bKash & PayStation)**
- User authentication (Google OAuth)
- API key management
- Pricing plans and subscriptions
- Promo code system
- Referral rewards program

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/image-tag-title-generator.git
   ```
2. Navigate to the project directory:
   ```bash
   cd image-tag-title-generator/gen-meta-app
   ```
3. Install the dependencies:
   ```bash
   npm install
   ```
4. Configure environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

## Configuration

### Required Environment Variables

See `.env.example` for all required environment variables including:

- Database configuration (main and backup)
- Authentication secrets
- **Payment gateway credentials (bKash & PayStation)**
- Email service configuration

### Payment Gateway Setup

The application supports two payment gateways:

1. **PayStation** (Recommended) - Multi-gateway aggregator
   - Supports: bKash, Nagad, Rocket, Upay, Credit/Debit Cards
   - Easy integration, no token management
   - See `PAYSTATION_QUICK_START.md` for 5-minute setup

2. **bKash** - Direct bKash integration
   - bKash-only payments
   - Token-based authentication
   - Advanced security features

**Payment Documentation:**
- `PAYSTATION_INTEGRATION.md` - Complete PayStation guide
- `PAYSTATION_QUICK_START.md` - Quick setup guide
- `PAYMENT_GATEWAY_COMPARISON.md` - Compare bKash vs PayStation

### Backup System Setup

The application includes an automated MongoDB backup system. See `BACKUP_QUICKSTART.md` for setup instructions.

**Key backup features:**

- Automatic weekly backups (Friday 12:00 PM UTC)
- Manual backup API endpoints
- Backup monitoring and statistics
- Admin-only access

## Usage

1. Start the application:

   ```bash
   npm start
   ```

   For development:

   ```bash
   npm run dev
   ```

2. The server will start on the configured port (default: 5000)

3. Access the API at `http://localhost:5000`

## API Documentation

### Main Endpoints

- `/api/v1/users` - User management
- `/api/v1/app` - Application key management
- **`/api/v1/payment` - Payment processing (bKash & PayStation)**
- `/api/v1/scheduler` - Scheduler management
- `/api/v1/backup` - Database backup (admin only)
- `/api/v1/pricing` - Pricing plans
- `/api/v1/promo-codes` - Promotional codes
- `/api/v1/refer` - Referral system

### Payment API Endpoints

**bKash:**
- `POST /api/v1/payment/create-app-payment` - Create bKash payment
- `GET /api/v1/payment/bkash-callback` - bKash callback handler

**PayStation:**
- `POST /api/v1/payment/create-paystation-payment` - Create PayStation payment
- `GET /api/v1/payment/paystation-callback` - PayStation callback handler

**Request Format:**
```json
{
  "planId": "507f1f77bcf86cd799439011",
  "promoCode": "SAVE20"
}
```

### Backup API Endpoints

All backup endpoints require admin authentication:

- `GET /api/v1/backup/status` - Get backup status
- `POST /api/v1/backup/trigger` - Trigger manual backup
- `GET /api/v1/backup/test-connection` - Test backup connection
- `GET /api/v1/backup/history` - Get backup history

See `BACKUP_API_EXAMPLES.md` for detailed API examples.

## Automated Tasks

### Daily Maintenance (00:00 UTC)

- Refresh free plan credits
- Downgrade expired subscriptions
- Deactivate zero-credit plans

### Weekly Backup (Friday 12:00 PM UTC)

- Full database sync to backup database
- Automatic backup of all collections

## Documentation

- **Payment System:**
  - `PAYSTATION_INTEGRATION.md` - Complete PayStation documentation
  - `PAYSTATION_QUICK_START.md` - 5-minute setup guide
  - `PAYMENT_GATEWAY_COMPARISON.md` - bKash vs PayStation comparison

- **Backup System:**
  - `BACKUP_QUICKSTART.md` - Quick setup guide
  - `BACKUP_GUIDE.md` - Complete backup documentation
  - `BACKUP_API_EXAMPLES.md` - API usage examples
  - `BACKUP_ARCHITECTURE.md` - System architecture
  - `BACKUP_CHECKLIST.md` - Setup checklist

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request.

## License

This project is licensed under the ISC License.
