import { initializeApp } from "firebase/app";
import { getMessaging, getToken, MessagePayload, onMessage } from "firebase/messaging";

// ✅ Configuración de Firebase
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

/**
 * ✅ Obtener el token de FCM del Administrador
 */
export const getFCMToken = async (): Promise<string | null> => {
    try {
        const token = await getToken(messaging, {
            vapidKey: process.env.NEXT_PUBLIC_VAPID_KEY, // 🔹 Clave VAPID
        });

        if (token) {
            console.log("✅ Token FCM obtenido:", token);
            return token;
        } else {
            console.warn("⚠️ No se pudo obtener el token FCM.");
            return null;
        }
    } catch (error) {
        console.error("❌ Error obteniendo el token FCM:", error);
        return null;
    }
};

/**
 * ✅ Escuchar notificaciones en primer plano
 */
export const onMessageListener = (): Promise<MessagePayload> => {
    return new Promise((resolve, reject) => {
        onMessage(messaging, (payload) => {
            resolve(payload as MessagePayload); // 🔥 Asegura el tipado correcto
        });
    });
};
