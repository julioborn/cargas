import admin from "firebase-admin";

const serviceAccount = {
    project_id: process.env.FIREBASE_ADMIN_PROJECT_ID,
    private_key: process.env.FIREBASE_ADMIN_KEY?.replace(/\\n/g, "\n"), // 🔥 Corrige los saltos de línea
    client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
};

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    });
}

export const messaging = admin.messaging();
