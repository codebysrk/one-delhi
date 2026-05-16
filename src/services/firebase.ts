import { initializeApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";
import { Platform } from "react-native";
import { initializeAuth, getReactNativePersistence, browserLocalPersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
    apiKey: "AIzaSyCcmJeDPobzD-6IcJF96-IHdLkvPudi-N0",
    authDomain: "onedelhii.firebaseapp.com",
    projectId: "onedelhii",
    storageBucket: "onedelhii.firebasestorage.app",
    messagingSenderId: "645784683590",
    appId: "1:645784683590:web:4bd8fdc3ee5a690a883647",
    measurementId: "G-NPCJGVC37D"
};

const app = initializeApp(firebaseConfig);

// Initialize Auth with platform-specific persistence
export const auth = initializeAuth(app, {
  persistence: Platform.OS === 'web' 
    ? browserLocalPersistence 
    : getReactNativePersistence(AsyncStorage)
});

// Using initializeFirestore - standard configuration
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

export default app;
