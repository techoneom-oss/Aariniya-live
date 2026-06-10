# Aariniya wellness brand platform expansion context

## Technical Stack
- **Backend**: Node.js, Express, SQLite (sqlite3)
- **Frontend**: React, Vite, Lucide-React for icons
- **Database**: SQLite database file at `backend/aariniya.db`
- **Port Configurations**: Express server runs on port 5000, Vite frontend runs on dev server (usually 5173).

## Key Files to Edit/Create
- `backend/database.js` — SQLite database initialization
- `backend/server.js` — API router, authorization, payment verify, receipts generator
- `frontend/src/pages/AdminDashboard.jsx` (New) — Secure admin views and inventory editor
- `frontend/src/pages/Profile.jsx` — Profiles
- `frontend/src/components/Navbar.jsx` — Navigation bar with admin dashboard route
- `frontend/src/App.jsx` — Route dispatcher
- `backend/tests/integration.js` (New) — Integration tests for checkout, receipts, admin auth
- `backend/package.json` — Add npm run test:integration
- `PROJECT.md` — Global workspace structure and layouts
