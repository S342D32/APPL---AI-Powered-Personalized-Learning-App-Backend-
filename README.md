# Backend Setup

## Environment Variables

Copy `.env.example` to `.env` and fill in your actual values:

```bash
cp .env.example .env
```

Required environment variables:
- `MONGODB_URI`: Your MongoDB connection string
- `GEMINI_API_KEY`: Your Google Gemini API key
- `CLERK_SECRET_KEY`: Your Clerk secret key
- `EMAIL_USER`: Your Gmail address
- `EMAIL_PASS`: Your Gmail app password
- `JWT_SECRET`: A secure random string

## Installation

```bash
npm install
npm start
```