const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs, deleteDoc, doc } = require("firebase/firestore");

const firebaseConfig = {
    apiKey: "AIzaSyCcmJeDPobzD-6IcJF96-IHdLkvPudi-N0",
    authDomain: "onedelhii.firebaseapp.com",
    projectId: "onedelhii",
    storageBucket: "onedelhii.firebasestorage.app",
    messagingSenderId: "645784683590",
    appId: "1:645784683590:web:4bd8fdc3ee5a690a883647"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function clearCollection(name) {
    console.log(`Clearing ${name}...`);
    const snap = await getDocs(collection(db, name));
    console.log(`Found ${snap.size} docs in ${name}`);
    for (const d of snap.docs) {
        await deleteDoc(doc(db, name, d.id));
    }
    console.log(`${name} cleared.`);
}

async function run() {
    try {
        await clearCollection("tickets");
        await clearCollection("users");
        console.log("SUCCESS: All data deleted.");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

run();
