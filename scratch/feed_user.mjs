import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyCcmJeDPobzD-6IcJF96-IHdLkvPudi-N0",
    authDomain: "onedelhii.firebaseapp.com",
    projectId: "onedelhii",
    storageBucket: "onedelhii.firebasestorage.app",
    messagingSenderId: "645784683590",
    appId: "1:645784683590:web:4bd8fdc3ee5a690a883647",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const adminEmail = "admin@onedelhi.com";
const adminPassword = "AdminPassword123!";
const targetUserId = "GXjxEHIxqBgZiHBbVztVC1xXVo53";

const userData = {
    name: "Aryan Sharma",
    email: "aryan@one-delhi.in",
    role: "user",
    status: "ACTIVE",
    createdAt: Date.now(),
    phone: "+919999999999"
};

async function feedUser() {
    try {
        console.log(`Logging in as admin ${adminEmail}...`);
        await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
        console.log("Admin login successful!");

        console.log(`Feeding user ${targetUserId}...`);
        await setDoc(doc(db, "users", targetUserId), userData);
        console.log("User data added successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Error feeding user:", error);
        process.exit(1);
    }
}

feedUser();
