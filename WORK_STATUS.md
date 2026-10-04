# Completion and release status

Reviewed and repaired in two parts on 2026-10-01. This describes code readiness; it does not certify a deployed service or a signed phone build.

## Part 1: functionality and security

- Firebase bearer authentication, verified email checks, revocation checks and profile field restrictions.
- Account-scoped settings, history, likes, playlists and downloads; account switches discard stale reads.
- Provider-aware track IDs, queue playback, repeat modes, deep links and asynchronous request cancellation.
- Real native download files, cancellation, Wi-Fi checks, offline playback URI selection and deletion.
- Playlist ownership checks, cover persistence, validated fields and metadata storage.
- Bounded remote requests, URL/DNS validation, download concurrency limits and API throttling.
- Forward database migration with automatic schema synchronization disabled.
- Fake billing and unfinished social/equalizer/translation controls now explicitly report unavailable functionality.

## Part 2: verification and release configuration

- Frontend/backend TypeScript, lint, regression tests, backend HTTP security tests and production build checks.
- Web static export and Android JavaScript/Hermes export checks.
- Dependency fixes and compatibility patches documented under `vendor/decode-uri-component` and `vendor/image-size`.
- CI workflow verifies both applications and exports. Environment examples are provided; private credentials and local database are excluded from Git.

Run frontend checks with `npm run typecheck`, `npm run lint`, `npm test`. Run backend checks inside `backend` with `npm run typecheck`, `npm run lint`, `npm test -- --runInBand`, `npm run test:e2e -- --runInBand`, `npm run build`.

## Required before public release

1. Configure the matching Firebase client project, private backend service account, authorized web domains and native Google sign-in certificates/client configuration. Never put a Spotify client secret or Firebase service account in the Android bundle.
2. Configure and deploy the backend with the real API URL, allowed web origins, PostgreSQL TLS certificate and provider credentials. Back up the actual database before its first migration; local SQLite tests do not certify a production PostgreSQL migration.
3. Build a signed Android APK/AAB and test on a physical phone: login/verification, two-account switching, background playback/notification controls, airplane-mode downloads, cancellation, deep links and account deletion. Bundle export is not an installed-device test.
4. Direct-APK Razorpay test checkout now supports INR 99 / 30 days on a separately configured test backend. Production billing, social features, collaboration, equalizer and translation remain unavailable. See `ANDROID_BUILD.md` for setup and limits.
5. Spotify catalog credentials do not provide full-song audio or live lyrics. The existing providers remain necessary for supported playback; availability depends on their services. Likes and local custom playlists remain device/account scoped rather than cross-device synchronized.
6. Complete actual privacy/store declarations, release signing and service monitoring before publishing.

No deployment, commit, payment or Spotify account change was performed by this work.

## Recorded verification

- Frontend: lint and TypeScript passed; five regression tests passed.
- Backend: lint and TypeScript passed; 32 tests passed, including payment ownership/signature/amount/replay and preservation of legacy database data; eight HTTP security tests passed; Nest production build passed.
- Expo export: Android and iOS Hermes bundles (5.33 MB each), web bundle (3.29 MB), 39 static routes passed.
- Earlier dependency audits reported zero known vulnerabilities. On 2026-10-02, the frontend audit reports five transitive high findings rooted in the newly reviewed node-forge advisory GHSA-86w9-cpqp-85rv, with no patched version listed. See `ANDROID_BUILD.md` for the current build and security status.
