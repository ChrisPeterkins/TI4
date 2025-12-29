import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthPage = req.nextUrl.pathname.startsWith('/login') ||
                     req.nextUrl.pathname.startsWith('/register');
  const isProtectedPage = req.nextUrl.pathname.startsWith('/lobby') ||
                          req.nextUrl.pathname.startsWith('/game');
  const isHomePage = req.nextUrl.pathname === '/';

  // Redirect logged-in users away from auth pages
  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL('/lobby', req.url));
  }

  // Redirect non-logged-in users to login for protected pages
  if (isProtectedPage && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Allow access to home page for demo purposes (game board preview)
  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|assets).*)'],
};
