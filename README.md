# Finance Dashboard Backend

> Assignment submission for **Zorvyn FinTech Pvt. Ltd. — Backend Developer Intern**
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

## Tech Stack & Justification

| Layer          | Choice                     | Why                                                         |
|----------------|----------------------------|-------------------------------------------------------------|
| Runtime        | Node.js 20 (LTS)           | Fast I/O, great ecosystem, natural fit for REST APIs        |
| Framework      | Express.js                 | Minimal, unopinionated — perfect for clean MVC layering     |
| Database       | MySQL 8 via `mysql2`       | Relational data, strong JOIN support, DECIMAL for money     |
| Auth           | JWT (access + refresh)     | Stateless, scalable, industry-standard                      |
| Validation     | Joi                        | Expressive schema definitions, great error messages         |
| Password Hash  | bcrypt                     | Adaptive cost factor, standard for password security        |
| Security       | helmet, cors, rate-limiter | Defense-in-depth for production readiness                   |

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

## Role-Based Access Control

| Action                            | Viewer | Analyst | Admin |
|-----------------------------------|--------|---------|-------|
| Login / Logout                    | ✅     | ✅      | ✅    |
| View own profile                  | ✅     | ✅      | ✅    |
| Change own password               | ✅     | ✅      | ✅    |
| View financial records            | ✅     | ✅      | ✅    |
| Dashboard overview & recent       | ✅     | ✅      | ✅    |
| Category-wise analytics           | ❌     | ✅      | ✅    |
| Monthly & weekly trends           | ❌     | ✅      | ✅    |
| Create / Update / Delete records  | ❌     | ❌      | ✅    |
| Manage users (list / update)      | ❌     | ❌      | ✅    |
| Deactivate users                  | ❌     | ❌      | ✅    |

---

## Setup & Run

### Prerequisites

- Node.js ≥ 18
- MySQL 8 running locally
- npm

### 1 — Clone & Install

```bash
git clone <your-repo-url>
cd finance-backend
npm install
```

### 2 — Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and fill in:
- `DB_PASSWORD` — your MySQL root password
- `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` — generate with:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3 — Initialize Database

```bash
mysql -u root -p < docs/schema.sql
```

This creates the `finance_dashboard` database, all tables, seeds roles, and creates a default admin user:

| Email               | Password    | Role  |
|---------------------|-------------|-------|
| admin@finance.dev   | Admin@1234  | admin |

### 4 — Run

```bash
# Development (auto-restart)
npm run dev

# Production
npm start
```

Server starts at: `http://localhost:3000`

Health check: `GET http://localhost:3000/health`

### 5 — Run Tests

```bash
npm test
```

---

## API Documentation

**Base URL:** `http://localhost:3000/api/v1`

All protected routes require:
```
Authorization: Bearer <accessToken>
```

---

### Auth APIs

#### Register a new user
```
POST /auth/register
Access: Public (Admin typically creates users, but registration is open for demo)
```
Body:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Secret@123",
  "role": "viewer"
}
```
Response `201`:
```json
{
  "success": true,
  "message": "Registration successful",
  "data": { "id": 2, "name": "John Doe", "email": "john@example.com", "role": "viewer" }
}
```

---

#### Login
```
POST /auth/login
Access: Public
```
Body:
```json
{ "email": "admin@finance.dev", "password": "Admin@1234" }
```
Response `200`:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "user": { "id": 1, "name": "System Admin", "email": "admin@finance.dev", "role": "admin" }
  }
}
```

---

#### Refresh Tokens
```
POST /auth/refresh
Access: Public
```
Body:
```json
{ "refreshToken": "eyJ..." }
```

---

#### Logout
```
POST /auth/logout
Access: Any authenticated user
```

---

### User APIs

#### Get all users
```
GET /users?page=1&limit=20&status=active&role=analyst
Access: Admin only
```

#### Get user by ID
```
GET /users/:id
Access: Admin only
```

#### Update user
```
PUT /users/:id
Access: Admin only
```
Body (any combination):
```json
{ "name": "New Name", "status": "inactive", "role": "analyst" }
```

#### Deactivate (soft delete) user
```
DELETE /users/:id
Access: Admin only (cannot delete self)
```

#### Get own profile
```
GET /users/me
Access: Any authenticated user
```

#### Change own password
```
PUT /users/me/password
Access: Any authenticated user
```
Body:
```json
{ "currentPassword": "OldPass@1", "newPassword": "NewPass@2" }
```

