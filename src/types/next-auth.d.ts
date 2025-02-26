import NextAuth from "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            name: string;
            email: string;
            role: "admin" | "empresa" | "chofer" | "playero";
            empresaId?: string | null;
            ubicacionId?: string; // <-- Agregado
        };
    }
    interface User {
        id: string;
        name: string;
        email: string;
        role: "admin" | "empresa" | "chofer" | "playero";
        empresaId?: string | null;
        ubicacionId?: string; // <-- Agregado
    }
}
