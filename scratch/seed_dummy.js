
const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: "onedelhii"
});

const db = admin.firestore();

async function seedDummyData() {
    console.log("Seeding database collections...");

    try {
        // Seed Users
        console.log("Seeding users...");
        await db.collection('users').doc('user_001').set({
            name: "Rajesh Kumar",
            email: "rajesh.kumar@example.com",
            phone: "9876543210",
            role: "user",
            status: "ACTIVE",
            createdAt: Date.now()
        });

        await db.collection('users').doc('user_admin_001').set({
            name: "Admin User",
            email: "admin@onedelhi.com",
            phone: "9000000000",
            role: "admin",
            status: "ACTIVE",
            createdAt: Date.now()
        });
        console.log("✓ Users seeded.");

        // Seed Stops
        console.log("Seeding stops...");
        const stops = [
            { id: "stop_001", name: "Minto Road Terminal", type: "bus_stop", updatedAt: Date.now() },
            { id: "stop_002", name: "Connaught Place", type: "bus_stop", updatedAt: Date.now() },
            { id: "stop_003", name: "India Gate", type: "bus_stop", updatedAt: Date.now() },
            { id: "stop_004", name: "AIIMS", type: "bus_stop", updatedAt: Date.now() },
            { id: "stop_005", name: "Lajpat Nagar", type: "bus_stop", updatedAt: Date.now() },
            { id: "stop_006", name: "Okhla Extn", type: "bus_stop", updatedAt: Date.now() }
        ];

        for (const stop of stops) {
            await db.collection('stops').doc(stop.id).set(stop);
        }
        console.log("✓ Stops seeded.");

        // Seed Routes
        console.log("Seeding routes...");
        const routes = [
            {
                id: "400UP",
                routeNumber: "400",
                origin: "Minto Road Terminal",
                destination: "Okhla Extn",
                direction: "UP",
                stopSequence: ["Minto Road Terminal", "Connaught Place", "India Gate", "AIIMS", "Lajpat Nagar", "Okhla Extn"],
                timestamp: Date.now()
            },
            {
                id: "502UP",
                routeNumber: "502",
                origin: "Old Delhi Railway Station",
                destination: "Mehrauli",
                direction: "UP",
                stopSequence: ["Old Delhi Railway Station", "Kashmere Gate", "Red Fort", "Delhi Gate", "ITO", "AIIMS", "Saket Metro Station", "Mehrauli"],
                timestamp: Date.now()
            }
        ];

        for (const route of routes) {
            await db.collection('routes').doc(route.id).set(route);
        }
        console.log("✓ Routes seeded.");

        // Seed Devices
        console.log("Seeding devices...");
        await db.collection('devices').doc('device_001').set({
            deviceId: "device_001",
            deviceName: "iPhone 14",
            firstRegistered: Date.now(),
            lastActive: Date.now(),
            osVersion: "17.4.1",
            status: "APPROVED",
            userId: "user_001"
        });
        console.log("✓ Devices seeded.");

        // Seed Tickets
        console.log("Seeding tickets...");
        const ticketId = "ticket_" + Date.now();
        await db.collection('tickets').doc(ticketId).set({
            tid: ticketId,
            userId: "user_001",
            route: "502UP",
            source: "Mehrauli Terminal",
            dest: "Saket",
            busType: "AC",
            fare: 25,
            baseFare: 20,
            finalFare: "25",
            total: "25",
            qty: 1,
            status: "Active",
            date: new Date().toISOString().split('T')[0],
            time: new Date().toLocaleTimeString(),
            timestamp: Date.now(),
            validationStatus: "VALID",
            validationMessage: "Ticket is valid",
            fareSource: "BASE_FARE",
            slab: {
                acFare: 25,
                nonACFare: 15,
                maxStops: 12,
                minStops: 5
            }
        });
        console.log("✓ Tickets seeded.");

        // Seed Notifications
        console.log("Seeding notifications...");
        await db.collection('notifications').doc('notif_001').set({
            message: "Your ticket is expiring soon",
            readBy: { "user_001": true },
            status: "SENT",
            targetRoute: "502UP",
            timestamp: Date.now(),
            title: "Ticket Expiry Alert"
        });
        console.log("✓ Notifications seeded.");

        // Seed Logs
        console.log("Seeding logs...");
        await db.collection('logs').doc('log_' + Date.now()).set({
            action: "DATABASE_SEEDED",
            details: "Dummy data seeded successfully",
            timestamp: new Date().toISOString(),
            type: "SYSTEM"
        });
        console.log("✓ Logs seeded.");

        // Seed Metadata
        console.log("Seeding metadata...");
        await db.collection('metadata').doc('app_metadata').set({
            activeCollections: ["users", "tickets", "routes", "stops", "devices", "notifications", "logs"],
            lastInitialized: new Date().toISOString()
        });
        console.log("✓ Metadata seeded.");

        console.log("\n✅ All collections seeded successfully!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Error seeding dummy data:", err.message);
        process.exit(1);
    }
}

seedDummyData().catch(err => {
    console.error("Error seeding dummy data:", err);
    process.exit(1);
});
