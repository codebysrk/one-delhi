const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const routeData = {
  route: "34",
  directions: {
    up: {
      from: "Mehrauli Terminal",
      to: "Noida Sector-32",
      totalStops: 63,
      stops: [
        "Mehrauli Terminal",
        "Qutub Minar",
        "Lado Sarai Crossing",
        "Lado Sarai",
        "Saidu-A-Zeb",
        "Said-ul-Ajaib/ Saket Metro Station",
        "Maidan Garhi Crossing (SDM Court)",
        "Saket Crossing",
        "Asian Market",
        "Institute Of Pharmacy (DIPSAR)",
        "Ambedkar Nagar Depot",
        "Ambedkar Nagar Terminal",
        "Khanpur Extension / Devli Road Xing",
        "VayuSenaBad (Tigri)",
        "Batra Hospital / Satya Narayan Mandir",
        "Hamdard Nagar / Sangam Vihar",
        "Air Force Station",
        "Tuglkabad Fort",
        "Tughlaqabad Village",
        "Kaya Maya Hospital",
        "MB Road / Okhla More",
        "Prem Nagar",
        "Lal Kuan",
        "Surajkund Crossing",
        "Prehlad Pur (Badarpur)",
        "Badarpur M B Road / Rajiv Gandhi Stadium",
        "Badarpur Village",
        "Power House (Badarpur)",
        "Onida Factory",
        "Ali Village",
        "Maruti Factory / Haldiram",
        "Madanpur Khadar Crossing",
        "Sarita Vihar Xing",
        "Sarita Vihar K Block",
        "Jasola Vihar",
        "Shaheen Bagh",
        "Kalindi Kunj",
        "Yamuna Bridge East Check Post",
        "Mahamaya Flyover West",
        "Amity International School",
        "Sec 37 Chowk",
        "Noida Sector 37",
        "Botanical Garden Metro Station",
        "Noida Sector 28/29",
        "Noida Sec 18 Metro Station",
        "Film City More Under Pass",
        "Wave Cinema",
        "Atta Peer",
        "Rajni Gandhi Chowk",
        "Noida Sec 19 B",
        "Telephone Exch Noida Sector-19 / staff",
        "Noida Sec 9 Power House",
        "Noida Sec 10 / 21",
        "Noida Stadium",
        "Chora More Sec 12",
        "Raghu Nath Pur /Chora Village",
        "Chora Village Noida Sec-12-Block",
        "Noida Sec-22 Shiv Mandir",
        "Sector-22 Noida H-Block",
        "Noida Sec 57 Xing",
        "Noida Sec 23 Chowk",
        "Noida Sector-53 Chowk",
        "Noida Sector-32"
      ]
    },
    down: {
      from: "Noida Sector-32 Terminal",
      to: "Mehrauli Terminal",
      totalStops: 62,
      stops: [
        "Noida Sector-32 Terminal",
        "Noida Sector-53 Chowk",
        "Noida Sec-23 Chowk",
        "Noida Sec 57 Xing",
        "Sector 22 H Block",
        "Noida Sec 22 Shiv Mandir",
        "Chora Village Sector-12 Block",
        "Raghu Nath Pur /Chora Village",
        "Chora More Sec12",
        "Noida Stadium",
        "Noida Sec-10-21",
        "Noida Sec 9 Power House",
        "Telephone Exch Noida Sector-19",
        "Noida Sector-19B",
        "Noida Sec 27 Chowk",
        "Noida Sector-27 Market",
        "Noida Sec 28",
        "Atta Chowk",
        "Noida Sector-28/29",
        "Botanical Garden Metro Station",
        "Noida Sector 37",
        "Noida Sec 37 Chowk",
        "Amity International School",
        "MahaMaya Flyover West",
        "Yamuna Bridge East Check Post",
        "Kalindi Kunj",
        "Shaheen Bagh",
        "Jasola Vihar",
        "Sarita Vihar K Block",
        "Sarita Vihar Xing",
        "Madanpur Khadar Crossing",
        "Haldiram / Maruti Factory",
        "Ali Village",
        "Noida Factory",
        "Power House(Badarpur)",
        "Badarpur Village",
        "Badarpur M B Road / Rajiv Gandhi Stadium",
        "Pul Prehladpur ( BadarPur)",
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
        "DIPSAR ( Institute of Pharmacy)",
        "Asian Market",
        "Saket Crossing",
        "Maidan Garhi Crossing (SDM Court)",
        "Said ul zeb",
        "Dhaula Peer",
        "Dhaula Peer / Lado Sarai",
        "Lado Sarai Crossing",
        "Qutub Minar",
        "Mehrauli Terminal"
      ]
    }
  }
};

async function upload() {
  try {
    const routeId = "34"; 
    await db.collection('routes').doc(routeId).set(routeData);
    console.log('Route 34 successfully uploaded to Firebase!');
    process.exit(0);
  } catch (error) {
    console.error('Error uploading route:', error);
    process.exit(1);
  }
}

upload();
