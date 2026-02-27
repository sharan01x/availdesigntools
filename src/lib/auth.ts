export const AUTH_COOKIE_NAME = 'avail_auth_token';
const AUTH_TOKEN_VERSION = 'v1';
const AUTH_TOKEN_PAYLOAD = 'avail-authenticated';
const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function toBase64Url(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function signValue(value: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(value));
  return toBase64Url(signature);
}

function getSigningSecret(): string {
  return (process.env.ACCESS_SESSION_SECRET ?? process.env.ACCESS_PASSWORD ?? '').trim();
}

export function getAccessPassword(): string {
  return (process.env.ACCESS_PASSWORD ?? '').trim();
}

export function isPasswordProtectionEnabled(): boolean {
  return getAccessPassword().length > 0;
}

export async function createAuthToken(): Promise<string> {
  const secret = getSigningSecret();

  if (!secret) {
    return '';
  }

  const signature = await signValue(`${AUTH_TOKEN_VERSION}.${AUTH_TOKEN_PAYLOAD}`, secret);
  return `${AUTH_TOKEN_VERSION}.${signature}`;
}

export async function verifyAuthToken(token: string | undefined): Promise<boolean> {
  if (!token) {
    return false;
  }

  const [version, signature] = token.split('.');

  if (version !== AUTH_TOKEN_VERSION || !signature) {
    return false;
  }

  const secret = getSigningSecret();

  if (!secret) {
    return false;
  }

  const expectedSignature = await signValue(`${AUTH_TOKEN_VERSION}.${AUTH_TOKEN_PAYLOAD}`, secret);
  return signature === expectedSignature;
}

export const authCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
};
