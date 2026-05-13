const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

/**
 * Admin utility to delete a user's entire presence:
 * 1. Firebase Authentication
 * 2. Firestore user document
 * 3. Firestore devices
 * 4. Firestore tickets
 * 5. Firestore logs
 */
exports.adminDeleteUser = functions.https.onCall(async (data, context) => {
  // 1. Check if caller is an admin
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }

  const callerUid = context.auth.uid;
  const callerSnap = await admin.firestore().collection('users').doc(callerUid).get();
  
  if (!callerSnap.exists || callerSnap.data().role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can delete users.');
  }

  const targetUid = data.uid;
  if (!targetUid) {
    throw new functions.https.HttpsError('invalid-argument', 'Target UID is required.');
  }

  console.log(`Admin ${callerUid} is deleting user ${targetUid}`);

  try {
    // 2. Delete from Auth
    await admin.auth().deleteUser(targetUid);

    const db = admin.firestore();
    const batch = db.batch();

    // 3. Delete devices
    const devicesSnap = await db.collection('devices').where('userId', '==', targetUid).get();
    devicesSnap.forEach(doc => batch.delete(doc.ref));

    // 4. Delete tickets
    const ticketsSnap = await db.collection('tickets').where('userId', '==', targetUid).get();
    ticketsSnap.forEach(doc => batch.delete(doc.ref));

    // 5. Delete logs (linked to user)
    const logsSnap = await db.collection('logs').where('userId', '==', targetUid).get();
    logsSnap.forEach(doc => batch.delete(doc.ref));

    // 6. Delete user document
    batch.delete(db.collection('users').doc(targetUid));

    // Commit all Firestore deletions
    await batch.commit();

    return { success: true, message: `User ${targetUid} and all associated data deleted.` };
  } catch (error) {
    console.error('Error deleting user:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});
