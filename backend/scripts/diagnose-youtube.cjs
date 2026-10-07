// Run on the backend host; never print signed URLs or raw extractor output.
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const path = require('node:path');
const { withYoutubeSession, YoutubeSessionConfigurationError } = require('../dist/catalog/youtube-session');
const run = promisify(execFile);
const binary = process.env.YTDLP_PYTHON || process.env.YTDLP_BINARY || path.resolve(__dirname, '../bin', process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');
function classify(error) {
  if (error instanceof YoutubeSessionConfigurationError) return 'youtube-session-invalid';
  const text = error.stderr || '';
  return /sign in|not a bot|login required/i.test(text) ? 'upstream-sign-in-required'
    : /signature|decipher|javascript runtime|challenge solving/i.test(text) ? 'player-challenge-failed'
    : /private|unavailable|removed|restricted/i.test(text) ? 'video-unavailable'
    : error.code === 'ENOENT' ? 'extractor-not-installed'
    : error.killed ? 'extractor-timeout' : 'extraction-failed';
}
(async () => {
  console.log(JSON.stringify({ host: process.env.RENDER ? 'render' : 'local', node: process.version }));
  for (const id of ['x--zeOqqeFc', '-xjhuuVXcF0']) {
    let stage = 'extraction';
    try {
      const { stdout } = await withYoutubeSession((cookieArgs, env) => run(binary, [
        ...(process.env.YTDLP_PYTHON ? ['-m', 'yt_dlp'] : []),
        ...cookieArgs,
        '--ignore-config', '--no-cache-dir', '--no-playlist', '--no-warnings',
        '--skip-download', '--dump-single-json', '--format', 'bestaudio[ext=m4a]/bestaudio',
        '--socket-timeout', '10', '--retries', '0', '--extractor-retries', '0',
        '--js-runtimes', 'node', `https://www.youtube.com/watch?v=${id}`,
      ], { timeout: 30000, maxBuffer: 8 * 1024 * 1024, windowsHide: true, env }));
      const info = JSON.parse(stdout);
      const media = new URL(info.url);
      if (media.protocol !== 'https:' || !media.hostname.endsWith('.googlevideo.com')) throw new Error('Invalid media host');
      stage = 'audio-download';
      const response = await fetch(media, {
        headers: { Range: 'bytes=0-1023', 'User-Agent': info.http_headers?.['User-Agent'] || 'Mozilla/5.0' },
        signal: AbortSignal.timeout(20000), redirect: 'error',
      });
      const type = response.headers.get('content-type') || '';
      let bytes = 0;
      const reader = response.body?.getReader();
      if (reader) {
        try { bytes = (await reader.read()).value?.length || 0; }
        finally { await reader.cancel(); }
      }
      const pass = response.ok && /^audio\//i.test(type) && bytes > 0;
      console.log(JSON.stringify({ id, stage, status: response.status, type, bytes, pass }));
      if (!pass) process.exitCode = 1;
    } catch (error) {
      console.log(JSON.stringify({ id, stage, pass: false, reason: stage === 'extraction' ? classify(error) : 'audio-download-failed' }));
      process.exitCode = 1;
    }
  }
})().catch(() => { console.error('Diagnostic failed'); process.exitCode = 1; });
