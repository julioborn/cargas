"use client"; 
import { SessionProvider } from "next-auth/react";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    return <SessionProvider refetchInterval={5 * 60}>{children}</SessionProvider>;
}
