const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const routeData = {
  route: "D-044STL",
  directions: {
    up: {
      from: "Nizamuddin Railway Station",
      to: "Kushak Nallah Depot",
      totalStops: 13,
      stops: [
        "Nizamuddin Railway Station",
        "Rajdoot Hotel",
        "Bhogal",
        "Bhogal (Jungpura)",
        "Nizamuddin Extension",
        "PS Nizamuddin (Dargah / Markaz)",
        "DPS / Police Station Nizamuddin(Lodhi...",
        "Ishpat Bhawan",
        "JLN Stadium (Sunehripulla Depot)",
        "Pragati Vihar",
        "Central School Lodhi Colony",
        "Lodhi Colony",
        "Kushak Nallah Depot"
      ]
    },
    down: {
      from: "Kushak Nallah Depot",
      to: "Nizamuddin Railway Station",
      totalStops: 13,
      stops: [
        "Kushak Nallah Depot",
        "Lodhi Colony",
        "Central School Lodhi Road",
        "Pragati Vihar",
        "JLN Stadium / Sunehri Pulla Depot",
        "Ishpat Bhawan",
        "DPS / Police Station Nizamuddin (Lodh...",
        "PS Nizamuddin (Dargah / Markaz)",
        "Nizamuddin Extension",
        "Bhogal (Jungpura)",
        "Bhogal",
        "Rojdoot Hotel / Shri Radha Krishna Ma...",
        "Nizamuddin Railway Station"
      ]
    }
  }
};

async function upload() {
  try {
    const routeId = "D-044STL"; 
    await db.collection('routes').doc(routeId).set(routeData);
    console.log('Route D-044STL successfully uploaded to Firebase!');
    process.exit(0);
  } catch (error) {
    console.error('Error uploading route:', error);
    process.exit(1);
  }
}

upload();
