import type { Metadata, Viewport } from "next";
import "./globals.css";
import AuthProvider from "@/components/SessionProvider";
import Header from "@/components/Header";
import { Inter } from "next/font/google";

// ✅ Exportamos `viewport` correctamente
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

// ❌ ELIMINAMOS `export const themeColor` porque Next.js 14 no lo permite

// ✅ `metadata` sin `viewport` ni `themeColor`
export const metadata: Metadata = {
  title: "Cargas",
  description: "App para gestionar órdenes de carga",
  icons: {
    icon: "/favicon.ico",
    apple: "icons/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
};

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <html lang="es">
        <head>
          <link rel="manifest" href="/manifest.json" />
          <meta name="theme-color" content="#000000" />
        </head>
        <body className={`${inter.variable} antialiased`}>
          <Header />
          {children}
        </body>
      </html>
    </AuthProvider>
  );
}
