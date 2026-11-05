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
   - Node.js v18+ or v22+ installed on your computer (`node -v`).

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
   EXPO_PUBLIC_API_URL=http://192.168.1.43:5000
   ```
   *(Note: The app is pre-configured with fallback to `http://192.168.1.43:5000` in `app/src/constants/config.js`)*.

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

The mobile app includes 22 native screens organized under Bottom Tab Navigation and Native Stack Navigation. Here is how to test each module:

### A. Authentication (Login & Registration)
1. **Registration**:
   - Tap **"Register Now"** on the Login screen.
   - Choose your role: **Farmer**, **Equipment Owner**, or **Crop Buyer**.
   - Fill in Name, 10-digit Phone, Password, and Village/District.
   - Tap **"Create Account"** → Receive confirmation alert → Redirects to Login.
2. **Login**:
   - Enter your registered phone number and password.
   - Tap **"Log In to AgriSpine"**.
   - Session JWT token is securely saved in `expo-secure-store`. The app auto-logs in on future app launches.

---

### B. Dashboard (Home Hub)
- **Top Header**: Shows user greeting, role badge, village location, and unread notifications icon button.
- **Live Weather Card**: Displays current temperature, weather conditions, humidity, wind, and Kharif agronomy tips.
- **Quick Actions**: 4 shortcut cards to jump to Add Crop, Rent Machine, Mandi Rates, or GramSathi AI.
- **My Farm Crops**: Displays active crop cards with flowering stage status and financial overview.
- **Machinery Rental Preview**: Quick browse cards for tractors, harvesters, etc.
- **Buyer Wholesale Market**: Produce demand listings with verified buyers.
- **Live Mandi Rates**: Warangal APMC modal price ticker.
- **Government Schemes**: PM-Kisan Samman Nidhi and subsidy cards.

---

### C. My Crops (Crop Lifecycle & Expense Management)
1. Tap the **My Crops** tab in the bottom bar.
2. View **Active** and **Harvested** crops tabs.
3. Tap **"+ Add Crop"**:
   - Enter Crop Name (e.g. Cotton, Paddy), Variety, Sowing Date, Acreage, and Season.
   - Select or type Region suggestions.
   - Tap **"Save Crop"**.
4. Tap any Crop card to open **Crop Details**:
   - **Financial Summary**: Total expenses, estimated yield, revenue, net profit.
   - **Expense Tracker**: Tap **"+ Add"** to log seeds, fertilizer, labor, or machinery expenses. Delete expenses with real-time recalculation.
   - **Buyer Marketplace Toggle**: Toggle **"List on Buyer Market"** to expose harvested produce to buyers in the Buyer Market.
   - **Sell / Harvest Produce**: Open the Sell modal to record sold quantity and revenue.

---

### D. Machinery Rental & Equipment Fleet
1. Tap the **Rent Machine** tab in the bottom bar.
2. **Browse Equipment**:
   - Category filter carousel (All, Tractor, Harvester, Rotavator, Drone, JCB, Rice Planter, etc.).
   - Search by machine name, model, or location.
   - Equipment cards show rental rate, owner name, ratings, and location.
3. **Machine Details**:
   - Tap any machine card to view detailed specifications, owner contact, and verified farmer reviews.
   - View **Task-Specific Rates** (e.g. Plowing ₹1,200/acre, Harrowing ₹900/acre).
4. **Book Machine**:
   - Tap **"Book This Machine"**.
   - Select task/service, start date, end date, and estimated duration.
   - Review live calculated estimated total.
   - Tap **"Confirm Booking Request"**.
5. **My Bookings & Owner Requests**:
   - Tap **"My Bookings"** in the top-right header of Rent Machine.
   - **Renter Tab**: View your outgoing bookings (Pending, Accepted, In-Progress, Completed). Cancel or leave a star rating review.
   - **Owner Requests Tab**: If you own machinery, accept or reject incoming booking requests.
6. **Owner Fleet Management**:
   - Tap **"My Fleet"** in the top header.
   - View your listed machines, toggle availability switch (Available / Busy).
   - Tap **"+ List Equipment"** to add a new tractor, harvester, or implement.
   - Tap **"Manage Tasks & Schedule"** to add custom task rates (e.g. Tilling ₹1,500/day) and inspect the booked dates calendar.

---

### E. Buyer Produce Market
1. Open from the Dashboard **"Buyer Market"** card or More menu.
2. Browse fresh crops listed directly by local farmers with crop variety, quantity available, and expected price per quintal.
3. Tap **"Call Seller"** to open your phone's native dialer with the farmer's phone number.
4. Tap **"Chat"** to start a direct message thread in Village Chat.

---

### F. Farmer Community
1. Tap the **Community** tab in the bottom bar.
2. Scroll through posts shared by fellow farmers across Telangana and India.
3. Tap the **Heart icon** to like/unlike posts in real time.
4. Tap the **Comment icon** to open the discussion modal and post replies.
5. Tap **"+ Share Post"**:
   - Write your query, harvest achievement, or pest inquiry.
   - Tap **"Add Photos"** to pick multiple images from your phone's gallery using `expo-image-picker`.
   - Tap **"Post to Community"**.
