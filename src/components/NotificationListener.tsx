import React, { useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAppStore } from '../store/useAppStore';

export const NotificationListener = () => {
  const { setLatestNotificationTimestamp, user } = useAppStore();

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'notifications'),
      orderBy('timestamp', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const latest = snapshot.docs[0].data();
        if (latest.timestamp) {
          setLatestNotificationTimestamp(latest.timestamp);
        }
      }
    }, (error) => {
      if (__DEV__) console.error('[NotificationListener] Firestore error:', error);
    });

    return () => unsubscribe();
  }, [user]);

  return null; // This component doesn't render anything
};
