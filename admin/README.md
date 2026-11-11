# AgriSpine SuperAdmin Portal (`admin/`)

Independent React 19 + Vite 8 management portal for AgriSpine platform administrators.

## Tech Stack
- **Framework**: React 19 (`^19.2.6`) + Vite 8 (`^8.0.12`)
- **Routing**: `react-router-dom` v7 (`src/App.jsx`)
- **Styling**: Tailwind CSS (`^3.4.19`)
- **HTTP Client**: Axios (`src/utils/api.js`, injects `admin-token` and `Authorization: Bearer ...` from `localStorage.getItem("admin-token")`)

## Environment Variables (`admin/.env`)
```env
VITE_API_BASE_URL=http://localhost:5000
```

## Scripts
```bash
npm install
npm run dev      # Starts Vite dev server on http://localhost:5174 (configured in vite.config.js)
npm run build    # Builds production bundle into dist/
npm run lint     # Runs ESLint
npm run preview  # Previews the production build
```

## Implemented Modules
- **Authentication**: `/`, `/login`, `/register`
- **Dashboard (`/dashboard`)**: System overview + Data Seeding (`POST /admin/seed`)
- **Government Schemes (`/schemes`)**: Full CRUD (`GET/POST/PUT/DELETE /admin/schemes`)
- **APMC Mandi Rates (`/mandi-rates`)**: Full CRUD (`GET/POST/PUT/DELETE /admin/mandi-rates`)
- **Community Moderation (`/moderation`)**: Review reported posts, update report statuses, dismiss or remove posts (`/admin/reports*`)
- **Planned Placeholder Views**: `/users`, `/groups`, `/polls`, `/announcements`, `/events`
