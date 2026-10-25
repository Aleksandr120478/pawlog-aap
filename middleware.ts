import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const path = request.nextUrl.pathname;

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            response = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // Обновляем сессию. Если сессии нет — это нормально, просто идём дальше.
    await supabase.auth.getUser();
  } catch (error) {
    // Если Supabase упал или сеть недоступна — логируем и отдаём страницу (без 500).
    console.error('Supabase middleware error:', error);
  }

  // Заголовки безопасности для ВСЕХ страниц
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');

  // Специфичные заголовки для публичных страниц
  if (path.startsWith('/emergency') || path.startsWith('/update-password')) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    response.headers.set('Referrer-Policy', 'no-referrer');
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};