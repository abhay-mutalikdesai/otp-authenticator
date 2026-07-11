# OTP Authenticator

> Just tokens, no tracking. A secure TOTP and HOTP authenticator for the privacy conscious.

A fully-featured, **no-account, no-server** OTP Authenticator browser extension built with React + Vite. Supports TOTP and HOTP with multiple secret encodings, configurable digit lengths, and a polished dark/light UI — all data stays local on your device.

---

## ✨ Features

### Core OTP
- **TOTP** (Time-based, RFC 6238) and **HOTP** (Counter-based, RFC 4226)
- Algorithms: **SHA1 / SHA256 / SHA512** (new accounts default to **SHA1 + Base32**, matching Google Authenticator / Microsoft Authenticator)
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
  - If no master password is set, a one-time prompt offers to enable one, with **Remind me later** (24h snooze) and **Don't show again** options
  - **Auto-lock after**: Never / 1 min / 5 min / 15 min / 30 min / 1 hour (resets on any interaction)
  - Closing the popup (e.g. clicking outside the extension) does **not** lock the app by itself — only the auto-lock timer elapsing, locking manually, or closing the browser will lock it; any in-progress screen or unsaved form is restored when reopened
- **Data**:
  - Delete all accounts (keeps settings)
  - Reset settings to defaults (keeps accounts)

### About
- App info (standards, algorithms, storage, crypto, security) at a glance
- **Source code** link to the GitHub repository

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
├── popup/            # React UI layer
│   ├── App.tsx         # Composition root — data load, theme, auto-lock, view routing (key file)
│   ├── main.tsx         # React root mount + font imports (key file)
│   ├── components/      # Reusable, presentational building blocks (icons, cards, rings, form fields, toasts)
│   ├── hooks/            # Shared UI hooks (e.g. live per-entry OTP code + countdown/counter)
│   └── views/             # One screen per file; views/settings/ holds the Settings screen + its sub-panels
├── store/             # Zustand stores — one per concern: accounts, app settings, auth/lock, navigation
├── lib/               # Framework-agnostic core logic: OTP engine, crypto/HMAC, secret decoding,
│                      #   otpauth:// URI parsing, import parsing, and the storage abstraction
├── styles/            # Global CSS design tokens (light/dark), animations, app-frame layout
└── types/             # Shared TypeScript interfaces

manifest.json          # Chrome Manifest V3 config (key file)
vite.config.ts         # Build config + post-build step that copies manifest.json/icons into dist/ (key file)
generate-icons.mjs     # Regenerates public/icons/*.png from public/favicon.svg (key file)
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
