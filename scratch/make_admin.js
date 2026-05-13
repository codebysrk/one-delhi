const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, updateDoc, doc } = require('firebase/firestore');

// Firebase config (Copy from src/services/firebase.ts if needed)
const firebaseConfig = {
  apiKey: "AIzaSy...", // User should replace these if they are different
  authDomain: "onedelhii.firebaseapp.com",
  projectId: "onedelhii",
  storageBucket: "onedelhii.appspot.com",
  messagingSenderId: "374246142750",
  appId: "1:374246142750:web:48a97268840b1062923761"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const makeAdmin = async (email) => {
  if (!email) {
    console.error("Please provide an email address.");
    return;
  }

  try {
    const q = query(collection(db, "users"), where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log(`No user found with email: ${email}`);
      return;
    }

    const userDoc = querySnapshot.docs[0];
    await updateDoc(doc(db, "users", userDoc.id), {
      role: 'admin'
    });

    console.log(`SUCCESS: User ${email} is now an ADMIN.`);
  } catch (error) {
    console.error("Error updating user:", error);
  }
};

// Replace with the email you want to make admin
const targetEmail = process.argv[2]; 
makeAdmin(targetEmail);
