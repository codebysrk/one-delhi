
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, deleteDoc, doc, setDoc } = require('firebase/firestore');
const fs = require('fs');
const path = require('path');

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
const db = getFirestore(app);

async function clearCollection(collectionName) {
    console.log(`Clearing collection: ${collectionName}...`);
    const snap = await getDocs(collection(db, collectionName));
    const deletePromises = snap.docs.map(d => deleteDoc(doc(db, collectionName, d.id)));
    await Promise.all(deletePromises);
    console.log(`Cleared ${snap.size} documents from ${collectionName}.`);
}

async function seedRoutes() {
    console.log("Seeding bus_routes...");
    const dataPath = path.join(__dirname, '..', 'src', 'data', 'dtc_data.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    for (const route of data.routes) {
        await setDoc(doc(db, 'bus_routes', route.id), {
            routeId: route.id,
            name: route.name,
            stops: route.stops,
            totalStops: route.stops.length
        });
        console.log(`Added route: ${route.id}`);
    }
    console.log("Bus routes seeded successfully.");
}

async function migrate() {
    try {
        await clearCollection('users');
        await clearCollection('tickets');
        await clearCollection('bus_routes');
        await seedRoutes();
        console.log("Migration completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
}

migrate();
