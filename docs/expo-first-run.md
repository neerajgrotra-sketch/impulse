# Expo First Run — From a Fresh Codespace to a Build on Your iPhone

> **Status:** Draft v0.1 — 2026-07. **Purpose:** the exact, verified sequence of commands to get `prototype/expo/` running on a physical iPhone, starting from nothing but a fresh GitHub Codespace. **Scope:** operational runbook only — no product decisions live here. For architecture, see [`prototype/expo/README.md`](../prototype/expo/README.md); for the frontend-technology decision this build follows, see [`investor-prototype.md`](investor-prototype.md)'s "Frontend update" note.
>
> Every command below was run against this repo's actual `prototype/expo/` during Milestone 2 (Expo SDK 57, `eas-cli` 20.5.1, Node 24). Nothing here is copied from generic Expo docs without being checked against what's actually installed.

---

## 0 · The one thing that will silently break if you skip it

**A Codespace is a cloud VM, not your iPhone's Wi-Fi network.** Expo's default dev-server mode (`lan`) prints a QR code containing the Codespace's *internal container IP* (something like `exp://10.0.x.x:8081`) — your iPhone cannot reach that address no matter how good the QR scan is; it isn't on the same network and never will be. Forwarding port 8081 in the Codespaces "Ports" tab does **not** fix this either, because the QR code's embedded address doesn't change — it still points at the unreachable internal IP.

**The fix: always start the dev server with `--tunnel`** from a Codespace. This routes the connection through Expo's ngrok-based tunnel and encodes a real, publicly-reachable URL in the QR code instead. Every `expo start` command in this document uses it. Skipping this is, by a wide margin, the most likely reason "the QR code doesn't work" on demo day.

---

## 1 · Exact commands, from a fresh Codespace

Assumes the Codespace already has this repo checked out and Node available (this repo's Codespace image ships Node 24 / npm 11 — check with `node -v` if unsure).

```bash
# 1. Install dependencies
cd prototype/expo
npm install

# 2. (One-time) Log in to your Expo account — needed for EAS builds later,
#    not for basic `expo start`. Opens a browser-based login by default.
npx expo login
# or, non-interactively:
npx expo login -u YOUR_EMAIL -p -            # reads password from stdin

# 3. (One-time) Log in to EAS — same Expo account, separate CLI, separate
#    login state. Both logins are required; neither substitutes for the other.
npx eas-cli login

# 4. Verify you're logged into both
npx expo whoami
npx eas-cli whoami

# 5. Start the dev server — tunnel mode is mandatory from a Codespace (see §0)
npx expo start --tunnel
```

`expo start --tunnel` will, on first use, prompt to install its tunnel dependency (`@expo/ngrok` or the current equivalent) — accept it; this is a one-time setup step per Codespace and needs the outbound network access Codespaces already has by default.

Leave this running. It prints a QR code in the terminal and serves the Metro bundler. Continue to §2/§3 to get it onto a phone.

**Fresh-Codespace checklist, if starting from literally nothing (no prior `npm install`):**

```bash
git clone <this-repo-url>        # or reopen the Codespace if already cloned
cd impulse/prototype/expo
npm install
npx expo start --tunnel
```

That's the entire path to a running dev server. Everything else in this document is either a one-time account/credential setup step or a Development Build (needed only for on-device voice capture — see §4 and `prototype/expo/README.md`'s "Voice strategy").

---

## 2 · Installing Expo Go on the iPhone

