# TaskPulse — Offline-First To-Do & Habits PWA 📱

A modern, fast, mobile-first **Progressive Web App (PWA)** built with **React + Vite + Tailwind CSS**. All your tasks, habits, and notes are saved **100% locally on your phone storage** (`localStorage`), meaning it operates completely offline without needing any cloud accounts, internet connection, or backend servers.

---

## 🌟 Key Features

- 📱 **PWA (Progressive Web App)**: Installable on iOS (Safari) and Android (Chrome) as a full-screen, native-feeling app.
- 💾 **Phone-Only Storage**: Stored securely on your device. Zero external tracking or accounts.
- ⚡ **Offline-Ready**: Full offline caching via Workbox Service Worker (`sw.js`).
- 🎯 **Smart Task Scheduling**:
  - Quick due date presets: *Today*, *Tomorrow*, *+1 Week*, or custom date.
  - Recurrence engine: Automatically schedules the next occurrence for *Daily*, *Weekdays*, *Weekly*, or *Monthly* routines.
  - Priority flags (Urgent 🔥, Medium, Low).
- 🏷️ **Categories / Tags**: Personal, Work, Study, Health, Errands.
- 🔒 **Privacy App PIN Lock**: Optional 4-digit PIN lock screen to keep private notes and tasks secure.
- 📊 **Daily Momentum & Progress Bar**: Visual radial progress and completion percentage.
- 🔍 **Real-Time Search & Filters**: Filter by *All*, *Today*, *Upcoming*, *Urgent*, or *Done*.
- 💾 **Backup & Restore**: Export your data to a `.json` file anytime and restore it on any phone or computer.
- 🎉 **Celebratory Confetti**: Instant micro-reward animation on completing tasks.

---

## 🚀 How to Run & Test

### 1. Start the Dev Server
```bash
npm run dev
```

### 2. Open on Your Phone (Same Wi-Fi)
To test and install the PWA directly on your phone:
```bash
npm run dev -- --host
```
Vite will output a Network URL (e.g., `http://192.168.x.x:5173`). Open that URL in your mobile browser:
- **On Android (Chrome)**: Tap the **"Install"** button on the banner, or tap the three dots `⋮` → **Install app**.
- **On iPhone (Safari)**: Tap the **Share** button `⎋` in the bottom bar → scroll down and tap **Add to Home Screen** `⊞`.

### 3. Production Build
```bash
npm run build
npm run preview
```

