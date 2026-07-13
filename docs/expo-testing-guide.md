# Testing the Impulse Expo App — Reconnect Runbook

> **Status:** Draft v0.2 — 2026-07. **Purpose:** the exact steps to get from a *fresh, just-opened Codespace* to the Impulse app running on your iPhone (or iPad), every time — written because the Codespace itself is temporary and gets rebuilt from scratch each session. §1 below is now verified end-to-end against a real build and a real device install. **Scope:** operational only, for `prototype/expo/`. For the original (now partly outdated — see §0) first-run doc, see [`expo-first-run.md`](expo-first-run.md).

---

## 0 · Why this doc exists, and what changed since the original runbook

[`expo-first-run.md`](expo-first-run.md) covers the original path to a working build, but several things discovered while actually running it changed the correct sequence:

1. **`npx expo start --tunnel` is broken and should not be used.** It bundles a legacy `ngrok` v2 client binary (2019-era). Ngrok has moved on from the v2 agent protocol, so the tunnel fails immediately with `CommandError: TypeError: Cannot read properties of undefined (reading 'body')`, regardless of any authtoken you configure. **Use §2 below (Codespaces' own port forwarding) instead — it fully replaces `--tunnel`.**
2. **Expo Go from the App Store can no longer be relied on to support this project's SDK.** As of Expo's May 2026 policy change, Expo Go is now treated as a beginner/educational tool, and new SDK releases (55, 56, 57, ...) sit in Apple App Store review indefinitely instead of shipping promptly. This project is on **SDK 57**; if your installed Expo Go reports an older supported SDK (e.g. "supported SDK 54") with no pending App Store update, that's this policy, not a bug on your end. **This project requires a Development Build (§1), not plain Expo Go.**
3. **A free, never-enrolled Apple ID does not work for ad-hoc distribution**, contrary to what the original doc assumed. `eas device:create` / `eas build` need a real Apple Developer **team**, and a plain Apple ID with no developer history has none — free or paid. **The Apple Developer Program ($99/year) is required**, enrolled once per Apple ID, done entirely in a browser (no Mac needed for enrollment itself). Note: after payment, Apple's own account page can keep showing **"(Pending)"** and a "complete your purchase now" banner for **up to 48 hours** even though the charge already succeeded — don't re-purchase; just wait it out.
4. **`expo-dev-client` isn't in the project's dependencies by default** — `eas build --profile development` fails immediately without it. §1e below installs it as part of the sequence.
5. **iOS 16+ requires Developer Mode to be manually enabled on the device** before an ad-hoc/development build will launch at all, separately from the "Trust This Developer" step. Missing this shows the app icon but refuses to open, saying *"Developer Mode is required to run this app."* Covered in §1g.

Everything below assumes you already have a paid, enrolled Apple Developer account. If you don't yet, start at §1a — it's a one-time step, not a per-session one.

---

## 1 · One-time setup (per Apple Developer account, and repeated per new device or native-dependency change)

Skip this section entirely if you've already got a Development Build installed and trusted on your device and no native dependency has changed since. Jump to §2.

### 1a. Enroll in the Apple Developer Program

1. Go to [developer.apple.com/programs/enroll](https://developer.apple.com/programs/enroll) and enroll with the Apple ID you want to build under — $99/year, browser-only, no Mac needed.
2. Apple requires identity verification (a photo of a passport or driver's license). If the web upload fails repeatedly, use the **Apple Developer** iOS app instead (App Store → "Apple Developer") — its guided camera capture is far more reliable than the website's file upload. If the in-app camera scan itself won't trigger: grant the app Camera permission in **Settings → Privacy & Security → Camera**, remove the ID from any glare-prone plastic sleeve, use even lighting on a plain dark background, and hold the phone flat and parallel above the document.
3. After payment, check **developer.apple.com/account** — it may show your name with **"(Pending)"** next to it and a banner saying to "complete your purchase now" even though you already paid. This is normal; Apple's backend can take **up to 48 hours** to finish linking the payment to the account. Do not click that banner again. Just wait and re-check; you'll know it's done when the "(Pending)" tag disappears and the page shows an active Team ID.

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

### 1d. Register the device (iPhone or iPad)

**This step must be run in your own interactive terminal** — it needs your Apple ID password and a 2FA code, which can't be scripted.

```bash
npx eas-cli device:create
```

Walk through the prompts:
1. Confirm the `ngrotra` Expo account.
2. Apple ID: `ngrotra@gildan.com`, then password, then the 6-digit 2FA code sent to your device.
3. **"How would you like to register your devices?"** → choose **Website**.
4. It prints a URL like `https://expo.dev/register-device/<uuid>` and the command exits — this is expected, registration finishes asynchronously on the device.
5. **Open that link on the device you're registering** (iPhone or iPad, doesn't matter which — repeat this whole step once per device). It offers a provisioning-profile download.
6. Tap to download it, then **actually install it**: go to **Settings → General → VPN & Device Management** (or tap the "Profile Downloaded" banner at the top of the main Settings screen if present), tap the profile, tap **Install**, enter your passcode, confirm. Downloading alone does not register the UDID — installing does.
7. Verify it worked from the Codespace:
   ```bash
   npx eas-cli device:list --apple-team-id <YOUR_TEAM_ID>
   ```
   (Find `<YOUR_TEAM_ID>` from the `device:create` output, e.g. `X3746YR74D`.) You should see the device's UDID, class (`iPhone` or `iPad`), and team listed.

**To register a second device later (e.g. an iPad in addition to an already-registered iPhone), just repeat this whole step** — run `device:create` again, choose Website again, open the new link on the *other* device.

### 1e. Install `expo-dev-client`

```bash
npx expo install expo-dev-client
```

Required once — the `development` build profile in `eas.json` won't build without it.

### 1f. Build the Development Build (cloud build, no Mac needed, ~10–20 min)

**Also run this in your own interactive terminal the first time** — it needs to prompt for Apple credentials and device selection:

```bash
npx eas-cli build --profile development --platform ios
```

Walk through the prompts:
1. **"Do you want to log in to your Apple account?"** → yes (lets EAS auto-generate and validate credentials).
2. Apple ID login (same as §1d — may reuse the cached session).
3. **"Generate a new Apple Distribution Certificate?"** → yes, first time.
4. **"Select devices for the ad hoc build"** → all currently-registered devices are pre-checked; just press **Enter** to accept, or use Space to toggle specific ones off if you don't want every registered device in this particular build.
5. It uploads the project and starts the cloud build. Once past this point it's fully non-interactive — you can Ctrl+C your terminal and the build keeps running on Expo's servers regardless.

Check progress any time with:

```bash
npx eas-cli build:list --platform ios --limit 5
# or, for a specific build:
npx eas-cli build:view <build-id>
```

**Important — the provisioning profile only includes devices that were registered *before* this step.** If you register a new device (§1d) after already building, you must **rebuild** (repeat §1f) for that device's UDID to be included — re-running `device:create` alone does not retroactively add it to an existing build's profile.

### 1g. Install it on the device

1. When the build finishes, the terminal (or the build's page at `expo.dev/accounts/ngrotra/projects/impulse-blueprint/builds/<id>`) shows an install link/QR. Open it **on the device** and tap **Install**.
2. It installs as an app icon named **"Impulse."**
3. **Trust the developer:** first launch shows "Untrusted Developer." Go to **Settings → General → VPN & Device Management** → tap your account → **Trust**.
4. **Enable Developer Mode (iOS 16+, one-time per device):** if the app instead says *"Developer Mode is required to run this app,"* go to **Settings → Privacy & Security → Developer Mode**, toggle it **on**, and let the device restart. After it restarts and unlocks, iOS shows a confirmation dialog — tap **Turn On**, enter your passcode. This is a one-time setting per device; it stays on afterward.
5. Force-quit and relaunch **Impulse** after both of the above. It should now open (to a blank/disconnected state until Metro is running — that's expected, see §2).

You only repeat §1e–§1g when a *native* dependency changes (a new native module, or an existing one's native code changes) or when you register a new device. Pure JS/TS changes reload instantly over Fast Refresh with no rebuild — that's everything in §2 below.

### A note on iPad

`app.json` currently sets `"supportsTablet": false`. The Development Build will still install and run on an iPad — §1d–§1g are identical for iPad, just register the iPad's UDID the same way as an iPhone — but the app runs in **iPhone-compatibility mode** (a scaled, non-tablet-optimized layout), not a real iPad layout, until that flag is changed and the project explicitly adds tablet support.

---

## 2 · Every time you open a fresh Codespace

The Codespace is ephemeral, so this whole section runs from scratch each session — none of it persists. Assumes §1 (device registered, build installed and trusted, Developer Mode on) is already done and staying valid.

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

If either says logged out, repeat §1b.

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

### 2f. Connect from the device

1. Open the **Impulse** app already installed (from §1g) — not Expo Go.
2. Scan the QR code Metro just printed, or use the dev-menu's **"Enter URL manually"** with:

   ```
   exp://<your-codespace-name>-8081.app.github.dev:443
   ```

   (Find `<your-codespace-name>` via `echo $CODESPACE_NAME` in the Codespace terminal.)
3. First load over the proxy takes 15–60 seconds — normal, not a hang.

From here, JS/TS edits hot-reload instantly. If the Codespace restarts or the port forwarding drops, only §2d–§2f need repeating — §1's build and install stay valid until a native dependency changes or a new device needs registering.

---

## 3 · Troubleshooting

**"Developer Mode is required to run this app"**
Not yet enabled on this device. See §1g step 4 — Settings → Privacy & Security → Developer Mode → toggle on → restart → confirm "Turn On Developer Mode?" This is separate from, and in addition to, "Trust This Developer."

**`eas build` fails: "you don't have expo-dev-client installed"**
Run §1e (`npx expo install expo-dev-client`) and retry the build.

**`eas device:create` / `eas build` hang or fail oddly when run through an automated/non-interactive tool**
Both need a real interactive terminal (Apple password, 2FA, device-selection prompts). Always run them yourself directly in your terminal, not via a script or agent.

**QR scans but nothing loads / spinner forever**
The Codespace's port-forwarding URL or Metro session died. Re-run §2d to confirm port 8081 is still `public`, then redo §2e with a fresh terminal and rescan — an old QR from a previous session is a dead link.

**"Untrusted Developer" reappears after already trusting it once**
Only happens after a fresh install (new build from §1f). Re-trust via **Settings → General → VPN & Device Management**.

**App still opens in Expo Go instead of the installed Development Build**
Make sure you're tapping the **Impulse** icon on the home screen, not Expo Go's own scanner — the dev-client build and Expo Go are separate apps once §1 is done. `npx expo start --dev-client` (not plain `expo start`) targets the installed build specifically.

**A newly registered device isn't in the build**
The provisioning profile only bakes in devices registered *before* the build ran (§1f note). Rebuild after registering.

**`gh codespace ports` says port 8081 doesn't exist yet**
Metro hasn't started listening yet — run §2c first, wait for `Waiting on http://localhost:8081` in the terminal, then run §2d.

**A native dependency was added or changed and Fast Refresh stops working / app crashes on launch**
This means the installed binary's native code no longer matches the JS bundle. Repeat §1f–§1g (rebuild and reinstall) — this is the one class of change Fast Refresh can never cover.

**EAS build/device commands fail with "no team associated with your Apple account"**
Your Apple ID isn't enrolled in the Apple Developer Program yet, or enrollment hasn't finished processing (§1a — can take up to 48 hours after payment). This isn't an EAS CLI bug.

---

## Quick reference — the whole per-session sequence (assumes §1 already done)

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
