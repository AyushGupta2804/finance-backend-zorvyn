# Finance Dashboard Backend

> **Zorvyn FinTech Pvt. Ltd. — Backend Developer Intern Assignment**
> Submitted by **Ayush Gupta** | ayushgupta2844@gmail.com

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack & Justification](#tech-stack--justification)
3. [Architecture](#architecture)
4. [Role-Based Access Control](#role-based-access-control)
5. [Setup & Run](#setup--run)
6. [API Documentation](#api-documentation)
7. [Assumptions & Tradeoffs](#assumptions--tradeoffs)
8. [Postman Examples](#postman-examples)

---

## Project Overview

A production-grade REST API backend for a finance dashboard system. It supports:

- JWT-based authentication with access + refresh token rotation
- Three-tier RBAC: **Viewer → Analyst → Admin**
- Full CRUD for financial records with soft delete
- Advanced dashboard analytics (totals, trends, category breakdowns)
- Input validation, structured error responses, rate limiting, and an audit log table

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Runtime | Node.js 20 | Fast async I/O, huge ecosystem |
| Framework | Express.js | Minimal, clean MVC layering |
| Database | MySQL 8 | Relational data, DECIMAL for money precision |
| Auth | JWT (access + refresh) | Stateless, scalable, industry standard |
| Validation | Joi | Expressive schemas, field-level error messages |
| Password | bcrypt | Adaptive cost, industry standard |
| Security | Helmet + CORS + Rate Limiter | Defense-in-depth |

---

## Architecture

```
MVC + Service Layer pattern

Request → Route → Middleware (auth/validation) → Controller → Service → DB
                                                                  ↓
                                                            Response (utils/response.js)
```

```
src/
├── app.js                  # Express app: middleware, routes, error handlers
├── server.js               # Entry: DB connect → listen
├── config/
│   └── database.js         # MySQL connection pool
├── controllers/            # Thin layer — delegate to services, return responses
│   ├── auth.controller.js
│   ├── user.controller.js
│   ├── record.controller.js
│   └── dashboard.controller.js
├── services/               # All business logic lives here
│   ├── auth.service.js
│   ├── user.service.js
│   ├── record.service.js
│   └── dashboard.service.js
├── routes/                 # Express routers — bind HTTP verbs to controllers
│   ├── auth.routes.js
│   ├── user.routes.js
│   ├── record.routes.js
│   └── dashboard.routes.js
├── middleware/
│   ├── auth.js             # authenticate (JWT verify) + authorize (role guard)
│   └── errorHandler.js     # AppError class + global error handler
├── validators/
│   └── index.js            # Joi schemas + validate() middleware factory
└── utils/
    ├── jwt.js              # Token generation/verification helpers
    └── response.js         # Consistent success/paginated response helpers
```

---

## Deployment (Railway)

### Step 1 — Push to GitHub
```bash
git init
git add .
git commit -m "Finance Dashboard Backend - Zorvyn Assignment"
git branch -M main
git remote add origin https://github.com/AyushGupta2804/finance-backend-zorvyn.git
git push -u origin main
```

### Step 2 — Create MySQL on Railway
- Go to railway.app → New Project → Add Service → Database → MySQL
- Copy the MYSQLHOST, MYSQLPORT, MYSQLUSER, MYSQLPASSWORD, MYSQLDATABASE values

### Step 3 — Import Schema
```bash
mysql -h MYSQLHOST -P MYSQLPORT -u MYSQLUSER -pMYSQLPASSWORD MYSQLDATABASE < docs/schema.sql
```

### Step 4 — Deploy Backend on Railway
- Add Service → GitHub Repo → select finance-backend-zorvyn
- Add these environment variables:

```env
NODE_ENV=production
PORT=3000
DB_HOST=<MYSQLHOST>
DB_PORT=<MYSQLPORT>
DB_USER=<MYSQLUSER>
DB_PASSWORD=<MYSQLPASSWORD>
DB_NAME=<MYSQLDATABASE>
JWT_ACCESS_SECRET=<generate with crypto.randomBytes(64)>
JWT_REFRESH_SECRET=<generate with crypto.randomBytes(64)>
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
CORS_ORIGIN=*
```

- Start command: `node src/server.js`
- Generate domain → your live URL is ready

---

## Environment Variables

```env
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=finance_dashboard
JWT_ACCESS_SECRET=your_64_char_secret
JWT_REFRESH_SECRET=your_different_64_char_secret
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
CORS_ORIGIN=*
```

Generate secrets with:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Role Permissions

| Action | Viewer | Analyst | Admin |
|---|---|---|---|
| View records | ✅ | ✅ | ✅ |
| Dashboard overview + recent activity | ✅ | ✅ | ✅ |
| Category analytics + trends | ❌ | ✅ | ✅ |
| Create / Update / Delete records | ❌ | ❌ | ✅ |
| Manage users | ❌ | ❌ | ✅ |
| Own profile + change password | ✅ | ✅ | ✅ |

---

## API Reference

**Base URL:** `http://localhost:3000/api/v1`

All protected routes require: `Authorization: Bearer <accessToken>`

### Auth Endpoints
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | /auth/register | Public | Register new user |
| POST | /auth/login | Public | Login, receive tokens |
| POST | /auth/refresh | Public | Refresh expired access token |
| POST | /auth/logout | Any user | Invalidate refresh token |

### User Endpoints
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | /users/me | Any user | Own profile |
| PUT | /users/me/password | Any user | Change own password |
| GET | /users | Admin | List all users |
| GET | /users/:id | Admin | Get user by ID |
| PUT | /users/:id | Admin | Update role or status |
| DELETE | /users/:id | Admin | Deactivate user |

### Financial Record Endpoints
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | /records | All roles | List records (paginated + filtered) |
| GET | /records/:id | All roles | Single record |
| POST | /records | Admin | Create record |
| PUT | /records/:id | Admin | Update record |
| DELETE | /records/:id | Admin | Soft delete |

Filter options:
```
?type=income&category=Salary&start_date=2025-01-01&end_date=2025-12-31
&page=1&limit=20&sort_by=record_date&order=desc
```

### Dashboard Endpoints
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | /dashboard/summary | All roles | Full summary (all analytics) |
| GET | /dashboard/overview | All roles | Total income, expense, net balance |
| GET | /dashboard/recent-activity | All roles | Last N records |
| GET | /dashboard/categories | Analyst, Admin | Category-wise totals |
| GET | /dashboard/trends/monthly | Analyst, Admin | Monthly income vs expense |
| GET | /dashboard/trends/weekly | Analyst, Admin | Last 8 weeks |

---

## When Access Token Expires

Send this request:
```
POST /api/v1/auth/refresh
Body: { "refreshToken": "your_refresh_token" }
```
Copy the new `accessToken` and `refreshToken`. Access tokens last 15 minutes, refresh tokens last 7 days.

---

## Thunder Client Test Flow

```
1. POST /auth/login          → get accessToken
2. POST /records             → create a record (Admin token)
3. GET  /records/1           → get single record
4. PUT  /records/1           → update record
5. DELETE /records/1         → soft delete
6. GET  /dashboard/summary   → see all analytics
7. Register viewer → login → POST /records → get 403 (RBAC proof)
```

---

## Example Requests

**Login:**
```json
POST /api/v1/auth/login
{
  "email": "admin@finance.dev",
  "password": "Admin@1234"
}
```

**Create Record:**
```json
POST /api/v1/records
Authorization: Bearer <token>
{
  "amount": 50000,
  "type": "income",
  "category": "Salary",
  "record_date": "2025-04-01",
  "notes": "April salary"
}
```

**Dashboard Overview Response:**
```json
{
  "success": true,
  "data": {
    "total_income": "95000.00",
    "total_expense": "24500.00",
    "net_balance": "70500.00"
  }
}
```

---

## Running Tests

```bash
npm test
```

Covers: auth, CRUD with role enforcement, dashboard access control, unauthenticated rejections.

---

## Assumptions

| Decision | Reason |
|---|---|
| Registration is public | Demo purposes — production would restrict to admin-only |
| Analyst cannot create records | Assignment says "view and insights" — write is Admin-only |
| Categories auto-created | New names inserted automatically — no separate API needed |
| Soft delete on records | Preserves audit trail |
| Refresh token hashed in DB | Security best practice |
| MySQL not MongoDB | DECIMAL precision required for financial data |
| Rate limit 100 req/15 min | Conservative default, tunable per environment |
