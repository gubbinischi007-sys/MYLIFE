# MYLIFE — Personal, College, Tasks & Money Tracker 📱

A modern, fast, mobile-first **Progressive Web App (PWA)** built with **React 19 + Vite 6 + Tailwind CSS v4 + SQLite**. 

All your tasks, college exams, assignments, finances, notes, and passwords are saved to a durable local **SQLite Database** (`data/mylife.db`) with automatic local browser cache fallback. Your data is stored on disk with ACID transactions, WAL mode, and zero external tracking.

---

## 🌟 Key Features

- 🗄️ **Durable SQLite Database**: Persists all records into an ACID-compliant local SQL file (`data/mylife.db`). Data is safe across reboots, port changes, and device restarts.
- 📱 **PWA (Progressive Web App)**: Installable on iOS (Safari) and Android (Chrome) as a full-screen, native-feeling app.
- 🔄 **Cross-Device Shared Storage**: Any device on your local Wi-Fi (phone, laptop, tablet) connects to the same SQLite database via `--host`.
- ⚡ **Offline Resilience**: Automatically caches data locally in browser storage so the app opens instantly even when disconnected.
- 🧾 **AI Receipt Scanner**: Powered by Google Gemini Vision (`gemini-2.0-flash`), reads paper bills and parses grand total, merchant, category, and line items.
- 🔒 **Encrypted Password Vault & App PIN Lock**: Optional 4-digit PIN lock screen and master-password protected vault.
- 💰 **Money & Budgeting**: Expense & income tracker, daily allowance calculator, 6-month spending chart, and category budget limits.
- 🎓 **College Hub**: Track upcoming exams with urgency countdowns and coursework assignments.
- 🔍 **Spotlight Search (`Cmd+K`)**: Global search across tasks, notes, passwords, exams, and expenses.
- 💾 **Backup & Restore**: Export your data to a `.json` file anytime and restore it easily.

---

## 🚀 How to Run & Test

### 1. Start the App (Vite + Integrated SQLite API)
```bash
npm run dev
```
The Vite development server automatically launches the built-in SQLite database engine on `http://localhost:5173`.

### 2. Open on Your Phone (Same Wi-Fi)
To access and share the same SQLite database on your phone:
```bash
npm run dev -- --host
```
Vite will output a Network URL (e.g., `http://192.168.x.x:5173`). Open that URL in your mobile browser:
- **On Android (Chrome)**: Tap the **"Install"** button on the banner, or tap `⋮` → **Install app**.
- **On iPhone (Safari)**: Tap the **Share** button `⎋` in the bottom bar → scroll down and tap **Add to Home Screen** `⊞`.

### 3. Production Server
To run the production Node.js server with SQLite:
```bash
npm run build
npm run server
```
