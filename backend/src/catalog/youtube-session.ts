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
  if (Buffer.byteLength(input) > 1024 * 1024 || input.includes('\0')) {
    throw new YoutubeSessionConfigurationError();
  }
  const lines = input.replace(/^\uFEFF/, '').split(/\r?\n/);
  if (!/^# (Netscape HTTP Cookie File|HTTP Cookie File)/.test(lines[0])) {
    throw new YoutubeSessionConfigurationError();
  }
  const cookies: string[] = [];
  for (const line of lines.slice(1)) {
    if (
      !line.trim() ||
      (line.startsWith('#') && !line.startsWith('#HttpOnly_'))
    )
      continue;
    const fields = line.replace(/^#HttpOnly_/, '').split('\t');
    if (
      fields.length !== 7 ||
      !/^(TRUE|FALSE)$/.test(fields[1]) ||
      !/^(TRUE|FALSE)$/.test(fields[3]) ||
      !/^\d+$/.test(fields[4]) ||
      !fields[5]
    ) {
      throw new YoutubeSessionConfigurationError();
    }
    const domain = fields[0].replace(/^\./, '').toLowerCase();
    if (domain !== 'youtube.com' && !domain.endsWith('.youtube.com')) continue;
    const expires = Number(fields[4]);
    if (expires !== 0 && expires <= Date.now() / 1000) continue;
    cookies.push(line);
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
