"use client"; // 🔹 Asegura que sea un Client Component
import { SessionProvider } from "next-auth/react";

export default function AuthProvider({
    children,
    session,
}: {
    children: React.ReactNode;
    session?: any;
}) {
    return <SessionProvider session={session}>{children}</SessionProvider>;
}
