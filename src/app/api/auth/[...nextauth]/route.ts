import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectMongoDB } from "@/lib/mongodb";
import Usuario from "@/models/Usuario";
import Chofer from "@/models/Chofer";

const handler = NextAuth({
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

                // Si se selecciona "chofer", se valida mediante DNI
                if (credentials?.role === "chofer") {
                    const dni = credentials.documento.trim();
                    console.log("🔍 Buscando chofer con DNI:", dni);
                    const chofer = await Chofer.findOne({ documento: dni });
                    console.log("🔍 Resultado de la búsqueda:", chofer);
                    if (!chofer) throw new Error("Chofer no encontrado");
                    console.log("✅ Chofer autenticado:", chofer.documento);
                    return {
                        id: chofer._id.toString(),
                        email: null,
                        name: chofer.nombre,
                        role: "chofer",
                    };
                } else {
                    // Para "usuario" (admin/empresa) se valida mediante email y contraseña
                    const user = await Usuario.findOne({ email: credentials?.email });
                    if (!user) throw new Error("Usuario no encontrado");
                    const isValidPassword = await bcrypt.compare(
                        credentials?.password ?? "",
                        user.password ?? ""
                    );
                    if (!isValidPassword) throw new Error("Contraseña incorrecta");
                    console.log("✅ Usuario autenticado:", user.email, "Rol:", user.rol);
                    return {
                        id: user._id.toString(),
                        email: user.email,
                        name: user.nombre,
                        role: user.rol, // admin o empresa
                    };
                }
            },
        }),
    ],
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
            }
            return token;
        },
        async session({ session, token }) {
            session.user.id = token.id as string;
            session.user.role = token.role as "admin" | "empresa" | "chofer";
            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
    secret: process.env.NEXTAUTH_SECRET,
    useSecureCookies: process.env.NODE_ENV === "production",
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
});

export { handler as GET, handler as POST };
