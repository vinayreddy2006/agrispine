# AgriSpine Android Mobile App (Expo + React Native) — Setup & Run Guide

This guide walks you through running, testing, and verifying the **AgriSpine Android Mobile Application** on your physical Android phone using **Expo Go** with the existing Node.js + MongoDB backend.

---

## 1. Prerequisites

1. **Android Phone**:
   - Install the official **Expo Go** app from Google Play Store:  
     👉 [Expo Go on Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
2. **Wi-Fi Connection**:
   - **Crucial**: Your Windows PC and Android phone **MUST** be connected to the exact same Wi-Fi network (or connect your PC to your phone's Wi-Fi hotspot).
3. **Node.js**:
   - Node.js v20+ or v22+ installed on your computer (`node -v`).

---

## 2. Windows IP Configuration & Backend API Setup

Because the app runs on a physical device, `localhost` or `127.0.0.1` will not work (they refer to the phone itself). The phone must reach your PC's local network IP address on port `5000`.

### Step A: Find Your Windows Local IPv4 Address
1. Open PowerShell or Command Prompt on your computer.
2. Run:
   ```powershell
   ipconfig
   ```
3. Look for your active Wi-Fi adapter (`Wireless LAN adapter Wi-Fi`):
   ```text
   IPv4 Address. . . . . . . . . . . : 192.168.1.43
   ```
4. Note your IP address (e.g., `192.168.1.43`).

### Step B: Configure the Mobile App API URL
1. Open `app/.env` (or verify `app/src/constants/config.js`).
2. Verify or update `EXPO_PUBLIC_API_URL` to match your PC's IP and backend port `5000`:
   ```env
   EXPO_PUBLIC_API_URL=http://<YOUR_PC_LAN_IP>:5000
   ```
   *(Note: If `EXPO_PUBLIC_API_URL` is unset, `app/src/constants/config.js` falls back to `DEFAULT_LAN_URL = 'http://10.85.213.163:5000'`. Update this to match your current Wi-Fi IPv4 address.)*

---

## 3. Starting the Backend Server

Before testing the mobile app, make sure your AgriSpine backend is running:

1. Open a terminal in the project root:
   ```powershell
   cd backend
   npm run dev
   # or
   node index.js
   ```
2. You will see:
   ```text
   🚀 Server running on port 5000
   ✅ MongoDB Connected
   ```

---

## 4. Starting the Expo Development Server

1. Open a second terminal window in the `app` directory:
   ```powershell
   cd app
   npx expo start
   ```
   *(Optional: If your PC has multiple network adapters, run `npx expo start --host lan`)*
2. Expo will display a large interactive QR code in your terminal along with an Expo DevTools URL.

---

## 5. Opening on Your Android Phone via Expo Go

1. Open the **Expo Go** app on your Android phone.
2. Tap **"Scan QR code"**.
3. Point your camera at the QR code in your Windows terminal.
4. Expo Go will fetch the JavaScript bundle from your computer (`Metro waiting on exp://...`).
5. The AgriSpine mobile app will open on your phone!

---

## 6. Complete Feature-by-Feature Testing Walkthrough

The mobile app (`Expo SDK 58`, React Native `0.88.1`) includes 28 routed screens (2 auth screens in `AuthNavigator.js` + 26 screens in `MainNavigator.js`, backed by 30 files in `app/src/screens/`) organized under Bottom Tab Navigation and Native Stack Navigation.

### A. Authentication (Login & Registration)
1. **Registration**:
   - Tap **"Register Now"** on the Login screen.
   - Choose your role: **Farmer**, **Equipment Owner**, or **Crop Buyer**.
   - Fill in Name, 10-digit Phone, Password, and Village/District.
   - Tap **"Create Account"** → Receive confirmation alert → Redirects to Login.
2. **Login**:
   - Enter your registered phone number and password (or switch app language between English, తెలుగు, and हिन्दी right from the login screen).
   - Tap **"Log In to AgriSpine"**.
   - Session JWT token is securely saved in `expo-secure-store`. The app auto-logs in on future launches.

---

### B. Dashboard (Home Hub)
- **Top Header**: Shows user greeting, role badge, village location, language switcher modal, and unread notifications icon button.
- **Location Confirmation Banner**: Prompts unconfirmed farmers to confirm their farm village/mandal/district using OpenStreetMap Nominatim autocomplete (`LocationConfirmationModal`).
- **Live Weather Card**: Displays current temperature, weather conditions, humidity, wind, pressure, and coordinate-resolved village weather.
- **Quick Actions**: Shortcut cards to jump to Add Crop, Rent Machine, Mandi Rates, Workgroups, Schemes, or GramSathi AI.
- **My Farm Crops**: Displays active crop cards and financial overview.
- **Live Mandi Rates & Schemes**: Quick market rate ticker and government scheme highlights.

---

### C. My Crops (Crop Lifecycle, Expenses & Market Listing)
1. Tap the **My Crops** tab in the bottom bar.
2. View **Active** and **Harvested** crops tabs.
3. Tap **"+ Add Crop"**:
   - Enter Crop Name, Sowing Date, Acreage, and Variety/Season.
   - Tap **"Save Crop"**.
4. Tap any Crop card to open **Crop Details**:
   - **Financial Summary**: Total expenses, estimated yield, revenue, net profit.
   - **Expense Tracker**: Tap **"+ Add"** to log seeds, fertilizer, pesticide, labor, or machinery expenses. Delete expenses with real-time recalculation.
   - **Single-Listing Market Toggle**: Tap **"List on Market"** with expected price per quintal and available quantity (`PUT /crops/market/toggle/:id`). Once listed, a **Listed on Market (`ACTIVE`)** card appears with an **Unlist** action.
   - **Sell / Harvest Produce**: Record sold quantity and revenue (`PUT /crops/sell/:id`), automatically delisting from the marketplace.

---

### D. Machinery Rental, Calendar & Equipment Fleet
1. Tap the **Rent Machine** tab in the bottom bar.
2. **Browse Equipment**:
   - Category filter carousel (`All`, `Tractor`, `Harvester`, `Rotavator`, `Drone`, `JCB`, `Rice Planter`, `Dozer`, `Baler`, `Ridger`) with local artwork fallbacks (`app/assets/machines/`).
   - Search by machine name, model, or location.
3. **Machine Details & Reviews**:
   - Tap any machine card for full specifications, tap-to-expand photo lightbox (`AppImage`), owner contact/chat, verified farmer reviews (`ReviewModal`), and **Task-Specific Rates**.
4. **Book Machine**:
   - Tap **"Book This Machine"**, select task/service, date, and duration, review total cost, and submit (`POST /bookings/book`).
5. **My Bookings, Owner Requests & Machinery Calendar**:
   - Open **My Bookings** or **Machinery Calendar** (`MachineryCalendarScreen.js`) from the Rent Machine header.
   - Inspect monthly booking dots (Pending, Confirmed/Accepted, Completed, Rejected) and switch between **Renter** and **Owner** views.
6. **Owner Fleet Management**:
   - Open **My Fleet** to toggle availability, add new equipment (`POST /machines/add`), or manage custom service tasks (`ManageMachineScreen.js`).

---

### E. Buyer Produce Market
1. Open from the Dashboard **"Buyer Market"** card.
2. Browse active produce listings populated with seller farmer details, crop, quantity available, and expected price per quintal (`GET /crops/market/listings`).
3. Tap **"Call"** to open the native phone dialer or **"Chat"** to open a direct conversation in Village Chat.

---

### F. Farmer Community
1. Tap the **Community** tab in the bottom bar.
2. Filter across 9 aligned categories (`All`, `Crop Management`, `Pest & Disease`, `Irrigation`, `Fertilizers`, `Weather`, `Equipment`, `Market Prices`, `Others`) or toggle between **All Forum** and **My Posts**.
3. Tap any post card to open **Post Details** (`PostDetailsScreen.js`) with inline nested comment replies, optimistic comment/reply submission, and post/comment/reply likes.
4. Tap **"+ Share Post"** (`CreatePostScreen.js`) to pick photos, camera shots, or documents (`POST /community/upload`), and share posts natively via `Share.share` or flag posts via report moderation.

---

### G. Village Chat (Real-Time Socket.IO & Polls)
1. Open Village Chat from the Community header chat icon or from any Farmer/Owner card.
2. View **Conversations List** (including self-chat `"Message Yourself"` notes) and tap **"+ New Chat"** (`GET /auth/search-users?q=...`).
3. Inside **ChatScreen**:
   - Real-time messaging via **Socket.IO** (`receive_message`, `message_deleted`, `message_updated`, `poll_updated`, `messages_read_update`).
   - Send images (Camera/Gallery with media review & crop), documents (`expo-document-picker`), replies with quote preview, stars, emoji reactions, and create/vote on **Village Polls** (`POST /poll/create`).

---

### H. Cooperative Labor Workgroups (Srama Shakthi)
1. Open **"Workgroups"** from Dashboard or Profile.
2. View Personal Labor & Earnings Summary (`GET /api/groups/personal/dashboard`), switch between **My Workgroups** and **Admin Dashboard**, and filter by role (`All`, `Owner`, `Admin`, `Member`).
3. Tap **"+ Create Group"** to set up a cooperative team (`POST /api/groups`).
4. Inside **Group Details**:
   - **Member View**: `Overview`, `Work Records`, `Settlements`, `Members`.
   - **Admin View**: Record daily work (`POST /api/groups/:id/work`), manage registered/offline members, promote/demote roles, process net/selective settlements (`POST /api/groups/:id/settlements`), transfer ownership, or close/delete group.

---

### I. Weather Forecast & AI Advisory
1. Open **Weather** from the Dashboard weather card.
2. Displays coordinate-based hyperlocal weather (Magnus-Tetens dew point, 16-point wind direction, sunrise/sunset, 24–48h timeline) and **Agricultural Field Operations Advisory** (`POST /api/ai/weather-recommendations`) covering Spraying, Irrigation, Harvesting, and Field Work.
3. Search locations dynamically using OpenStreetMap Nominatim autocomplete without overwriting your saved farm profile.

---

### J. Live Mandi Rates
1. Open **Mandi Rates** from the Dashboard or Quick Actions.
2. Search by commodity and filter by market yard to view Min, Max, and Modal prices per Quintal (`GET /admin/mandi-rates`).

---

### K. Government Schemes
1. Open **Government Schemes** from the Dashboard card (`GET /admin/schemes`).
2. Filter by category, view benefits/eligibility details, and launch external application portals.

---

### L. GramSathi AI Farming Assistant (Voice + Human-in-the-Loop)
1. Open **GramSathi AI** from the Dashboard or Quick Actions.
2. Ensure both the **Backend (`port 5000`)** and **AI FastAPI (`port 8000`)** servers are running.
3. **Chat History Drawer**: Swipe or tap the sidebar menu for a sliding dark-green drawer to start new consultations, switch sessions, rename (`PUT /api/ai/chats/:id`), or delete (`DELETE /api/ai/chats/:id`).
4. **Voice Input & Speech Output**:
   - Tap the microphone to record natively using `expo-audio` (`app/src/utils/audioRecorder.js`).
   - Audio is transcribed via `POST /api/ai/transcribe` (Groq Whisper `whisper-large-v3` with Google fallback) into Telugu, Hindi, or English and can be reviewed or sent.
   - AI responses support voice queries with automatic TTS playback via `expo-speech` (`te-IN`, `hi-IN`, `en-IN`) plus per-message Listen/Stop buttons.
5. **Human-in-the-Loop Confirmation Cards**:
   - Whenever GramSathi AI detects a data-modifying request (adding a crop, recording an expense, booking machinery, etc.), it asks targeted clarification questions for any missing mandatory details across turns.
   - Once complete, it displays an interactive **Confirmation Card** with **`[Confirm]`**, **`[Edit]`**, and **`[Cancel]`** buttons (`POST /api/ai/actions/confirm` and `/cancel`) — never modifying database records until you confirm.

---

### M. In-App Notifications
1. Tap the **Bell icon** in the Dashboard header (`GET /api/notifications`).
2. View group additions, work log alerts, and settlement receipts, and tap **"Mark All Read"** (`PUT /api/notifications/mark-all-read`).

---

### N. Farmer Profile, Location & Language Settings
1. Tap the **Profile** tab in the bottom bar.
2. Edit personal & farming details (`PUT /auth/updateprofile`), confirm village GPS coordinates (`PUT /auth/confirm-location`), or switch language (`English`, `తెలుగు`, `हिन्दी`) persisted securely in `expo-secure-store`.
3. Tap **"Logout"** to clear stored JWT credentials while preserving your chosen language.

---

## 7. Troubleshooting & FAQ

| Issue | Cause & Solution |
| :--- | :--- |
| **"Network request failed" or "Unable to reach backend"** | 1. Phone and PC are not on the same Wi-Fi.<br>2. Windows Firewall is blocking port 5000. Open Windows Defender Firewall and allow Node.js, or run in PowerShell (Admin):<br>`netsh advfirewall firewall add rule name="Node 5000" dir=in action=allow protocol=TCP localport=5000`<br>3. Check if your PC's IP changed (`ipconfig`). Update `app/.env` and `app/src/constants/config.js` accordingly. |
| **"Socket.IO connection failed"** | Verify that `backend/index.js` is running on port 5000. Mobile automatically connects using the URL configured in `app/src/constants/config.js`. |
| **Expo Go shows a red error screen or Metro cache issue** | Stop the Expo terminal (`Ctrl + C`) and restart with cache reset:<br>`npx expo start -c` |
| **Images not loading or image picker permissions** | `expo-image-picker` prompts for Android gallery permissions on first use. Tap **Allow** when the Android permission dialog appears. |
