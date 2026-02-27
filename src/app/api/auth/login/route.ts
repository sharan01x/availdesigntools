import { NextRequest, NextResponse } from 'next/server';
import {
  AUTH_COOKIE_NAME,
  authCookieOptions,
  createAuthToken,
  getAccessPassword,
  isPasswordProtectionEnabled,
} from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  if (!isPasswordProtectionEnabled()) {
    return NextResponse.json({ success: true, message: 'Password protection is disabled.' });
  }

  let submittedPassword = '';

  try {
    const body = (await request.json()) as { password?: unknown };
    if (typeof body.password === 'string') {
      submittedPassword = body.password.trim();
    }
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request payload.' }, { status: 400 });
  }

  const expectedPassword = getAccessPassword();

  if (!submittedPassword || submittedPassword !== expectedPassword) {
    return NextResponse.json({ success: false, error: 'Incorrect password.' }, { status: 401 });
  }

  const token = await createAuthToken();

  if (!token) {
    return NextResponse.json({ success: false, error: 'Auth secret is not configured.' }, { status: 500 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(AUTH_COOKIE_NAME, token, authCookieOptions);
  return response;
}
