const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const routeData = {
  route: "428",
  directions: {
    up: {
      from: "Nehru Place Terminal",
      to: "Aya Nagar Terminal",
      totalStops: 34,
      stops: [
        "Nehru Place Terminal",
        "Nehru Place / Nehru Place Terminal",
        "Pumposh Enclave",
        "OS Communication / Masjid Moth",
        "Chirag Delhi",
        "Sheikh Sarai Phase II / Shaheed Bhaga...",
        "Sheikh Sarai More",
        "Vocational College",
        "PSRI",
        "Khirki Village",
        "Hauz Rani",
        "HaujRani / MaxHospital",
        "Press Enclave",
        "Saket A block(Malviya Nagar Metro St...",
        "PNB Geetanjali",
        "PTS (Geetanjali Enclave)",
        "DDA Flats Lado Sarai",
        "T.B. Hospital",
        "Lado Sarai Crossing",
        "Ahinsa Sthal",
        "jain mandir / Delhi Jal Board (MG Road)",
        "Qutub Minar Metro Station",
        "Andheria Bagh More",
        "Chhatarpur More / Andheria more",
        "New Mangla Pur",
        "Sultan Pur Metro Station",
        "NBCC Ghitorni / Modern Batta",
        "Ghitorni Metro Station / Ghitorani Village",
        "Ghitorni School",
        "Air Force Station Ghitorni",
        "RRC Station MB Road",
        "Arjan Garh Metro Station",
        "Aya Nagar Crossing",
        "Aya Nagar Terminal"
      ]
    },
    down: {
      from: "Aya Nagar Terminal",
      to: "Nehru Place Terminal",
      totalStops: 36,
      stops: [
        "Aya Nagar Terminal",
        "Aya Nagar Crossing",
        "Arjan Garh Metro Station",
        "RRC Station MB Road",
        "Air Force  Station Ghitorni",
        "Ghitorni School",
        "Ghitorni Metro Station / Ghitorni  Village",
        "NBCC Ghitorni / Modern Batta",
        "Sultan Pur Metro Station",
        "New Mangla Puri",
        "Chhatarpur Metro Station (T)",
        "Andheria Bagh More",
        "Andheria Bagh More",
        "Qutub Minar Metro Sation",
        "Jain Mandir / Delhi Jal Board (MG Road)",
        "Ahinsa Sthal",
        "Lado Sarai Crossing",
        "T B Hospital",
        "DDA Flats Lado Sarai",
        "PTS (Geetanjali Enclave)",
        "PNB Geetanjali",
        "Saket A Block (Malviya Nagar Metro St...",
        "Press Enclave",
        "HaujRani / MaxHospital",
        "Hauz Rani",
        "Khirki Village",
        "PSRI",
        "Vocational College",
        "Sheikh Sarai More",
        "Sheikh Sarai Phase II / Shaheed Bhaga...",
        "Chirag Delhi",
        "Masjid Moth",
        "Savitri Cinema / Greater Kailash Metro ...",
        "OS Communications",
        "Pumposh Enclave",
        "Nehru Place Terminal"
      ]
    }
  }
};

async function upload() {
  try {
    const routeId = "428"; 
    await db.collection('routes').doc(routeId).set(routeData);
    console.log('Route 428 successfully uploaded to Firebase!');
    process.exit(0);
  } catch (error) {
    console.error('Error uploading route:', error);
    process.exit(1);
  }
}

upload();
