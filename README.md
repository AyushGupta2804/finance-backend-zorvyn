# Finance Dashboard Backend

> **Zorvyn FinTech Pvt. Ltd. — Backend Developer Intern Assignment**
> Submitted by **Ayush Gupta** | ayushgupta2844@gmail.com

---

## 🔗 Project Links

| | URL |
|---|---|
| **GitHub Repository** | https://github.com/AyushGupta2804/finance-backend-zorvyn |
| **Live API** | https://finance-backend-zorvyn-production.up.railway.app |
| **Health Check** | https://finance-backend-zorvyn-production.up.railway.app/health |
| **Welcome** | https://finance-backend-zorvyn-production.up.railway.app/ |

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20 |
| Framework | Express.js |
| Database | MySQL 8 (Railway) |
| Auth | JWT (Access + Refresh Tokens) |
| Validation | Joi |
| Password | bcrypt |
| Security | Helmet, CORS, Rate Limiter |
| Deployment | Railway |

---

## 🚀 Quick Start (Local)

```bash
npm install
cp .env.example .env
mysql -u root -p < docs/schema.sql
npm run dev
```

Server runs at: `http://localhost:3000`

**Default Admin Account:**
| Email | Password |
|---|---|
| admin@finance.dev | Admin@1234 |

---

## 📁 Project Structure

```
finance-backend/
├── src/
│   ├── app.js                  Express app
│   ├── server.js               Entry point
│   ├── config/database.js      MySQL connection pool
│   ├── controllers/            auth, user, record, dashboard
│   ├── services/               All business logic
│   ├── routes/                 HTTP routes
│   ├── middleware/             auth.js + errorHandler.js
│   ├── validators/index.js     Joi schemas
│   └── utils/                  jwt.js + response.js
├── docs/schema.sql             Database schema
├── tests/api.test.js           Integration tests
├── .env.example
├── package.json
└── README.md
```

---

## 🔐 Role Permissions

| Action | Viewer | Analyst | Admin |
|---|---|---|---|
| View records | ✅ | ✅ | ✅ |
| Dashboard overview + recent activity | ✅ | ✅ | ✅ |
| Category analytics + trends | ❌ | ✅ | ✅ |
| Create / Update / Delete records | ❌ | ❌ | ✅ |
| Manage users | ❌ | ❌ | ✅ |
| Own profile + change password | ✅ | ✅ | ✅ |

---

## 📋 Complete API Reference

**Live Base URL:** `https://finance-backend-zorvyn-production.up.railway.app/api/v1`
**Local Base URL:** `http://localhost:3000/api/v1`

> All protected routes require header: `Authorization: Bearer <accessToken>`

---

### 🔑 Auth Endpoints

#### 1 — Register a new user
```
POST /api/v1/auth/register
Access: Public
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

---

#### 2 — Login
```
POST /api/v1/auth/login
Access: Public
```
Body:
```json
{
  "email": "admin@finance.dev",
  "password": "Admin@1234"
}
```
Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "user": { "id": 1, "name": "System Admin", "role": "admin" }
  }
}
```

---

#### 3 — Refresh Token (when access token expires)
```
POST /api/v1/auth/refresh
Access: Public
```
Body:
```json
{
  "refreshToken": "your_refresh_token_here"
}
```

---

#### 4 — Logout
```
POST /api/v1/auth/logout
Access: Any logged-in user
Header: Authorization: Bearer <token>
```

---

### 👤 User Endpoints

#### 5 — Get my profile
```
GET /api/v1/users/me
Access: Any logged-in user
Header: Authorization: Bearer <token>
```

---

#### 6 — Change my password
```
PUT /api/v1/users/me/password
Access: Any logged-in user
Header: Authorization: Bearer <token>
```
Body:
```json
{
  "currentPassword": "Admin@1234",
  "newPassword": "NewPass@5678"
}
```

---

#### 7 — Get all users
```
GET /api/v1/users
Access: Admin only
Header: Authorization: Bearer <token>
```

---

#### 8 — Get user by ID
```
GET /api/v1/users/1
Access: Admin only
Header: Authorization: Bearer <token>
```

---

#### 9 — Update user role or status
```
PUT /api/v1/users/1
Access: Admin only
Header: Authorization: Bearer <token>
```
Body:
```json
{
  "role": "analyst",
  "status": "active"
}
```

---

#### 10 — Deactivate a user
```
DELETE /api/v1/users/1
Access: Admin only
Header: Authorization: Bearer <token>
```

---

### 💰 Financial Record Endpoints

#### 11 — Create a record (income)
```
POST /api/v1/records
Access: Admin only
Header: Authorization: Bearer <token>
```
Body:
```json
{
  "amount": 50000,
  "type": "income",
  "category": "Salary",
  "record_date": "2025-04-01",
  "notes": "April salary"
}
```

