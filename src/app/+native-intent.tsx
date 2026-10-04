// Track Player emits a system intent, not an application screen URL.
export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  if (/^(?:(?:soundwave|trackplayer):\/\/)?\/?notification\.click(?:[/?#]|$)/i.test(path)) {
    return '/player/now-playing';
  }
  return path;
}
