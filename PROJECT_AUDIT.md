# Soundwave project audit

Date: 2026-10-01. Reviewed the current working tree, including existing uncommitted changes. This report does not change application code.

## Assessment and scope

The app has a useful Expo Router/Zustand component structure and a modular NestJS backend, but the current implementation has release-blocking authentication, playback, authorization, payment, and offline-download defects. Treat it as a prototype until these are corrected.

Reviewed frontend routes, API client, stores, audio service, backend controllers/services/entities, dependency manifests, configuration, local installed library exports, and existing tests. The sibling CustomLyrics-Spotify browser extension is outside the React Native app audit. No production endpoints were attacked, no payment was initiated, and no real user records were modified. Android/iOS installation, physical-device background playback, production credentials, external-provider availability, and dependency vulnerability scanning were not verified.

## Verification

- Root `tsc --noEmit --pretty false`: failed, 269 diagnostic errors; 54 diagnostics originate in `src/`. Root tsconfig includes backend sources under Expo compiler rules, accounting for many additional decorator/test errors. This is not 269 independent product bugs.
- Backend `tsc --noEmit --pretty false`: passed.
- Backend Jest: one suite, one test passed. It only tests the scaffold Hello World controller; it does not establish application correctness.
- Web production export to an isolated audit output directory: failed after bundling 1,630 server-render modules because `shaka-player/dist/shaka-player.ui` could not be resolved. Import chain: root layout -> playbackService -> react-native-track-player web implementation. Existing `dist` was not overwritten.
- The E2E scaffold expects `/` to return Hello World, but AppModule registers no AppController. E2E was not run because its current setup boots real application integrations/database rather than an isolated test fixture.
- Existing working-tree changes were preserved.

## Critical and high-priority findings

0. **P1: Web production build is blocked.** Root layout statically imports the native playback service/TrackPlayer even though registration is conditional on Platform.OS. Metro resolves the web implementation and its missing Shaka dependency. Use `.native.ts`/`.web.ts` audio-service modules so the chosen Expo AV web implementation does not import TrackPlayer, or deliberately support TrackPlayer web with its required dependencies. Re-run static export after fixing this; it may reveal further Firebase/SSR issues currently masked by this first failure.

1. **P1: Frontend and backend use incompatible authentication tokens.** `src/lib/api.ts:55` sends Firebase ID tokens. `backend/src/auth/jwt.strategy.ts:10` verifies custom JWTs using JWT_SECRET. The existing `/auth/firebase` exchange is explicitly no longer called by the frontend. Protected playlist/profile requests will fail authentication against this backend. Standardize on Firebase verification with UID-to-database mapping, or restore a complete custom-token exchange/refresh flow.

2. **P1: Profile update permits mass assignment and returns the raw entity.** `backend/src/user/user.controller.ts` passes the whole request body to `UserService.update`; the TypeScript inline body type is not a validated DTO class. `backend/src/user/user.service.ts:26` forwards it to `Repository.update` and returns the complete user. A valid backend-token holder can submit entity fields such as is_premium/email/password_hash; the response can contain password_hash when populated. Use a decorated DTO, explicitly select permitted fields, and return a safe response DTO. Global ValidationPipe alone does not validate an erased inline object type.

3. **P1: Arbitrary server-side URL fetching.** `backend/src/catalog/catalog.controller.ts:22` accepts any URL for proxying; `:238` accepts audioUrl and imageUrl and buffers responses without explicit download-size limits/timeouts. These unauthenticated handlers expose SSRF and memory-exhaustion risks, subject to server network access. Resolve provider IDs server-side, allowlist hosts/protocols, reject private/reserved destinations and unsafe redirects, enforce byte/time/concurrency limits, and require authorization for downloads.

4. **P1: Missing playlist ownership checks.** `backend/src/playlist/playlist.controller.ts:46` and `:55` authenticate but do not pass the caller ID to the mutation service. `playlist.service.ts` inserts/deletes using only the supplied playlist ID. A valid backend-token holder can change someone else's playlist if they obtain its ID. Require owner-scoped lookup before every mutation and test with two distinct users.

5. **P1: Payment success is simulated.** `src/app/checkout/step2.tsx:48` and `src/app/(premium)/index.tsx:89` upgrade after a timeout following UPI launch, without transaction verification. `src/stores/useAuthStore.ts` only toggles local is_premium; `_layout.tsx:126` resets it to false upon auth initialization. Payment cancellation can still produce a verified-success message; an actual payer can lose entitlement on restart. Replace simulation with server-verified transaction/receipt processing, persisted entitlements, idempotency and restore behavior. Keep checkout unavailable until this is implemented.