1. On the iPhone: open the **App Store**, search **"Expo Go"**, install it (it's free, published by Expo).
2. Open Expo Go once after installing — it'll ask for camera access to scan QR codes later; allow it.
3. No account/login is required inside Expo Go to scan a locally-served project from this repo (login is only relevant for Expo's own cloud project features, not for connecting to your own dev server).

That's the whole setup — Expo Go is a generic client; it doesn't need to know about this project ahead of time.

---

## 3 · Scanning the QR code

1. With `npx expo start --tunnel` running in the Codespace terminal, a QR code renders directly in the terminal output.
2. On the iPhone, open the **Camera** app (not Expo Go directly) and point it at the terminal's QR code — iOS's built-in camera recognizes Expo QR codes and shows a notification banner; tap it. (Expo Go itself also has a built-in scanner under its "Scan QR Code" button if the Camera-app route doesn't trigger a banner — same result.)
3. This opens Expo Go and loads the JS bundle over the tunnel. First load can take 15–60 seconds depending on tunnel latency — this is normal, not a hang.
4. If the terminal is hard to photograph (small text, screen glare), press `w` in the terminal to also open the Metro dev-tools web page, which shows the same QR code larger and includes a copyable `exp://` URL you can send to the phone another way (AirDrop a screenshot, Messages, etc.) as a fallback.

**If the scan succeeds but the app shows a red error screen immediately:** see §10 Troubleshooting — this is almost always the tunnel URL going stale (Codespace port churn) or a JS bundling error, not a scanning problem.

---

## 4 · Creating the first Development Build

Only needed once you want **real on-device speech capture** (`expo-speech-recognition`) — see `prototype/expo/README.md`'s "Voice strategy". Everything else (Welcome, Consent, the full 8-question conversation with typed answers, TTS playback) already works in plain Expo Go from §1–§3; skip this section entirely if a Development Build isn't needed yet for tomorrow's demo.

```bash
# 1. One-time: link this project to your Expo account
cd prototype/expo
npx eas-cli init
# This writes a project ID into app.json's `extra.eas.projectId` — commit that change.

# 2. One-time: register the founder's specific iPhone for ad-hoc distribution
npx eas-cli device:create
# This prints a URL. Open it ON THE FOUNDER'S IPHONE (not the Codespace) and
# follow the on-screen prompt — it installs a small provisioning profile that
# registers the device's UDID with your Apple account, invisibly to the user.

# 3. Start the build — this runs entirely in EAS's cloud, no Xcode/Mac needed
npx eas-cli build --profile development --platform ios
```

Step 3 will ask (first time only) how to handle iOS credentials — choose **"Let EAS manage credentials"** unless you already have an Apple Developer account's certificates set up manually; this needs an Apple ID (a free Apple ID works for ad-hoc/internal builds, no paid Apple Developer Program enrollment required for `internal` distribution to a device you've registered via step 2, though a paid enrollment removes the 7-day free-provisioning-profile expiry that a free Apple ID's certificates carry).

The build itself takes roughly 10–20 minutes, entirely on EAS's servers — you can close the terminal and check progress later with:

```bash
npx eas-cli build:list --platform ios --limit 5
```

or watch it live at the URL EAS prints when the build starts.

---

## 5 · Installing the Development Build on the iPhone

1. When the build in §4 finishes, `eas build` prints an install link (also visible at `expo.dev` under your project's Builds tab, or via `npx eas-cli build:view`).
2. Open that link **directly on the iPhone** (text it, AirDrop it, or open expo.dev's build page in Safari on the phone) and tap **Install**.
3. iOS will install it like a TestFlight app icon on the home screen, named after `app.json`'s `"name"` (**"Impulse"**).
4. **First launch only:** iOS will refuse to open it with an "Untrusted Developer" warning. Fix: **Settings → General → VPN & Device Management → [your Apple ID / Developer App]** → tap **Trust**. This is a one-time step per device per Apple-account-signing-identity, not per build.
5. Once trusted, the icon launches like any other app — this is the **Development Build**, a superset of Expo Go for this project specifically (it includes `expo-speech-recognition`'s native code).
6. Back in the Codespace, run `npx expo start --tunnel --dev-client` (the `--dev-client` flag is what makes the QR code target this custom build instead of Expo Go) and scan it from inside the installed app the same way as §3.

You only repeat §4–§5 when native dependencies change (a new native module is added, or an existing one's native code changes). Pure JS/TS changes after that reload instantly over the tunnel via Fast Refresh — no rebuild needed.

---

## 6 · Environment variables required

**As of Milestone 3, the Expo app calls the backend once (Blueprint generation) and needs exactly two environment variables to do it.** Without them, the Thinking screen will always fail into the retry screen — `services/blueprintApi.ts` checks for both before attempting the request and fails with a clear (logged, not user-facing) config error rather than a confusing network error.

1. Copy the template: `cp .env.example .env` (from `prototype/expo/`).
2. Fill in real values from your Supabase project (Project Settings → API) — see §7.

Expo's built-in convention (SDK 49+, no extra package needed):

- A `.env` file at `prototype/expo/.env` (git-ignored — never commit real values; `.env.example` is the committed template) is loaded automatically by `expo start` / `eas build`.
- Any variable prefixed `EXPO_PUBLIC_` is inlined into the JS bundle at build time and readable via `process.env.EXPO_PUBLIC_FOO` in app code. **Anything with this prefix ends up in the shipped app binary, inspectable by anyone — treat it as public, never as a secret.**
- Variables without that prefix are visible to `app.config.js`/build tooling but never bundled into client JS.
- **Restart `expo start` after creating or changing `.env`** — env values are read at bundler start, not hot-reloaded.

| Variable | Prefix | Value | Why it's safe to ship client-side |
|---|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | `EXPO_PUBLIC_` | Your Supabase project URL | Not a secret — it's a public endpoint address. |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `EXPO_PUBLIC_` | Your Supabase anon key | Designed to be public; access is governed by Supabase's row-level security / Edge Function auth, the same trust model `AppConfig.swift` already uses in `prototype/ios/`. |

**`ANTHROPIC_API_KEY` never appears here.** It is a real secret and lives only in the Supabase Edge Function's own secret store (`supabase secrets set ANTHROPIC_API_KEY=...`, per §8 below) — it must never be read from client code, an `EXPO_PUBLIC_*` variable, or committed anywhere in `prototype/expo/`.

---

## 7 · Supabase setup

The backend (`prototype/backend/`) is shared by both frontends and unchanged by this Milestone — full setup instructions already exist and are the source of truth: **[`prototype/backend/README.md`](../prototype/backend/README.md)**. Summary of what it covers, so you know whether you need it today:

1. Install the Supabase CLI, `supabase login`.
2. `supabase init` / `supabase link --project-ref YOUR-PROJECT-REF` from `prototype/backend/`.
3. `supabase secrets set ANTHROPIC_API_KEY=sk-ant-...` (§8 below — get this key first).
4. `supabase functions deploy generate-blueprint --no-verify-jwt`.
5. Copy the project's URL + anon key from the Supabase dashboard (Project Settings → API) — these become `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` (§6) once the Expo app calls the backend (Milestone 4). Not needed for tomorrow's demo if the flow being shown stops before the Blueprint screen.

---

## 8 · Anthropic API setup

Also entirely on the backend side, not the Expo app:

1. Get an API key from the [Anthropic Console](https://console.anthropic.com/) — this is the same key `prototype/backend/supabase/functions/generate-blueprint/index.ts` already expects via `Deno.env.get("ANTHROPIC_API_KEY")`.
2. Set it as a Supabase function secret (§7, step 3) — **never** as a `.env` value inside `prototype/expo/`, never with an `EXPO_PUBLIC_` prefix, never committed anywhere. It must only exist server-side.
3. No Anthropic-side configuration is needed beyond having a funded account — the function calls `claude-opus-4-8` directly per `prototype/backend/README.md`.

---

## 9 · Known Expo limitations (as of this build)

- **Expo Go cannot run on-device speech recognition.** `expo-speech-recognition` is a custom native module; Expo Go's fixed binary doesn't include it. The app detects this automatically and falls back to a typed-answer text field — this is by design, not a bug, and is documented in full in `prototype/expo/README.md`'s "Voice strategy". A Development Build (§4–§5) is the only way to get real voice capture.
- **Tunnel mode adds real latency.** Every JS reload and every network request during dev goes through Expo's ngrok tunnel, not a direct LAN hop. Expect 1–3s of extra lag on first bundle load; this is a Codespaces-workflow cost, not a production concern (a production build has no dev server in the loop at all).
- **The free Apple ID / EAS-managed-credentials path (§4) provisions certificates that expire after 7 days.** If the founder's Development Build stops opening ("Untrusted Developer" / installation failure) more than a week after building, that's almost certainly why — rebuild (§4 step 3 only; init/device steps don't need repeating).
- **TestFlight is not covered by this document.** Everything here uses ad-hoc **internal distribution** (a build installed directly, not through the App Store's review pipeline) — the right choice for "founder's own phone, tomorrow," not for wider distribution.
- **Premium TTS is not implemented on either frontend.** Both the Swift design spec and the Expo build currently speak questions with the OS's default system voice (`expo-speech` here). This is a known, previously-flagged gap (`docs/investor-prototype.md` §6) — not something this checkpoint fixes.
- **No offline mode.** Even Expo Go's connection (tunnel or LAN) must stay up for the JS bundle to load initially; once loaded, the app has no further network dependency until Milestone 4 adds the Blueprint call. A Development Build's *installed* binary does not need the dev server at all for normal use — only `expo start --dev-client` sessions during active development do.

---

## 10 · Troubleshooting

**QR code scans but nothing happens / infinite spinner**
Tunnel URL likely died (Codespaces can recycle the tunnel's underlying port on idle). Stop (`Ctrl+C`) and restart `npx expo start --tunnel`; re-scan the *new* QR code — an old one is a dead link, not a slow one.

**"Something went wrong" / red error screen immediately after load**
This is a JS error, not a connectivity issue. Read the stack trace in Expo Go directly (tap the error banner) or in the Codespace terminal running `expo start`. Run `npm run typecheck` in `prototype/expo/` first — most red-screen errors at this stage are typos that `tsc` would have already caught before you ever opened the phone.

**`npx eas-cli build` fails immediately with a credentials error**
Usually means `eas init` (§4 step 1) wasn't run, or was run in the wrong directory (must be `prototype/expo/`, where `app.json`/`eas.json` live). Confirm with `npx eas-cli config` — it should print the resolved `app.json` + `eas.json` without error.

**"Untrusted Developer" persists even after tapping Trust in Settings**
Force-quit the app and relaunch — iOS sometimes needs one full relaunch after the trust change takes effect, not just a resume from the app switcher.

**Development Build installs but crashes instantly on launch**
Almost always a native-module/JS mismatch — the installed binary's native code doesn't match what the currently-running Metro bundle expects (e.g., you added a new native dependency after the last `eas build`). Rebuild (§4 step 3). This is the one class of error a JS-only fix (Fast Refresh) can never solve — if you're mid-demo and this happens, fall back to Expo Go (§1–§3), which always reflects the latest JS regardless of native state.

**Metro bundler hangs on "Starting Metro Bundler" for a long time**
First run after `npm install` or a dependency change rebuilds Metro's cache from scratch — can take a minute or two on a Codespace's shared CPU. If it truly hangs (multiple minutes, no progress), `Ctrl+C` and retry with `npx expo start --tunnel --clear` to force a clean cache.

**`npm install` fails with an ERESOLVE peer-dependency error**
Shouldn't happen — `prototype/expo/.npmrc` sets `legacy-peer-deps=true` specifically to avoid this (a known conflict between `expo-router`'s optional web dependencies and React 19.2, unrelated to this app's own code). If it still happens, confirm `.npmrc` is present and `npm --version` is 7+.

**Camera app doesn't show an Expo notification banner when pointed at the QR code**
Some iOS versions/regions don't auto-detect Expo's custom QR payload via the system camera. Open **Expo Go → Scan QR Code** directly instead — its scanner always recognizes the code.

**EAS build stuck "in queue" for a long time**
Free-tier EAS builds queue behind other free-tier builds industry-wide; this is normal and can take 10–30+ minutes at busy times, not a sign of failure. Check live status at the URL `eas build` printed, or `npx eas-cli build:list`.

**`expo login` succeeds but `eas-cli whoami` says not logged in (or vice versa)**
These are two separate CLIs with separate session storage (`expo` legacy auth vs. `eas-cli`'s own). Log in to both explicitly (§1, steps 2–3) — logging into one is never sufficient for the other, even though both use the same underlying Expo account.

**Founder's iPhone and the Codespace both show "connected" but the app never loads**
Check the founder isn't on a restrictive network (corporate/conference Wi-Fi that blocks the tunnel's outbound domain). Switching the iPhone to cellular data is the fastest diagnostic — if it works on cellular but not Wi-Fi, it's a network policy issue, not this app.

---

## Open questions / what we're deliberately not covering here

- Android setup — this project targets iOS first per the mission (`app.json`'s Android block exists for future parity but hasn't been tested on a device); this document assumes iPhone throughout.
- App Store / TestFlight distribution — out of scope until there's a reason to distribute beyond the founder's own device.
- CI-driven EAS builds (triggered automatically on push) — not set up; every build in this document is manually triggered.
