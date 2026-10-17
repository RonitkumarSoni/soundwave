// Run with a fresh Firebase ID token in RELEASE_CHECK_ID_TOKEN.
// Never write tokens or upstream response bodies to the console.
const base = 'https://soundwave-1-t5o6.onrender.com/api';
const token = process.env.RELEASE_CHECK_ID_TOKEN;
const video = process.env.RELEASE_CHECK_VIDEO_ID || 'x--zeOqqeFc';
async function check(name, path, options, validate) {
  let response;
  try {
    response = await fetch(`${base}${path}`, { ...options, signal: AbortSignal.timeout(65000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    await validate(response);
    console.log(`${name}: PASS`);
    return true;
  } catch (error) {
    console.error(`${name}: FAIL (${error instanceof Error ? error.message : 'request failed'})`);
    return false;
  } finally {
    await response?.body?.cancel().catch(() => {});
  }
}
(async () => {
  if (!token) {
    console.error('Production account check requires a fresh RELEASE_CHECK_ID_TOKEN. Release verification cannot pass without authentication.');
    process.exitCode = 1;
  }
  if (!/^[A-Za-z0-9_-]{11}$/.test(video)) throw new Error('Invalid check video ID');
  const health = await check('Production health', '/health', {}, async () => {});
  const account = token ? await check('Authenticated production account', '/users/me', {
    headers: { Authorization: `Bearer ${token}` },
  }, async response => {
    const profile = await response.json();
    if (!profile || typeof profile !== 'object' || !profile.id) throw new Error('Missing account profile');
  }) : false;
  const audio = await check('Production YouTube audio bytes', `/youtube/stream/${video}`, {
    headers: { Range: 'bytes=0-1023' },
  }, async response => {
    if (!/^audio\//i.test(response.headers.get('content-type') || '')) throw new Error('Not an audio response');
    const reader = response.body.getReader();
    try {
      const first = await reader.read();
      if (first.done || !first.value?.length) throw new Error('Empty audio stream');
    } finally {
      await reader.cancel();
      reader.releaseLock();
    }
  });
  if (!health || !account || !audio) process.exitCode = 1;
  console.log(process.exitCode ? 'RELEASE BLOCKED: production checks failed.' : 'Production checks passed for this account and video. Device playback testing is still required.');
})().catch(() => { console.error('Production check failed'); process.exitCode = 1; });
