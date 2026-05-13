
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

const serviceAccount = require('./firebase-service-account.json');
const dataPath = path.join(__dirname, '../src/data/dtc_data.json');
let rawData = fs.readFileSync(dataPath, 'utf8');
// Remove BOM if present
if (rawData.charCodeAt(0) === 0xFEFF) {
    rawData = rawData.slice(1);
}
const data = JSON.parse(rawData);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function seed() {
  const collections = [
    { name: 'devices', idField: 'deviceId' },
    { name: 'logs', idField: null },
    { name: 'notifications', idField: null },
    { name: 'routes', idField: 'route' },
    { name: 'stops', idField: 'id' },
    { name: 'tickets', idField: 'tid' },
    { name: 'users', idField: 'email' }
  ];

  for (const coll of collections) {
    console.log(`Cleaning ${coll.name} collection...`);
    const snapshot = await db.collection(coll.name).get();
    const deleteBatch = db.batch();
    snapshot.docs.forEach((doc) => {
      deleteBatch.delete(doc.ref);
    });
    await deleteBatch.commit();
    console.log(`Cleaned ${coll.name}.`);

    const items = data[coll.name];
    if (!items || !Array.isArray(items)) {
      console.log(`Skipping ${coll.name}, no data found.`);
      continue;
    }

    console.log(`Seeding ${coll.name}...`);
    const batch = db.batch();
    
    items.forEach((item) => {
      let docRef;
      if (coll.idField && item[coll.idField]) {
        docRef = db.collection(coll.name).doc(String(item[coll.idField]));
      } else {
        docRef = db.collection(coll.name).doc();
      }
      batch.set(docRef, item);
    });

    await batch.commit();
    console.log(`Finished seeding ${coll.name}.`);
  }

  // Handle metadata separately as a single document if needed
  if (data.metadata) {
    console.log('Seeding metadata...');
    await db.collection('metadata').doc('config').set(data.metadata);
    console.log('Finished seeding metadata.');
  }
}

seed()
  .then(() => {
    console.log('Database seeded successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error seeding database:', error);
    process.exit(1);
  });
