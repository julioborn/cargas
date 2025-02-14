import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectMongoDB } from "@/lib/mongodb";
import Usuario from "@/models/Usuario";

const handler = NextAuth({
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email", placeholder: "tu@email.com" },
                password: { label: "Contraseña", type: "password" },
            },
            async authorize(credentials) {
                await connectMongoDB();
                const user = await Usuario.findOne({ email: credentials?.email });

                if (!user) throw new Error("Usuario no encontrado");

                const isValidPassword = await bcrypt.compare(credentials?.password ?? "", user.password ?? "");

                if (!isValidPassword) throw new Error("Contraseña incorrecta");

                return {
                    id: user._id.toString(),
                    email: user.email,
                    name: user.nombre,
                    role: user.rol,
                };
            },
        }),
    ],
    session: {
        strategy: "jwt", // ✅ Forzar JWT para evitar pérdida de sesión en Vercel
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
            session.user.role = token.role as "admin" | "empresa";
            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
    secret: process.env.NEXTAUTH_SECRET, // ✅ Asegurarse de que esté en Vercel
    useSecureCookies: process.env.NODE_ENV === "production",
    cookies: {
        sessionToken: {
            name: `__Secure-next-auth.session-token`,
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
