const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const track = { id: 'song', source: 'youtube', name: 'Song', artist_name: 'Artist', duration: 180 };
function render({ current = null, loading = false, queue, open = true } = {}) {
  const events = [];
  const state = {
    currentTrack: current, isPlaying: true, isAudioLoading: loading, downloadedTracks: [],
    setTrack(value) { events.push('select'); state.currentTrack = value; },
    setQueue() { events.push('queue'); }, togglePlay() { events.push('toggle'); },
  };
  const store = selector => selector(state);
  store.getState = () => state;
  const animation = { delay() { return this; }, duration() { return this; } };
  const mocks = {
    react: { createElement: (type, props, ...children) => ({ type, props: props || {}, children }), useState: value => [value, () => {}] },
    'react-native': { View: 'View', Text: 'Text', TouchableOpacity: 'Touchable', Modal: 'Modal', ActivityIndicator: 'Spinner', StyleSheet: { create: value => value }, Platform: { OS: 'android' }, Keyboard: { dismiss: () => events.push('keyboard') } },
    'expo-router': { useRouter: () => ({ navigate: route => events.push(route) }) },
    'expo-image': { Image: 'Image' }, 'expo-blur': { BlurView: 'Blur' },
    'expo-linear-gradient': { LinearGradient: 'Gradient' },
    'expo-haptics': { ImpactFeedbackStyle: { Light: 'light' }, impactAsync: async () => {} },
    'react-native-toast-message': {}, '@expo/vector-icons': { Ionicons: 'Icon', Feather: 'Icon' },
    'react-native-reanimated': { View: 'Animated', FadeInDown: animation },
    '@/theme/colors': { colors: {}, gradients: { primary: [] }, spacing: {}, borderRadius: {} },
    '@/stores/usePlayerStore': { usePlayerStore: store }, '@/stores/useAuthStore': { useAuthStore: selector => selector({ user: null }) },
    '@/lib/api': { api: { getPopular: () => new Promise(() => {}) } },
    '@/lib/tracks': { sameTrack: (a, b) => Boolean(a && b && a.id === b.id && a.source === b.source) },
    '@/lib/share': {}, './AddToPlaylistModal': { AddToPlaylistModal: 'PlaylistModal' }, './CustomDialog': { CustomDialog: 'Dialog' },
  };
  const code = ts.transpileModule(fs.readFileSync('src/components/TrackRow.tsx', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(code, { module, exports: module.exports, require: name => {
    if (!(name in mocks)) throw Error(`Unexpected import: ${name}`);
    return mocks[name];
  } });
  const tree = module.exports.TrackRow({ track, index: 0, contextQueue: queue, openPlayerOnPress: open });
  const controls = [];
  function walk(node) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'Touchable') controls.push(node.props.onPress);
    for (const child of node.children || []) walk(child);
  }
  walk(tree);
  return { events, pressRow: controls[0], pressPlay: controls[3] };
}
test('one search result tap selects the song and opens the player without awaiting queue/network', () => {
  const row = render();
  row.pressRow();
  assert.deepEqual(row.events, ['select', 'keyboard', '/player/now-playing']);
});
test('one search play-button tap selects its queue and opens the player', () => {
  const row = render({ queue: [track] });
  row.pressPlay();
  assert.deepEqual(row.events, ['select', 'queue', 'keyboard', '/player/now-playing']);
});
test('opening an already loading search song does not pause or restart it', () => {
  const row = render({ current: track, loading: true });
  row.pressPlay();
  assert.deepEqual(row.events, ['keyboard', '/player/now-playing']);
});
