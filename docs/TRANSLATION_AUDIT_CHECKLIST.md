# AgriSpine Website-Wide Language Translation & Voice Pipeline Audit Checklist

This document tracks the comprehensive audit and verification of internationalization (i18n), multi-language persistence, and the GramSathi AI automatic voice interaction pipeline across the AgriSpine platform.

---

## 1. Supported Languages & Persistence Engine

| Language | Code | Default Dialect / Speech Code | Web Dictionary Path | Mobile Dictionary Path |
| :--- | :--- | :--- | :--- | :--- |
| **English** | `en` | `en-IN` (Indian English) | `frontend/public/locales/en/translation.json` | `app/src/i18n/translations/en.json` |
| **Hindi** (हिन्दी) | `hi` | `hi-IN` (Hindi - India) | `frontend/public/locales/hi/translation.json` | `app/src/i18n/translations/hi.json` |
| **Telugu** (తెలుగు) | `te` | `te-IN` (Telugu - India) | `frontend/public/locales/te/translation.json` | `app/src/i18n/translations/te.json` |

### Persistence Guarantee & Tooling
- **Web Storage Target (`frontend/src/i18n.js`):** `localStorage.getItem('i18nextLng')` with `order: ['localStorage', 'navigator', 'htmlTag']`, `caches: ['localStorage']`.
- **Mobile Storage Target (`app/src/context/I18nContext.js`):** `expo-secure-store` under key `agrispine_selected_language`.
- **Session & Logout Safety:** Web logouts (`handleLogout` in `Dashboard.jsx`, `Profile.jsx`, and `api.js` 401 handler) and mobile logouts explicitly preserve the selected language so switching accounts or logging out never reverts to English.
- **Navigation & Reload Safety:** All routing changes retain the active translation without visual flicker.
- **Automated Parity Tooling:** `scripts/i18n-tool.js` and `scripts/inject_screen_translations.js` synchronize and validate keys across Web and Mobile dictionaries.

---

## 2. Module-By-Module Verification Matrix

| Module / Page | Source File | Status | Translated Elements / Verifications |
| :--- | :--- | :---: | :--- |
| **Global Navigation** | `frontend/src/components/BottomNav.jsx` | Verified | Home, Crops, Market, Community, Workgroups, Profile tabs. |
| **Global Layout & Launcher** | `frontend/src/layouts/AppLayout.jsx` | Verified | Floating "Ask GramSathi" launcher, offline banners. |
| **Offline Banner** | `frontend/src/components/common/OfflineBanner.jsx` | Verified | Offline warning, cached data disclosure, connection restored notice, retry button. |
| **Location Modal** | `frontend/src/components/common/LocationConfirmationModal.jsx` | Verified | Farm location confirmation, GPS detection, village/mandal/district fields, skip & confirm buttons. |
| **Reusable UI States** | `frontend/src/components/ui/` (`EmptyState`, `ErrorState`, `NoSearchResults`, `PermissionDenied`, `SuccessState`, `LoadingState`) | Verified | Standard fallback titles, descriptions, retry actions, clear filter suggestions, permission requirements. Automates fallback string translation via `COMMON_EMPTY_MAP`. |
| **Dashboard** | `frontend/src/pages/core/Dashboard.jsx` & mobile `DashboardScreen.js` | Verified | Welcome greetings, AgriSpine branding, location prompts, active crop badges, area and sowing dates, verified farm badge. |
| **Weather & Advisories** | `frontend/src/pages/core/Weather.jsx` & mobile `WeatherScreen.js` | Verified | Hyperlocal weather observations, spray advisories, 24-48h hourly timelines, day transitions (Today/Tomorrow), metrics (humidity, wind, dew point, pressure, sunrise/sunset). |
| **Quick Actions** | `frontend/src/components/dashboard/QuickActions.jsx` | Verified | Tool titles & descriptions, weather summary, humidity, wind speed, high/low temperatures, full forecast link. |
| **Farmer Profile** | `frontend/src/pages/core/Profile.jsx` & mobile `ProfileScreen.js` | Verified | Tabs (Personal, Farming, Machinery, Analytics, Privacy), experience, farming styles (Conventional, Organic, Mixed), soil types (Black, Red, Alluvial, Clay, Sandy, Loam), irrigation sources, land plot details, bio. |
| **Crop Management** | `frontend/src/pages/crops/MyCrops.jsx`, `CropDetails.jsx` | Verified | Crop statuses (active, harvested, sold), area in acres, total investment, net profit/loss, market listing actions. |
| **Crop Expenses** | `frontend/src/pages/crops/components/ExpenseForm.jsx`, `ExpenseHistory.jsx` | Verified | Expense categories (Fertilizer, Seeds, Pesticides, Labor, Machinery, Other), date, amount, history records. |
| **Rent Machinery & Calendar** | `frontend/src/pages/rent-machinery/RentMachineryWorkspace.jsx`, `BookingCalendar.jsx` & mobile `MachineryCalendarScreen.js`, `MachineDetailsScreen.js` | Verified | Booking calendar, month & weekday headers, schedule details, status filters, machinery categories (Rice Planter, Dozer, Ridger, Tractor, etc.), Farmer Reviews. |
| **Direct Farm Market** | `frontend/src/pages/market/BuyerMarket.jsx` | Verified | Market title, search placeholder, produce quantities, farmer locations, empty states. |
| **APMC Mandi Rates** | `frontend/src/pages/market/MarketPrices.jsx` | Verified | Commodity search, mandi dropdown filter, modal prices, daily price bulletin. |
| **Plant Doctor** | `frontend/src/pages/services/PlantDoctor.jsx` | Verified | Disease detection, upload prompt, confidence rating, severity badge, recommended cures and chemicals. |
| **Government Schemes** | `frontend/src/pages/services/Schemes.jsx` | Verified | Dynamic scheme translations, authority names, benefit amounts, eligibility criteria, apply portals. |
| **Financial Reports** | `frontend/src/pages/services/Reports.jsx` | Verified | Total investment, total revenue, net profit/loss, crop performance chart labels, expense distributions. |
| **Village Chat / Messenger** | `frontend/src/pages/messages/Messenger.jsx`, `Sidebar.jsx`, `ChatWindow.jsx` | Verified | Conversation search, filter chips (All, Unread, Favorites, Groups), end-to-end encryption notice, empty state. |
| **Community Feed** | `frontend/src/pages/community/Community.jsx`, `PostCard.jsx`, `SinglePostModal.jsx`, `CreatePostModal.jsx`, `ReportPostModal.jsx` | Verified | LinkedIn-style interaction bar (Like, Discuss, Share), relative timestamps, comments and nested replies, post creation, moderation reporting. |
| **Srama Shakthi Groups** | `frontend/src/pages/groups/GroupDashboard.jsx` | Verified | Workgroup search, role filters (All, Admin/Owner, Member), Card vs Table view toggles, quick actions. |
| **Authentication** | `frontend/src/pages/auth/Login.jsx`, `Register.jsx` | Verified | Login headers, phone and password inputs, submit actions, redirection preservation. |

