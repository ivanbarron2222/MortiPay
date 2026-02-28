# User Mobile App (Demo) Setup

## 1) Run shared demo API + web app

1. Install dependencies:
   - `npm install`
2. Start API + app:
   - `npm run dev:all`
3. API runs on:
   - `http://localhost:3001`
4. Frontend runs on:
   - `http://localhost:5173`

For phone testing on same Wi-Fi:
- Frontend: `http://<your-laptop-ip>:5173`
- API: `http://<your-laptop-ip>:3001`

Set this in `.env` before launching:
- `VITE_API_BASE_URL=http://<your-laptop-ip>:3001`

## 2) Build user-only app mode

Set:
- `VITE_USER_APP_ONLY=true`

In this mode:
- `/admin` route is not registered.
- Login routes all users to `/user`.

## 3) Capacitor packaging (Android/iOS)

Install:
- `npm i @capacitor/core @capacitor/cli`
- `npm i -D @capacitor/android @capacitor/ios`

Initialize:
- `npx cap init "Morti Pay" "ph.mortipay.user" --web-dir=dist`

Build and sync:
- `npm run build`
- `npx cap add android`
- `npx cap sync android`
- `npx cap open android`

For iOS (macOS only):
- `npx cap add ios`
- `npx cap sync ios`
- `npx cap open ios`
