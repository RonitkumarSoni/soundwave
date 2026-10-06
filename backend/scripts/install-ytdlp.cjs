const { mkdir, readFile, writeFile, rename, chmod } = require('node:fs/promises');
const { createHash } = require('node:crypto');
const path = require('node:path');
const version = '2026.08.19';
// SHA-256 values from this release's official SHA2-256SUMS manifest.
const checksums = {
  'yt-dlp.exe': '66674953fe251b89f4d08c5f0e35e0728679bd67ab3d7d05c0562af101dd3e7a',
  yt_dlp_linux: '58162f9bfdc27458ea47bfcb311cf47028f17d8154a8bf7d689861d46399230a',
};
const filename = process.platform === 'win32' ? 'yt-dlp.exe' : process.platform === 'linux' && process.arch === 'x64' ? 'yt-dlp_linux' : null;
async function install() {
  if (process.env.YTDLP_BINARY || process.env.YTDLP_PYTHON) return;
  if (!filename) throw new Error('Set YTDLP_BINARY for this platform');
  const root = `https://github.com/yt-dlp/yt-dlp/releases/download/${version}`;
  const expected = filename === 'yt-dlp.exe' ? checksums['yt-dlp.exe'] : checksums.yt_dlp_linux;
  if (!expected || !/^[a-f0-9]{64}$/i.test(expected)) throw new Error('Extractor checksum not found');
  const directory = path.resolve(__dirname, '../bin');
  const target = path.join(directory, process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');
  const hash = bytes => createHash('sha256').update(bytes).digest('hex');
  try { if (hash(await readFile(target)) === expected) return; } catch { /* First install. */ }
  const binary = await fetch(`${root}/${filename}`, { signal: AbortSignal.timeout(120000) });
  if (!binary.ok) throw new Error(`Extractor download failed (${binary.status})`);
  const bytes = Buffer.from(await binary.arrayBuffer());
  if (hash(bytes) !== expected) throw new Error('Extractor checksum mismatch');
  await mkdir(directory, { recursive: true });
  await writeFile(target + '.tmp', bytes);
  await rename(target + '.tmp', target);
  if (process.platform !== 'win32') await chmod(target, 0o755);
  console.log(`Installed verified yt-dlp ${version}`);
}
install().catch(error => { console.error(error.message); process.exitCode = 1; });
