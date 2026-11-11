# AgriSpine Web Application (`frontend/`)

React 19 + Vite SPA serving Farmers, Machinery Providers, and Commodity Buyers on desktop and mobile browsers.

## Tech Stack
- **Framework**: React 19 (`^19.2.0`) + Vite 7 (`^7.2.4`)
- **Routing**: `react-router-dom` v7 (`src/App.jsx`)
- **Styling**: Tailwind CSS (`tailwind.config.js`) with Dark Mode (`ThemeContext.jsx`)
- **Networking**: Axios (`src/utils/api.js` with `auth-token` injection, 25s timeout, 401 draft preservation) + Socket.IO Client (`src/utils/socket.js`)
- **Localization (i18n)**: `i18next` + `react-i18next` supporting `en`, `hi`, and `te` (`public/locales/{en,hi,te}/translation.json`)
- **Charts & Exports**: Recharts, `jspdf` / `jspdf-autotable`, `xlsx`

## Environment Variables (`frontend/.env`)
```env
VITE_API_BASE_URL=http://localhost:5000
VITE_WEATHER_API_KEY=your_openweathermap_api_key
```
*(Note: `VITE_API_BASE_URL` defaults to `http://localhost:5000` in `src/utils/api.js`; `VITE_WEATHER_API_KEY` falls back to a configured key in `src/pages/core/Weather.jsx` if unset.)*

## Scripts
```bash
npm install
npm run dev      # Starts Vite dev server at http://localhost:5173
npm run build    # Builds production bundle into dist/
npm run lint     # Runs ESLint across src/
npm run preview  # Previews the production build locally
```

## Key Standards & Guidelines
- UI/UX compliance must follow `../docs/UX_STANDARDS.md` using reusable primitives in `src/components/ui/`.
- Translation dictionaries are synchronized with mobile (`../app/src/i18n/translations/`) via `../scripts/i18n-tool.js`.