---

## 3. GramSathi AI – Dual Input, Voice & Human-in-the-Loop Matrix

| Feature | Implementation Detail | Status |
| :--- | :--- | :---: |
| **Typed Input (Text Only)** | User types query $\rightarrow$ sends via Enter/Send $\rightarrow$ AI displays response in text only. **Does NOT auto-speak**. | Verified |
| **Web Voice Input & TTS** | Web uses browser `SpeechRecognition` (`continuous = false`, `interimResults = true`) $\rightarrow$ auto-submits query $\rightarrow$ **automatically speaks response using `window.speechSynthesis`**. | Verified |
| **Mobile Voice Input & TTS** | Mobile records native `.m4a` via `expo-audio` (`app/src/utils/audioRecorder.js`) $\rightarrow$ `POST /api/ai/transcribe` (Groq Whisper `whisper-large-v3` with Google fallback) $\rightarrow$ populates editable input / submits $\rightarrow$ **speaks via `expo-speech`**. | Verified |
| **Voice Playback Controls** | Every AI response has inline playback controls (Listen / Speaking / Stop on Mobile; Listen / Speaking / Stop / Pause / Resume / Replay on Web). | Verified |
| **Speech Interruption** | Starting a new typed message, tapping microphone, or switching chats immediately invokes `stopSpeaking()` (Web) / `Speech.stop()` (Mobile). | Verified |
| **Lifecycle Safety** | Navigating away or unmounting triggers `speechSynthesis.cancel()` / `Speech.stop()`. | Verified |
| **Dialect Voice Matching** | Matches user's active language: `te-IN` for Telugu, `hi-IN` for Hindi, `en-IN` for Indian English. | Verified |
| **Human-in-the-Loop Cards** | Confirmation card titles, field labels, clarification questions, and Confirm/Edit/Cancel buttons render in `en`, `te`, and `hi` via `ai/core/action_validator.py`. | Verified |
| **Web & Mobile Parity** | `frontend/src/pages/ai/GramSathiFullScreen.jsx` and `app/src/screens/ai/GramSathiScreen.js` share identical confirmation, editing, cancellation, and voice workflows. | Verified |

