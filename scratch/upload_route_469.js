const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const routeData = {
  route: "469",
  directions: {
    up: {
      from: "ISBT Anand Vihar Terminal",
      to: "Lado Sarai Firni Road (T)",
      totalStops: 56,
      stops: [
        "ISBT Anand Vihar Terminal",
        "Anand Vihar ISBT Main Road",
        "Maharaj Pur Check Post",
        "EDM Mall / Gazipur Depot",
        "Hasanpur Village",
        "Hasanpur Depot",
        "KarKarDooma Crossing",
        "New Rajdhani Enclave / Preet Vihar Me...",
        "Swasthya Vihar / Preet Vihar",
        "Nirman Vihar",
        "Shakarpur Cross...",
        "Shakarpur (Vikas Marg)",
        "Laxmi Nagar (Vikas Marg) / Laxmi Nag...",
        "Laxmi Nagar X-ing / Laxmi Nagar / Sha...",
        "Shakarpur School Block",
        "Ganesh Nagar",
        "Mother Dairy",
        "Samaspur Jagir / Ganesh Nagar East",
        "Akhardham Temple / Pusta crossing",
        "Nizamuddin Road Bridge / PWD office ...",
        "Nizamuddin Road Bridge",
        "ISBT Sarai Kale Khan",
        "Bala Sahib Gurudwara",
        "Maharani Bagh / Ashram / Tol Bridge C...",
        "Nehru Nagar",
        "Sri Niwaspuri / PG DAV College",
        "Lajpat Nagar Crossing",
        "Garhi Village",
        "BBlock East of Kailash",
        "CBlock East of Kailash",
        "SNPD",
        "Laghu Udyog Sansthan (ModiMill)",
        "NSIC",
        "Kalkaji Mandir (MaaA...nd...eeMarg)",
        "Punj Sons / Govind P...te Station",
        "Kalkaji Depot",
        "Govindpuri No.3",
        "Govindpuri Extn Gali N...6",
        "DDA Market Kalkaji",
        "DDA Flats KalkaJi",
        "Tara Apartment",
        "Guru Ravidass Marg / Guru Ravi Das A...",
        "Majeedia Hospital",
        "Hamdard Nagar / Sangam Vihar",
        "Batra Hospital (Satya Narayan Mandir)",
        "Vayusenabad (Tigri)",
        "Khanpur Extension / Devali Road Xing / ...",
        "Ambedkar Nagar Depot",
        "Ambedkar Nagar Terminal",
        "DIPSAR ( Institute of Pharmacy)",
        "Asian Market",
        "Saket Crossing",
        "Maidan Garhi Crossing (SDM Court)",
        "Saket Metro Station / Said-ul-Ajaib",
        "Dhaula Peer",
        "Lado Sarai Firni Road (T)"
      ]
    },
    down: {
      from: "Lado Sarai Firni Road (T)",
      to: "ISBT Anand Vihar",
      totalStops: 54,
      stops: [
        "Lado Sarai Firni Road (T)",
        "Saidu-A-Zeb",
        "Said-ul-Ajaib/ Saket Metro Station",
        "Maidan Garhi Crossing (SDM Court)",
        "Saket Crossing",
        "Asian Market",
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
        "Govindpuri Gali No 3",
        "Kalkaji Depot",
        "Punj Sons / Govind Puri Metro Station",
        "Kalkaji Mandir (MaaAnandmayeeMarg)",
        "NSIC",
        "Laghu Udyog Sansthan(ModiMill)",
        "SNPD",
        "East of Kailash CBlock",
        "East of Kailash BBlock",
        "Garhi Gaon",
        "Lajpat Nagar Crossing",
        "PG DAV College / Sri Niwaspuri",
        "Nehru Nagar",
        "Maharani Bagh",
        "Bala Sahib Gurudwara",
        "Sarai Kale Khan ISBT",
        "Nizamuddin Road Bridge / CPWD Offic...",
        "CPWD Office",
        "Pusta Crossing / Akshardham Temple",
        "Samaspur Jagir / Pandav Nagar",
        "Mother Dairy",
        "Ganesh Nagar",
        "Shakar Pur School Block",
        "Laxmi Nagar X-ing / Laxmi Nagar / Sha...",
        "TT Post under Pass",
        "Laxmi Nagar Metro Station / Laxmi Na...",
        "ShakarPur / Shakarpur (Vikas Marg)",
        "Shakarpur Crossing",
        "Nirman Vihar Metro Station",
        "Swasthya Vihar / Preet Vihar",
        "Preet Vihar Metro Station / New Rajh...",
        "KarkarDooma Crossing",
        "Hassanpur Depot",
        "Hassanpur Village",
        "EDM / Gazipur Depot",
        "ISBT Anand Vihar"
      ]
    }
  }
};

async function upload() {
  try {
    const routeId = "469"; 
    await db.collection('routes').doc(routeId).set(routeData);
    console.log('Route 469 successfully uploaded to Firebase!');
    process.exit(0);
  } catch (error) {
    console.error('Error uploading route:', error);
    process.exit(1);
  }
}

upload();
