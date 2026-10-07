# Project Management System (Web + Mobile)

A full-stack project management application with a shared Express REST API, Next.js web application, and React Native (Expo) mobile client for Android.

## Repository Structure

```
tasks/
├── backend/          # Node.js + Express + TypeScript + pg (Neon PostgreSQL)
├── web/              # Next.js 14 + TypeScript + Tailwind CSS
├── mobile/           # React Native + Expo + TypeScript + SecureStore
├── docs/             # Documentation and diagrams
└── README.md
```

---

## 1. Backend Setup

### Prerequisites
- Node.js >= 18
- PostgreSQL / Neon database connection

### Instructions
1. Navigate to `backend`:
   ```bash
   cd backend
   npm install
   ```
2. Configure `.env`:
   ```bash
   PORT=5001
   NODE_ENV=development
   DATABASE_URL="your-postgresql-connection-string"
   JWT_SECRET="your-jwt-secret-key-at-least-8-chars"
   JWT_EXPIRES_IN="7d"
   CORS_ORIGIN="http://localhost:3000"
   ```
3. Initialize PostgreSQL tables, enums, and indexes:
   ```bash
   npm run db:init
   ```
4. Build & start:
   ```bash
   npm run build
   node dist/server.js
   # Or for development: npm run dev
   ```

---

## 2. Web Frontend Setup

### Prerequisites
- Backend running on `http://localhost:5001`

### Instructions
1. Navigate to `web`:
   ```bash
   cd web
   npm install
   ```
2. Configure `.env.local`:
   ```bash
   NEXT_PUBLIC_API_URL=http://localhost:5001/api
   ```
3. Build & start:
   ```bash
   npm run build
   npm run dev
   ```
4. Access web app at: `http://localhost:3000`

---

## 3. Mobile App Setup (Android / Expo)

### Prerequisites
- Expo CLI (`npx expo`)
- Android Studio with an Android Virtual Device (AVD), or a physical Android phone with Expo Go

### Environment Configuration
Configure `mobile/.env`:
- **Android Emulator**:
  ```bash
  EXPO_PUBLIC_API_URL=http://10.0.2.2:5001/api
  ```
  *(10.0.2.2 is the Android emulator's alias to your Mac host's `localhost`)*
- **Physical Android Device** (via Expo Go on same Wi-Fi):
  ```bash
  EXPO_PUBLIC_API_URL=http://<YOUR_MAC_LAN_IP>:5001/api
  ```

### Run the App
```bash
cd mobile
npm install
npx expo start
```
- Press **`a`** to open directly on your running Android Emulator.
- Or scan the QR code with the **Expo Go** app on your physical Android device.

---

## 4. Generating an Android APK

You can build an installable APK without paid services:

### Method A: EAS Build (Cloud — Free Tier)
1. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   ```
2. Log in with your free Expo account:
   ```bash
   eas login
   ```
3. Run the preview APK build (configured in `eas.json`):
   ```bash
   cd mobile
   eas build --platform android --profile preview
   ```
   This generates a direct link to download the `.apk` file for installation on any Android device.

### Method B: Local Android Build
```bash
cd mobile
npx expo prebuild --platform android
cd android && ./gradlew assembleRelease
# APK generated at: android/app/build/outputs/apk/release/app-release.apk
```

---

## 5. Cross-Platform Verification (Assessment Demo)

Both Web and Mobile talk to the identical PostgreSQL database via the same REST backend on port 5001:

1. **Register** a new account on Web (`http://localhost:3000/register`).
2. **Log in** with the same account on the Mobile app.
3. **Create a project** on Web → Pull-to-refresh on Mobile → the project immediately appears.
4. **Create a task** on Mobile under that project → Refresh Web → the task appears.
5. **Mark task completed** on Web → Pull-to-refresh on Mobile → status updates to `COMPLETED`.
6. **Log out** on either platform → SecureStore token is discarded and user is redirected to Login.
