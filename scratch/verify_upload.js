const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function verifyData() {
  try {
    const docRef = db.collection('routes').doc('516');
    const doc = await docRef.get();
    
    if (!doc.exists) {
      console.log('Document "516" NOT FOUND in collection "routes".');
      
      // List collections to be sure
      const collections = await db.listCollections();
      console.log('Available collections:', collections.map(c => c.id));
      
      // Search for 516 in any other collection just in case
      for (const coll of collections) {
          const check = await coll.doc('516').get();
          if (check.exists) {
              console.log(`Document "516" found in collection "${coll.id}" instead!`);
          }
      }

    } else {
      console.log('Document "516" FOUND successfully!');
      console.log('Content:', JSON.stringify(doc.data(), null, 2).substring(0, 500) + '...');
    }
    process.exit(0);
  } catch (error) {
    console.error('Error verifying data:', error);
    process.exit(1);
  }
}

verifyData();
