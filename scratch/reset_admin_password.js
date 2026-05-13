
const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: "onedelhii"
    });
}

const db = admin.firestore();
const auth = admin.auth();

async function resetAdmin() {
    const email = "admin@onedelhi.com";
    const newPassword = "admin123";
    const name = "Super Admin";

    console.log(`Attempting to reset/create admin: ${email}`);

    try {
        let userRecord;
        try {
            userRecord = await auth.getUserByEmail(email);
            console.log("User found in Auth. Updating password...");
            await auth.updateUser(userRecord.uid, {
                password: newPassword
            });
            console.log("✓ Auth password updated.");
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                console.log("User not found in Auth. Creating new user...");
                userRecord = await auth.createUser({
                    email: email,
                    password: newPassword,
                    displayName: name
                });
                console.log("✓ Auth user created.");
            } else {
                throw error;
            }
        }

        const uid = userRecord.uid;

        // Update/Create Firestore document
        console.log(`Syncing Firestore document for UID: ${uid}`);
        await db.collection('users').doc(uid).set({
            uid: uid,
            name: name,
            email: email,
            role: "admin",
            status: "ACTIVE",
            createdAt: Math.floor(Date.now() / 1000)
        }, { merge: true });

        console.log("✓ Firestore document updated.");
        console.log("\n==========================================");
        console.log(`SUCCESS! Admin credentials:`);
        console.log(`Email: ${email}`);
        console.log(`Password: ${newPassword}`);
        console.log("==========================================");

        process.exit(0);
    } catch (err) {
        console.error("❌ Error:", err.message);
        process.exit(1);
    }
}

resetAdmin();
