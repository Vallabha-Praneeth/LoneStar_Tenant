type NativeIntentRedirect = {
  initial: boolean;
  path: string;
};

export function redirectSystemPath({ path }: NativeIntentRedirect) {
  try {
    const url = new URL(path, 'lonestar-tenant://app.home');
    const pathname = url.pathname === '/--/' ? '/' : url.pathname;

    if (url.protocol === 'lonestar-tenant:' && pathname === '/') {
      return '/';
    }

    if (!pathname || pathname === '//') {
      return '/';
    }

    return `${pathname}${url.search}${url.hash}`;
  } catch {
    return '/';
  }
}
