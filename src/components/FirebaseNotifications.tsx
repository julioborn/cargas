"use client";

import { useEffect } from "react";
import { getFCMToken, onMessageListener } from "@/lib/firebase";
import type { MessagePayload } from "firebase/messaging"; // ✅ Importa el tipo

export default function FirebaseNotifications() {
    useEffect(() => {
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker
                .register("/firebase-messaging-sw.js")
                .then((registration) => {
                    console.log("✅ Service Worker registrado:", registration);
                })
                .catch((error) => {
                    console.error("❌ Error registrando el Service Worker:", error);
                });
        }

        getFCMToken()
            .then((token) => {
                if (token) {
                    console.log("✅ Token de FCM obtenido:", token);
                    localStorage.setItem("FCM_TOKEN", token);
                } else {
                    console.warn("⚠️ No se pudo obtener el token de FCM.");
                }
            })
            .catch((error) => console.error("❌ Error obteniendo el token:", error));

        // ✅ Escuchar notificaciones en primer plano con tipado correcto
        onMessageListener()
            .then((payload: MessagePayload) => { // ✅ Ahora `payload` tiene el tipo correcto
                console.log("📩 Notificación recibida:", payload);
                alert(`📢 Notificación: ${payload.notification?.title}`);
            })
            .catch((error) => console.error("❌ Error en la notificación:", error));

    }, []);

    return null; // ✅ No renderiza nada en la UI
}
