const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const routeData = {
  route: "D-7103",
  directions: {
    up: {
      from: "Chandan Holla",
      to: "100 Foota Road Ghitorni",
      totalStops: 8,
      stops: [
        "Chandan Holla",
        "Gadai Pur  / Westend DLF",
        "Sultan Pur Estate",
        "Center for Development of Telematics",
        "New Mangla Pur",
        "Sultan Pur",
        "Ghitorni Metro Station / Ghitorani Village",
        "100 Foota Road Ghitorni"
      ]
    },
    down: {
      from: "100 Foota Road Ghitorni",
      to: "Chandan Holla",
      totalStops: 9,
      stops: [
        "100 Foota Road Ghitorni",
        "Ghitorni Metro Station / Ghitorni  Village",
        "Sultan Pur",
        "New Mangla Puri",
        "Center for Development of Telematics",
        "Sultan Pur Estate",
        "Gadai Pur  / Westend DLF",
        "Gadaipur",
        "Chandan Holla"
      ]
    }
  }
};

async function upload() {
  try {
    const routeId = "D-7103"; 
    await db.collection('routes').doc(routeId).set(routeData);
    console.log('Route D-7103 successfully uploaded to Firebase!');
    process.exit(0);
  } catch (error) {
    console.error('Error uploading route:', error);
    process.exit(1);
  }
}

upload();
