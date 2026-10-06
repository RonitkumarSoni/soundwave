const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
test('account refresh renews an expired token once and retries the protected profile', async () => {
  let intercept, calls = 0, forced = 0;
  const auth = { currentUser: { uid: 'alice', getIdToken: async force => { if (force) forced++; return 'test-token'; } } };
  const api = load('src/lib/api.ts', {
    './publicData': {}, './jiosaavn': {}, './tracks': load('src/lib/tracks.ts'),
    './config': { API_BASE: 'https://backend.example/api' }, './firebase': { auth },
    'react-native': { Platform: { OS: 'android' } },
    axios: { create: () => ({ interceptors: { request: { use: fn => { intercept = fn; } } }, get: async url => {
      await intercept({ url, method: 'get', headers: {} });
      calls++;
      if (calls === 1) throw { response: { status: 401 } };
      return { data: { id: 'alice' } };
    } }) },
  }).api;
  assert.equal((await api.auth.me()).id, 'alice');
  assert.equal(forced, 1);
  assert.equal(calls, 2);
});
test('public YouTube catalog does not depend on Firebase refresh; protected reads still do', async () => {
  let intercept, refreshes = 0;
  const api = load('src/lib/api.ts', {
    './publicData': {}, './jiosaavn': {}, './tracks': load('src/lib/tracks.ts'),
    './config': { API_BASE: 'https://backend.example/api' },
    './firebase': { auth: { currentUser: { uid: 'alice', getIdToken: async () => { refreshes++; throw Error('Firebase offline'); } } } },
    'react-native': { Platform: { OS: 'android' } },
    axios: { create: () => ({ interceptors: { request: { use: fn => { intercept = fn; } } }, get: async url => { await intercept({ url, method: 'get', headers: {} }); return { data: { results: [] } }; } }) },
  }).api;
  await api.getYoutubeHits();
  assert.equal(refreshes, 0);
  await assert.rejects(intercept({ url: '/users/me', method: 'get', headers: {} }), /Firebase offline/);
  assert.equal(refreshes, 1);
});
test('notification inbox rejects stale account reads and preserves incoming messages during hydration', async () => {
  let uid = 'alice', finish;
  const store = load('src/stores/useNotificationStore.ts', {
    '@/lib/accountStorage': { getStorageAccount: () => uid, accountStorage: { getItem: () => new Promise(resolve => { finish = resolve; }), setItem: async () => {} } },
  }).useNotificationStore;
  const pending = store.getState().load('alice');
  const item = { id: 'new', title: 'Alert', message: 'Hello', receivedAt: 1, read: false };
  store.getState().receive('alice', item);
  finish('[]'); await pending;
  assert.equal(store.getState().items.length, 1);
  const stale = store.getState().load('alice');
  uid = 'bob'; await store.getState().load(null);
  finish(JSON.stringify([item])); await stale;
  assert.equal(store.getState().items.length, 0);
});
function load(file, mocks = {}, globals = {}) {
  const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(output, { module, exports: module.exports, require: name => name in mocks ? mocks[name] : require(name), console, setTimeout, clearTimeout, URL, URLSearchParams, AbortController, ...globals });
  return module.exports;
}

test('concurrent profile restores share a request and 429 observes Retry-After without token refresh', async () => {
  let calls = 0, release, refreshes = 0;
  const auth = { currentUser: { uid: 'alice', getIdToken: async () => { refreshes++; return 'token'; } } };
  const api = load('src/lib/api.ts', {
    './publicData': {}, './jiosaavn': {}, './tracks': load('src/lib/tracks.ts'),
    './config': { API_BASE: 'https://backend.example/api' }, './firebase': { auth },
    'react-native': { Platform: { OS: 'android' } },
    axios: { create: () => ({ interceptors: { request: { use() {} } }, get: () => {
      calls++; return new Promise((resolve, reject) => { release = () => reject({ response: { status: 429, headers: { 'retry-after': '60' } } }); });
    } }) },
  }).api;
  const first = api.auth.me(), second = api.auth.me();
  assert.equal(first, second);
  release();
  await assert.rejects(first, error => error.response.status === 429);
  await assert.rejects(api.auth.me(), error => error.response.status === 429);
  assert.equal(calls, 1);
  assert.equal(refreshes, 0);
});

