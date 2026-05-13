const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const routeData = {
  route: "516",
  directions: {
    up: {
      from: "Safdurjung Terminal",
      to: "dera village",
      totalStops: 36,
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
        "Qutab",
        "Mehrauli",
        "Qutab Minar",
        "Lado Sarai Crossing",
        "Ahinsa Sthal",
        "Andheria Bagh More",
        "Andheria More / Chhatarpur Metro Station",
        "Chhatarpur Mandir",
        "Chhattarpur",
        "Chhatarpur Extension",
        "Rajpur Crossing",
        "Chhatarpur Ext / Nanda Hospital",
        "Satbari Village",
        "Mallu Farm",
        "Chandan Holla",
        "Shani Dham Mandir",
        "Fatehpur Beri",
        "Harswaroop Colony",
        "Dera More",
        "dera village"
      ]
    },
    down: {
      from: "dera village",
      to: "Safdurjung Terminal",
      totalStops: 35,
      stops: [
        "dera village",
        "Dera More",
        "Harswaroop Colony",
        "Fatehpur Beri",
        "Shani Dham Mandir",
        "Chandan Holla",
        "Mallu Farm",
        "Satbari Village",
        "Chhatarpur Ext / Nanda Hospital",
        "Rajpur Crossing",
        "Chhatarpur Extension",
        "Chhattarpur",
        "Chhatarpur Mandir",
        "Chhatarpur More",
        "Andheria Bagh More",
        "Ahinsa Sthal",
        "Lado Sarai Crossing",
        "Qutab Minar",
        "Mehrauli",
        "Qutab",
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
    const routeId = "516"; 
    await db.collection('routes').doc(routeId).set(routeData);
    console.log('Route 516 successfully uploaded to Firebase!');
    process.exit(0);
  } catch (error) {
    console.error('Error uploading route:', error);
    process.exit(1);
  }
}

upload();
