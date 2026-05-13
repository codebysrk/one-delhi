const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: "onedelhii"
});

const db = admin.firestore();

async function seedDataFromFile() {
    console.log("📂 Reading dtc_data.json from Downloads...\n");

    try {
        const filePath = path.join('C:\\Users\\maish\\Downloads\\dtc_data.json');
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(fileContent);

        console.log("📍 Found collections:", Object.keys(data).join(', '));
        console.log("");

        // Seed routes
        if (data.routes && Array.isArray(data.routes)) {
            console.log(`Seeding ${data.routes.length} routes...`);
            let routeCount = 0;
            for (const route of data.routes) {
                // Convert old format to new format
                const routeData = {
                    id: route.id,
                    name: route.name,
                    routeNumber: route.id.replace(/[A-Z]+$/, ''),
                    direction: route.id.endsWith('DOWN') ? 'DOWN' : 'UP',
                    origin: route.name.match(/\(([^-]+)/)?.[1]?.trim() || 'Unknown',
                    destination: route.name.match(/- ([^)]+)\)/)?.[1]?.trim() || 'Unknown',
                    stopSequence: route.stops || [],
                    timestamp: Date.now()
                };
                
                await db.collection('routes').doc(route.id).set(routeData);
                routeCount++;
                if (routeCount % 5 === 0) {
                    console.log(`  ✓ ${routeCount} routes seeded...`);
                }
            }
            console.log(`✅ ${routeCount} routes seeded successfully!\n`);
        }

        // Seed stops if available
        if (data.stops && Array.isArray(data.stops)) {
            console.log(`Seeding ${data.stops.length} stops...`);
            let stopCount = 0;
            for (const stop of data.stops) {
                const stopData = {
                    id: stop.id || `stop_${stopCount}`,
                    name: stop.name || stop,
                    type: 'bus_stop',
                    updatedAt: Date.now()
                };
                
                await db.collection('stops').doc(stopData.id).set(stopData);
                stopCount++;
            }
            console.log(`✅ ${stopCount} stops seeded successfully!\n`);
        }

        console.log("🎉 All data from Downloads/dtc_data.json has been seeded to Firebase!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Error:", err.message);
        process.exit(1);
    }
}

seedDataFromFile();