test('YouTube preflight distinguishes server failure from missing song and permits local audio', async () => {
  let calls = 0, status = 503;
  const { checkAudioSource } = load('src/lib/audioSource.ts', {}, { fetch: async (_, options) => {
    calls++; assert.equal(options.method, 'HEAD'); return { ok: status === 206, status };
  } });
  const signal = new AbortController().signal;
  await assert.rejects(checkAudioSource('youtube', 'https://backend.example/api/youtube/stream/123', signal), /HTTP 503/);
  status = 206;
  await checkAudioSource('youtube', 'https://backend.example/api/youtube/stream/123', signal);
  await checkAudioSource('youtube', 'file:///download.m4a', signal);
  assert.equal(calls, 2);
});

test('Expo Go startup and sign-out do not load the unavailable Google native module', async () => {
  const google = load('src/lib/googleSignIn.native.ts', {
    'expo-constants': { executionEnvironment: 'storeClient' },
    'firebase/auth': {}, './firebase': { auth: {} },
  });
  await google.clearGoogleSession();
  await assert.rejects(google.signInGoogle(), /development build/);
});

for (const environment of ['bare', 'storeClient']) {
test(`modern audio engine retains playback in ${environment} with supported background controls only`, async () => {
  const storage = load('src/lib/accountStorage.ts', { '@react-native-async-storage/async-storage': { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} } });
  const tracks = load('src/lib/tracks.ts');
  const store = load('src/stores/usePlayerStore.ts', {
    '@/lib/accountStorage': storage, '@/lib/tracks': tracks,
    '@/services/downloadService': { cancelDownloads() {}, verifyDownloads: async () => [] },
    'react-native-toast-message': { show() {} }, 'react-native': { Platform: { OS: 'android' } },
  }).usePlayerStore;
  const instances = [];
  let audioMode;
  let checkFailure;
  const engine = load('src/services/audioPlayback.ts', {
    'expo-constants': { executionEnvironment: environment },
    'expo-audio': { setAudioModeAsync: async mode => { audioMode = mode; }, createAudioPlayer: source => {
      const player = { isLoaded: true, duration: 100, seeks: [], playing: false,
        addListener: (_, fn) => { player.status = fn; return { remove: () => { player.listenerRemoved = true; } }; },
        setActiveForLockScreen: active => { assert.notEqual(environment, 'storeClient'); player.lockScreen = active; },
        remove: () => { player.removed = true; },
        setPlaybackRate: rate => { player.rate = rate; }, play() { player.playing = true; }, pause() { player.playing = false; },
        seekTo: async seconds => { player.seeks.push(seconds); },
      }; player.uri = source.uri; instances.push(player); return player;
    } },
    'react-native': { Platform: { OS: 'android' } }, '@/stores/usePlayerStore': { usePlayerStore: store },
    '@/stores/useSettingsStore': { useSettingsStore: { getState: () => ({ offlineMode: false }), subscribe: () => () => {} } },
    '@/lib/tracks': tracks, './previewCache': { previewFile: async track => tracks.audioUri(track) },
    '@/lib/audioSource': { checkAudioSource: async () => { if (checkFailure) throw checkFailure; } },
    '@/lib/config': { API_BASE: 'https://current-backend.example/api' },
  });
  const one = { id: '1', source: 'youtube', name: 'One', audio: 'https://backend.example/one' };
  const two = { ...one, id: '2', name: 'Two', audio: 'https://backend.example/two' };
  store.getState().setQueue([one, two]); store.getState().setTrack(one);
  await engine.ensurePlayer();
  await new Promise(resolve => setTimeout(resolve, 0));
  const first = instances[0]; assert.equal(first.lockScreen, environment === 'bare' ? true : undefined);
  assert.equal(store.getState().isAudioLoading, true);
  first.status({ isLoaded: false, isBuffering: true });
  assert.equal(store.getState().isAudioLoading, true);
  first.status({ isLoaded: true, isBuffering: false, currentTime: 0, duration: 100, playing: true });
  assert.equal(store.getState().isAudioLoading, false);
  first.status({ isLoaded: true, isBuffering: true, currentTime: 0, duration: 100, playing: true });
  assert.equal(store.getState().isAudioLoading, true);
  first.status({ isLoaded: true, isBuffering: false, currentTime: 0, duration: 100, playing: true });
  assert.equal(audioMode.shouldPlayInBackground, environment === 'bare');
  assert.equal(first.uri, 'https://current-backend.example/api/youtube/stream/1', 'saved tracks must use the current backend instead of a stale server URL');
  await engine.seekNative(0.5); assert.equal(first.seeks[0], 50);
  store.setState({ playbackRate: 1.5, repeatMode: 'one' });
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(first.rate, 1.5); assert.equal(first.loop, true);
  first.status({ isLoaded: true, currentTime: 50, duration: 100, playing: true });
  first.status({ isLoaded: true, currentTime: 50, duration: 100, playing: false });
  assert.equal(store.getState().isPlaying, false);
  store.setState({ repeatMode: 'off', isPlaying: true });
  first.status({ isLoaded: true, currentTime: 100, duration: 100, playing: false, didJustFinish: true, loop: false });
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(store.getState().currentTrack.id, '2'); assert.equal(first.removed, true);
  const second = instances[1];
  store.getState().setTrack(one);
  assert.equal(store.getState().currentTrack.id, '1', 'mini-player track is available on the first tap');
  assert.equal(second.playing, false, 'old audio stops before awaiting the new source');
  assert.equal(second.listenerRemoved, true);
  second.status({ isLoaded: true, currentTime: 100, duration: 100, playing: true, didJustFinish: true });
  assert.equal(store.getState().currentTrack.id, '1', 'removed player cannot advance the new selection');
  store.getState().setTrack(two);
  store.getState().setTrack(one);
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(instances.filter(item => item.playing && !item.removed).length, 1);
  engine.disposePlayer();
  assert.equal(instances.filter(item => item.playing && !item.removed).length, 0);
  await engine.ensurePlayer();
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(instances.filter(item => item.playing && !item.removed).length, 1);
  const afterRestart = instances.length;
  store.getState().setTrack(two);
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(instances.length, afterRestart + 1, 'restart does not duplicate subscriptions');
  store.getState().stop(); await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(instances.every(item => item.removed), true);
  assert.equal(store.getState().isAudioLoading, false);
  checkFailure = new Error('Audio service unavailable');
  store.getState().setTrack(one);
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(store.getState().isAudioLoading, false, 'failed audio request must not leave an endless loader');
  assert.ok(store.getState().audioError, 'failed audio should display a retry error instead of loading forever');
  engine.disposePlayer();
});
}

