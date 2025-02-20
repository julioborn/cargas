import NextAuth from "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            name: string;
            email: string;
            role: "admin" | "empresa" | "chofer" | "playero"; // Agregado "playero"
            empresaId?: string | null;
        };
    }

    interface User {
        id: string;
        name: string;
        email: string;
        role: "admin" | "empresa" | "chofer" | "playero"; // Agregado "playero"
        empresaId?: string | null;
    }
}
