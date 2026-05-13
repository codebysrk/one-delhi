const { initializeApp } = require("firebase/app");
const { getFirestore, doc, setDoc, collection, writeBatch } = require("firebase/firestore");

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

async function initializeDatabase() {
    console.log("Initializing Scalable Database Structure...");
    
    // 1. Seed Sample Stop (Normalized)
    const sampleStop = {
        id: "S_AIIMS_01",
        name: "AIIMS Metro Station",
        coords: { lat: 28.5672, lng: 77.2100 },
        city: "Delhi"
    };
    await setDoc(doc(db, "stops", sampleStop.id), sampleStop);
    console.log("Stops collection initialized.");

    // 2. Seed Sample Route (Normalized - using Stop IDs)
    const sampleRoute = {
        id: "522UP",
        longName: "Lado Sarai - Krishi Bhawan",
        type: "AC",
        stopSequence: ["S_AIIMS_01", "S_SAKET_01"], // Linking to Stop IDs
        active: true
    };
    await setDoc(doc(db, "routes", sampleRoute.id), sampleRoute);
    console.log("Routes collection initialized.");

    // 3. Tickets (Placeholder schema setup)
    // Firestore creates collections automatically on first document write.
    // We'll write a metadata doc to 'tickets' and 'logs' to establish them.
    await setDoc(doc(db, "metadata", "collections"), {
        activeCollections: ["users", "admins", "stops", "routes", "tickets", "logs"],
        lastInitialized: new Date().toISOString()
    });

    // 4. Logs Initialization
    const initialLog = {
        type: "SYSTEM",
        action: "DATABASE_INITIALIZATION",
        timestamp: new Date().toISOString(),
        details: "Scalable structure initialized with Normalized Schemas."
    };
    await setDoc(doc(db, "logs", `LOG_${Date.now()}`), initialLog);
    console.log("Logs collection initialized.");

    console.log("Database Setup Complete!");
    process.exit(0);
}

initializeDatabase().catch(console.error);