test('token refresh keeps completed onboarding and account changes wait for settings', async () => {
  let settingsLoads = 0, finishSettings;
  const alice = { uid: 'alice', emailVerified: true, providerData: [] };
  const bob = { uid: 'bob', emailVerified: true, providerData: [] };
  const auth = { currentUser: alice };
  const store = load('src/stores/useAuthStore.ts', {
    'firebase/auth': { signOut: async () => {} }, '@/lib/firebase': { auth },
    '@/lib/config': { API_BASE: 'https://backend.example/api' },
    '@/lib/api': { api: { auth: { me: async () => ({ id: auth.currentUser.uid }) } } },
    './usePlayerStore': { usePlayerStore: { getState: () => ({ switchAccount: async () => {} }) } },
    './useSettingsStore': { useSettingsStore: { getState: () => ({ loadFromStorage: async () => {
      settingsLoads++;
      if (settingsLoads === 2) await new Promise(resolve => { finishSettings = resolve; });
    } }) } },
    '@/lib/googleSignIn': { clearGoogleSession: async () => {} },
    '@/services/pushNotifications': { disablePushNotifications: async () => {} },
  }).useAuthStore;
  await store.getState().syncUser(alice);
  await store.getState().syncUser(alice);
  assert.equal(settingsLoads, 1, 'same-account token refresh must not reload onboarding settings');
  auth.currentUser = bob;
  const pending = store.getState().syncUser(bob);
  while (!finishSettings) await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(store.getState().isLoading, true);
  finishSettings(); await pending;
  assert.equal(store.getState().isLoading, false);
  assert.equal(store.getState().firebaseUser.uid, 'bob');
});

