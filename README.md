# OTP Authenticator

A fully-featured, **no-account, no-server** OTP Authenticator browser extension built with React + Vite. Supports TOTP and HOTP with multiple secret encodings, configurable digit lengths, and a polished dark/light UI — all data stays local on your device.

---

## ✨ Features

### Core OTP
- **TOTP** (Time-based, RFC 6238) and **HOTP** (Counter-based, RFC 4226)
- Algorithms: **SHA1 / SHA256 / SHA512**
- Digits: **4 / 6 / 8**
- TOTP periods: **15 / 30 / 60 / 90 / 120 seconds**
- Secret encodings: **Base32, Base64, HEX, Auto-detect**

### Dashboard
- **Click any account card to copy the OTP** → clipboard + "Copied!" toast (both TOTP and HOTP)
- Live countdown ring per TOTP entry (blue → amber → red as time runs out)
- HOTP counter ring (solid circle) showing current counter value, left of the 3-dot menu
- HOTP **Next** button inline with the OTP code to manually increment the counter before copying
- Per-entry 3-dot menu: **Show account / Copy OTP / Favourite / Move to top / Edit / Delete**
- Global 3-line menu: **Select / Reorder / Settings / About**
- Menus close reliably on any click outside (fixed full-viewport overlay)
- Favourite ⭐ shown left of the ring in the right-side controls row; clicking favourite/unfavourite does NOT navigate
- Real-time search filter (issuer + account); no results shows clean text only
- Favourites pinned to top; filter by favourites with the ⭐ header button
- Show / Hide OTP toggle (masks all codes with `• • •`)

### Entry Management
- **Add form** with URI import and live OTP preview while typing the secret
- **Edit form** locks the type (TOTP/HOTP) — only shows options relevant to the existing account type
- Advanced options: Encoding, Algorithm, Digits (4/6/8), Period (TOTP) or Initial counter (HOTP)
- Drag-and-drop **Reorder** view (per tab)
- **Select mode** for bulk delete (long-press to activate)
- Grammar-correct confirmation dialogs ("Delete 1 account?" vs "Delete 2 accounts?")

### Account Detail Page
- OTP code and progress ring (TOTP) or counter ring (HOTP) shown **side-by-side**
- **Hide / Copy / Next** action buttons with equal height
- Edit and Delete buttons **sticky at the bottom** regardless of scroll position
- Favourite toggle in the header (star icon)

### Import / Export
- **Export** all accounts as a JSON backup file or copy as `otpauth://` URIs
- **Import** by:
  - Uploading a JSON or text file (new file-picker button)
  - Pasting JSON or `otpauth://` URIs directly

### Settings
- **Theme**: Light / Dark / System
- **New account defaults**: Algorithm, Digits, Period
- **Security**:
  - Master password (set / change / remove) — protects the app with SHA-256 hashed password
  - **Auto-lock after**: Never / 1 min / 5 min / 15 min / 30 min / 1 hour (resets on any interaction)
- **Data**:
  - Delete all accounts (keeps settings)
  - Reset settings to defaults (keeps accounts)

---

## 🏗️ Tech Stack

| Layer       | Technology                         |
|-------------|------------------------------------|
| Framework   | React 19                           |
| Build Tool  | Vite 8                             |
| Extension   | Chrome Manifest V3                 |
| State       | Zustand                            |
| Crypto      | Web Crypto API (`SubtleCrypto`)    |
| Storage     | `chrome.storage.local`             |
| Styling     | Vanilla CSS (design tokens)        |
| Font        | Inter (`@fontsource/inter`)        |

No external OTP libraries — TOTP/HOTP implemented from scratch using the native Web Crypto API.

---

## 📁 Project Structure

```
src/
├── popup/
│   ├── App.tsx               # Composition root: data load, theme, auto-lock, routing only
│   ├── main.tsx               # React root mount + font imports
│   ├── components/            # Reusable, presentational building blocks
│   │   ├── Icons.tsx, AppLogo.tsx, Avatar.tsx, Rings.tsx, OtpCode.tsx
│   │   ├── primitives.tsx     # Header, Confirm, Field, PwInput, TextInput, FSelect, ...
│   │   ├── AccountCard.tsx, TabBar.tsx, EmptyState.tsx, Toast.tsx
│   ├── hooks/
│   │   └── useOtpData.ts      # Per-entry OTP code + period/counter countdown, keyed by id
│   └── views/                 # One file per screen
│       ├── LockScreen.tsx, MainList.tsx, EntryDetail.tsx, AddEditEntry.tsx, Reorder.tsx, About.tsx
│       └── settings/
│           ├── Settings.tsx, MasterPasswordPanel.tsx, ImportExportPanel.tsx
├── store/
│   ├── entriesStore.ts        # Zustand: accounts CRUD, select mode, filtering
│   ├── settingsStore.ts       # Zustand: theme, defaults, auto-lock
│   ├── authStore.ts           # Zustand: master password + lock state (fail-safe: locked by default)
│   └── navigationStore.ts     # Zustand: view stack (list/detail/add/edit/reorder/settings/about)
├── lib/
│   ├── otp.ts                 # TOTP + HOTP engine (RFC 4226/6238)
│   ├── cryptoUtils.ts          # HMAC-SHA1/256/512 via SubtleCrypto
│   ├── secretDecoder.ts        # Base32 / Base64 / HEX decoder
│   ├── storage.ts              # chrome.storage.local ↔ localStorage wrapper (isolated keys per domain)
│   ├── hash.ts                 # SHA-256 helper for master-password hashing
│   ├── importParser.ts         # Pure parser for JSON/otpauth import text (used to validate + import)
│   └── otpauthUri.ts           # otpauth:// URI parser + builder
├── styles/
│   └── global.css              # CSS design tokens (light/dark), animations, app-frame
└── types/
    └── index.ts                 # Shared TypeScript interfaces
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Chrome or Edge (any Chromium-based browser)

### Development

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev
```

In dev mode the app runs in a browser tab with `localStorage` as a fallback — all features work identically to the extension popup.

### Build & Load as Extension

```bash
# Build the extension
npm run build
```

1. Open Chrome → `chrome://extensions`
2. Enable **Developer mode** (toggle, top-right)
3. Click **Load unpacked**
4. Select the `dist/` folder
5. The OTP Authenticator icon appears in your toolbar 🎉

---

## 🔐 Security Notes

- **All data is stored locally** in `chrome.storage.local` — nothing is ever sent to a server
- Secrets are stored in plain text locally (standard for authenticator apps; matches Google Authenticator behaviour)
- The **master password** hash (SHA-256) is stored in `chrome.storage.local` (its own isolated key) and never leaves the device
- JSON exports are **unencrypted** — store backup files securely
- The extension requires only `storage` and `clipboardWrite` permissions

---

## 📋 OTP RFC Test Vectors

You can verify the OTP engine with these known RFC test vectors:

### TOTP (RFC 6238)

| Secret (Base32)      | Algorithm | Digits | Period | Expected          |
|----------------------|-----------|--------|--------|-------------------|
| `JBSWY3DPEHPK3PXP`   | SHA1      | 6      | 30     | Changes every 30s |
| `JBSWY3DPEHPK3PXP`   | SHA256    | 6      | 30     | Changes every 30s |

### HOTP (RFC 4226)

Secret = `12345678901234567890` in ASCII → HEX `3132333435363738393031323334353637383930`:

| Counter | Expected (6 digits) |
|---------|---------------------|
| 0       | `755224`            |
| 1       | `287082`            |
| 2       | `359152`            |

---

## 📄 License

For personal use. Not affiliated with any OTP standards body.
