import { isPublicAddress, validateRemoteUrl } from './remote-fetch';

describe('remote URL boundary', () => {
  it.each([
    'http://www.jiosaavn.com/api.php',
    'https://127.0.0.1',
    'https://jiosaavn.com.evil.test',
    'https://user:pass@www.jiosaavn.com',
    'https://www.jiosaavn.com:444',
    'file:///etc/passwd',
  ])('rejects %s', (value) => {
    expect(() => validateRemoteUrl(value)).toThrow();
  });
  it('permits known HTTPS provider hosts', () => {
    expect(validateRemoteUrl('https://www.jiosaavn.com/api.php').hostname).toBe(
      'www.jiosaavn.com',
    );
  });
  it.each([
    '127.0.0.1',
    '10.1.2.3',
    '169.254.169.254',
    '172.16.0.1',
    '192.168.0.1',
    '100.64.0.1',
    '::1',
    '::ffff:127.0.0.1',
    'fc00::1',
    '2001:db8::1',
  ])('rejects nonpublic address %s', (address) => {
    expect(isPublicAddress(address)).toBe(false);
  });
  it('permits public addresses', () => {
    expect(isPublicAddress('8.8.8.8')).toBe(true);
    expect(isPublicAddress('2606:4700:4700::1111')).toBe(true);
  });
});
