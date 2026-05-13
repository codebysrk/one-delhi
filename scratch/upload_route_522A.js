const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const routeData = {
  route: "522A",
  directions: {
    down: {
      from: "Hamdard Nagar / Sangam Vihar",
      to: "R Block Rajinder Nagar",
      totalStops: 60,
      stops: [
        "Hamdard Nagar / Sangam Vihar",
        "Batra Hospital (Satya Narayan Mandir)",
        "Vayusenabad (Tigri)",
        "Khanpur Extension / Devli Road Xing / ...",
        "Ambedkar Nagar Depot",
        "Ambedkar Nagar Terminal",
        "DIPSAR ( Institute of Pharmacy)",
        "Asian Market",
        "Saket Crossing",
        "Saket J Block",
        "Saket Terminal",
        "Saket M Block",
        "HaujRani / MaxHospital",
        "Modi Hospital",
        "Press Enclave",
        "Saket A block(Malviya Nagar Metro St...",
        "PNB Geetanjali",
        "Geetanjali Enclave",
        "Aurobindo College",
        "Malviya Nagar",
        "Begumpur (Malviya Nagar)",
        "Bhavishya Nidhi Enclave",
        "Panchsheel Club",
        "Shahpur Jat",
        "Khel Gaon",
        "Kamla Nehru College",
        "Neeti Bagh / Kamla Nehru College/Niti ...",
        "Uday Park / Anandlok",
        "Ayurvigyan Nagar",
        "Andrews Ganj Shiv Mandir / Ansal Plaza",
        "PT College Kotla",
        "Defence Colony",
        "Sewa Nagar Flyover",
        "J L Nehru Stadium",
        "Central School Lodhi Colony",
        "Lodhi Colony",
        "Lodhi Colony 18 Block",
        "Lodhi Road Crossing",
        "Max Mueller Marg",
        "Prithviraj Road Crossing",
        "Claridges Hotel",
        "National Museum",
        "National Archives",
        "Windsor Place",
        "Western Court",
        "Janpath Market",
        "Shivaji Stadium Terminal ( Connaught ...",
        "Shaheed Bhagat Singh Marg",
        "Gole Market",
        "Mandir Marg / Balmiki Mandir",
        "Panchkuian Road Banwai Lal Hospital",
        "Meghdoot Bhawan",
        "Pusa Road Petrol Pump / Sadhu Vaswa...",
        "Karol Bagh Metro Station",
        "rajinder nagar market",
        "Rajender Nagar Crossing",
        "Shankar Road",
        "East Patel Nagar",
        "NPL Colony",
        "R Block Rajinder Nagar"
      ]
    },
    up: {
      from: "R Block Rajendra Nagar",
      to: "Hamdard Nagar / Sangam Vihar",
      totalStops: 60,
      stops: [
        "R Block Rajendra Nagar",
        "N.P.L Colony",
        "East Patel Nagar",
        "Shankar Road",
        "Rajender Nagar Crossing",
        "Old Rajendra Nagar Market",
        "Karol Bagh Metro Station",
        "Pusa Road Petrol Pump/ Sadhu Vaswa...",
        "Meghdoot Bhawan",
        "Panchkuian Road Banwari Lal Hospital",
        "Panchkuian Road",
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
        "Andrews Ganj Shiv Mandir / Ansal Plaza",
        "Ayurvigyan Nagar",
        "Uday Park / Anandlok",
        "Neeti Bagh",
        "Kalma Nehru College",
        "Khel Gaon / Siri Fort Road",
        "Shahpur Jat",
        "Panchsheel Club",
        "Bhavishya Nidhi Enclave",
        "Begumpur (Malviya Nagar)",
        "Malviya Nagar",
        "Aurobindo College",
        "Geetanjali Enclave",
        "PNB Geetanjali",
        "Saket A Block (Malviya Nagar Metro St...",
        "Press Enclave",
        "Modi Hospital",
        "HaujRani / MaxHospital",
        "Saket M Block",
        "Saket Terminal",
        "Saket J Block",
        "Saket Crossing",
        "Asian Market",
        "Institute Of Pharmacy (DIPSAR)",
        "Ambedkar Nagar Depot",
        "Ambedkar Nagar Terminal",
        "Khanpur Extension / Devali Road Xing /...",
        "VayuSenaBad (Tigri)",
        "Batra Hospital / Satya Narayan Mandir",
        "Hamdard Nagar / Sangam Vihar"
      ]
    }
  }
};

async function upload() {
  try {
    const routeId = "522A"; 
    await db.collection('routes').doc(routeId).set(routeData);
    console.log('Route 522A successfully uploaded to Firebase!');
    process.exit(0);
  } catch (error) {
    console.error('Error uploading route:', error);
    process.exit(1);
  }
}

upload();
