const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const routeData = {
  route: "434",
  directions: {
    up: {
      from: "Jasola Vihar",
      to: "Bhati Mines (T)",
      totalStops: 55,
      stops: [
        "Jasola Vihar",
        "Sarita Vihar K Block",
        "Power House / DESU Office (BSES)",
        "Okhla Phase 2",
        "CRPF Camp / Crown Plaza",
        "Bank",
        "Okhla Phase 1",
        "ESI Hospital Okhla",
        "Tekhand Depot DTC",
        "Maa Anand Mai Marg X-ing",
        "Tuglaqabad MB Road / Okhla more",
        "Kaya Maya Hospital",
        "Tughalaqbad Village",
        "Air Force Station",
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
        "Ahinsa Sthal",
        "Jain mandir / Delhi Jal Board (MG Road)",
        "Qutub Minar Metro Station",
        "Andheria Bagh More",
        "Chhatarpur Metro Station",
        "Andheria More / Chhatarpur Metro Station",
        "Chhatarpur Mandir",
        "Chhatarpur",
        "Chhatarpur Extension",
        "Rajpur Crossing",
        "Chhatarpur Ext / Nanda Hospital",
        "Rajpur Ext",
        "Satbari",
        "Ambedkar Colony",
        "Mallu Farm",
        "Chandan Holla",
        "Shani Dham Mandir",
        "Fatehpur Beri",
        "Ansal Villa / Dera More",
        "Harswaroop Colony",
        "Dera More",
        "Sawan Public School",
        "RADHA SWAMI SATSANG / Vipassana",
        "Check Post",
        "Sanjay Colony",
        "Bhati Mines (T)"
      ]
    },
    down: {
      from: "Bhati Mines (T)",
      to: "Jasola Vihar",
      totalStops: 57,
      stops: [
        "Bhati Mines (T)",
        "Sanjay Colony",
        "Check Post",
        "RADHA SWAMI SATSANG / Vipassana",
        "Sawan Public School",
        "RS Satsang",
        "Dera More",
        "Harswaroop Colony",
        "Fatehpur Beri",
        "Shani Dham Mandir",
        "Chandan Hola",
        "Mallu Farm",
        "Ambedkar Colony",
        "Satbari",
        "Satbari Village",
        "Rajpur Ext",
        "Chhatarpur Ext / Nanda Hospital",
        "Rajpur Crossing",
        "Chhatarpur Extension",
        "Chhatarpur",
        "Chhatarpur Mandir",
        "Chhatarpur More",
        "Andheria Bagh More",
        "Andheria Bagh More",
        "Jai Mandir / Delhi Jal Board (MG Road)",
        "Ahinsa Sthal",
        "Lado Sarai Crossing",
        "Lado Sarai Crossing",
        "Lado Sarai",
        "Lado Sarai Firni Road (T)",
        "Dhaula Peer Lado Sarai",
        "Said-ul-Ajaib/ Saket Metro Station",
        "Maidan Garhi Crossing (SDM Court)",
        "Saket Crossing",
        "Asian Market",
        "DIPSAR College of Pharmacy / Ambedkar Nagar",
        "Ambedkar Nagar Terminal",
        "Ambedkar Nagar Depot",
        "Khanpur Extension / Devali Road Xing",
        "VayuSenaBad (Tigri)",
        "Batra Hospital / Satya Narayan Mandir",
        "Hamdard Nagar / Sangam Vihar",
        "Air Force Station",
        "Air Force Station",
        "Tughlaqabad Village",
        "Kaya Maya Hospital",
        "MB Road / Okhla More",
        "Maa Anand Mayee Marg",
        "Tekhand Depot DTC",
        "ESI Hospital Okhla",
        "Okhla Phase 1",
        "Bank",
        "CRPF Camp / Crown Plaza",
        "CLal Chowk",
        "D-Block Okhla-II",
        "Sarita Vihar K Block",
        "Jasola Vihar"
      ]
    }
  }
};

async function upload() {
  try {
    const routeId = "434"; 
    await db.collection('routes').doc(routeId).set(routeData);
    console.log('Route 434 successfully uploaded to Firebase!');
    process.exit(0);
  } catch (error) {
    console.error('Error uploading route:', error);
    process.exit(1);
  }
}

upload();
