import axios from 'axios';
const cache = new Map<string, { until: number; data: any }>();
const pending = new Map<string, Promise<any>>();
export async function publicData(url: string, signal?: AbortSignal) {
  if (signal) return (await axios.get(url, { timeout: 12000, signal })).data;
  const stored = cache.get(url);
  if (stored && stored.until > Date.now()) return JSON.parse(JSON.stringify(stored.data));
  let request = pending.get(url);
  if (!request) {
    request = axios.get(url, { timeout: 12000 }).then(response => {
      if (cache.size >= 100) cache.delete(cache.keys().next().value!);
      cache.set(url, { until: Date.now() + 120000, data: response.data });
      return response.data;
    }).finally(() => pending.delete(url));
    pending.set(url, request);
  }
  return JSON.parse(JSON.stringify(await request));
}