6. **P1: Native player capabilities use the wrong export.** `src/app/_layout.tsx:75` reads `TrackPlayer.Capability.Play`, but the installed library exports Capability separately from its default player object. The setup catch hides this failure, leaving notification options unconfigured. Import `{ Capability }`, use a single awaited setup promise, and expose setup errors.

7. **P1: Native playlist playback does not advance automatically.** `src/hooks/useAudioPlayer.ts:101` resets the native queue and adds one track. Neither it nor `src/services/playbackService.ts` handles queue-end/active-track events. The Zustand queue never becomes the native queue; repeat-all loops the single native track. Put the full queue in TrackPlayer and synchronize native state/events, including playback errors and interruptions. Rapid switches also lack native cancellation/serialization, allowing reset/add operations to race.

8. **P1: Downloads are not reliable offline downloads.** `src/stores/usePlayerStore.ts:202` marks tracks downloaded before file completion; batch download at `:240` saves metadata only. Downloaded file URIs are never stored or selected by the audio hook. Removing a downloaded track does not remove its file. The code imports obsolete methods from `expo-file-system` rather than the SDK 54 legacy entry point/new API; installed implementations explicitly throw. The download API fallback is localhost:3000, while the main API fallback is the Render backend. Add a real download-job state machine, persisted local URI/size/status, atomic completion, retry/cancel/delete, storage limits and offline playback resolution. Verify in airplane mode after restarting the app.

9. **P1: Authenticated profile/delete controllers use the wrong user property.** `backend/src/auth/auth.controller.ts:51,60` reads req.user.userId; JwtStrategy returns `{ id, email }`. Pass req.user.id consistently. Deleting only the database user also leaves the Firebase account alive; coordinate Firebase deletion, owned records, local data and session revocation.

10. **P1: Account data leaks across local sessions.** Player-store storage keys such as liked_tracks_full, custom_playlists and downloaded_tracks are global. Logout clears only auth state. A second account on the same device inherits the first account's library/history and playback state. Namespace data by UID, clear in-memory account state on transition, stop playback, and explicitly define guest-data migration.

11. **P1: Email verification screen is bypassed by routing.** `_layout.tsx` treats any Firebase user as logged in and redirects every authenticated auth-group route home, including verify-email. The guard does not check emailVerified. Model initializing/unverified/verified states and gate the verification route intentionally; enforce verification server-side where required.

## Correctness, architecture and operational findings

12. **P2: Playlist API contract is inconsistent.** Frontend playlist rename calls PATCH `/playlists/:id`, but no backend PATCH handler exists. GET `:id` is declared before GET `likes`, so the latter can be consumed as an ID. Move static routes first, implement rename with ownership validation, and add API contract tests.

13. **P2: Provider identity is discarded.** Playlist entries store only track_id, and the backend resolves every entry through Jamendo. The app supplies Spotify, YouTube and JioSaavn IDs. Artist/album client resolvers similarly assume JioSaavn. Store `(provider, providerTrackId)` and route every lookup through a provider adapter; distinguish playable audio, previews and external links. Reconcile the separate local custom-playlist and server-playlist models.

14. **P2: Web repeat and load-state synchronization are incomplete.** The web completion callback calls nextTrack even with repeat off; nextTrack wraps at the end. Re-selecting the same ID does not rerun the loader, so one-track queues cannot reliably restart. Repeat changes before Sound creation are not applied to the new sound. A pause during async loading can be superseded by the captured shouldPlay value. Separate user-next from automatic completion and apply current desired state after each load.

15. **P2: Remote seek uses incompatible units.** `playbackService.ts:23` sends seconds into setProgress, while the store/UI use a 0-to-1 fraction. Update time and normalized progress from the native duration. Remote commands should operate directly on the audio service and then synchronize UI; relying only on a mounted React effect weakens background behavior.

16. **P2: Rate limiting is configured but not enforced.** AppModule imports ThrottlerModule but no ThrottlerGuard/APP_GUARD binding exists in backend source. Bind it and apply stricter limits to authentication and expensive provider/download endpoints. Test 429 responses locally.

17. **P2: Database configuration is unsafe for deployment.** `backend/src/app.module.ts:12` selects the DB before ConfigModule loads `.env`; DATABASE_URL supplied only in that file can be ignored. Both DB branches set synchronize:true; Postgres disables certificate verification. Use ConfigService in forRootAsync, migrations, environment validation and verified TLS configuration.

