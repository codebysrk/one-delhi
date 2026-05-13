const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const routeData = {
  route: "522",
  directions: {
    up: {
      from: "Lado Sarai Firni Road (T)",
      to: "Inderpuri Krishi Kunj (T)",
      totalStops: 58,
      stops: [
        "Lado Sarai Firni Road (T)",
        "Saidu-A-Zeb",
        "Said-ul-Ajaib/ Saket Metro Station",
        "Maidan Garhi Crossing (SDM Court)",
        "Saket Crossing",
        "Asian Market",
        "Ambedkar Nagar Terminal",
        "Madangir DDA Flats",
        "Madangir Village / Madangir DDA Flats",
        "Pushp Vihar",
        "Pushpa Bhawan",
        "Sheikh Sarai Phase II / Shaheed Bhaga...",
        "Chirag Delhi",
        "Panchsheel Enclave",
        "Krishi Vihar",
        "Siri Fort Road",
        "Sadiq Nagar",
        "Central School (MCKR) / Defence Colo...",
        "Andrews Ganj",
        "PT College Kotla",
        "Defence Colony",
        "Sewa Nagar Flyover",
        "J L Nehru Stadium",
        "Central School Lodhi Colony",
        "Lodhi Colony 12/13 Block",
        "Lodhi Colony 18 Block",
        "Lodhi Colony / Crossing",
        "Max Mueller Marg",
        "Prithviraj Road Crossing",
        "Claridges Hotel",
        "National Museum",
        "National Archives",
        "Windsor Place",
        "Western Court",
        "Janpath Market",
        "Shivaji Stadium Terminal",
        "Shaheed Bhagat Singh Marg",
        "Gole Market",
        "Mandir Marg / Balmiki Mandir",
        "Panchkuian Road Banwai Lal Hospital",
        "Meghdoot Bhawan",
        "Pusa Road Petrol Pump / Sadhu Vaswa...",
        "Karol Bagh Metro Station",
        "Old Rajendra Nagar Market",
        "Rajender Nagar Crossing",
        "Shankar Road",
        "East Patel Nagar",
        "NPL Colony",
        "RBlock Rajendra Nagar",
        "Janak Vihar",
        "Pusa Quarters",
        "ISAR",
        "NASC Dasghara",
        "Todapur Village",
        "Air Pusa / Monitoring and Receiving St...",
        "Inderpuri ABlock",
        "Inder Puri",
        "Inderpuri Krishi Kunj (T)"
      ]
    },
    down: {
      from: "Inderpuri Krishi Kunj (T)",
      to: "Lado Sarai Firni Road (T)",
      totalStops: 61,
      stops: [
        "Inderpuri Krishi Kunj (T)",
        "Inder Puri",
        "Inderpuri ABlock",
        "AIR Station pusa",
        "Todapur Village",
        "NASC Dasghara",
        "ISAR",
        "Pusa Quarters",
        "Janak Vihar",
        "R Block Rajendra Nagar",
        "N.P.L Colony",
        "East Patel Nagar",
        "Shankar Road",
        "Rajender Nagar Crossing",
        "rajinder nagar market",
        "Karol Bagh Metro Station",
        "Pusa Road Petrol Pump/ Sadhu Vaswa...",
        "Meghdoot Bhawan",
        "Panchkuian Road Banwari Lal Hospital",
        "Mandir Marg / Balmiki Mandir",
        "Gole Market",
        "Rama Krishna Ashram Marg",
        "Kalawati Hospital",
        "Sucheta Kriplani Hospital / Lady Hardin...",
        "Super Bazar",
        "Kailash Bhawan / Scindia House",
        "Max Mueller Bhawan",
        "Firoz Shah Road",
        "National Archives",
        "National Museum",
        "Claridges Hotel",
        "Prithviraj Road Crossing",
        "Max Mueller Marg",
        "Lodhi Colony",
        "Lodhi Colony 18 Block",
        "Lodhi Colony 12/13 Block",
        "Central School Lodhi Road",
        "J L Nehru Stadium",
        "Sewa Nagar Flyover",
        "Defence Colony (Homyopathic College)",
        "PT College Kotla",
        "Andrews Ganj",
        "Central School (MCKR)",
        "Sadiq Nagar",
        "Siri Fort Road",
        "Krishi Vihar",
        "Panchsheel Enclave",
        "Chirag Delhi",
        "Sheikh Sarai Phase II / Shaheed Bhaga...",
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
        "Lado Sarai Firni Road (T)"
      ]
    }
  }
};

async function upload() {
  try {
    const routeId = "522"; 
    await db.collection('routes').doc(routeId).set(routeData);
    console.log('Route 522 successfully uploaded to Firebase!');
    process.exit(0);
  } catch (error) {
    console.error('Error uploading route:', error);
    process.exit(1);
  }
}

upload();
