
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, Timestamp } = require('firebase/firestore');

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

async function seedDummyData() {
    console.log("Seeding dummy users...");
    const dummyUserId = "dummy_user_777";
    await setDoc(doc(db, 'users', dummyUserId), {
        uid: dummyUserId,
        displayName: "One Delhi Test User",
        email: "testuser@onedelhi.com",
        phoneNumber: "9876543210",
        createdAt: Timestamp.now(),
        lastLogin: Timestamp.now()
    });
    console.log("Dummy user added.");

    console.log("Seeding dummy tickets...");
    const dummyTicketId = "ticket_" + Date.now();
    await setDoc(doc(db, 'tickets', dummyTicketId), {
        ticketId: dummyTicketId,
        userId: dummyUserId,
        routeId: "502UP",
        routeName: "502 (Mehrauli Terminal - Kashmere Gate)",
        sourceStop: "Mehrauli Terminal",
        destinationStop: "Saket",
        fare: 15,
        passengers: 1,
        status: "Active",
        busNumber: "DL 1PC 4321",
        bookingTime: Timestamp.now(),
        expiryTime: new Timestamp(Math.floor(Date.now() / 1000) + 3600, 0) // 1 hour later
    });

    const expiredTicketId = "ticket_expired_" + Date.now();
    await setDoc(doc(db, 'tickets', expiredTicketId), {
        ticketId: expiredTicketId,
        userId: dummyUserId,
        routeId: "434UP",
        routeName: "434 (Jasola Vihar - Bhati Mines (T))",
        sourceStop: "Jasola Vihar",
        destinationStop: "Okhla Phase 1",
        fare: 10,
        passengers: 2,
        status: "INVALID",
        busNumber: "DL 1PB 9999",
        bookingTime: new Timestamp(Math.floor(Date.now() / 1000) - 86400, 0), // 1 day ago
        expiryTime: new Timestamp(Math.floor(Date.now() / 1000) - 82800, 0)
    });

    console.log("Dummy tickets added (1 Active, 1 INVALID).");
    console.log("Dummy data seeding completed!");
    process.exit(0);
}

seedDummyData().catch(err => {
    console.error("Error seeding dummy data:", err);
    process.exit(1);
});
