const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const routeData = {
  route: "525STL",
  directions: {
    up: {
      from: "Badarpur Border(T)",
      to: "Mehrauli Terminal",
      totalStops: 25,
      stops: [
        "Badarpur Border(T)",
        "Badarpur M B Road / Rajiv Gandhi Stadium",
        "Pul Prehladpur ( BadarPur)",
        "Surajkund Crossing",
        "Lal Kuan",
        "Prem Nagar",
        "Tuglaqabad MB Road / Okhla more",
        "Kaya Maya Hospital",
        "Air Force Station",
        "Hamdard Nagar / Sangam Vihar",
        "Batra Hospital (Satya Narayan Mandir)",
        "Vayusenabad (Tigri)",
        "Khanpur Extension / Devli Road Xing",
        "Ambedkar Nagar Depot",
        "DIPSAR ( Institute of Pharmacy)",
        "Asian Market",
        "Saket Crossing",
        "Maidan Garhi Crossing (SDM Court)",
        "Saket Metro Station / Said-ul-Ajaib",
        "Said ul zeb",
        "Dhaula Peer",
        "Dhaula Peer / Lado Sarai",
        "Lado Sarai Crossing",
        "Qutub Minar",
        "Mehrauli Terminal"
      ]
    },
    down: {
      from: "Mehrauli Terminal",
      to: "Badarpur Border(T)",
      totalStops: 0,
      stops: []
    }
  }
};

async function upload() {
  try {
    const routeId = "525STL"; 
    await db.collection('routes').doc(routeId).set(routeData);
    console.log('Route 525STL successfully uploaded to Firebase!');
    process.exit(0);
  } catch (error) {
    console.error('Error uploading route:', error);
    process.exit(1);
  }
}

upload();
