import { access, readFile } from 'node:fs/promises';
import { normalizeYoutubeCookies, withYoutubeSession } from './youtube-session';

const sample =
  '# Netscape HTTP Cookie File\n.youtube.com\tTRUE\t/\tTRUE\t0\tSID\ttest-only-value\n';

describe('YouTube session isolation', () => {
  const original = {
    cookies: process.env.YTDLP_COOKIES,
    file: process.env.YTDLP_COOKIES_FILE,
  };
  beforeEach(() => {
    delete process.env.YTDLP_COOKIES;
    delete process.env.YTDLP_COOKIES_FILE;
  });
  afterEach(() => {
    if (original.cookies === undefined) delete process.env.YTDLP_COOKIES;
    else process.env.YTDLP_COOKIES = original.cookies;
    if (original.file === undefined) delete process.env.YTDLP_COOKIES_FILE;
    else process.env.YTDLP_COOKIES_FILE = original.file;
  });

  it('retains anonymous operation when no session is configured', async () => {
    await withYoutubeSession(async (args) => expect(args).toEqual([]));
  });

  it('isolates simultaneous cookie jars, strips secret env, and removes files after use', async () => {
    process.env.YTDLP_COOKIES = sample;
    const paths: string[] = [];
    await Promise.all(
      [1, 2].map(() =>
        withYoutubeSession(async (args, env) => {
          expect(args[0]).toBe('--cookies');
          paths.push(args[1]);
          expect(env.YTDLP_COOKIES).toBeUndefined();
          expect(await readFile(args[1], 'utf8')).toBe(sample);
        }),
      ),
    );
    expect(paths[0]).not.toBe(paths[1]);
    for (const file of paths) await expect(access(file)).rejects.toThrow();
  });

  it('removes cookies even when extraction fails', async () => {
    process.env.YTDLP_COOKIES = sample;
    let file = '';
    await expect(
      withYoutubeSession(async (args) => {
        file = args[1];
        throw new Error('failed');
      }),
    ).rejects.toThrow('failed');
    await expect(access(file)).rejects.toThrow();
  });

  it('rejects invalid or expired jars without revealing their contents', () => {
    for (const value of ['private-value', sample.replace('\t0\t', '\t1\t')]) {
      expect(() => normalizeYoutubeCookies(value)).toThrow(
        'Invalid YouTube session configuration',
      );
    }
    expect(
      normalizeYoutubeCookies(
        sample + '.example.com\tTRUE\t/\tTRUE\t0\tOTHER\tprivate\n',
      ),
    ).toBe(sample);
  });
});
