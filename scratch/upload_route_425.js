const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const routeData = {
  route: "425",
  directions: {
    up: {
      from: "ISBT Kashmere Gate Terminal",
      to: "Hamdard Nagar / Sangam Vihar",
      totalStops: 38,
      stops: [
        "ISBT Kashmere Gate Terminal",
        "Mori Gate Terminal",
        "Old Delhi Railway Station",
        "Red Fort",
        "Jama Masjid",
        "Darya Ganj",
        "GOLCHA CINEMA",
        "Delhi Gate",
        "Express Building-DC2809",
        "ITO BSZ Marg",
        "Tilak Bridge",
        "Supreme Court / Pragati Maidan Metro...",
        "supreme court metro station",
        "ITPO Gate No. 3",
        "National Stadium",
        "Zoo",
        "Sunder Nagar",
        "Sunder Nagar  Market / Golf Club",
        "Delhi Public School",
        "Amir Khusro Park / Oberoi Hotel",
        "CGO Complex",
        "Pant Nagar",
        "Defence Colony (Lajpat Nagar Mtr Stn)",
        "MCKR Hospital",
        "Central School (MCKR)",
        "Lady Shri Ram College",
        "Kailash Colony",
        "Sant Nagar",
        "Nehru Place",
        "Nehru Enclave",
        "Deshbandhu Collage",
        "Govindpuri Extn Gali No. 16",
        "DDA Market Kalkaji",
        "DDA Flats KalkaJi",
        "Tara Apartment",
        "Guru Ravidass Marg / Guru Ravi Das A...",
        "Majeedia Hospital",
        "Hamdard Nagar / Sangam Vihar"
      ]
    },
    down: {
      from: "Hamdard Nagar / Sangam Vihar",
      to: "ISBT Kashmere Gate City Bus Terminal...",
      totalStops: 39,
      stops: [
        "Hamdard Nagar / Sangam Vihar",
        "Majeedia Hospital",
        "Guru Ravidass Marg / Guru Ravi Das A...",
        "Tara Apartment",
        "DDA Flats Kalkaji",
        "DDA Flats Kalka Ji",
        "Govindpuri Ext Gali No 16",
        "Desh Bandhu College",
        "Nehru Enclave / Nehru Place Crossing ...",
        "Nehru Place",
        "Sant Nagar",
        "Kailash Colony",
        "Lady Shri Ram College",
        "Central School (MCKR) / Defence Colo...",
        "MCKR Hospital",
        "Defence Colony",
        "Pant Nagar",
        "CGO Complex",
        "Amir Khusro Park / Oberoi Hotel",
        "Delhi Public School",
        "Sunder Nagar Market / Sunder Nagar ...",
        "Sunder Nagar",
        "Zoo",
        "National Stadium",
        "ITPO Gate No. 3 / ITPO Office Pragati ...",
        "supreme court metro station / Superm...",
        "Supreme Court",
        "Tilak Bridge",
        "ITO BSZ Marg (Ram Charan Aggarwal ...",
        "Express Building",
        "Delhi Gate / Ambedkar Stadium",
        "Delhi Gate / Golcha Cinema",
        "GOLCHA CINEMA",
        "Subhash Park",
        "Jama Masjid",
        "Red Fort",
        "GPO",
        "GGS University ISBT Kashmere Gate",
        "ISBT Kashmere Gate City Bus Terminal..."
      ]
    }
  }
};

async function upload() {
  try {
    const routeId = "425"; 
    await db.collection('routes').doc(routeId).set(routeData);
    console.log('Route 425 successfully uploaded to Firebase!');
    process.exit(0);
  } catch (error) {
    console.error('Error uploading route:', error);
    process.exit(1);
  }
}

upload();
