"use client";

import { useEffect } from "react";
import { getFCMToken, onMessageListener } from "@/lib/firebase";
import { MessagePayload } from "firebase/messaging";

export default function FirebaseNotifications() {
    useEffect(() => {
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.register("/firebase-messaging-sw.js")
                .then((registration) => {
                    console.log("✅ Service Worker registrado:", registration);
                })
                .catch((error) => {
                    console.error("❌ Error registrando el Service Worker:", error);
                });
        }

        getFCMToken().then((token) => {
            if (token) {
                console.log("✅ Token de FCM obtenido:", token);
                localStorage.setItem("FCM_TOKEN", token);
            }
        });

        onMessageListener()
            .then((payload: MessagePayload) => {
                console.log("📩 Notificación recibida:", payload);
                alert(`📢 Notificación: ${payload.notification?.title}`);
            })
            .catch((error) => console.error("❌ Error en la notificación:", error));

    }, []);

    return null; // No renderiza nada en la UI, solo ejecuta los efectos
}
