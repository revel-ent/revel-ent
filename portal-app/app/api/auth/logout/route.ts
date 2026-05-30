import { NextResponse } from 'next/server';

import { getSessionCookieName } from '@/lib/session-token';

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL('/login', request.url));

  response.cookies.delete(getSessionCookieName());

  return response;
}
