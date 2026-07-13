# Testing the Impulse Expo App — Reconnect Runbook

> **Status:** Draft v0.1 — 2026-07. **Purpose:** the exact steps to get from a *fresh, just-opened Codespace* to the Impulse app running on your iPhone, every time — written because the Codespace itself is temporary and gets rebuilt from scratch each session. **Scope:** operational only, for `prototype/expo/`. For the original (now partly outdated — see §0) first-run doc, see [`expo-first-run.md`](expo-first-run.md).

---

## 0 · Why this doc exists, and what changed since the original runbook

[`expo-first-run.md`](expo-first-run.md) covers the original path to a working build, but two things discovered while actually running it changed the correct sequence:

1. **`npx expo start --tunnel` is broken and should not be used.** It bundles a legacy `ngrok` v2 client binary (2019-era). Ngrok has moved on from the v2 agent protocol, so the tunnel fails immediately with `CommandError: TypeError: Cannot read properties of undefined (reading 'body')`, regardless of any authtoken you configure. **Use §2 below (Codespaces' own port forwarding) instead — it fully replaces `--tunnel`.**
2. **Expo Go from the App Store can no longer be relied on to support this project's SDK.** As of Expo's May 2026 policy change, Expo Go is now treated as a beginner/educational tool, and new SDK releases (55, 56, 57, ...) sit in Apple App Store review indefinitely instead of shipping promptly. This project is on **SDK 57**; if your installed Expo Go reports an older supported SDK (e.g. "supported SDK 54") with no pending App Store update, that's this policy, not a bug on your end. **This project now requires a Development Build (§1), not plain Expo Go.**
3. **A free, never-enrolled Apple ID does not work for ad-hoc distribution**, contrary to what the original doc assumed. `eas device:create` / `eas build` need a real Apple Developer **team**, and a plain Apple ID with no developer history has none — free or paid. **The Apple Developer Program ($99/year) is required**, enrolled once per Apple ID, done entirely in a browser (no Mac needed for enrollment itself).

Everything below assumes you already have a paid, enrolled Apple Developer account and have completed §1 once. If you haven't, do §1 first — it's a one-time step, not a per-session one.

---

## 1 · One-time setup (per Apple Developer account / per native-dependency change)

Skip this section entirely if you've already got a Development Build installed on your phone and no native dependency has changed since. Jump to §2.

### 1a. Enroll in the Apple Developer Program

1. Go to [developer.apple.com/programs/enroll](https://developer.apple.com/programs/enroll) and enroll with the Apple ID you want to build under — $99/year, browser-only, no Mac needed.
2. Apple requires identity verification (a photo of a passport or driver's license). If the web upload fails repeatedly, use the **Apple Developer** iOS app instead (App Store → "Apple Developer") — its guided camera capture is far more reliable than the website's file upload. Common fixes if the scan won't trigger: grant the app Camera permission in **Settings → Privacy & Security → Camera**, remove the ID from any glare-prone plastic sleeve, use even lighting on a plain dark background, and hold the phone flat and parallel above the document.
3. Approval can take anywhere from minutes to ~48 hours.

### 1b. Log in to both Expo CLIs (only needed once per Codespace, but harmless to repeat)

```bash
cd prototype/expo
npx expo login          # or: npx expo login -u YOUR_EMAIL -p -
npx eas-cli login
npx expo whoami          # confirm
npx eas-cli whoami       # confirm — separate login state from expo login
```

### 1c. Confirm the EAS project is linked

```bash
npx eas-cli project:info
```

Should print `fullName @ngrotra/impulse-blueprint` and a project ID matching `app.json`'s `extra.eas.projectId`. If this errors, run `npx eas-cli init` once.

### 1d. Register your iPhone

```bash
npx eas-cli device:create
```

Prints a URL — open it **on the iPhone itself** (not the Codespace) and follow the prompt. This registers the device's UDID with your now-enrolled Apple account.

### 1e. Build the Development Build (cloud build, no Mac needed, ~10–20 min)

```bash
npx eas-cli build --profile development --platform ios
```

First run asks how to handle credentials — choose **"Let EAS manage credentials"**. Check progress any time with:

```bash
npx eas-cli build:list --platform ios --limit 5
```

### 1f. Install it on the iPhone

1. When the build finishes, `eas build` prints an install link (also on expo.dev under the project's Builds tab). Open it **on the iPhone** and tap Install.
2. It installs as an app icon named **"Impulse"**.
3. **First launch only:** iOS will show "Untrusted Developer." Fix: **Settings → General → VPN & Device Management** → tap your account → **Trust**. Force-quit and relaunch after trusting.

You only repeat §1e–§1f when a *native* dependency changes (new native module, or an existing one's native code changes). Pure JS/TS changes reload instantly over Fast Refresh with no rebuild — that's everything in §2 below.

---

## 2 · Every time you open a fresh Codespace

The Codespace is ephemeral, so this whole section runs from scratch each session — none of it persists.

### 2a. Install dependencies

```bash
cd prototype/expo
npm install
```

### 2b. Confirm you're still logged in

```bash
npx expo whoami
npx eas-cli whoami
```

If either says logged out, repeat §1b (your Apple enrollment and installed build from §1 still stand — only the CLI session needs refreshing).

### 2c. Start Metro with the dev client flag

```bash
npx expo start --dev-client
```

Leave this running. It's fine that this alone won't produce a working QR code yet — the printed URL still points at the Codespace's internal container address. §2d fixes that.

### 2d. Make port 8081 public and get its forwarding URL

In a second terminal (or after backgrounding the above):

```bash
gh codespace ports visibility 8081:public -c "$CODESPACE_NAME"
```

This uses the Codespace's own HTTPS port forwarding in place of the broken ngrok tunnel (§0). Confirm it took effect:

```bash
gh codespace ports -c "$CODESPACE_NAME"
```

Port 8081 should show `public`.

### 2e. Restart Metro pointed at the public URL

Stop the server from §2c (`Ctrl+C`) and restart it with the proxy override:

```bash
EXPO_PACKAGER_PROXY_URL="https://${CODESPACE_NAME}-8081.app.github.dev" npx expo start --dev-client
```

This makes Expo print a QR code (and construct manifest/bundle URLs) using the public Codespaces domain instead of the unreachable internal IP.

### 2f. Connect from the iPhone

1. Open the **Impulse** app already installed on your phone (from §1f) — not Expo Go.
2. Scan the QR code Metro just printed, or use the dev-menu's **"Enter URL manually"** with:

   ```
   exp://<your-codespace-name>-8081.app.github.dev:443
   ```

   (Find `<your-codespace-name>` via `echo $CODESPACE_NAME` in the Codespace terminal.)
3. First load over the proxy takes 15–60 seconds — normal, not a hang.

From here, JS/TS edits hot-reload instantly. If the Codespace restarts or the port forwarding drops, only §2d–§2f need repeating — §1's build and install stay valid until a native dependency changes.

---

## 3 · Troubleshooting

**QR scans but nothing loads / spinner forever**
The Codespace's port-forwarding URL or Metro session died. Re-run §2d to confirm port 8081 is still `public`, then redo §2e with a fresh terminal and rescan — an old QR from a previous session is a dead link.

**"Untrusted Developer" reappears after already trusting it once**
Only happens after a fresh install (new build from §1e). Re-trust via **Settings → General → VPN & Device Management**.

**App still opens in Expo Go instead of the installed Development Build**
Make sure you're tapping the **Impulse** icon on the home screen, not Expo Go's own scanner — the dev-client build and Expo Go are separate apps once §1 is done. `npx expo start --dev-client` (not plain `expo start`) targets the installed build specifically.

**`gh codespace ports` says port 8081 doesn't exist yet**
Metro hasn't started listening yet — run §2c first, wait for `Waiting on http://localhost:8081` in the terminal, then run §2d.

**A native dependency was added or changed and Fast Refresh stops working / app crashes on launch**
This means the installed binary's native code no longer matches the JS bundle. Repeat §1e–§1f (rebuild and reinstall) — this is the one class of change Fast Refresh can never cover.

**EAS build fails with "no team associated with your Apple account"**
Your Apple ID isn't enrolled in the Apple Developer Program yet, or enrollment hasn't finished processing. Finish §1a first; this isn't an EAS CLI bug.

---

## Quick reference — the whole per-session sequence

```bash
cd prototype/expo
npm install
npx expo whoami && npx eas-cli whoami        # re-login if needed (§1b)
npx expo start --dev-client &                 # or run in its own terminal
gh codespace ports visibility 8081:public -c "$CODESPACE_NAME"
# Ctrl+C the above, then:
EXPO_PACKAGER_PROXY_URL="https://${CODESPACE_NAME}-8081.app.github.dev" npx expo start --dev-client
# scan the QR, or in the Impulse app's dev menu enter manually:
# exp://<codespace-name>-8081.app.github.dev:443
```
