const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

const routeData = {
  route: "523",
  directions: {
    up: {
      from: "Dhaula Kuan ARSD College",
      to: "Bhati Mines (T)",
      totalStops: 52,
      stops: [
        "Dhaula Kuan ARSD College",
        "Satya Niketan (ORR)",
        "Gurudwara Moti Bagh",
        "South Moti Bagh (Ring Road) / Moti Ba...",
        "South Moti Bagh",
        "R. K. Puram Sec12",
        "Sangam Cinema",
        "RK Puram Sec 9 / R K Puram Sec 7 X...",
        "Mohan Singh Market",
        "RK Puram Sec 1",
        "RK Puram Sec 1",
        "R K Puram Nab",
        "Munirka Village (T)",
        "Munirka Family Planning / Munirka / M...",
        "Munirka DDA Flats",
        "ISTM / JNU",
        "Ber Sarai / JNU",
        "School Of Physical Science",
        "FAI",
        "Sanskrit Vidyapeeth",
        "Katwaria Sarai",
        "Qutab Hotel",
        "NCERT",
        "MMTC / Adchini Village",
        "PTS",
        "DDA Flats Lado Sarai",
        "T.B. Hospital",
        "Lado Sarai Crossing",
        "Ahinsa Sthal",
        "Qutub Minar Metro Station",
        "Andheria Bagh More",
        "Chhatarpur Metro Station",
        "Andheria More / Chhatarpur Metro Sta...",
        "Chhatarpur Mandir",
        "Chhattarpur",
        "Rajpur Crossing",
        "Chhatarpur Ext / Nanda Hospital",
        "Rajpur Ext",
        "Satbari",
        "Ambedkar Colony",
        "Mallu Farm",
        "Chandan Hola",
        "Shani Dham Mandir",
        "Fatehpur Beri",
        "Harswaroop Colony",
        "Dera More",
        "SP School / RS Satsang",
        "Sawan Public School",
        "RADHA SWAMI SATSANG / Vipassana ...",
        "Check Post",
        "Sanjay Colony",
        "Bhati Mines (T)"
      ]
    },
    down: {
      from: "Bhati Mines (T)",
      to: "Dhaula Kuan (Ring Road)",
      totalStops: 48,
      stops: [
        "Bhati Mines (T)",
        "INDIRA NAGAR",
        "Check Post",
        "RADHA SWAMI SATSANG / Vipassana ...",
        "Sawan Public School",
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
        "Chhatarpur",
        "Chhatarpur Mandir",
        "Chhatarpur More",
        "Andheria Bagh More",
        "Qutub Minar Metro Sation",
        "Ahinsa Sthal",
        "Lado Sarai Crossing (Aurobindo Marg)",
        "DDA Flats Lado Sarai",
        "PTS",
        "MMTC / Adhchini Village",
        "Adhchini",
        "NCERT",
        "Qutub Hotel / Govt. Medical Store Dep...",
        "Katwaria Sarai / Bharatkhande Sangee...",
        "Sanskrit Vidyapeeth",
        "FAI",
        "Physical Of Science",
        "Ber Sarai/JNU",
        "JNU / JNU Xing",
        "DDA Flats Munirka Family Planing",
        "Munirka Village (T)",
        "RK Puram Sec 4 (Kendriya Vidhyalaya)",
        "RK Puram Sec 1",
        "Mohan Singh Market / R K Puram Sec-6",
        "RK Puram Sec 7 Som Vihar",
        "Sangam Cinema RK Puram Sec12",
        "R. K. Puram Sec-12 / R. K. Puram Sec",
        "South Moti Bagh",
        "South Moti Bagh (Ring Road) / MOTI B...",
        "Moti Bagh Gurudawara Nanakpura",
        "Satya Niketan",
        "ARSD College / Dhaula Kuan",
        "Dhaula Kuan (Ring Road)"
      ]
    }
  },
  updatedAt: Date.now()
};

async function upload() {
  try {
    const routeId = "523"; 
    await db.collection('routes').doc(routeId).set(routeData);
    console.log('Route 523 successfully uploaded to Firebase!');
    process.exit(0);
  } catch (error) {
    console.error('Error uploading route:', error);
    process.exit(1);
  }
}

upload();