---

#### 12 — Create another record (expense)
```
POST /api/v1/records
Access: Admin only
Header: Authorization: Bearer <token>
```
Body:
```json
{
  "amount": 12000,
  "type": "expense",
  "category": "Rent",
  "record_date": "2025-04-02",
  "notes": "Monthly rent"
}
```

---

#### 13 — Get all records (with filters)
```
GET /api/v1/records
Access: All roles
Header: Authorization: Bearer <token>
```
Optional filters:
```
?type=income
?type=expense
?category=Salary
?start_date=2025-01-01&end_date=2025-12-31
?page=1&limit=20
?sort_by=record_date&order=desc
```

---

#### 14 — Get single record
```
GET /api/v1/records/1
Access: All roles
Header: Authorization: Bearer <token>
```

---

#### 15 — Update a record
```
PUT /api/v1/records/1
Access: Admin only
Header: Authorization: Bearer <token>
```
Body:
```json
{
  "amount": 55000,
  "notes": "Updated — confirmed payment"
}
```

---

#### 16 — Delete a record (soft delete)
```
DELETE /api/v1/records/1
Access: Admin only
Header: Authorization: Bearer <token>
```

---

### 📊 Dashboard Endpoints

#### 17 — Full dashboard summary
```
GET /api/v1/dashboard/summary?year=2025
Access: All roles
Header: Authorization: Bearer <token>
```
Returns: total income, expense, net balance, category breakdown, monthly trends, recent activity — all in one call.

---

#### 18 — Overview (totals only)
```
GET /api/v1/dashboard/overview
Access: All roles
Header: Authorization: Bearer <token>
```
Response:
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

#### 19 — Recent activity
```
GET /api/v1/dashboard/recent-activity?limit=10
Access: All roles
Header: Authorization: Bearer <token>
```

---

#### 20 — Category-wise totals
```
GET /api/v1/dashboard/categories
GET /api/v1/dashboard/categories?type=expense
Access: Analyst, Admin
Header: Authorization: Bearer <token>
```

---

#### 21 — Monthly trends
```
GET /api/v1/dashboard/trends/monthly?year=2025
Access: Analyst, Admin
Header: Authorization: Bearer <token>
```

---

#### 22 — Weekly trends (last 8 weeks)
```
GET /api/v1/dashboard/trends/weekly
Access: Analyst, Admin
Header: Authorization: Bearer <token>
```

---

## 🔄 When Access Token Expires

Access tokens last **15 minutes**. When you get `401 Unauthorized`:

```
POST /api/v1/auth/refresh
Body: { "refreshToken": "your_refresh_token" }
```

Copy the new `accessToken` from the response and use it going forward.
Refresh tokens last **7 days**. If expired, just login again.

---

## 🧪 RBAC Test (Role Restriction Proof)

```
Step 1 — Register a viewer account
POST /api/v1/auth/register
Body: { "name": "Test Viewer", "email": "viewer@test.com", "password": "Viewer@1234", "role": "viewer" }

Step 2 — Login as viewer
POST /api/v1/auth/login
Body: { "email": "viewer@test.com", "password": "Viewer@1234" }

Step 3 — Copy viewer token and try to create a record
POST /api/v1/records with viewer token

Result → 403 Forbidden ✅ RBAC is working!
```

---

## ⚠️ HTTP Status Codes

| Code | Meaning |
|---|---|
| 200 | Success |
| 201 | Created |
| 401 | Invalid or expired token |
| 403 | Wrong role — no permission |
| 404 | Record not found |
| 409 | Email already exists |
| 422 | Validation failed |
| 429 | Too many requests |
| 500 | Server error |

---

## 🚢 Deployment (Railway)

The API is deployed on Railway with:
- **Backend:** Node.js service connected to GitHub (auto-deploys on push)
- **Database:** Railway managed MySQL 8
- **Start command:** `node src/server.js`

Environment variables set on Railway:
```
NODE_ENV=production
PORT=3000
DB_HOST=mysql.railway.internal
DB_PORT=3306
DB_USER=root
DB_PASSWORD=<railway_mysql_password>
DB_NAME=railway
JWT_ACCESS_SECRET=<64_byte_secret>
JWT_REFRESH_SECRET=<64_byte_secret>
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
CORS_ORIGIN=*
```

---

## 📌 Assumptions

| Decision | Reason |
|---|---|
| Registration is public | Demo purposes |
| Analyst cannot create records | Assignment says view and insights only |
| Categories auto-created | No separate category API needed |
| Soft delete on records | Preserves audit trail |
| Refresh token hashed in DB | Security best practice |
| MySQL not MongoDB | DECIMAL precision required for money |