6. Tap the flag icon on any post to submit a moderation report.

---

### G. Village Chat (Real-Time Socket.IO)
1. Open Village Chat from the Community header chat icon or from any Seller/Farmer profile.
2. View **Conversations List** with farmer names, avatar badges, last message previews, and unread counts.
3. Tap **"+ New Chat"** to search any farmer in the database by name or village and start a chat.
4. Open a conversation to enter the **Real-Time Chat Screen**:
   - Powered by **Socket.IO**: Messages sent and received instantly without manual refresh.
   - Read receipts (double checkmarks) update in real time.
   - Tap the camera icon to pick and send image attachments.
   - Long press or tap delete on your own messages to recall them across both devices.

---

### H. Cooperative Labor Workgroups (Srama Shakthi)
1. Open **"Workgroups"** from Dashboard or Profile.
2. View joined farming cooperatives with your personal net labor balance (Days Given vs Days Received).
3. Tap **"+ Create Group"** to set up a new cooperative team with daily labor wage rates.
4. Tap any group to open **Group Details**:
   - **Work Logs Feed**: View who worked on whose farm and for how many hours/days.
   - **Members List**: View group members and their contact numbers.
   - **Financial Settlements**: View ledger balances and log cash/crop settlements.
   - Tap **"+ Log Work"** to record mutual labor exchange.

---

### I. Weather Forecast & AI Advisory
1. Open **Weather** from the Dashboard weather card.
2. View live temperature, humidity, wind speed, pressure, and cloudiness.
3. Read the **AI Crop Advisory**: Guidance for chemical spraying suitability and irrigation recommendations.
4. Review the **5-Day Agricultural Weather Forecast** cards with rain probabilities and wind trends.

---

### J. Live Mandi Rates
1. Open **Mandi Rates** from the Dashboard or Quick Actions.
2. Search by commodity (Cotton, Paddy, Red Gram, Turmeric, Maize, Chilli, etc.).
3. Filter by market yard (Warangal, Khammam, Nizamabad, Suryapet, Adilabad).
4. Inspect Min Price, Max Price, and **Modal Price** per Quintal with daily trend indicators (+₹50, -₹20).

---

### K. Government Schemes
1. Open **Government Schemes** from the Dashboard card.
2. Filter by category (All, Subsidies, Insurance, Financial Support, Irrigation).
3. Tap **"View Scheme Details"** to view financial benefits, eligibility criteria, and required documents.
4. Tap **"Apply on Official Portal"** to open the external DBT portal in your phone's mobile browser.

---

### L. GramSathi AI Farming Assistant
1. Open **GramSathi AI** from the Dashboard or Quick Actions.
2. Tap any suggestion chip (e.g., *"How to control pink bollworm in cotton?"*, *"Best fertilizer dose for paddy?"*).
3. Type custom agronomy questions in English or Hinglish/Telugu transliteration.
4. Receives intelligent, structured farming advice cards.
5. Tap **"New Chat"** to clear and start a fresh session.

---

### M. In-App Notifications
1. Tap the **Bell icon** in the top-right header of the Dashboard.
2. View booking requests, machine approvals, chat alerts, and community replies.
3. Tap **"Mark All Read"** or tap any notification to navigate directly to the relevant screen.

---

### N. Farmer Profile & Farm Settings
1. Tap the **Profile** tab in the bottom bar.
2. View user details, role badge, phone number, village, and district.
3. View **Farming Details**: Total farm size, primary crops grown, irrigation type.
4. View **Farm Analytics**: Active crops count, machinery owned, community posts count.
5. Tap **"Edit Profile"** to update name, village, farm size, or soil type.
6. Tap **"Logout"** to securely log out and clear stored tokens.

---

## 7. Troubleshooting & FAQ

| Issue | Cause & Solution |
| :--- | :--- |
| **"Network request failed" or "Unable to reach backend"** | 1. Phone and PC are not on the same Wi-Fi.<br>2. Windows Firewall is blocking port 5000. Open Windows Defender Firewall and allow Node.js, or run in PowerShell (Admin):<br>`netsh advfirewall firewall add rule name="Node 5000" dir=in action=allow protocol=TCP localport=5000`<br>3. Check if your PC's IP changed (`ipconfig`). Update `app/.env` and `app/src/constants/config.js` accordingly. |
| **"Socket.IO connection failed"** | Verify that `backend/index.js` is running on port 5000. Mobile automatically connects using the URL configured in `app/src/constants/config.js`. |
| **Expo Go shows a red error screen or Metro cache issue** | Stop the Expo terminal (`Ctrl + C`) and restart with cache reset:<br>`npx expo start -c` |
| **Images not loading or image picker permissions** | `expo-image-picker` prompts for Android gallery permissions on first use. Tap **Allow** when the Android permission dialog appears. |
