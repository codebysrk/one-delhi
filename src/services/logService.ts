import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { useAppStore } from "../store/useAppStore";

export type LogType = 'ADMIN' | 'USER' | 'SYSTEM' | 'SECURITY';

export interface LogOptions {
  type: LogType;
  action: string;
  details: string;
  targetId?: string;
  targetType?: 'USER' | 'ROUTE' | 'TICKET' | 'NOTIFICATION' | 'DEVICE' | 'AUTH';
  oldValue?: any;
  newValue?: any;
  notes?: string;
}

/**
 * Logs an activity to the global audit log collection.
 * Aligned with the Admin Dashboard logging schema.
 */
export const logActivity = async (options: LogOptions) => {
  const { user, userProfile, deviceId } = useAppStore.getState();
  
  try {
    await addDoc(collection(db, 'logs'), {
      ...options,
      userId: user?.uid || 'guest',
      userName: userProfile?.name || user?.displayName || 'Delhi Traveler',
      userEmail: user?.email || 'guest@onedelhi.gov.in',
      timestamp: serverTimestamp(),
      deviceId: deviceId || 'Unknown Device',
      platform: 'Mobile Client',
    });
  } catch (error) {
    // Logging should never crash the app flow
    console.error('[LogService] Logging failed:', error);
  }
};
