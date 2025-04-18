import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Si se accede a la raíz ("/") y hay sesión, redirige según el rol:
    if (pathname === "/") {
        const token = await getToken({
            req,
            secret: process.env.NEXTAUTH_SECRET,
            secureCookie: process.env.NODE_ENV === "production",
        });
        if (token) {
            if (token.role === "admin") {
                return NextResponse.redirect(new URL("/dashboard", req.url));
            } else if (token.role === "empresa") {
                return NextResponse.redirect(new URL("/empresa-dashboard", req.url));
            } else if (token.role === "chofer") {
                return NextResponse.redirect(new URL("/chofer-ordenes", req.url));
            } else if (token.role === "playero") {
                return NextResponse.redirect(new URL("/playero-ordenes", req.url));
            }
        }
    }

    console.log("🌐 Middleware ejecutándose en:", req.nextUrl.pathname);

    // Verificar la cookie de sesión
    const sessionCookie =
        req.cookies.get("next-auth.session-token") ||
        req.cookies.get("__Secure-next-auth.session-token");
    console.log("🍪 Cookie detectada en middleware:", sessionCookie);

    // Obtener el token de sesión
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

    // Restricciones para admin:
    const adminRestrictedRoutes = [
        "/empresa-dashboard",
        "/unidades",
        "/choferes",
        "/ordenes",
        "/crear-orden",
    ];

    if (role === "admin" && adminRestrictedRoutes.includes(path)) {
        console.log(
            "🚫 Admin intentando acceder a ruta no permitida. Redirigiendo a /dashboard"
        );
        return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Restricción para rol empresa:
    if (role === "empresa" && path === "/dashboard") {
        console.log(
            "🚫 Empresa intentando acceder a /dashboard. Redirigiendo a /empresa-dashboard"
        );
        return NextResponse.redirect(new URL("/empresa-dashboard", req.url));
    }

    // Restricción para playero:
    if (role === "playero" && !path.startsWith("/playero-ordenes")) {
        console.log(
            "🚫 Playero intentando acceder a una ruta no permitida. Redirigiendo a /playero-ordenes"
        );
        return NextResponse.redirect(new URL("/playero-ordenes", req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/",
        "/dashboard",
        "/empresa-dashboard",
        "/unidades",
        "/choferes",
        "/ordenes",
        "/crear-orden",
        "/playero-ordenes",
    ],
};
