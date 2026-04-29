type NativeIntentRedirect = {
  initial: boolean;
  path: string;
};

export function redirectSystemPath({ path }: NativeIntentRedirect) {
  try {
    const url = new URL(path, 'lonestar-tenant://app.home');
    const pathname = url.pathname === '/--/' ? '/' : url.pathname;

    if (url.protocol === 'lonestar-tenant:' && pathname === '/') {
      // Preserve query and hash so Supabase auth callbacks (PKCE ?code=, magic-link #access_token=)
      // are forwarded to the router rather than being silently dropped.
      return `/${url.search}${url.hash}`;
    }

    if (!pathname || pathname === '//') {
      return '/';
    }

    return `${pathname}${url.search}${url.hash}`;
  } catch {
    return '/';
  }
}
