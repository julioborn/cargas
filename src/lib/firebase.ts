import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage, MessagePayload } from "firebase/messaging";

// 🔥 Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBmJfT8PsfPA1GFkRb2xQKUBwQTl8Sxe5Y",
    authDomain: "cargas-firebase.firebaseapp.com",
    projectId: "cargas-firebase",
    storageBucket: "cargas-firebase.appspot.com",
    messagingSenderId: "829165934189",
    appId: "1:829165934189:web:958ad2adadb38be63ed164",
    measurementId: "G-455BB65HYZ",
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

/**
 * ✅ Obtener el token de FCM
 */
export const getFCMToken = async (): Promise<string | null> => {
    try {
        const token = await getToken(messaging, {
            vapidKey: "BDPegfwcjnlyWO_YVrVQbBCzeFTVWmV7jXHpH5Gr4y-4KyNq9iPM77hBgC59v_FubN_Skksanl1-0Lcpagqgfhs",
        });

        return token || null;
    } catch (error) {
        console.error("❌ Error obteniendo el token de FCM:", error);
        return null;
    }
};

/**
 * ✅ Escuchar notificaciones en primer plano (CORREGIDO)
 */
export const onMessageListener = (): Promise<MessagePayload> =>
    new Promise((resolve, reject) => {
        try {
            onMessage(messaging, (payload) => {
                resolve(payload);
            });
        } catch (error) {
            reject(error);
        }
    });
