const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const routeData = {
  route: "525",
  directions: {
    up: {
      from: "Badarpur Border (T)",
      to: "Aya Nagar Terminal",
      totalStops: 38,
      stops: [
        "Badarpur Border (T)",
        "Badarpur M B Road / Rajiv Gandhi Stadium",
        "Pul Prehladpur (BadarPur)",
        "Surajkund Crossing",
        "Lal Kuan",
        "Prem Nagar",
        "Tuglaqabad MB Road / Okhla more",
        "Kaya Maya Hospital",
        "Tughalqabad Village",
        "Tuglkabad Fort",
        "Air Force Station",
        "Hamdard Nagar / Sangam Vihar",
        "Batra Hospital (Satya Narayan Mandir)",
        "Vayusenabad (Tigri)",
        "Khanpur Extension / Devli Road Xing",
        "Ambedkar Nagar Depot",
        "Ambedkar Nagar Terminal",
        "DIPSAR (Institute of Pharmacy)",
        "Asian Market",
        "Saket Crossing",
        "Maidan Garhi Crossing (SDM Court)",
        "Said ul zeb",
        "Dhaula Peer",
        "Dhaula Peer / Lado Sarai",
        "Lado Sarai Crossing",
        "Ahinsa Sthal",
        "Qutub Minar Metro Station",
        "Andheria Bagh More",
        "Chhatarpur More / Andheria more",
        "New Mangla Pur",
        "Sultan Pur",
        "NBCC Ghitorni / Modern Batta",
        "Ghitorni Metro Station / Ghitorani Village",
        "Ghitorni School",
        "Air Force Station Ghitorni",
        "RRC Station MB Road",
        "Aya Nagar Crossing",
        "Aya Nagar Terminal"
      ]
    },
    down: {
      from: "Aya Nagar Terminal",
      to: "Badarpur Border (T)",
      totalStops: 38,
      stops: [
        "Aya Nagar Terminal",
        "Aya Nagar Crossing",
        "RRC Station MB Road",
        "Air Force Station Ghitorni",
        "Ghitorni School",
        "Ghitorni Metro Station / Ghitorni Village",
        "NBCC Ghitorni / Modern Batta",
        "Sultan Pur",
        "New Mangla Puri",
        "Chhattarpur More",
        "Andheria Bagh More",
        "Qutub Minar Metro Station",
        "Ahinsa Sthal",
        "Lado Sarai Crossing",
        "Lado Sarai",
        "Dhaula Peer Lado Sarai",
        "Said-ul-Ajaib / Saket Metro Station",
        "Maidan Garhi Crossing (SDM Court)",
        "Saket Crossing",
        "Asian Market",
        "DIPSAR College of Pharmacy / Ambedkar Nagar",
        "Ambedkar Nagar Depot",
        "Ambedkar Nagar Terminal",
        "Khanpur Extension / Devali Road Xing",
        "VayuSenaBad (Tigri)",
        "Batra Hospital / Satya Narayan Mandir",
        "Hamdard Nagar / Sangam Vihar",
        "Air Force Station",
        "Tuglakabad Fort",
        "Tughlaqabad Village",
        "Kaya Maya Hospital",
        "MB Road / Okhla More",
        "Prem Nagar",
        "Lal Kuan",
        "Surajkund Crossing",
        "Prehlad Pur (Badarpur)",
        "Badarpur MB Road / Rajiv Gandhi Stadium",
        "Badarpur Border (T)"
      ]
    }
  }
};

async function upload() {
  try {
    const routeId = "525"; 
    await db.collection('routes').doc(routeId).set(routeData);
    console.log('Route 525 successfully uploaded to Firebase!');
    process.exit(0);
  } catch (error) {
    console.error('Error uploading route:', error);
    process.exit(1);
  }
}

upload();
