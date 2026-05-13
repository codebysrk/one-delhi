const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const routeData = {
  route: "427",
  directions: {
    down: {
      from: "Mehrauli Terminal",
      to: "Nizamuddin Railway Station",
      totalStops: 35,
      stops: [
        "Mehrauli Terminal",
        "Qutub Minar",
        "Lado Sarai Crossing",
        "Lado Sarai",
        "Dhaula Peer Lado Sarai",
        "Said-ul-Ajaib/ Saket Metro Station",
        "Maidan Garhi Crossing (SDM Court)",
        "Saket Crossing",
        "Asian Market",
        "Institute Of Pharmacy (DIPSAR)",
        "Ambedkar Nagar Terminal",
        "Madangir DDA Flats",
        "Madangir Village / Madangir DDA Flats",
        "Pushp Vihar",
        "Pushpa Bhawan",
        "Sheikh Sarai Phase II / Shaheed Bhagat Singh College",
        "Chirag Delhi",
        "Masjid Moth",
        "OS Communications",
        "Pumposh Enclave",
        "Paras Cinema",
        "Nehru Place / Paras Cinema",
        "Kalkaji Mandir",
        "NSIC",
        "Modi Mill / NSIC Hostel",
        "SNPD",
        "East of Kailash CBlock",
        "East of Kailash BBlock",
        "Garhi Gaon",
        "Lajpat Nagar Crossing",
        "PG DAV College / Sri Niwaspuri",
        "Nehru Nagar",
        "Ashram (Hari Nagar)",
        "Rojdoot Hotel / Shri Radha Krishna Mandir",
        "Nizamuddin Railway Station"
      ]
    },
    up: {
      from: "Nizamuddin Railway Station",
      to: "Mehrauli Terminal",
      totalStops: 34,
      stops: [
        "Nizamuddin Railway Station",
        "Rajdoot Hotel",
        "Ashram (Hari Nagar)",
        "Nehru Nagar",
        "Sri Niwaspuri / PG DAV College",
        "Lajpat Nagar Crossing",
        "Garhi Village",
        "BBlock East of Kailash",
        "CBlock East of Kailash",
        "SNPD",
        "Laghu Udyog Sansthan (ModiMill)",
        "NSIC",
        "Kalkaji Mandir",
        "Nehru Place / Nehru Place Terminal",
        "Paras Cinema",
        "Pumposh Enclave",
        "OS Communication / Masjid Moth",
        "Chirag Delhi",
        "Sheikh Sarai Phase II / Shaheed Bhagat Singh College",
        "Pushpa Bhawan",
        "Pushp Vihar",
        "Madangir DDA Flats / Madangir Village",
        "Madangir",
        "Ambedkar Nagar Terminal",
        "DIPSAR ( Institute of Pharmacy)",
        "Asian Market",
        "Saket Crossing",
        "Maidan Garhi Crossing (SDM Court)",
        "Saket Metro Station / Said-ul-Ajaib",
        "Dhaula Peer",
        "Lado Sarai Firni Road (T)",
        "Lado Sarai Crossing",
        "Mehrauli / Qutub Minar",
        "Mehrauli Terminal"
      ]
    }
  }
};

async function upload() {
  try {
    const routeId = "427"; 
    await db.collection('routes').doc(routeId).set(routeData);
    console.log('Route 427 successfully uploaded to Firebase!');
    process.exit(0);
  } catch (error) {
    console.error('Error uploading route:', error);
    process.exit(1);
  }
}

upload();
