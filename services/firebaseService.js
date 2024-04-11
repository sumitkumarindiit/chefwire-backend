import admin from "firebase-admin";
import {firebaseKey} from "../firebase_config.js";

admin.initializeApp({
  credential: admin.credential.cert(firebaseKey)
});

const db = admin.firestore();
const messaging = admin.messaging();

export const sendPushNotification = async (registrationToken, payload) => {
  try {
    await messaging.send({token:registrationToken, data: payload });
    console.log("Push notification sent successfully!");
  } catch (error) {
    console.error("Error sending push notification:", error);
  }
};
