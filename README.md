# OTP Authenticator

> Just tokens, no tracking. A secure TOTP and HOTP authenticator for the privacy conscious.

**Disclaimer:** This app is AI generated and vibe coded.

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

### 🛠️ Local Development

**Web & Extension**
```bash
npm install
npm run dev    # Start web dev server
npm run build  # Build extension to the dist/ folder
```
To load the extension locally, go to `chrome://extensions` (or `edge://extensions`) → **Developer mode** → **Load unpacked** → select the `dist/` folder.

**Desktop App (Tauri)**
```bash
npm run tauri dev    # Start the desktop dev server (opens in system tray)
npm run tauri build  # Compile the final .exe and .msi installers locally
```

### 📦 Releases & Deployment

Automated builds are created via GitHub Actions on new version tags (`v*`) and uploaded to GitHub Releases.

**Browser Extension**
1. Download `otp-authenticator-browser-extension.zip` from the latest release and extract it.
2. Go to `chrome://extensions` (or `edge://extensions`).
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the extracted folder.

**Desktop App (Windows)**
1. Download either `otp-authenticator-windows-exe.zip` or `otp-authenticator-windows-msi.zip` from the latest release.
2. Extract the archive.
3. Run the `.exe` or `.msi` installer to set up the application on your system.

---

## 🔐 Security Notes
- **Local Only**: Nothing is ever sent to a server. 
- **Plain-text Secrets**: Secrets are stored in plain text locally (standard for authenticator apps; matches Google Authenticator behaviour).
- **Permissions**: The extension requires only `storage` and `clipboardWrite` permissions.

---

## 📄 License
For personal use.
