# Direct APK test build

The direct-APK test plan is INR 99 for 30 days. Test mode does not charge real money. The server creates an order, verifies its HMAC signature and fetches the captured payment before applying an entitlement. Repeated verification does not extend the same purchase twice. Expired entitlements stop authorizing downloads.

## Private configuration

- The supplied test keys are in the ignored `backend/.env`. Regenerate this exposed key pair in Razorpay and replace those values locally and on the test backend. Never use `EXPO_PUBLIC_` for the key secret.
- Firebase public Android configuration and a private local backend credential file already exist. Verify Firebase Authentication provider settings and the release signing certificate fingerprints; file presence alone does not confirm dashboard configuration.
- Deploy a separate development/test backend with `NODE_ENV=development`, matching Firebase credentials, persistent database and the regenerated Razorpay test key pair. Test billing refuses to run on a production server. Enable automatic payment capture for the test account.
- Set `EXPO_PUBLIC_API_URL` in the EAS preview environment to that backend's public HTTPS URL ending in `/api`. The current fallback remains the existing Render endpoint. Local `.env` is excluded from upload; it is not automatically applied to cloud builds.

## Build and verification

`npx eas-cli build --platform android --profile preview` creates an installable APK using the existing Expo signing credentials. `.easignore` excludes backend source, private credentials, environment files, databases and certificates. Android native files are regenerated from Expo configuration.

Native compatibility patches run automatically after dependency installation. They adapt Track Player's nullable Bundles to React Native 0.81 and set Razorpay's Android namespace. Playback registers at the application entry point before navigation. Razorpay loads only when checkout starts and is unavailable in Expo Go.

Current corrected cloud build: https://expo.dev/accounts/ronit55/projects/soundwave/builds/d5c1d693-d3e3-473c-8e91-fd11df7fbeec

The first cloud build failed because the archive excluded the vendored parser's `dist` files. The parser now ships under `vendor/image-size/lib`; archive inspection confirms its entry exists and private backend files are absent. The intermediate build was cancelled.

The APK uses SDK 54 legacy architecture (`newArchEnabled=false`) and Reanimated 3.19.5 because installed Track Player 4 does not support the New Architecture. Unused new-architecture libraries were removed. Expo's default Reanimated 4 version suggestion and Track Player's irrelevant New Architecture metadata warning are excluded specifically for this documented configuration; the postinstall script rejects an incompatible architecture or animation major version. Expo Doctor passes all 18 checks. Official guidance: https://expo.dev/changelog/sdk-54

On 2026-10-02, the supplied Razorpay test credentials returned HTTP 401 on a read-only official API check. Replace them with a freshly generated valid test pair before testing checkout. No payment was made.

The current frontend dependency audit reports five transitive high findings rooted in node-forge (GHSA-86w9-cpqp-85rv). The advisory lists no patched version. The earlier zero-vulnerability result is historical; this new finding remains pending upstream remediation: https://github.com/advisories/GHSA-86w9-cpqp-85rv

After installing on an Android phone:

1. Open, close and reopen the app, including offline startup. Check Android logs for `FATAL EXCEPTION` and React Native errors.
2. Test email verification, Google sign-in, logout and account switching.
3. Play supported audio, lock the phone, use notification controls, seek and stop.
4. Download supported tracks with a test entitlement, cancel a download and play the completed file in airplane mode.
5. Test Razorpay checkout success/cancellation; verify that failed, uncaptured and wrong-account payments cannot activate access. Test payments are not production billing.
6. Check installed release certificate SHA-1/SHA-256 in Firebase if Google sign-in reports a developer/configuration error.

No connected Android device or working local Java toolchain was detected. An APK build and Hermes export cannot prove absence of installed-device crashes.

## Razorpay dashboard screenshot

For app verification, provide the genuine public app listing/download page and a separate test login that the reviewer can use. Do not enter a fake app link or your personal account password. Ask Razorpay support which unpublished/direct-APK link they accept if the form expects a store listing. The existing test key pair does not require charging a live payment.

Production billing remains outside this test integration: real live keys, webhooks/reconciliation, refund handling, store billing compliance and live-account verification need separate implementation before charging users. Do not enable live keys in this test-only service.

2026-10-02: the previous corrected build d5c1d693-d3e3-473c-8e91-fd11df7fbeec finished successfully. A separate UI-refresh build is being submitted; see UI_CHANGES.md for its included fixes and remaining phone checks. The previous APK does not contain those UI changes.
UI-refresh build: https://expo.dev/accounts/ronit55/projects/soundwave/builds/207564cd-e61b-41b7-ba7c-26998d197382 (submitted; result pending).

2026-10-03 final authentication/playback fixes: https://expo.dev/accounts/ronit55/projects/soundwave/builds/791ce885-3d39-4e4e-81ef-d9f7c1852680 (submitted, result pending). See FINAL_REVIEW.md.
