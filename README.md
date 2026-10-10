# Finora — Expense & Budget Tracker

Finora is a local-first personal finance application for recording income and expenses, planning monthly category budgets, and reviewing financial analytics. It uses the Midnight Emerald design system and defaults to Sri Lankan Rupees (LKR).

## Features

- Email/password registration and login with bcrypt password hashing and JWTs in HttpOnly cookies
- User-scoped transaction and budget CRUD APIs
- Dashboard totals, monthly income/expense chart, category breakdown, budget progress, and recent activity from MongoDB data
- Transaction search, filtering, date and amount ranges, sorting, detail view, and delete confirmation
- Monthly category budgets with duplicate protection and overspending indicators
- Analytics filtered by month/year using real transaction records
- Editable profile name and preferred currency
- Responsive layout with desktop navigation and a mobile drawer

## Technology

- Client: React, Vite, JavaScript, Tailwind CSS, React Router, Axios, Recharts, Lucide React
- Server: Node.js, Express, MongoDB, Mongoose, JWT, bcryptjs, express-validator
- Security: HttpOnly JWT cookie, Helmet, CORS allow-list, rate-limited authentication endpoints

## Requirements

- Node.js 20 or later and npm
- MongoDB running locally, or a MongoDB connection string you are authorized to use

## Setup

### Backend

```bash
cd server
npm install
cp .env.example .env
```

Set `MONGODB_URI` and a long, random `JWT_SECRET` in `server/.env`. For a local MongoDB service, the URI can be `mongodb://127.0.0.1:27017/finora`. Do not commit `.env`.

Start the API:

```bash
npm run dev
```

The API listens at `http://localhost:5000` by default. If that port is already in use, set `PORT=5001` in `server/.env` and `VITE_API_PROXY_TARGET=http://localhost:5001` in `client/.env`.

### Frontend

In a second terminal:

```bash
cd client
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:5173`. The Vite development server proxies `/api` to `http://localhost:5000`.

## Tests and production build

```bash
cd server
npm test
```

```bash
cd client
npm run build
```

Backend integration tests use a separate database named `finora_test` on the configured MongoDB server and drop that database after the test run. Do not use that database for personal data.

## API overview

All private endpoints require the HttpOnly session cookie set by login/register.

| Method | Endpoint | Purpose |
|---|---|---|
| GET/POST | `/api/auth/me`, `/api/auth/register`, `/api/auth/login`, `/api/auth/logout` | Session and authentication |
| GET/POST | `/api/transactions` | List and create transactions |
| GET/PUT/DELETE | `/api/transactions/:id` | Read, update, or remove one transaction |
| GET/POST | `/api/budgets` | List and create monthly budgets |
| PUT/DELETE | `/api/budgets/:id` | Update or remove a budget |
| GET | `/api/dashboard/summary` | Dashboard aggregates and recent records |
| GET | `/api/analytics/overview?month=1&year=2026` | Monthly chart and category data |
| GET/PUT | `/api/users/profile` | Read or update profile and currency |
| GET | `/api/health` | API and database health |

## Project structure

```text
client/   React/Vite application
server/   Express API, Mongoose models, validation, controllers, tests
```

## Notes

- Monetary values are stored as integer minor units (`amountCents` / `limitCents`) to avoid floating-point arithmetic in persisted records.
- Currency formatting supports LKR, USD, EUR, and GBP. Existing records are formatted using the user's current preference.
- Authentication uses a SameSite=Lax, HttpOnly cookie. HTTPS deployments must set `COOKIE_SECURE=true`; this project is intended for local use and is not deployed.
- Register a new account in the app to begin. There are no seeded or fabricated financial totals.
