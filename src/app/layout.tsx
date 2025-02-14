"use client";
import { useEffect } from "react";
import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "@/components/SessionProvider";
import Header from "@/components/Header";
import { Inter } from "next/font/google";
import { MessagePayload } from "firebase/messaging";
import { getFCMToken, onMessageListener } from "@/lib/firebase";

export const metadata: Metadata = {
  title: "Cargas",
  description: "App para gestionar órdenes de carga",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover",
  manifest: "/manifest.json",
  themeColor: "#000000",
};

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  
  useEffect(() => {
    // ✅ Registrar el Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/firebase-messaging-sw.js")
        .then((registration) => {
          console.log("✅ Service Worker registrado:", registration);
        })
        .catch((error: unknown) => {
          console.error("❌ Error registrando el Service Worker:", error);
        });
    }

    // ✅ Obtener el Token de FCM con tipado explícito
    getFCMToken().then((token: string | null) => {
      if (token) {
        console.log("✅ Token de FCM obtenido:", token);
        localStorage.setItem("FCM_TOKEN", token);
      }
    });

    // ✅ Escuchar notificaciones en primer plano con tipado explícito
    onMessageListener()
      .then((payload: MessagePayload) => {
        console.log("📩 Notificación recibida:", payload);
        alert(`📢 Notificación: ${payload.notification?.title}`);
      })
      .catch((error: unknown) => console.error("❌ Error en la notificación:", error));

  }, []);

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
