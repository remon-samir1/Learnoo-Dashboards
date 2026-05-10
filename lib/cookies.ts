// Simple cookie utility to replace js-cookie dependency
//src/lib/cookies.ts
export interface CookieAttributes {
  expires?: number | Date;
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
}

export function set(name: string, value: string, options: CookieAttributes = {}): void {
  if (typeof document === 'undefined') return;

  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

  if (options.expires) {
    if (typeof options.expires === 'number') {
      const date = new Date();
      date.setDate(date.getDate() + options.expires);
      cookieString += `; expires=${date.toUTCString()}`;
    } else {
      cookieString += `; expires=${options.expires.toUTCString()}`;
    }
  }

  if (options.path) {
    cookieString += `; path=${options.path}`;
  } else {
    cookieString += '; path=/';
  }

  if (options.domain) {
    cookieString += `; domain=${options.domain}`;
  }

  if (options.secure) {
    cookieString += '; secure';
  }

  if (options.sameSite) {
    cookieString += `; samesite=${options.sameSite}`;
  }

  document.cookie = cookieString;
}

export function get(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;

  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [cookieName, cookieValue] = cookie.trim().split('=');
    if (decodeURIComponent(cookieName) === name) {
      return decodeURIComponent(cookieValue);
    }
  }
  return undefined;
}

export function remove(name: string, options: Pick<CookieAttributes, 'path' | 'domain'> = {}): void {
  if (typeof document === 'undefined') return;

  const removeOptions: CookieAttributes = {
    ...options,
    expires: new Date(0),
  };
  set(name, '', removeOptions);
}

const Cookies = {
  set,
  get,
  remove,
};

export default Cookies;
