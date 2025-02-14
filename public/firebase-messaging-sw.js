importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

// 📌 Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBmJfT8PsfPA1GFkRb2xQKUBwQTl8Sxe5Y",
    authDomain: "cargas-firebase.firebaseapp.com",
    projectId: "cargas-firebase",
    storageBucket: "cargas-firebase.firebasestorage.app",
    messagingSenderId: "829165934189",
    appId: "1:829165934189:web:958ad2adadb38be63ed164",
    measurementId: "G-455BB65HYZ"
};

// 📌 Inicializa Firebase
firebase.initializeApp(firebaseConfig);

// 📌 Inicializa Firebase Cloud Messaging
const messaging = firebase.messaging();

// 📌 Manejar notificaciones en segundo plano
messaging.onBackgroundMessage((payload) => {
    console.log("📩 Notificación en segundo plano:", payload);

    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: "/icon.png"
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
