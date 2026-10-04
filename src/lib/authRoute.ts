export function authRedirect(state: { isLoggedIn: boolean; emailVerified: boolean; hasSeenOnboarding: boolean }, segments: readonly string[]): string | null {
  const inAuth = segments[0] === '(auth)';
  if (!state.isLoggedIn) {
    return !inAuth || segments[1] === 'verify-email' ? '/(auth)/welcome' : null;
  }
  if (!state.emailVerified) return segments[1] === 'verify-email' ? null : '/(auth)/verify-email';
  if (!state.hasSeenOnboarding) return segments[0] === 'onboarding' ? null : '/onboarding';
  if (inAuth || segments[0] === 'onboarding') return '/(home)';
  return null;
}
