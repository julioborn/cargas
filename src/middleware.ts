import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
    console.log("🌐 Middleware ejecutándose en:", req.nextUrl.pathname);

    // 🔥 Verifica manualmente la cookie de sesión
    const sessionCookie = req.cookies.get("next-auth.session-token") || req.cookies.get("__Secure-next-auth.session-token");
    console.log("🍪 Cookie detectada en middleware:", sessionCookie);

    // 🔥 Intentamos obtener el token de la sesión
    const session = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
        secureCookie: process.env.NODE_ENV === "production",
    });

    console.log("🔍 Token en middleware:", session);

    if (!session) {
        console.log("🚫 No hay sesión en middleware. Redirigiendo a /login");
        return NextResponse.redirect(new URL("/login", req.url));
    }

    const { role } = session as { role?: string };
    const path = req.nextUrl.pathname;

    // 🔥 Rutas restringidas para el rol "admin"
    const adminRestrictedRoutes = ["/empresa-dashboard", "/unidades", "/choferes", "/ordenes", "/crear-orden"];

    if (role === "admin" && adminRestrictedRoutes.includes(path)) {
        console.log("🚫 Admin intentando acceder a ruta no permitida. Redirigiendo a /dashboard");
        return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // 🔥 Rutas restringidas para el rol "empresa"
    if (role === "empresa" && path === "/dashboard") {
        console.log("🚫 Empresa intentando acceder a /dashboard. Redirigiendo a /empresa-dashboard");
        return NextResponse.redirect(new URL("/empresa-dashboard", req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/dashboard",
        "/empresa-dashboard",
        "/unidades",
        "/choferes",
        "/ordenes",
        "/crear-orden",
    ],
};
