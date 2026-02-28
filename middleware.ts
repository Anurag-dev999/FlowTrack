import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Auth is handled client-side in DashboardLayout via supabaseClient.auth.getUser()
// Middleware only handles static rewrites if needed in the future
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|icon|apple-icon).*)'],
};
