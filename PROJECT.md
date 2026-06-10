# Project: Aariniya wellness brand platform expansion

## Architecture
- **Backend (Express + SQLite)**:
  - Database layout at `backend/database.js` managing users, products, courses, reviews, and orders tables.
  - Server endpoints in `backend/server.js`.
  - Email receipts written to `backend/logs/receipts/`.
- **Frontend (React + Vite)**:
  - Multi-page simulation using State variables (no React Router installed, uses page-routing state in `App.jsx`).
  - Auth token saved in `localStorage.aariniya_token`.
  - User details saved in `localStorage.aariniya_user`.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Database & Backend Core | Add role to users table, add enrollment_status to courses, implement isAdmin middleware and admin endpoints, add receipt generation and stock decrement on order verification | None | DONE |
| 2 | Frontend Admin UI | Create AdminDashboard page, integrate into Navbar and App, update stock/enrollment status via admin view | M1 | IN_PROGRESS |
| 3 | Automated E2E Testing | Create E2E integration test, add npm test:integration, verify user-to-order-to-receipt cycle | M1, M2 | DONE |

## Code Layout
- `backend/`
  - `server.js` — Core API router and business logic
  - `database.js` — DB schema definition and seeding
  - `aariniya.db` — SQLite database file
  - `logs/receipts/` — Transaction receipts folder
  - `tests/` — Integration testing folder
- `frontend/`
  - `src/App.jsx` — Main react page dispatcher
  - `src/components/Navbar.jsx` — Navigation bar
  - `src/pages/AdminDashboard.jsx` — Secure Admin panel
  - `src/pages/Profile.jsx` — Profile and order log listing

## Interface Contracts
### Admin Check Middleware
- **Signature**: `isAdmin(req, res, next)`
- **Role Verification**: Parses `req.user.role` from token payload. If `role !== 'admin'`, returns `403 Forbidden`.

### Admin Dashboard API
- **Endpoint**: `GET /api/admin/dashboard-stats`
- **Request Headers**: `Authorization: Bearer <token>`
- **Response**: `{ revenue: number, orderCount: number, activeOrders: Array }`

### Inventory Management APIs
- **Endpoint**: `PUT /api/admin/products/:id/inventory`
- **Request Headers**: `Authorization: Bearer <token>`
- **Body**: `{ inventory: number }`
- **Response**: `{ message: 'Inventory updated successfully', product: Object }`

- **Endpoint**: `PUT /api/admin/courses/:id/enrollment`
- **Request Headers**: `Authorization: Bearer <token>`
- **Body**: `{ enrollment_status: string }`
- **Response**: `{ message: 'Enrollment status updated successfully', course: Object }`
