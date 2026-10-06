export async function checkAudioSource(source: string | undefined, uri: string, signal: AbortSignal) {
  if (source !== 'youtube' || !/^https?:\/\//.test(uri)) return;
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal.addEventListener('abort', abort, { once: true });
  if (signal.aborted) controller.abort();
  const timer = setTimeout(abort, 45000);
  try {
    const response = await fetch(uri, { method: 'HEAD', headers: { Range: 'bytes=0-0' }, signal: controller.signal });
    if (!response.ok) throw new Error(response.status === 429
      ? 'Audio request limit reached. Wait a minute before retrying.'
      : `YouTube audio service failed (HTTP ${response.status}). Please retry shortly.`);
  } catch (error) {
    if (controller.signal.aborted && !signal.aborted) throw new Error('The audio service timed out. Please retry.');
    throw error;
  } finally {
    clearTimeout(timer);
    signal.removeEventListener('abort', abort);
  }
}
