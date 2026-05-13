import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";

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

const testEmail = "user@one-delhi.in";
const testPassword = "UserPassword123!";

async function createTestUser() {
    try {
        console.log(`Creating user in Auth: ${testEmail}...`);
        let userUid;
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
            userUid = userCredential.user.uid;
            console.log("User created in Auth with UID:", userUid);
        } catch (authError) {
            if (authError.code === 'auth/email-already-in-use') {
                console.log("User already exists in Auth, logging in to get UID...");
                const userCredential = await signInWithEmailAndPassword(auth, testEmail, testPassword);
                userUid = userCredential.user.uid;
                console.log("Logged in. UID:", userUid);
            } else {
                throw authError;
            }
        }

        console.log(`Setting user data in Firestore for UID: ${userUid}...`);
        await setDoc(doc(db, "users", userUid), {
            name: "Test User One Delhi",
            email: testEmail,
            role: "user",
            status: "ACTIVE",
            createdAt: Date.now(),
            phone: "+918888888888"
        });

        console.log("Test user created and setup successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Error creating test user:", error);
        process.exit(1);
    }
}

createTestUser();
