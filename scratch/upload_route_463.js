const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const routeData = {
  route: "463",
  directions: {
    down: {
      from: "Mehrauli Terminal",
      to: "Okhla Extension (Abul Fazl Encalve)",
      totalStops: 39,
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
        "DIPSAR College of Pharmacy / Ambed...",
        "Ambedkar Nagar Terminal",
        "Ambedkar Nagar Depot",
        "Khanpur Extension / Devali Road Xing /...",
        "VayuSenaBad (Tigri)",
        "Batra Hospital / Satya Narayan Mandir",
        "Hamdard Nagar / Sangam Vihar",
        "Majeedia Hospital",
        "Guru Ravidass Marg / Guru Ravi Das A...",
        "Tara Apartment",
        "DDA Flats Kalkaji",
        "DDA Market kalka Ji",
        "Govindpuri Ext Gali No 16",
        "Govindpuri Gail No 3",
        "Kalkaji Depot",
        "Punj Sons / Govind Puri Metro Station",
        "Kalkaji Mandir (MaaAnandmayeeMarg)",
        "NSIC",
        "Modi Mill / NSIC Hostel",
        "Holy Family Hospital / Jhulena Village",
        "Holy Family Hospital",
        "Jamiya Millia College",
        "Ansari Health Care",
        "Batla House",
        "Okhla Village",
        "Nai Basti",
        "Unani Hospital / Okhla Ext Thokar 3",
        "Noor Masjid",
        "Shaheen Bagh Thokar No 8 (A F Encla...",
        "Okhla Extension (Abul Fazl Encalve)"
      ]
    },
    up: {
      from: "Okhla Extension (Abul Fazl Encalve)",
      to: "Mehrauli Terminal",
      totalStops: 39,
      stops: [
        "Okhla Extension (Abul Fazl Encalve)",
        "Shaheen Bagh Thokar No. 8 (AF Encla...",
        "Noor Masjid",
        "Unani Hospital / Okhla Ext Thokar 3",
        "Nai Basti",
        "Okhla Village",
        "Batla House",
        "Ansari Health Care",
        "Jamiya Millia College",
        "Holy Family Hospital",
        "Holy Family Hospital / Jhulena Village",
        "Sukhdev Vihar/ Modi Floor Mills",
        "NSIC",
        "Kalkaji Mandir (MaaAnandmayeeMarg)",
        "Punj Sons / Govind Puri Metro Station",
        "Kalkaji Depot",
        "Govindpuri No.3",
        "Govindpuri Extn Gali No. 16",
        "DDA Market Kalkaji",
        "DDA Flats KalkaJi",
        "Tara Apartment",
        "Guru Ravidass Marg / Guru Ravi Das A...",
        "Majeedia Hospital",
        "Hamdard Nagar / Sangam Vihar",
        "Batra Hospital (Satya Narayan Mandir)",
        "Vayusenabad (Tigri)",
        "Khanpur Extension / Devli Road Xing / ...",
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
        "Mehrauli / Qutub Minar",
        "Mehrauli Terminal"
      ]
    }
  }
};

async function upload() {
  try {
    const routeId = "463"; 
    await db.collection('routes').doc(routeId).set(routeData);
    console.log('Route 463 successfully uploaded to Firebase!');
    process.exit(0);
  } catch (error) {
    console.error('Error uploading route:', error);
    process.exit(1);
  }
}

upload();
