const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
test('YouTube tracks do not enter the failing native audio proxy queue', async () => {
  let added = 0, reset = 0;
  const state = { currentTrack: { id: 'jNQXAC9IVRw', source: 'youtube' }, downloadedTracks: [], queue: [] };
  const store = { getState: () => state, subscribe: () => () => {}, setState: () => {} };
  const playback = load('src/services/playbackService.native.ts', {
    'react-native-track-player': { __esModule: true, default: { setupPlayer: async () => {}, updateOptions: async () => {}, addEventListener: () => {}, reset: async () => { reset++; }, add: async () => { added++; } }, Event: {}, State: {}, Capability: {}, RepeatMode: {}, AppKilledPlaybackBehavior: {} },
    '@/stores/usePlayerStore': { usePlayerStore: store },
    '@/stores/useSettingsStore': { useSettingsStore: { subscribe: () => () => {}, getState: () => ({ offlineMode: false }) } },
    '@/lib/tracks': load('src/lib/tracks.ts'),
    'react-native': { AppState: { currentState: 'active' } },
    './previewCache.native': {},
  });
  await playback.ensurePlayer();
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(reset, 1);
  assert.equal(added, 0);
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
  await assert.rejects(api.auth.me(), /Firebase offline/);
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
function load(file, mocks = {}) {
  const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(output, { module, exports: module.exports, require: name => name in mocks ? mocks[name] : require(name), console, setTimeout, clearTimeout, URL, URLSearchParams, AbortController });
  return module.exports;
}
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
