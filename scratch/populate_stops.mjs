import { initializeApp } from "firebase/app";
import { getFirestore, doc, writeBatch } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

async function populateStops() {
    try {
        console.log("Logging in as admin...");
        await signInWithEmailAndPassword(auth, "admin@onedelhi.com", "AdminPassword123!");
        
        console.log("Reading JSON data...");
        const jsonPath = path.join(__dirname, '../src/components/react-native-component-code/src/data/dtc_data.json');
        const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        
        const stopNames = new Set();
        data.routes.forEach(route => {
            if (route.stops && Array.isArray(route.stops)) {
                route.stops.forEach(stop => stopNames.add(stop));
            }
        });

        console.log(`Found ${stopNames.size} unique stops.`);

        let batch = writeBatch(db);
        let count = 0;
        let totalProcessed = 0;

        for (const stopName of stopNames) {
            // Sanitize ID: replace slashes and other invalid characters for Firestore IDs
            const sanitizedId = stopName.replace(/[\/\.\#\$\[\]]/g, '_');
            const stopRef = doc(db, "stops", sanitizedId);
            
            batch.set(stopRef, {
                name: stopName,
                id: sanitizedId,
                type: 'bus_stop',
                updatedAt: Date.now()
            });

            count++;
            totalProcessed++;

            if (count === 400) {
                await batch.commit();
                console.log(`Committed batch. Total: ${totalProcessed}/${stopNames.size}`);
                batch = writeBatch(db);
                count = 0;
            }
        }

        if (count > 0) {
            await batch.commit();
            console.log(`Committed final batch. Total: ${totalProcessed}`);
        }

        console.log("Stops population complete!");
        process.exit(0);
    } catch (error) {
        console.error("Population failed:", error);
        process.exit(1);
    }
}

populateStops();
