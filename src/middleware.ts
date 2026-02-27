import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, isPasswordProtectionEnabled, verifyAuthToken } from '@/lib/auth';

const PUBLIC_PATHS = new Set(['/login']);
const PUBLIC_API_PATHS = new Set(['/api/auth/login', '/api/auth/logout']);

function buildLoginRedirect(request: NextRequest): NextResponse {
  const loginUrl = new URL('/login', request.url);
  const nextPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  loginUrl.searchParams.set('next', nextPath);
  return NextResponse.redirect(loginUrl);
}

export async function middleware(request: NextRequest) {
  if (!isPasswordProtectionEnabled()) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.has(pathname) || PUBLIC_API_PATHS.has(pathname)) {
    if (pathname !== '/login') {
      return NextResponse.next();
    }

    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    const isAuthenticated = await verifyAuthToken(token);

    if (isAuthenticated) {
      const destination = request.nextUrl.searchParams.get('next');
      const safeDestination = destination && destination.startsWith('/') ? destination : '/';
      return NextResponse.redirect(new URL(safeDestination, request.url));
    }

    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const isAuthenticated = await verifyAuthToken(token);

  if (isAuthenticated) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  return buildLoginRedirect(request);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images/).*)'],
};
