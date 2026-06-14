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

/**
 * Commuter/Conductor utility to validate a ticket QR code:
 * 1. Read ticket from Firestore
 * 2. Verify status and expiresAt timestamp
 * 3. Log validation event
 */
exports.validateTicket = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }

  const { ticketId } = data;
  if (!ticketId) {
    throw new functions.https.HttpsError('invalid-argument', 'Ticket ID is required.');
  }

  const db = admin.firestore();
  const ticketRef = db.collection('tickets').doc(ticketId);
  const ticketSnap = await ticketRef.get();

  if (!ticketSnap.exists) {
    throw new functions.https.HttpsError('not-found', 'Ticket not found.');
  }

  const ticket = ticketSnap.data();
  const now = Date.now();
  
  // Resolve expiresAt timestamp
  const expiresAt = ticket.expiresAt 
    ? (ticket.expiresAt.toMillis?.() || ticket.expiresAt)
    : (ticket.timestamp?.toMillis?.() || ticket.timestamp || 0) + 2 * 60 * 60 * 1000;

  if (ticket.status !== 'Active') {
    return { success: false, reason: `Ticket is already ${ticket.status || 'Expired'}` };
  }

  if (now > expiresAt) {
    // Update status to Expired
    await ticketRef.update({ status: 'Expired' });
    return { success: false, reason: 'Ticket has expired' };
  }

  // Mark ticket as validated
  await ticketRef.update({ 
    status: 'Validated',
    validatedAt: admin.firestore.FieldValue.serverTimestamp(),
    validatedBy: context.auth.uid
  });

  // Log action
  await db.collection('logs').add({
    userId: context.auth.uid,
    action: 'VALIDATE_TICKET',
    details: `Ticket ${ticketId} successfully validated.`,
    type: 'SYSTEM',
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  });

  return { success: true, message: 'Ticket validated successfully.' };
});

/**
 * Daily scheduler/trigger to archive logs older than 30 days
 * 1. Fetch logs where timestamp < now - 30 days
 * 2. Copy to logs_archive
 * 3. Delete from active logs
 */
exports.archiveOldLogs = functions.https.onCall(async (data, context) => {
  // Guard check: Caller must be an admin
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }

  const callerUid = context.auth.uid;
  const db = admin.firestore();
  const callerSnap = await db.collection('users').doc(callerUid).get();
  
  if (!callerSnap.exists || callerSnap.data().role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can trigger log archival.');
  }

  const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
  const cutoffTime = new Date(Date.now() - thirtyDaysInMs);

  try {
    const oldLogsSnap = await db.collection('logs')
      .where('timestamp', '<', cutoffTime)
      .limit(100) // Process in chunks of 100 to avoid memory/batch limits
      .get();

    if (oldLogsSnap.empty) {
      return { success: true, message: 'No logs older than 30 days found to archive.' };
    }

    const batch = db.batch();
    
    oldLogsSnap.forEach((doc) => {
      const logData = doc.data();
      // Write to archive collection
      const archiveRef = db.collection('logs_archive').doc(doc.id);
      batch.set(archiveRef, { ...logData, archivedAt: admin.firestore.FieldValue.serverTimestamp() });
      // Delete from active logs
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`Archived and purged ${oldLogsSnap.size} logs.`);
    
    return { 
      success: true, 
      message: `Archived and purged ${oldLogsSnap.size} logs successfully.`,
      count: oldLogsSnap.size
    };
  } catch (error) {
    console.error('Error archiving logs:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});
