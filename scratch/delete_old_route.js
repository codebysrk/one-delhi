const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function deleteOldDoc() {
  try {
    await db.collection('routes').doc('route_516').delete();
    console.log('Old document "route_516" deleted successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error deleting old document:', error);
    process.exit(1);
  }
}

deleteOldDoc();
