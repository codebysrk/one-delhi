import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
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

async function checkData() {
    try {
        await signInWithEmailAndPassword(auth, "admin@onedelhi.com", "AdminPassword123!");
        
        const routesSnap = await getDocs(collection(db, "routes"));
        console.log(`Routes count: ${routesSnap.size}`);

        const stopsSnap = await getDocs(collection(db, "stops"));
        console.log(`Stops count: ${stopsSnap.size}`);

        process.exit(0);
    } catch (error) {
        console.error("Error checking data:", error);
        process.exit(1);
    }
}

checkData();
