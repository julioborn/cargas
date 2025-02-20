import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectMongoDB } from "@/lib/mongodb";
import Usuario from "@/models/Usuario";
import Chofer from "@/models/Chofer";
import Playero from "@/models/Playero"; // Asegúrate de que este modelo esté correctamente definido

const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                role: { label: "Tipo de Usuario", type: "text" },
                email: {
                    label: "Email",
                    type: "email",
                    placeholder: "tu@email.com",
                },
                password: { label: "Contraseña", type: "password" },
                documento: { label: "Documento", type: "text" },
            },
            async authorize(credentials) {
                await connectMongoDB();
                console.log("🔍 Credenciales recibidas:", credentials);

                if (credentials?.role === "chofer") {
                    const dni = credentials.documento.trim();
                    console.log("🔍 Buscando chofer con DNI:", dni);
                    const chofer = await Chofer.findOne({ documento: dni });
                    console.log("🔍 Resultado de la búsqueda (chofer):", chofer);
                    if (!chofer) throw new Error("Chofer no encontrado");
                    console.log("✅ Chofer autenticado:", chofer.documento);
                    return {
                        id: chofer._id.toString(),
                        email: "",
                        name: chofer.nombre,
                        role: "chofer",
                    };
                } else if (credentials?.role === "playero") {
                    const doc = credentials.documento.trim();
                    console.log("🔍 Buscando playero con documento:", doc);
                    const playero = await Playero.findOne({ documento: doc });
                    console.log("🔍 Resultado de la búsqueda (playero):", playero);
                    if (!playero) throw new Error("Playero no encontrado");
                    console.log("✅ Playero autenticado:", playero.documento);
                    return {
                        id: playero._id.toString(),
                        email: "",
                        name: playero.nombre,
                        role: "playero",
                    };
                } else {
                    // Lógica para usuarios (admin/empresa) mediante email y contraseña
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
    session: { strategy: "jwt" },
    jwt: {
        secret: process.env.NEXTAUTH_SECRET,
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
            }
            console.log("🔥 JWT generado en authOptions:", token);
            return token;
        },
        async session({ session, token }) {
            session.user.id = token.id as string;
            session.user.role = token.role as "admin" | "empresa" | "chofer" | "playero";
            return session;
        },
    },
    pages: { signIn: "/login" },
    secret: process.env.NEXTAUTH_SECRET,
    useSecureCookies: process.env.NODE_ENV === "production",
    cookies: {
        sessionToken: {
            name:
                process.env.NODE_ENV === "production"
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

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
