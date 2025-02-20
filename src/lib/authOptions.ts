import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectMongoDB } from "@/lib/mongodb";
import Usuario from "@/models/Usuario";
import Chofer from "@/models/Chofer";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                role: { label: "Tipo de Usuario", type: "text" },
                email: { label: "Email", type: "email", placeholder: "tu@email.com" },
                password: { label: "Contraseña", type: "password" },
                documento: { label: "DNI", type: "text" },
            },
            async authorize(credentials) {
                await connectMongoDB();
                console.log("🔍 Credenciales recibidas:", credentials);

                if (credentials?.role === "chofer") {
                    const dni = credentials.documento.trim();
                    console.log("🔍 Buscando chofer con DNI:", dni);
                    const chofer = await Chofer.findOne({ documento: dni });
                    console.log("🔍 Resultado de la búsqueda:", chofer);
                    if (!chofer) {
                        console.error("❌ Chofer no encontrado con DNI:", dni);
                        return null;
                    }
                    console.log("✅ Chofer autenticado:", chofer.documento);
                    return {
                        id: chofer._id.toString(),
                        email: null,
                        name: chofer.nombre,
                        role: "chofer",
                        empresaId: chofer.empresaId?.toString() ?? null,
                    };
                } else {
                    // Lógica para usuarios (admin/empresa)
                    const user = await Usuario.findOne({ email: credentials?.email });
                    if (!user) {
                        console.error("❌ Usuario no encontrado:", credentials?.email);
                        return null;
                    }
                    const isValidPassword = await bcrypt.compare(
                        credentials?.password ?? "",
                        user.password ?? ""
                    );
                    if (!isValidPassword) {
                        console.error("❌ Contraseña incorrecta para:", credentials?.email);
                        return null;
                    }
                    console.log("✅ Usuario autenticado:", user.email, "Rol:", user.rol);
                    return {
                        id: user._id.toString(),
                        email: user.email,
                        name: user.nombre,
                        role: user.rol,
                        empresaId: user.empresaId ?? null,
                    };
                }
            },
        }),
    ],
    session: { strategy: "jwt" },
    jwt: {
        secret: process.env.NEXTAUTH_SECRET,
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.email = user.email;
                token.name = user.name;
                token.role = user.role;
                token.empresaId = user.empresaId ?? null;
            }
            console.log("🔥 JWT generado en authOptions:", token);
            return token;
        },
        async session({ session, token }) {
            session.user = {
                id: token.id as string,
                email: token.email as string,
                name: token.name as string,
                role: token.role as "chofer" | "admin" | "empresa",
                empresaId: token.empresaId as string | null,
            };
            console.log("✅ Sesión generada:", session);
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
    pages: { signIn: "/login" },
    cookies: {
        sessionToken: {
            name: process.env.NODE_ENV === "production"
                ? "__Secure-next-auth.session-token"
                : "next-auth.session-token",
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                secure: process.env.NODE_ENV === "production",
            },
        },
    },
    debug: process.env.NODE_ENV === "development",
};
