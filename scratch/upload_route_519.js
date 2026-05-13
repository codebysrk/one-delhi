const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const routeData = {
  route: "519",
  directions: {
    up: {
      from: "Safdurjung Terminal",
      to: "Mandi Village",
      totalStops: 29,
      stops: [
        "Safdurjung Terminal",
        "Vikas Sadan",
        "INA Colony / Kidwai nagar",
        "INA Metro Station( Dilli Haat)",
        "AIIMS / Safdurjung Hospital",
        "Yusuf Sarai",
        "Green Park",
        "Hauz Khas",
        "Padhmini Enclave",
        "IIT Gate",
        "Mothers International School",
        "Adhchini Village",
        "MMTC / Adhchini Village",
        "PTS",
        "DDA Flats Lado Sarai",
        "T.B. Hospital",
        "Lado Sarai Crossing",
        "Ahinsa Sthal",
        "Andheria Bagh More",
        "Chhatarpur More / Andheria more",
        "New Mangla Puri",
        "Sultan Pur",
        "Sultan Pur Estate",
        "Gadai Pur / Westend DLF",
        "Govind Sadan",
        "Jona Pur / SBI JonaPur",
        "Jonapur Pahari Mandir / Pahari Mandir",
        "Sardar Patel Vidya Niketan",
        "Mandi Village"
      ]
    },
    down: {
      from: "Mandi Village",
      to: "Safdurjung Terminal",
      totalStops: 28,
      stops: [
        "Mandi Village",
        "Sardar Patel Vidya Niketan",
        "Jonapur Pahari Mandir / Pahari Mandir",
        "Jona Pur / SBI JonaPur",
        "Govind Sadan",
        "Gadai Pur / Westend DLF",
        "Sultan Pur Estate",
        "Sultan Pur Metro Station",
        "New Mangla Puri",
        "Chhattarpur More",
        "Andheria Bagh More",
        "Ahinsa Sthal",
        "Lado Sarai Crossing",
        "T B Hospital",
        "DDA Flats Lado Sarai",
        "PTS",
        "MMTC / Adhchini Village",
        "Adhchini Village",
        "Mothers International School",
        "IIT Gate",
        "Padmani Enclave",
        "Hauz Khas",
        "Green Park",
        "Yusuf Sarai",
        "Safdurjung Hospital / AIIMS",
        "Kidwai Nagar / INA MARKET",
        "INA COLONY",
        "Safdurjung Terminal"
      ]
    }
  }
};

async function upload() {
  try {
    const routeId = "519"; 
    await db.collection('routes').doc(routeId).set(routeData);
    console.log('Route 519 updated successfully in Firebase!');
    process.exit(0);
  } catch (error) {
    console.error('Error updating route:', error);
    process.exit(1);
  }
}

upload();
