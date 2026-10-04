import axios, { type AxiosResponse } from 'axios';
import {
  BadRequestException,
  BadGatewayException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { lookup, type LookupAddress, type LookupOptions } from 'node:dns';
import { isIP } from 'node:net';

const allowedDomains = [
  'lrclib.net',
  'jiosaavn.com',
  'saavncdn.com',
  'jamendo.com',
  'jamendo.net',
  'dzcdn.net',
  'scdn.co',
  'googleusercontent.com',
  'ytimg.com',
];
export function isPublicAddress(address: string): boolean {
  if (address.includes(':')) {
    const a = address.toLowerCase();
    // Only globally routed unicast IPv6; this also rejects IPv4-mapped/local forms.
    const [first, second = '0'] = a.split(':');
    return (
      /^[23][0-9a-f]{3}:/.test(a) &&
      first !== '2002' &&
      first !== '3fff' &&
      !a.startsWith('2001:db8:') &&
      !(first === '2001' && parseInt(second || '0', 16) < 0x200)
    );
  }
  const n = address.split('.').map(Number);
  if (n.length !== 4 || n.some((x) => !Number.isInteger(x) || x < 0 || x > 255))
    return false;
  const [a, b] = n;
  return !(
    a === 0 ||
    a === 10 ||
    a === 127 ||
    a >= 224 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && (b === 168 || b === 0)) ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 198 && (b === 18 || b === 19 || b === 51)) ||
    (a === 203 && b === 0)
  );
}
export function validateRemoteUrl(value: string): URL {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new BadRequestException('Invalid remote URL');
  }
  const host = url.hostname.toLowerCase();
  if (
    url.protocol !== 'https:' ||
    (url.port && url.port !== '443') ||
    url.username ||
    url.password ||
    isIP(host) ||
    !allowedDomains.some(
      (domain) => host === domain || host.endsWith('.' + domain),
    )
  ) {
    throw new BadRequestException('Remote host is not allowed');
  }
  return url;
}
// Validation happens inside lookup so the address actually used by the socket is checked.
export const publicLookup = ((
  host: string,
  options: (LookupOptions & { all?: boolean }) | number,
  callback: (
    error: Error | null,
    address?: string | LookupAddress[],
    family?: number,
  ) => void,
) => {
  lookup(host, { all: true, verbatim: true }, (error, addresses) => {
    if (error) return callback(error);
    if (
      !addresses.length ||
      addresses.some((item) => !isPublicAddress(item.address))
    )
      return callback(new Error('Private destination rejected'));
    const family = typeof options === 'number' ? options : options?.family;
    const filtered = family
      ? addresses.filter((item) => item.family === family)
      : addresses;
    if (!filtered.length) return callback(new Error('No public address'));
    if (typeof options !== 'number' && options.all) callback(null, filtered);
    else callback(null, filtered[0].address, filtered[0].family);
  });
}) as typeof lookup;
let activeFetches = 0;
export async function fetchRemote<T = unknown>(
  value: string,
  maxBytes = 2 * 1024 * 1024,
  responseType: 'json' | 'arraybuffer' | 'text' = 'json',
): Promise<AxiosResponse<T>> {
  if (activeFetches >= 4)
    throw new ServiceUnavailableException(
      'Remote requests are busy. Retry shortly.',
    );
  activeFetches++;
  try {
    return await fetchBounded<T>(value, maxBytes, responseType);
  } finally {
    activeFetches--;
  }
}
async function fetchBounded<T>(
  value: string,
  maxBytes: number,
  responseType: 'json' | 'arraybuffer' | 'text',
) {
  let current = validateRemoteUrl(value);
  const started = Date.now();
  for (let redirect = 0; redirect <= 3; redirect++) {
    try {
      const response = await axios.get<T>(current.toString(), {
        responseType,
        timeout: Math.max(1, 15000 - (Date.now() - started)),
        maxContentLength: maxBytes,
        maxBodyLength: maxBytes,
        maxRedirects: 0,
        proxy: false,
        lookup: publicLookup,
        validateStatus: (status) => status >= 200 && status < 400,
      });
      if (response.status >= 300) {
        const location: unknown = response.headers.location;
        if (typeof location !== 'string' || redirect === 3)
          throw new BadGatewayException('Remote redirect limit exceeded');
        current = validateRemoteUrl(new URL(location, current).toString());
        continue;
      }
      return response;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof BadGatewayException
      )
        throw error;
      throw new BadGatewayException('Remote content unavailable');
    }
  }
  throw new BadGatewayException('Remote content unavailable');
}
