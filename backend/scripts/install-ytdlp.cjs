const { mkdir, readFile, writeFile, rename, chmod } = require('node:fs/promises');
const { createHash } = require('node:crypto');
const path = require('node:path');

const filename = process.platform === 'win32' ? 'yt-dlp.exe' : process.platform === 'linux' && process.arch === 'x64' ? 'yt-dlp_linux' : null;

async function install() {
  if (process.env.YTDLP_BINARY || process.env.YTDLP_PYTHON) return;
  if (!filename) throw new Error('Set YTDLP_BINARY for this platform');

  // Fetch the latest release info from GitHub API
  const releaseRes = await fetch('https://api.github.com/repos/yt-dlp/yt-dlp/releases/latest');
  if (!releaseRes.ok) throw new Error(`Failed to fetch latest release: ${releaseRes.status}`);
  const release = await releaseRes.json();
  const version = release.tag_name;
  
  // Find the required asset download URL
  const asset = release.assets.find(a => a.name === filename);
  const checksumAsset = release.assets.find(a => a.name === 'SHA2-256SUMS');
  
  if (!asset || !checksumAsset) throw new Error(`Missing assets for version ${version}`);

  // Fetch the checksums
  const checksumRes = await fetch(checksumAsset.browser_download_url);
  if (!checksumRes.ok) throw new Error('Failed to fetch checksums');
  const checksumText = await checksumRes.text();
  
  // Parse the specific checksum
  const expectedLine = checksumText.split('\n').find(line => line.endsWith(filename));
  if (!expectedLine) throw new Error('Checksum not found in manifest');
  const expected = expectedLine.split(' ')[0];

  const directory = path.resolve(__dirname, '../bin');
  const target = path.join(directory, process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');
  const hash = bytes => createHash('sha256').update(bytes).digest('hex');

  try { if (hash(await readFile(target)) === expected) return; } catch { /* First install or update needed */ }

  const binary = await fetch(asset.browser_download_url, { signal: AbortSignal.timeout(120000) });
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
