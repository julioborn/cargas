import admin from "firebase-admin";

if (!admin.apps.length) {
    const firebaseAdminConfig = JSON.parse(process.env.FIREBASE_ADMIN_KEY || "{}");

    // 🔥 Corrige la clave reemplazando `\\n` por saltos de línea reales
    if (firebaseAdminConfig.private_key) {
        firebaseAdminConfig.private_key = firebaseAdminConfig.private_key.replace(/\\n/g, "\n");
    }

    admin.initializeApp({
        credential: admin.credential.cert(firebaseAdminConfig),
    });
}

// ✅ Exportamos el servicio de messaging correctamente
export const messaging = admin.messaging();
export default admin;
