import { db } from '../src/services/firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

const clearCollection = async (colName: string) => {
  console.log(`Clearing collection: ${colName}...`);
  const querySnapshot = await getDocs(collection(db, colName));
  const deletePromises = querySnapshot.docs.map((document) => 
    deleteDoc(doc(db, colName, document.id))
  );
  await Promise.all(deletePromises);
  console.log(`Collection ${colName} cleared successfully!`);
};

const clearAllData = async () => {
  try {
    await clearCollection('tickets');
    await clearCollection('users');
    console.log('All requested data has been deleted.');
  } catch (error) {
    console.error('Error deleting data:', error);
  }
};

clearAllData();
