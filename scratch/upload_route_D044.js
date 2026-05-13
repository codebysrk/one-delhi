const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const routeData = {
  route: "D-044",
  directions: {
    up: {
      from: "Nizamuddin Railway Station",
      to: "Hamdard Nagar / Sangam Vihar",
      totalStops: 24,
      stops: [
        "Nizamuddin Railway Station",
        "Rajdoot Hotel",
        "Ashram (Hari Nagar)",
        "Nehru Nagar",
        "Sri Niwaspuri / PG DAV College",
        "Lajpat Nagar Crossing",
        "Sapna Cinema (Kailash Colony)",
        "Kailash Colony",
        "Sant Nagar",
        "Nehru Place",
        "Pumposh Enclave",
        "Savitri Cinema (E Block Gurudwara)",
        "Greater K & E Block / Savitri Cinema (E...",
        "M Block Greater Kailash II",
        "Chandan Market Greater Kailash II",
        "S Block Greater Kailash II",
        "Don Bosco School",
        "Narmada Apartments",
        "Alaknanda Apartments",
        "Tara Apartments Terminal",
        "Guru Ravidass Marg / Guru Ravi Das A...",
        "Jamia Hamdard Library",
        "Majeedia Hospital",
        "Hamdard Nagar / Sangam Vihar"
      ]
    },
    down: {
      from: "Hamdard Nagar / Sangam Vihar",
      to: "Nizamuddin Railway Station",
      totalStops: 28,
      stops: [
        "Hamdard Nagar / Sangam Vihar",
        "Majeedia Hospital",
        "Jamia Hamdard Library",
        "Guru Ravidass Marg / Guru Ravi Das A...",
        "Tara Apartments Terminal",
        "Alaknanda Apartment",
        "Narmada Apartment",
        "Don Bosco School",
        "S Block Greater Kailash II",
        "Chandan Market Greater Kailash II",
        "M Block Greater Kailash II",
        "E Block Greater Kailash II",
        "Greater K & E Block / Savitri Cinema (E...",
        "Savitri Cinema (E Block Gurudwara)",
        "OS Communications",
        "Pumposh Enclave",
        "Nehru Place",
        "Sant Nagar",
        "Kailash Colony Metro Station",
        "Kailash Colony",
        "jamrood pur",
        "Sapna Cinema (Kailash Colony)",
        "Lajpat Nagar Crossing",
        "PG DAV College / Sri Niwaspuri",
        "Nehru Nagar",
        "Ashram (Hari Nagar)",
        "Rojdoot Hotel / Shri Radha Krishna Ma...",
        "Nizamuddin Railway Station"
      ]
    }
  }
};

async function upload() {
  try {
    const routeId = "D-044"; 
    await db.collection('routes').doc(routeId).set(routeData);
    console.log('Route D-044 successfully uploaded to Firebase!');
    process.exit(0);
  } catch (error) {
    console.error('Error uploading route:', error);
    process.exit(1);
  }
}

upload();
