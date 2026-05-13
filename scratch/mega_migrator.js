const { initializeApp } = require("firebase/app");
const { getFirestore, doc, setDoc, writeBatch, collection } = require("firebase/firestore");
const fs = require('fs');
const path = require('path');

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

async function migrate() {
    console.log("Starting Migration from JSON to Firestore...");
    
    const jsonPath = path.join(__dirname, '../src/components/react-native-component-code/src/data/dtc_data.json');
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const routes = data.routes;

    console.log(`Found ${routes.length} routes. Beginning upload...`);

    // We'll use batches to speed up (Firestore limits batches to 500 operations)
    let batch = writeBatch(db);
    let count = 0;
    let totalProcessed = 0;

    for (const route of routes) {
        const routeRef = doc(db, "routes", route.id);
        batch.set(routeRef, {
            ...route,
            timestamp: new Date().toISOString()
        });
        
        count++;
        totalProcessed++;

        if (count === 400) { // Safety margin below 500
            await batch.commit();
            console.log(`Committed batch. Total processed: ${totalProcessed}/${routes.length}`);
            batch = writeBatch(db);
            count = 0;
        }
    }

    if (count > 0) {
        await batch.commit();
        console.log(`Committed final batch. Total: ${totalProcessed}`);
    }

    console.log("Migration Complete!");
    process.exit(0);
}

migrate().catch(err => {
    console.error("Migration failed:", err);
    process.exit(1);
});
