import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage, MessagePayload } from "firebase/messaging";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let messaging: any;

if (typeof window !== "undefined") {
    const app = initializeApp(firebaseConfig);
    messaging = getMessaging(app);
}

/**
 * ✅ Obtener el token de FCM solo si estamos en el cliente
 */
export const getFCMToken = async (): Promise<string | null> => {
    if (typeof window === "undefined") return null;

    try {
        const token = await getToken(messaging, {
            vapidKey: process.env.NEXT_PUBLIC_VAPID_KEY,
        });
        return token || null;
    } catch (error) {
        console.error("❌ Error obteniendo el token de FCM:", error);
        return null;
    }
};

/**
 * ✅ Escuchar notificaciones solo si estamos en el cliente
 */
export const onMessageListener = (): Promise<MessagePayload> =>
    new Promise((resolve, reject) => {
        if (typeof window === "undefined") return;
        try {
            onMessage(messaging, (payload) => {
                resolve(payload);
            });
        } catch (error) {
            reject(error);
        }
    });
