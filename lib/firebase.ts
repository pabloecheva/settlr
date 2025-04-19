import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCqlF2SdJLRa-M_XZVqXDlo6s452gK9Oq0",
  authDomain: "settlr-27282.firebaseapp.com",
  projectId: "settlr-27282",
  storageBucket: "settlr-27282.firebasestorage.app",
  messagingSenderId: "829609903157",
  appId: "1:829609903157:web:4c279160b0f7a3aeb9dd7c",
  measurementId: "G-YJ78H22KJN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);

export { app, analytics, db, auth }; 