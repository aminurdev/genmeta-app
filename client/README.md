# GenMeta: AI-Powered Image Metadata Generator

GenMeta is a full-stack application that automatically generates accurate titles, descriptions, and SEO-optimized keywords for images using advanced AI technology. The application consists of a Next.js frontend and a Node.js/Express backend.

## Project Structure

The project is organized into two main directories:

- **client**: Next.js frontend application
- **server**: Node.js/Express backend API

## Client (Frontend)

The client is built with:

- [Next.js 15](https://nextjs.org/) - React framework with App Router
- [React 19](https://react.dev/) - UI library
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Radix UI](https://www.radix-ui.com/) - Unstyled, accessible UI components
- [Authentication](https://next-auth.js.org/) - User authentication

### Key Features

- Modern, responsive UI with dark/light mode
- Image upload and processing
- Metadata generation and editing
- Bulk operations for processing multiple images
- User authentication and role management
- Analytics dashboard

### Getting Started with Client

```bash
# Navigate to client directory
cd client

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## Server (Backend)

The server is built with:

- [Node.js](https://nodejs.org/) - JavaScript runtime
- [Express](https://expressjs.com/) - Web framework
- [MongoDB](https://www.mongodb.com/) - Database
- [Google Generative AI](https://ai.google.dev/) - AI for image analysis
- [AWS S3](https://aws.amazon.com/s3/) - Image storage

### Key Features

- RESTful API for image processing
- AI-powered image analysis and metadata generation
- User authentication with JWT
- File upload handling
- Image processing with Sharp and ExifTool
- S3 integration for image storage

### Getting Started with Server

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create environment file
cp .env.sample .env

# Configure environment variables
# Edit .env with your specific configuration

# Start development server
npm run dev

# Start production server
npm start
```

## Environment Setup

### Client Environment Variables

Create a `.env.local` file in the client directory with:

```
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api


# Google Tag Manager (optional)
NEXT_PUBLIC_GTM_ID=your_gtm_id

# Token Expiry Configuration
ACCESS_TOKEN_EXPIRY=1
REFRESH_TOKEN_EXPIRY=7
```

**Note:** Copy `.env.example` to `.env.local` and update with your actual values. The `.env.local` file is ignored by git for security.

### Server Environment Variables

Create a `.env` file in the server directory with appropriate values for:

```
PORT=5000
MONGODB_URI=
JWT_SECRET=
GOOGLE_API_KEY=
```

## Desktop Application

GenMeta is also available as a desktop application for Windows. You can download the latest version from the website.

## License

This project is licensed under the MIT License.