---

### Financial Record APIs

#### Create a record
```
POST /records
Access: Admin only
```
Body:
```json
{
  "amount": 45000.00,
  "type": "income",
  "category": "Salary",
  "record_date": "2025-04-01",
  "notes": "Monthly salary credit"
}
```
Response `201`:
```json
{
  "success": true,
  "message": "Record created successfully",
  "data": {
    "id": 1, "amount": "45000.00", "type": "income",
    "category": "Salary", "record_date": "2025-04-01",
    "notes": "Monthly salary credit", "created_by": "System Admin"
  }
}
```

---

#### List records (paginated + filtered)
```
GET /records?type=income&category=Salary&start_date=2025-01-01&end_date=2025-12-31&page=1&limit=20&sort_by=record_date&order=desc
Access: Viewer, Analyst, Admin
```
Response includes pagination metadata:
```json
{
  "success": true,
  "data": [...],
  "pagination": { "total": 50, "page": 1, "limit": 20, "totalPages": 3, "hasNext": true, "hasPrev": false }
}
```

---

#### Get record by ID
```
GET /records/:id
Access: Viewer, Analyst, Admin
```

---

#### Update record
```
PUT /records/:id
Access: Admin only
```
Body (any subset of fields):
```json
{ "amount": 50000, "notes": "Updated note" }
```

---

#### Delete record (soft)
```
DELETE /records/:id
Access: Admin only
```
Records are soft-deleted (`deleted_at` timestamp set). They remain in DB but are excluded from all queries.

---

### Dashboard APIs

#### Full summary
```
GET /dashboard/summary?year=2025
Access: Viewer, Analyst, Admin
```
Returns: overview + category totals + monthly trends + recent activity in one call.

---

#### Overview (totals)
```
GET /dashboard/overview
Access: Viewer, Analyst, Admin
```
Response:
```json
{
  "data": {
    "total_income": "150000.00",
    "total_expense": "62500.00",
    "net_balance": "87500.00"
  }
}
```

---

#### Category-wise totals
```
GET /dashboard/categories?type=expense
Access: Analyst, Admin
```
Response:
```json
{
  "data": [
    { "category": "Rent", "type": "expense", "transaction_count": 3, "total": "45000.00", "average": "15000.00" },
    { "category": "Food", "type": "expense", "transaction_count": 12, "total": "8400.00",  "average": "700.00" }
  ]
}
```

---

#### Monthly trends
```
GET /dashboard/trends/monthly?year=2025
Access: Analyst, Admin
```

---

#### Weekly trends (last 8 weeks)
```
GET /dashboard/trends/weekly
Access: Analyst, Admin
```

---

#### Recent activity
```
GET /dashboard/recent-activity?limit=10
Access: Viewer, Analyst, Admin
```

---

## Assumptions & Tradeoffs

| Decision | Rationale |
|----------|-----------|
| MySQL over MongoDB | Financial data is highly relational (users → roles, records → categories). SQL gives ACID guarantees and precise DECIMAL math. |
| Soft delete on records | Preserves audit trail. Admin can see deleted record IDs in raw DB if needed. |
| Refresh token hashed in DB | Prevents token theft if DB is compromised. |
| Categories are auto-created | If a new category name is submitted with a record, it is inserted automatically. This avoids a separate "create category" API step. |
| Analyst cannot write records | The assignment says Analyst can "view records and access insights". Write access is Admin-only. |
| Registration is open for demo | In production, only admins would create user accounts. |
| Rate limit: 100 req / 15 min | Conservative default for demo. Should be tuned per environment. |

---

## Postman Examples

Import this cURL flow to test the full lifecycle:

```bash
# 1. Login as admin
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@finance.dev","password":"Admin@1234"}'

# Save the accessToken from response, then:

# 2. Create a record
curl -X POST http://localhost:3000/api/v1/records \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"amount":50000,"type":"income","category":"Salary","record_date":"2025-04-01"}'

# 3. Get dashboard summary
curl http://localhost:3000/api/v1/dashboard/summary?year=2025 \
  -H "Authorization: Bearer <TOKEN>"

# 4. Filter records
curl "http://localhost:3000/api/v1/records?type=income&start_date=2025-01-01&limit=5" \
  -H "Authorization: Bearer <TOKEN>"

# 5. Register a viewer
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Viewer","email":"jane@example.com","password":"View@1234","role":"viewer"}'
```