test('settings hydration never transiently clears completed onboarding; reset preserves it', async () => {
  let finish;
  const store = load('src/stores/useSettingsStore.ts', {
    '@/lib/accountStorage': { getStorageAccount: () => 'alice', accountStorage: {
      getItem: () => new Promise(resolve => { finish = resolve; }), setItem: async () => {},
    } },
  }).useSettingsStore;
  store.getState().updateSetting('hasSeenOnboarding', true);
  const seen = [];
  const unsubscribe = store.subscribe(state => seen.push(state.hasSeenOnboarding));
  const pending = store.getState().loadFromStorage();
  assert.equal(store.getState().hasSeenOnboarding, true);
  finish(JSON.stringify({ hasSeenOnboarding: true })); await pending;
  store.getState().resetToDefaults();
  assert.equal(store.getState().hasSeenOnboarding, true);
  assert.equal(seen.includes(false), false);
  unsubscribe();
});
test('provider IDs remain distinct and local audio takes priority', () => {
  const tracks = load('src/lib/tracks.ts');
  assert.equal(tracks.sameTrack({ id: '1', source: 'youtube' }, { id: '1', source: 'spotify' }), false);
  assert.equal(tracks.audioUri({ localUri: 'file:///music.m4a', audio: 'https://remote.test/audio' }), 'file:///music.m4a');
  assert.equal(tracks.audioUri({ source: 'spotify', audiodownload: 'https://open.spotify.com/track/1' }), '');
});

test('home YouTube tracks use the deployed stream URL rather than an unplayable relative path', () => {
  const tracks = load('src/lib/tracks.ts');
  const raw = { id: 'BGU1YL9LNr4', name: 'Song', source: 'youtube', audio: '/api/youtube/stream/BGU1YL9LNr4' };
  const normalized = tracks.normalizeBackendTrack(raw, 'https://backend.example/api/');
  assert.equal(tracks.audioUri(normalized), 'https://backend.example/api/youtube/stream/BGU1YL9LNr4');
  assert.equal(raw.audio, '/api/youtube/stream/BGU1YL9LNr4');
  assert.equal(tracks.normalizeBackendTrack({ ...raw, source: 'itunes', audio: 'https://audio.example/preview.m4a' }, 'https://backend.example/api').audio, 'https://audio.example/preview.m4a');
});

test('notification system intents open the player and preserve normal routes', () => {
  const { redirectSystemPath } = load('src/app/+native-intent.tsx');
  for (const path of ['soundwave://notification.click', 'trackplayer://notification.click', '/notification.click', 'soundwave://notification.click?x=1']) {
    assert.equal(redirectSystemPath({ path, initial: true }), '/player/now-playing');
  }
  assert.equal(redirectSystemPath({ path: '/(search)', initial: false }), '/(search)');
  assert.equal(redirectSystemPath({ path: 'soundwave://notification.click.evil', initial: true }), 'soundwave://notification.click.evil');
});

