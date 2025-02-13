import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectMongoDB } from "@/lib/mongodb";
import Usuario from "@/models/Usuario";

export const authOptions: NextAuthOptions = {
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

                if (!user) {
                    throw new Error("Usuario no encontrado");
                }

                const isValidPassword = await bcrypt.compare(
                    credentials?.password ?? "",
                    user.password ?? ""
                );

                if (!isValidPassword) {
                    throw new Error("Contraseña incorrecta");
                }

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
        async jwt({ token, user }: { token: any; user?: any }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
            }
            return token;
        },
        async session({ session, token }: { session: any; token: any }) {
            if (!session.user) {
                session.user = { id: "", name: "", email: "", role: "empresa" };
            }
            session.user.id = token.id as string;
            session.user.name = token.name as string;
            session.user.email = token.email as string;
            session.user.role = token.role as "admin" | "empresa";
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
    session: {
        strategy: "jwt",
    },
};
