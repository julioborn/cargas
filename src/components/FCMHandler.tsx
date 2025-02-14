"use client"; // 🔥 Este será un Client Component

import { useEffect } from "react";
import { getFCMToken, onMessageListener } from "@/lib/firebase";
import { MessagePayload } from "firebase/messaging";

export default function FCMHandler() {
    useEffect(() => {
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.register("/firebase-messaging-sw.js")
                .then((registration) => {
                    console.log("✅ Service Worker registrado:", registration);
                })
                .catch((error: unknown) => {
                    console.error("❌ Error registrando el Service Worker:", error);
                });
        }

        // ✅ Obtener el Token de FCM
        getFCMToken().then((token: string | null) => {
            if (token) {
                console.log("✅ Token de FCM obtenido:", token);
                localStorage.setItem("FCM_TOKEN", token);
            }
        });

        // ✅ Escuchar notificaciones en primer plano
        onMessageListener()
            .then((payload: MessagePayload) => {
                console.log("📩 Notificación recibida:", payload);
                alert(`📢 Notificación: ${payload.notification?.title}`);
            })
            .catch((error: unknown) => console.error("❌ Error en la notificación:", error));

    }, []);

    return null; // 🔥 Este componente no renderiza nada
}
