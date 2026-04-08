import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCySi5LgvlTrmSFExVCyaHtP-sXPNr_r1k",
  authDomain: "physio-theray.firebaseapp.com",
  projectId: "physio-theray",
  storageBucket: "physio-theray.firebasestorage.app",
  messagingSenderId: "1065421022661",
  appId: "1:1065421022661:web:908f9ea2aea6de6db257ac",
  measurementId: "G-1LNB0MQH0N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics conditionally to prevent SSR/Background rendering errors
const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;

// Common services instance references
const auth = getAuth(app);
const db = getFirestore(app);

export { app, analytics, auth, db };
