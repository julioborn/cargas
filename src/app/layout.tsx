import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "@/components/SessionProvider";
import Header from "@/components/Header";
import { Inter } from "next/font/google";
import { viewport } from "./generateViewport";
import { themeColor } from "./generateThemeColor";

export const metadata: Metadata = {
  title: "Cargas",
  description: "App para gestionar órdenes de carga",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover",
  manifest: "/manifest.json", // 🔥 Agregamos el manifest aquí
  themeColor: "#000000", // 🔥 Asegura que los navegadores móviles detecten el color correcto
};

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const generateViewport = () => viewport;
export const generateThemeColor = () => themeColor;

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
