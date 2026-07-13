# OTP Authenticator

> Just tokens, no tracking. A secure TOTP and HOTP authenticator for the privacy conscious.

A fully-featured, **no-account, no-server** OTP Authenticator built with React + Vite. It runs as both a **Browser Extension** and a **Standalone Desktop App (Tauri)**. All data stays strictly local on your device.

---

## ✨ Key Features

- **Core OTP**: Supports TOTP (RFC 6238) and HOTP (RFC 4226) with multiple secret encodings (Base32, Base64, HEX).
- **Cross-Platform**: Runs natively as a Windows desktop application (via Tauri) and as a Chrome/Edge Browser Extension.
- **Data Persistence**:
  - *Desktop*: Saves data securely to your native OS AppData directory.
  - *Extension*: Saves data to `chrome.storage.local`.
- **Security**: Protect the app with a master password (SHA-256 hashed). Unencrypted JSON backup files can be easily imported/exported.
- **CI/CD**: GitHub Actions automatically build Windows `.exe` and `.msi` installers and Chrome `.zip` extensions for every release.

---

## 🏗️ Tech Stack

| Layer       | Technology                         |
|-------------|------------------------------------|
| Framework   | React 19 + Tauri                   |
| Extension   | Chrome Manifest V3                 |
| Desktop API | Rust                               |
| Crypto      | Web Crypto API (`SubtleCrypto`)    |
| Storage     | Multi-adapter (`chrome.storage.local` / Tauri `fs` / `localStorage`) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- [Rust toolchain](https://rustup.rs/) (Required for the Desktop app only)

### Local Development (Web)
```bash
npm install
npm run dev
```

### Desktop App (Tauri)
```bash
# Start the desktop dev server (opens in system tray)
npm run tauri dev

# Compile the final .exe and .msi installers
npm run tauri build
```

### Browser Extension
```bash
# Build the Chrome extension to the dist/ folder
npm run build
```
To load it, go to `chrome://extensions` → **Developer mode** → **Load unpacked** → select `dist/`.

---

## 🔐 Security Notes
- **Local Only**: Nothing is ever sent to a server. 
- **Plain-text Secrets**: Secrets are stored in plain text locally (standard for authenticator apps; matches Google Authenticator behaviour).
- **Permissions**: The extension requires only `storage` and `clipboardWrite` permissions.

---

## 📄 License
For personal use.