test('signed-out verification screen recovers; verified Google sessions skip verification', () => {
  const { authRedirect } = load('src/lib/authRoute.ts');
  const state = { isLoggedIn: false, emailVerified: false, hasSeenOnboarding: true };
  assert.equal(authRedirect(state, ['(auth)', 'verify-email']), '/(auth)/welcome');
  assert.equal(authRedirect(state, ['(auth)', 'login']), null);
  assert.equal(authRedirect({ ...state, isLoggedIn: true, emailVerified: true }, ['(auth)', 'verify-email']), '/(home)');
  assert.equal(authRedirect({ ...state, isLoggedIn: true, emailVerified: true, hasSeenOnboarding: false }, ['(auth)', 'welcome']), '/onboarding');
  assert.equal(authRedirect({ ...state, isLoggedIn: true, emailVerified: true, hasSeenOnboarding: false }, ['onboarding']), null);
  assert.equal(authRedirect({ ...state, isLoggedIn: true, emailVerified: true, hasSeenOnboarding: true }, ['onboarding']), '/(home)');
  assert.equal(authRedirect({ ...state, isLoggedIn: true }, ['(home)']), '/(auth)/verify-email');
});

test('logout and cold signed-out hydration reject delayed account responses', async () => {
  let finishProfile, googleCleared = 0;
  const user = { uid: 'alice', emailVerified: true, providerData: [{ providerId: 'google.com' }] };
  const auth = { currentUser: user };
  const store = load('src/stores/useAuthStore.ts', {
    'firebase/auth': { signOut: async () => { auth.currentUser = null; } },
    '@/lib/firebase': { auth },
    '@/lib/config': { API_BASE: 'https://backend.example/api' },
    '@/lib/api': { api: { auth: { me: () => new Promise(resolve => { finishProfile = resolve; }) } } },
    './usePlayerStore': { usePlayerStore: { getState: () => ({ switchAccount: async () => {} }) } },
    './useSettingsStore': { useSettingsStore: { getState: () => ({ loadFromStorage: async () => {} }) } },
    '@/lib/googleSignIn': { clearGoogleSession: async () => { googleCleared++; } },
    '@/services/pushNotifications': { disablePushNotifications: async () => {} },
  }).useAuthStore;
  const pending = store.getState().syncUser(user);
  while (!finishProfile) await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(store.getState().emailVerified, true);
  await store.getState().logout();
  finishProfile({ id: 'alice', is_premium: true });
  await pending;
  assert.equal(store.getState().isLoggedIn, false);
  assert.equal(store.getState().user, null);
  assert.equal(googleCleared, 1);
  await store.getState().syncUser(null);
  assert.equal(store.getState().isLoading, false);
});

