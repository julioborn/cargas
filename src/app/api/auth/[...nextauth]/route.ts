import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectMongoDB } from "@/lib/mongodb";
import Usuario from "@/models/Usuario";
import { JWT } from "next-auth/jwt";

const authOptions: AuthOptions = {
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email", placeholder: "tu@email.com" },
                password: { label: "Contraseña", type: "password" },
            },
            async authorize(credentials) {
                await connectMongoDB();
                console.log("🔍 Buscando usuario en la base de datos...");

                const user = await Usuario.findOne({ email: credentials?.email });

                if (!user) {
                    console.log("❌ Usuario no encontrado");
                    throw new Error("Usuario no encontrado");
                }

                console.log("✅ Usuario encontrado:", user);

                const isValidPassword = await bcrypt.compare(credentials?.password || "", user.password);

                if (!isValidPassword) {
                    console.log("❌ Contraseña incorrecta");
                    throw new Error("Contraseña incorrecta");
                }

                console.log("🔓 Usuario autenticado correctamente");

                return {
                    id: user._id.toString(),
                    email: user.email,
                    name: user.nombre,
                    role: user.rol,
                };
            },
        }),
    ],
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
    secret: process.env.NEXTAUTH_SECRET,
    session: {
        strategy: "jwt",
    },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST, authOptions };
