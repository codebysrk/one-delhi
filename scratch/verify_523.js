const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function verify() {
  try {
    const doc = await db.collection('routes').doc('523').get();
    if (doc.exists) {
      console.log('Verification Success: Route 523 exists in Firestore');
      console.log('Data:', JSON.stringify(doc.data(), null, 2).substring(0, 500) + '...');
    } else {
      console.log('Verification Failed: Route 523 not found');
    }
    process.exit(0);
  } catch (error) {
    console.error('Error verifying route:', error);
    process.exit(1);
  }
}

verify();
