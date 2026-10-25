// middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // 1. САМОЕ ВАЖНОЕ: Сначала проверяем публичные пути.
  // Если это экстренная карточка или сброс пароля — пропускаем сразу,
  // не нагружая сервер проверкой авторизации.
  if (
    request.nextUrl.pathname.startsWith('/emergency') ||
    request.nextUrl.pathname.startsWith('/update-password')
  ) {
    return NextResponse.next();
  }

  // 2. Для всех остальных страниц создаем клиент и проверяем авторизацию
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

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

  // Проверяем юзера (только для защищенных страниц)
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};