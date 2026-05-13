const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs, deleteDoc, doc, writeBatch } = require("firebase/firestore");

const firebaseConfig = {
    apiKey: "AIzaSyCcmJeDPobzD-6IcJF96-IHdLkvPudi-N0",
    authDomain: "onedelhii.firebaseapp.com",
    projectId: "onedelhii",
    storageBucket: "onedelhii.firebasestorage.app",
    messagingSenderId: "645784683590",
    appId: "1:645784683590:web:4bd8fdc3ee5a690a883647",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function deleteAllRoutes() {
    console.log("Fetching all routes from Firestore...");
    try {
        const snap = await getDocs(collection(db, "routes"));
        console.log(`Found ${snap.size} routes. Deleting...`);
        
        const batch = writeBatch(db);
        snap.forEach((d) => {
            batch.delete(d.ref);
        });
        
        await batch.commit();
        console.log("Success! All route documents have been deleted.");
        process.exit(0);
    } catch (error) {
        console.error("Error deleting routes:", error);
        process.exit(1);
    }
}

deleteAllRoutes();
