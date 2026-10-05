import React from 'react';
import { Text, TurboModuleRegistry } from 'react-native';
import { API_BASE } from '@/lib/config';

// Older development APKs cannot gain native modules through a Metro reload.
// Load WebView only when its native module exists, so route discovery stays safe.
const WebView = TurboModuleRegistry.get('RNCWebViewModule')
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ? (require('react-native-webview') as typeof import('react-native-webview')).WebView
  : null;

export default function YoutubeEmbed({ id, onError }: { id: string; onError: (message: string) => void }) {
  if (!WebView) return <Text style={{ color: '#FFF', padding: 20 }}>This installed development APK does not include the YouTube player module. Use Open in YouTube below. In-app playback needs an updated native APK.</Text>;
  const origin = new URL(API_BASE).origin;
  const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body,#player{margin:0;width:100%;height:100%;background:#000}</style></head><body><div id="player"></div><script src="https://www.youtube.com/iframe_api"></script><script>function onYouTubeIframeAPIReady(){new YT.Player('player',{videoId:${JSON.stringify(id)},width:'100%',height:'100%',playerVars:{controls:1,playsinline:1,origin:${JSON.stringify(origin)}},events:{onError:function(e){window.ReactNativeWebView.postMessage(JSON.stringify({error:e.data}));}}});}</script></body></html>`;
  return <WebView key={id} source={{ html, baseUrl: origin }} style={{ flex: 1, backgroundColor: '#000' }} javaScriptEnabled allowsFullscreenVideo allowsInlineMediaPlayback mediaPlaybackRequiresUserAction onError={() => onError('YouTube could not connect. Check your internet connection and retry.')} onMessage={event => {
    try { const message = JSON.parse(event.nativeEvent.data); if (message.error) onError([101, 150].includes(message.error) ? 'The video owner does not allow playback inside other apps. Open it in YouTube.' : 'YouTube could not play this video. You can retry or open it in YouTube.'); } catch { /* Ignore unrelated messages. */ }
  }} />;
}
