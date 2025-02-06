import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        return NextResponse.next();
    },
    {
        pages: {
            signIn: "/login", // ✅ Redirige automáticamente a /login si no está autenticado
        },
    }
);

// 🚀 Aplica el middleware solo a ciertas rutas:
export const config = {
    matcher: ["/dashboard/:path*", "/ordenes/:path*", "/empresas/:path*", "/unidades/:path*"],
};
