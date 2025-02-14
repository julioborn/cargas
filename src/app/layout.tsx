import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "@/components/SessionProvider";
import Header from "@/components/Header";
import { Inter } from "next/font/google";
import FirebaseNotifications from "@/components/FirebaseNotifications"; // 🔥 Cliente separado

export const metadata: Metadata = {
  title: "Cargas",
  description: "App para gestionar órdenes de carga",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
};

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es"> {/* ✅ html debe estar en el Server Component */}
      <body className={`${inter.variable} antialiased`}>
        <AuthProvider>
          <FirebaseNotifications /> {/* ✅ Ahora está correctamente dentro del árbol del cliente */}
          <Header />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
