import { mkdtemp, readFile, writeFile, unlink, rmdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export class YoutubeSessionConfigurationError extends Error {
  constructor() {
    super('Invalid YouTube session configuration');
  }
}

// Only YouTube cookies belong in the extractor's cookie jar. Never log input.
export function normalizeYoutubeCookies(input: string): string {
  if (!input || Buffer.byteLength(input) > 2 * 1024 * 1024) {
    throw new YoutubeSessionConfigurationError();
  }
  // Standardize newlines and handle raw escaped newlines if saved from UI
  const rawClean = input.replace(/^\uFEFF/, '').replace(/\\n/g, '\n').replace(/\\t/g, '\t');
  const lines = rawClean.split(/\r?\n/);
  
  const cookies: string[] = [];
  let buffer = '';

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('#') && !trimmed.startsWith('#HttpOnly_')) continue;

    // Check if previous incomplete line needs to be joined
    const candidate = buffer ? `${buffer}\t${trimmed}` : trimmed;
    const cleanLine = candidate.replace(/^#HttpOnly_/, '');
    const fields = cleanLine.split(/\t+/);

    if (fields.length < 7) {
      buffer = candidate;
      continue;
    }

    buffer = '';
    const domain = fields[0].replace(/^\./, '').toLowerCase();
    if (domain !== 'youtube.com' && !domain.endsWith('.youtube.com')) continue;

    const flag1 = /^(TRUE|FALSE)$/i.test(fields[1]) ? fields[1].toUpperCase() : 'TRUE';
    const path = fields[2] || '/';
    const flag2 = /^(TRUE|FALSE)$/i.test(fields[3]) ? fields[3].toUpperCase() : 'TRUE';
    const expiry = /^\d+$/.test(fields[4]) ? fields[4] : '0';
    const name = fields[5];
    const value = fields.slice(6).join('\t');

    if (!name || !value) continue;
    cookies.push(`${fields[0]}\t${flag1}\t${path}\t${flag2}\t${expiry}\t${name}\t${value}`);
  }

  if (!cookies.length) throw new YoutubeSessionConfigurationError();
  return '# Netscape HTTP Cookie File\n' + cookies.join('\n') + '\n';
}

export async function withYoutubeSession<T>(
  run: (cookieArgs: string[], environment: NodeJS.ProcessEnv) => Promise<T>,
): Promise<T> {
  const { YTDLP_COOKIES, YTDLP_COOKIES_FILE, ...environment } = process.env;
  if (!YTDLP_COOKIES && !YTDLP_COOKIES_FILE) return run([], environment);
  let content: string;
  try {
    content = normalizeYoutubeCookies(
      YTDLP_COOKIES_FILE
        ? await readFile(YTDLP_COOKIES_FILE, 'utf8')
        : YTDLP_COOKIES!,
    );
  } catch {
    throw new YoutubeSessionConfigurationError();
  }
  // yt-dlp may update its cookie jar. Copy the read-only Render secret into a
  // private, per-request file so parallel requests cannot overwrite each other.
  const directory = await mkdtemp(join(tmpdir(), 'soundwave-youtube-'));
  const file = join(directory, 'cookies.txt');
  try {
    await writeFile(file, content, { mode: 0o600 });
    return await run(['--cookies', file], environment);
  } finally {
    await unlink(file).catch(() => {});
    await rmdir(directory).catch(() => {});
  }
}