test('preview cache validates sources, reuses files and cleans failed downloads', async () => {
  const files = new Map(); let downloads = 0, status = 200;
  const fsMock = {
    cacheDirectory: 'file:///cache/', makeDirectoryAsync: async () => {},
    getInfoAsync: async name => files.has(name) ? { exists: true, isDirectory: false, size: files.get(name) } : { exists: false },
    readDirectoryAsync: async () => [],
    downloadAsync: async (_, file) => { downloads++; files.set(file, 123); return { status }; },
    moveAsync: async ({ from, to }) => { files.set(to, files.get(from)); files.delete(from); },
    deleteAsync: async name => { files.delete(name); },
  };
  const { previewFile } = load('src/services/previewCache.native.ts', { 'expo-file-system/legacy': fsMock });
  const track = { id: '1', source: 'itunes', audio: 'https://audio-ssl.itunes.apple.com/test.m4a' };
  assert.equal(await previewFile(track), 'file:///cache/audio-previews/1.m4a');
  await previewFile(track); assert.equal(downloads, 1);
  await assert.rejects(previewFile({ ...track, audio: 'https://evil.example/test.m4a' }));
  status = 403;
  await assert.rejects(previewFile({ ...track, id: '2' }));
  assert.equal([...files.keys()].some(name => name.endsWith('.partial')), false);
});
test('account switch discards delayed reads and keeps writes scoped', async () => {
  const values = new Map();
  let release;
  const storage = load('src/lib/accountStorage.ts', { '@react-native-async-storage/async-storage': {
    getItem: key => new Promise(resolve => { release = () => resolve(values.get(key) || null); }),
    setItem: async (key, value) => { values.set(key, value); },
    removeItem: async key => values.delete(key),
    getAllKeys: async () => [...values.keys()],
    multiRemove: async keys => keys.forEach(key => values.delete(key)),
  } });
  storage.setStorageAccount('alice');
  await storage.accountStorage.setItem('likes', 'alice-only');
  const pending = storage.accountStorage.getItem('likes');
  await Promise.resolve();
  storage.setStorageAccount('bob');
  release();
  assert.equal(await pending, null);
  await storage.accountStorage.setItem('likes', 'bob-only');
  assert.equal(values.get(storage.accountKey('likes', 'alice')), 'alice-only');
  await storage.clearAccountStorage('alice');
  assert.equal(values.get(storage.accountKey('likes', 'bob')), 'bob-only');
});
test('catalog requests are deduplicated and cached arrays cannot be mutated by callers', async () => {
  let calls = 0;
  const data = load('src/lib/publicData.ts', { axios: { get: async () => { calls++; return { data: { tracks: ['a', 'b'] } }; } } });
  const [first, second] = await Promise.all([data.publicData('https://example.test/catalog'), data.publicData('https://example.test/catalog')]);
  first.tracks.reverse();
  assert.equal(calls, 1);
  assert.equal(second.tracks[0], 'a');
  assert.equal((await data.publicData('https://example.test/catalog')).tracks[0], 'a');
});
test('repeat off stops at queue end; repeat all wraps; same-track restart advances revision', async () => {
  const storage = load('src/lib/accountStorage.ts', { '@react-native-async-storage/async-storage': { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} } });
  const store = load('src/stores/usePlayerStore.ts', {
    '@/lib/accountStorage': storage,
    '@/lib/tracks': load('src/lib/tracks.ts'),
    '@/services/downloadService': { cancelDownloads() {}, verifyDownloads: async () => [], downloadTrack: async () => { throw Error('unavailable'); }, deleteDownload: async () => {} },
    'react-native-toast-message': { show() {} },
    'react-native': { Platform: { OS: 'web' } },
  }).usePlayerStore;
  const one = { id: '1', source: 'youtube', name: 'One', duration: 60 };
  const two = { id: '2', source: 'youtube', name: 'Two', duration: 60 };
  store.getState().setQueue([one, two]);
  store.getState().setTrack(two);
  store.getState().finishTrack();
  assert.equal(store.getState().isPlaying, false);
  store.setState({ repeatMode: 'all' });
  store.getState().finishTrack();
  assert.equal(store.getState().currentTrack.id, '1');
  const revision = store.getState().playbackRevision;
  store.setState({ repeatMode: 'one' });
  store.getState().finishTrack();
  assert.equal(store.getState().playbackRevision, revision + 1);
  storage.setStorageAccount('alice');
  store.getState().toggleLike(one);
  await store.getState().switchAccount('bob');
  assert.equal(store.getState().likedTracks.length, 0);
  assert.equal(store.getState().currentTrack, null);
});

test('security overrides preserve routing, asset parsing and native project identifiers', () => {
  const query = require('query-string');
  const decoder = require('decode-uri-component');
  const encoded = query.stringify({ play: 'song 1', source: 'jiosaavn' });
  assert.equal(query.parse(encoded).play, 'song 1');
  assert.equal(decoder('%E0%A4%B9%E0%A4%BF%E0%A4%82%E0%A4%A6%E0%A5%80'), 'हिंदी');
  const started = Date.now();
  assert.equal(typeof decoder('%FF'.repeat(10000)), 'string');
  assert.ok(Date.now() - started < 3000, 'Malformed URI decoding must remain bounded');
  const size = require('image-size');
  assert.ok(size.default(fs.readFileSync('assets/images/icon.png')).width > 0);
  assert.deepEqual(size.default('assets/images/icon.png'), size.default(fs.readFileSync('assets/images/icon.png')));
  const project = require('xcode').project('unused.pbxproj');
  project.hash = { project: { objects: {} } };
  assert.match(project.generateUuid(), /^[A-F0-9]{24}$/);
});
