const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function listRoutes() {
  try {
    console.log('Listing all documents in "routes" collection...');
    const snapshot = await db.collection('routes').get();
    if (snapshot.empty) {
      console.log('Collection "routes" is EMPTY!');
    } else {
      snapshot.forEach(doc => {
        console.log(`- ID: ${doc.id}`);
      });
    }
    
    // Check for "516" specifically again
    const check = await db.collection('routes').doc('516').get();
    console.log(`Direct check for "516": ${check.exists ? 'EXISTS' : 'NOT FOUND'}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error listing routes:', error);
    process.exit(1);
  }
}

listRoutes();
