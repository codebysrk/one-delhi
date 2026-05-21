import { useEffect } from 'react';
import { db } from '../../services/firebase';
import { useAppStore } from '../../store/useAppStore';

export const NotificationListener = () => {
  const { setLatestNotificationTimestamp, user } = useAppStore();

  useEffect(() => {
    if (!user) return;

    const unsubscribe = db
      .collection('notifications')
      .orderBy('timestamp', 'desc')
      .limit(1)
      .onSnapshot(
        (snapshot) => {
          if (!snapshot.empty) {
            const latest = snapshot.docs[0].data();
            if (latest.timestamp) {
              setLatestNotificationTimestamp(latest.timestamp);
            }
          }
        },
        (error: any) => {
          if (error.code === 'permission-denied') {
            // This is expected when a user is banned or logged out
            return;
          }
          if (__DEV__) console.error('[NotificationListener] Firestore error:', error);
        }
      );

    return () => unsubscribe();
  }, [user]);

  return null; // This component doesn't render anything
};