18. **P2: JWT lifecycle is incomplete.** AuthModule/JwtStrategy allow a known fallback secret. Access and refresh tokens share the same claim shape and signing secret, with no token-type check; refresh tokens can consequently authenticate as access tokens. Strategy validation does not check current account existence. Remove fallback secrets, distinguish token types, rotate/revoke refresh tokens and reject deleted accounts—or remove this custom system when adopting Firebase-only auth.

19. **P2: Search can show stale results and hides outages.** Debouncing in `src/app/(search)/index.tsx:181` cancels pending timers but not in-flight requests. An older request can overwrite newer results. API errors frequently become empty arrays, making a provider outage look like no results. Use AbortController/request IDs, explicit partial/error states, bounded timeouts and retry UI.

20. **P2: Settings do not consistently control playback.** audioQuality defines normal/auto, but applyQuality checks medium and defaults to 320. Several fetchers hard-code 320 regardless of selection. Equalizer state only changes local sliders, not the audio engine. Implement supported settings through the audio adapter and hide or label unsupported controls.

21. **P2: Deep links do not match share links.** TrackRow shares `soundwave://track/<id>`, while the root handler looks for queryParams.id and only logs it. Web share URLs use `/track/<id>`, without a matching route. Define one source-aware URL format and resolve/play it after authentication and player initialization.

22. **P2: Microservice mode is incomplete.** Gateway has no `/api/youtube` proxy. Catalog mode loads PlaylistModule without registering JwtStrategy through AuthModule. All service modes initialize a database, even the gateway. Stabilize the monolith first, or add service-specific auth/providers/routes and independent health checks before using start:ms.

23. **P2: Repository hygiene and release setup need work.** Git tracks the root `.env` and local SQLite database. This observation does not establish that the environment file contains secrets or the database contains real user data. Review them before sharing and remove unsuitable files from tracking; rotate only credentials actually exposed. The root ignore file contains a malformed NUL-encoded entry. Generated local Android release configuration currently uses the debug signing config; distinguish this from EAS-managed release signing and verify the final artifact's certificate.

24. **P2: Quality gates are insufficient.** There is no frontend test script or explicit frontend ESLint configuration/dependency setup in the inspected project. Root typechecking includes backend code; frontend diagnostics also reveal wrong TrackRow props, inconsistent Track types, missing theme fields and Firebase platform typing. Split TS projects, define one Track model, add a non-mutating lint command and CI checks. The backend lint script currently includes --fix, unsuitable for a read-only check.

25. **P3: Performance and feature completeness.** useAudioPlayer subscribes to the entire player store inside RootLayout, causing root rerenders on every progress update. Use narrow selectors and isolate progress subscribers. Home launches multiple sequential data phases and five recommendation searches, each fanning out to three providers. Add caching/deduplication and load independent sections separately. Virtualize large queues/download/library lists. Friend activity/notifications contain mock data; equalizer and some action buttons are UI-only. Add accessibility labels/roles, meaningful empty/error states and verify font scaling and touch targets on devices.

## Recommended implementation order

1. Close SSRF/mass-assignment/ownership issues and disable simulated paid entitlement.
2. Choose one auth model; correct identity mapping, verification, profile/account deletion and per-user persistence.
3. Repair TrackPlayer setup/queue/events and native-versus-web audio adapters; then implement actual downloads and airplane-mode playback.
4. Normalize provider identities and playlist APIs; repair search races, settings and deep links.
5. Split TS configs, resolve frontend errors, configure lint/CI, migrate DB schemas and validate deployment configuration.
6. Improve performance/accessibility and replace mock/social screens only after core flows are reliable.

## Minimum release acceptance tests

- Sign up, verify email, relaunch, fetch/create/rename a playlist, sign out, and sign in as a different user.
- User B cannot mutate User A's playlist or protected user fields.
- Payment cancel/failure never grants premium; verified purchase survives relaunch and duplicate callbacks.
- Play at least three tracks with next/previous, repeat off/one/all, shuffle, seek, rapid switching and network failure.
- Lock-screen/headset controls and phone-call interruptions work on real Android/iOS devices.
- Download one track and a playlist; restart, enable airplane mode, play them, remove files, and retry failed downloads.
- Proxy rejects disallowed destinations; downloads enforce size/time limits; throttling returns 429.
- Search results correspond to the latest query; outages have retry UI; share links open the intended provider track.

## Reference documentation

- Expo SDK 54 FileSystem: https://docs.expo.dev/versions/v54.0.0/sdk/filesystem/
- NestJS throttling and required guard binding: https://docs.nestjs.com/security/rate-limiting
- Capability export was additionally verified against the installed react-native-track-player `lib/src/index.js` and TypeScript diagnostics.
